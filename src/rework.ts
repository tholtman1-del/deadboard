// Rework process outcomes from thermal history. The thermal model supplies temperatures under
// real heat sources (iron, hot air, preheater); this monitor turns them into what happens to the
// solder joints, pads and parts. Limits are typical process-window values (estimates, as data).
import { t } from './i18n';
import { endsAt, terminalType } from './terminals';
import type { Board, Component } from './types';
import type { ThermalModel } from './thermal';
import { rng, seedOf, sampleSeverity } from './faults';

/**
 * A solder alloy: solid below `solidus`, liquid above `liquidus` (°C); between them a pasty
 * ("plastic") range. Tin-lead: NAVAIR 01-1A-23 / T.O. 00-25-259 (2013) para. 05-7.1.1 — 63/37 melts
 * at 361 °F [183 °C], 60/40 between 361 and 375 °F [183–191 °C] (NEETS 14, 1998, printed 370 °F; the
 * newer manual matches the tin-lead phase diagram). SAC305: maker datasheets (217–220 °C).
 */
export interface Alloy { id: AlloyId; name: string; solidus: number; liquidus: number }
export type AlloyId = 'sac305' | 'sn63' | 'sn60';
export const SAC305: Alloy = { id: 'sac305', name: 'SAC305 (lead-free)', solidus: 217, liquidus: 220 };
export const SN63: Alloy = { id: 'sn63', name: 'Sn63Pb37', solidus: 183, liquidus: 183 };
export const SN60: Alloy = { id: 'sn60', name: 'Sn60Pb40', solidus: 183, liquidus: 191 };
export const ALLOYS: Record<AlloyId, Alloy> = { sac305: SAC305, sn63: SN63, sn60: SN60 };
/** The process limits for a board's alloy (lead-free unless the board says otherwise). */
export function limitsFor(alloy?: AlloyId): ProcessLimits {
  return { ...DEFAULT_LIMITS, alloy: ALLOYS[alloy ?? 'sac305'] ?? SAC305 };
}

export interface ProcessLimits {
  alloy: Alloy;
  /** Time above liquidus for a joint to wet properly (s). */
  reflowSeconds: number;
  /** Flux activity: seconds above liquidus before it is exhausted. */
  fluxSeconds: number;
  /** Pad adhesion: seconds above `padLiftTemp` in one heating before the pad delaminates. */
  padLiftTemp: number;
  padLiftSeconds: number;
  /** Part body: cumulative seconds above `partMaxTemp` before it is damaged. */
  partMaxTemp: number;
  partMaxSeconds: number;
  /** MLCC thermal shock: heating rate (K/s, smoothed) that cracks an un-preheated ceramic cap. */
  mlccShockRate: number;
  /**
   * Hot-air coefficient (W/m²K; impinging rework jets ≈ 500–1000 at normal flow) that displaces a
   * molten small part, and what "small" means (mm²).
   */
  blowAwayH: number;
  smallPartArea: number;
}

/** Bottom preheater coefficient (W/m²K): holds a board near 130 °C at a 150 °C setting. */
export const PREHEAT_H = 150;
/** Hot-air jet coefficients (W/m²K): normal and high flow. */
export const HOTAIR_H = { normal: 1000, high: 1500 }; // upper end of jet range: the 1-layer plate model under-states local surface heating

/** Tip-to-joint conductance (W/K): wetted with flux vs dry tip. */
export const IRON_G = { flux: 0.22, dry: 0.07 };

export const DEFAULT_LIMITS: ProcessLimits = {
  alloy: SAC305, reflowSeconds: 0.6, fluxSeconds: 8, padLiftTemp: 300, padLiftSeconds: 6,
  partMaxTemp: 300, partMaxSeconds: 10, mlccShockRate: 150, blowAwayH: 1400, smallPartArea: 0.6,
};

export type ReworkEventKind = 'molten' | 'reflowed' | 'wetted' | 'dull-joint' | 'pad-lifted' | 'part-overheated' | 'mlcc-cracked' | 'part-displaced'
  | 'filled' | 'no-solder' | 'extracted' | 'sweat' | 'wick-surface' | 'not-molten'
  | 'overheated-joint' | 'slow-melt' | 'wire-soldered' | 'wire-starved' | 'clinched';
export interface ReworkEvent { kind: ReworkEventKind; ref: string; pad?: number; detail: string }

/**
 * One heating of a solder joint, from the moment it melted until it froze again: what an
 * inspector would want to know about how the joint was made.
 */
export interface JointEpisode {
  ref: string; pad: number;
  /** Seconds the joint was molten (above liquidus). */
  molten: number;
  /**
   * Of those, seconds with the tip still on it: the dwell the manuals mean. A big terminal stays
   * molten for seconds after the tip leaves; that is cooling, not overheating.
   */
  dwell: number;
  /** Peak joint temperature (°C). */
  peak: number;
  /** Flux was active when it melted. */
  flux: boolean;
  /** Board time at melting (s). */
  t: number;
  /** Still molten (the episode is not over). */
  open: boolean;
  /** A thermal shunt was clipped on this lead. */
  shunt: boolean;
  /** Peak temperature of the part's body during the heating (°C). */
  bodyPeak: number;
  /** The part was already burnt (a dead part being taken out: no shunt needed for it). */
  dead?: boolean;
}

/** A through-hole part with a body: soldered through plated holes (the desoldering rules apply). */
export function isThroughHole(c: Component): boolean {
  return c.body.shape !== 'none' && c.pads.length > 0 && c.pads.every((p) => (p.drill ?? 0) > 0);
}
/** A pad in a supported (plated-through) hole: copper on both sides and a plated barrel. */
export const isPlated = (c: Component, pi: number) => c.pads[pi]?.layers === 'FB' && (c.pads[pi].drill ?? 0) > 0;
/**
 * Heat-sensitive parts: the textbook clips a thermal shunt on their leads (NEETS 14 p. 3-23:
 * "diodes, transistors, and ICs"; LEDs are diodes).
 */
export function isHeatSensitive(c: Component): boolean {
  return c.kind === 'led' || c.kind === 'diode' || c.kind === 'ic' || c.body.shape === 'to92' || (c.kind === 'generic' && /^(Q|U|IC)\d/i.test(c.ref));
}
/** Pads of a through-hole part still holding it (solder in the hole, or a sweat joint). */
export function heldPads(c: Component): number[] {
  return c.pads.map((_, i) => i).filter((i) => c.state.holes?.[i] !== 'clear');
}
/** A manual plunger's jolt lifts a pad now and then (NEETS 14 p. 3-16 says it may; the rate is an estimate). */
export const PLUNGER_LIFT_CHANCE = 0.15;
/** Molten time a continuous-vacuum tip needs to empty a plated hole while the lead is stirred (s, estimate). */
export const VACUUM_SECONDS = 0.6;

export type ExtractMode = 'wick' | 'plunger' | 'vacuum';

/**
 * Solder oxidizes when it is heated too long (the tip's dwell while it is molten), or reflowed
 * again and again (T.O. 00-25-259 05-4.2.5/6). The manual gives no numbers: these are estimates —
 * twice the 3 s soldering action, and a third reflow of the same solder.
 */
export const OXIDIZE_MOLTEN_S = 6;
export const OXIDIZE_REFLOWS = 3;
/** Solder should melt within 2–3 s of heat (T.O. 00-25-259 03-5.4, 05-5.3.4). */
export const MELT_WITHIN_S = 3;
/**
 * Fresh solder fed into a molten new joint, in ideal fills per second of feeding with the tip on it
 * (an estimate: a hand-fed through-hole joint fills in about a second). Under 0.75 the pad is not
 * covered, under 1 a plated hole is not filled, over 2.5 the joint is excessive (T.O. 07-6.20, 05-4.2.10):
 * a full fillet takes about 1 – 2.5 s of feeding, in line with the manuals' 2 – 3 s soldering action.
 */
export const FEED_RATE = 1.0;
export const FILL_LIMITS = { pad: 0.75, hole: 1, excess: 2.5 } as const;

interface JointState { above: number; melted: boolean; hot: number; ep?: JointEpisode; fed: boolean; /** heatings of the same solder */ reflows: number; /** fresh solder in this joint (ideal fills) */ vol: number }

/** What was done on a board, kept by the caller across monitors. */
export interface ReworkHistory { episodes: JointEpisode[]; log: (ReworkEvent & { t: number })[] }
interface PartState { seen: number; overheat: number; rate: number; lastT: number; base: number; flux: number; cracked: boolean; displaced: boolean; molten: boolean }

const lifted0 = (c: Component, pi: number) => !!c.state.lifted?.includes(pi);

export class ReworkMonitor {
  private joints = new Map<string, JointState>();
  /** Every joint heating so far, in order (for the workmanship inspection). */
  readonly episodes: JointEpisode[];
  /** Every event so far, with board time. */
  readonly log: (ReworkEvent & { t: number })[];
  private parts = new Map<string, PartState>();

  /**
   * `history` keeps the record across monitors: the app makes a new monitor when the board object
   * changes (undo, redo), and the inspection still needs everything done on this board.
   */
  constructor(readonly board: Board, readonly thermal: ThermalModel, readonly limits: ProcessLimits = DEFAULT_LIMITS, history?: ReworkHistory) {
    this.episodes = history?.episodes ?? [];
    this.log = history?.log ?? [];
  }

  private part(c: Component): PartState {
    let s = this.parts.get(c.id);
    if (!s) this.parts.set(c.id, (s = { seen: this.thermal.time, overheat: 0, rate: 0, lastT: this.thermal.partTemp(c.id) ?? 25, base: this.thermal.partTemp(c.id) ?? 25, flux: 0, cracked: false, displaced: false, molten: false }));
    return s;
  }

  /** Flux applied over an area: parts with a pad (or their origin) inside it. */
  applyFlux(xmm: number, ymm: number, rmm = 3) {
    const r2 = rmm * rmm;
    for (const c of this.board.components) {
      const a = (c.rot * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a);
      const near = (c.at[0] - xmm) ** 2 + (c.at[1] - ymm) ** 2 <= r2
        || c.pads.some((p) => (c.at[0] + p.at[0] * cs - p.at[1] * sn - xmm) ** 2 + (c.at[1] + p.at[0] * sn + p.at[1] * cs - ymm) ** 2 <= r2);
      if (near) this.part(c).flux = this.limits.fluxSeconds;
    }
  }

  isMolten(c: Component): boolean { return this.parts.get(c.id)?.molten ?? false; }
  /** Fresh (flux-cored) solder is being fed to this joint while it is heated. */
  feedSolder(c: Component, pi: number) {
    const key = `${c.id}#${pi}`;
    const js = this.joints.get(key);
    if (js) { js.fed = true; if (js.melted && c.state.holes?.[pi] === 'clear') js.melted = false; } // a molten empty hole fills on the next step
    else this.joints.set(key, { above: 0, melted: false, hot: 0, fed: true, reflows: 0, vol: 0 });
  }

  /**
   * The tip has been on a joint for `MELT_WITHIN_S` without melting it: the manual says stop, clean
   * the tip and the joint, then raise the tip temperature. Logged once per contact.
   */
  noteSlowMelt(c: Component, pi: number): ReworkEvent {
    const e: ReworkEvent = { kind: 'slow-melt', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: no melt after {s} s. Stop: clean the tip and the joint (flux), then raise the tip temperature.', { ref: c.ref, pad: c.pads[pi].name, s: MELT_WITHIN_S }) };
    this.log.push({ ...e, t: this.thermal.time });
    return e;
  }

  /** Seconds the joint has been molten in its current heating (0 when solid). */
  moltenFor(c: Component, pi: number): number {
    return this.joints.get(`${c.id}#${pi}`)?.ep?.molten ?? 0;
  }

  /**
   * Takes solder out of a molten through-hole joint (NEETS 14 pp. 3-15 – 3-18):
   * - wick: capillary pull beats only surface solder; a plated hole stays full (an unsupported hole empties);
   * - plunger: one pulse of vacuum; a plated hole keeps a sweat joint (the lead against the barrel),
   *   and the jolt can lift the pad;
   * - vacuum (continuous, lead stirred): the hole empties and no sweat joint forms.
   * Returns what happened (also as an event in the log).
   */
  extract(c: Component, pi: number, mode: ExtractMode): ReworkEvent {
    const p = c.pads[pi], where = { ref: c.ref, pad: p.name };
    const molten = this.thermal.jointTemp(c, pi) >= this.limits.alloy.liquidus;
    const plated = isPlated(c, pi);
    let e: ReworkEvent;
    const clear = () => {
      c.state.holes = { ...(c.state.holes ?? {}), [pi]: 'clear' };
      // the old (perhaps oxidized) solder is gone: the next joint starts fresh
      const js = this.joints.get(`${c.id}#${pi}`);
      if (js) js.reflows = 0;
      if (c.state.oxidized?.includes(pi)) { const left = c.state.oxidized.filter((x) => x !== pi); c.state.oxidized = left.length ? left : undefined; }
      if (!c.state.cold.includes(pi)) c.state.cold = [...c.state.cold, pi].sort((a, b) => a - b);
      if (c.state.solderFill?.[pi] !== undefined) { const { [pi]: _gone, ...rest } = c.state.solderFill; void _gone; c.state.solderFill = Object.keys(rest).length ? rest : undefined; }
      if (js) js.vol = 0;
    };
    const clinched = !!c.state.clinch?.[pi];
    if (clinched && mode !== 'wick') {
      // the bent lead lies over the pad: an extractor tip cannot fit over it (T.O. 00-25-259 07-5.4)
      e = { kind: 'clinched', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: the lead is clinched over the pad, so the extractor tip cannot fit over it. Wick the surface solder off, break the sweat joint and straighten the lead first.', where) };
    } else if (!molten) e = { kind: 'not-molten', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: the solder is not molten — nothing came out', where) };
    else if (clinched) {
      // wicking a clinched lead takes the surface solder: a sweat joint still bonds the bent lead to the pad
      if (!c.state.surfaceWicked?.includes(pi)) c.state.surfaceWicked = [...(c.state.surfaceWicked ?? []), pi].sort((a, b) => a - b);
      e = { kind: 'wick-surface', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: surface solder wicked off; a sweat joint still holds the clinched lead. Break it by turning the lead 15° and straighten it (Lead pliers).', where) };
    } else if (mode === 'vacuum' || !plated) {
      clear();
      e = { kind: 'extracted', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: hole clear, the lead is free', where) };
    } else if (mode === 'wick') {
      e = { kind: 'wick-surface', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: the wick took the surface solder, but the plated hole stays full (wick cannot beat the hole\'s capillary pull)', where) };
    } else {
      c.state.holes = { ...(c.state.holes ?? {}), [pi]: 'sweat' };
      e = { kind: 'sweat', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: most solder gone, but a sweat joint still holds the lead to the barrel', where) };
      if (!c.state.lifted?.includes(pi) && rng(seedOf(`plunger|${c.ref}|${pi}|${Math.round(this.thermal.time * 10)}`))() < PLUNGER_LIFT_CHANCE) {
        c.state.lifted = [...(c.state.lifted ?? []), pi];
        if (!c.state.cold.includes(pi)) c.state.cold = [...c.state.cold, pi].sort((a, b) => a - b);
        const lift: ReworkEvent = { kind: 'pad-lifted', ref: c.ref, pad: pi, detail: t('{ref} pad {pad} lifted by the plunger\'s jolt — needs a jumper wire', where) };
        this.log.push({ ...lift, t: this.thermal.time });
      }
    }
    this.log.push({ ...e, t: this.thermal.time });
    return e;
  }

  /** Active flux on the part's joints (rosin applied, not yet used up). */
  hasFlux(c: Component): boolean { return (this.parts.get(c.id)?.flux ?? 0) > 0; }

  /** Advance bookkeeping by dt (call after thermal.step(dt)); applies outcomes to the board. */
  update(dt: number): ReworkEvent[] {
    const L = this.limits, ev: ReworkEvent[] = [];
    const hotAir = this.thermal.sources.filter((s) => s.kind === 'hotair');
    for (const c of this.board.components) {
      if (!c.state.populated || !c.pads.length || c.body.shape === 'none') continue; // nothing soldered: a fiducial, the bench supply's clips
      const T = this.thermal.partTemp(c.id);
      if (T === undefined) continue;
      const ps = this.part(c);
      // not observed for a while (monitor paused): resync history instead of seeing a fake jump
      if (this.thermal.time - ps.seen > 1) { ps.lastT = T; ps.base = T; ps.rate = 0; }
      ps.seen = this.thermal.time;
      // heating rate (smoothed) for thermal shock
      const r = (T - ps.lastT) / Math.max(dt, 1e-3);
      ps.rate = ps.rate * 0.7 + r * 0.3;
      ps.lastT = T;
      // slow baseline (τ ≈ 3 s): the temperature the part sat at before a sudden heat-up
      ps.base += (T - ps.base) * Math.min(1, dt / 3);
      let allMolten = true;
      c.pads.forEach((p, pi) => {
        const key = `${c.id}#${pi}`;
        let js = this.joints.get(key);
        if (!js) this.joints.set(key, (js = { above: 0, melted: false, hot: 0, fed: false, reflows: 0, vol: 0 }));
        const tj = this.thermal.jointTemp(c, pi);
        if (tj >= L.alloy.liquidus) {
          if (!js.ep) {
            js.ep = { ref: c.ref, pad: pi, molten: 0, dwell: 0, peak: tj, flux: ps.flux > 0, t: this.thermal.time, open: true, shunt: !!c.state.shunts?.includes(pi), bodyPeak: T, ...(c.state.burnt && { dead: true }) };
            this.episodes.push(js.ep);
            if (c.state.holes?.[pi] !== 'clear') js.reflows++;
            js.vol = c.state.solderFill?.[pi] ?? 0;
          }
          js.ep.molten += dt;
          const tipOn = this.thermal.sources.some((s) => s.kind === 'iron' && s.partId === c.id && (s.pad === undefined || s.pad === pi) && this.thermal.time <= s.until + 1e-9);
          if (tipOn) js.ep.dwell += dt;
          // fresh solder flowing into a new joint while it is fed; the fillet grows with it
          if (tipOn && js.fed) {
            js.vol += dt * FEED_RATE;
            if (c.state.solderFill?.[pi] !== undefined) c.state.solderFill = { ...c.state.solderFill, [pi]: js.vol };
          }
          // heated too long, or the same solder reflowed again and again: it oxidizes (dull, grainy)
          const why = js.ep.dwell >= OXIDIZE_MOLTEN_S ? 'long' : js.reflows >= OXIDIZE_REFLOWS ? 'repeated' : null;
          if (why && !c.state.burnt && c.state.holes?.[pi] !== 'clear' && !c.state.oxidized?.includes(pi)) {
            c.state.oxidized = [...(c.state.oxidized ?? []), pi].sort((a, b) => a - b);
            ev.push({ kind: 'overheated-joint', ref: c.ref, pad: pi, detail: why === 'long'
              ? t('{ref} pad {pad}: heated molten for {s} s — the solder is oxidizing (dull, grainy). It must be removed and the joint resoldered.', { ref: c.ref, pad: p.name, s: OXIDIZE_MOLTEN_S })
              : t('{ref} pad {pad}: reflowed {n} times — the solder is oxidized. Remove it and resolder the joint with fresh solder.', { ref: c.ref, pad: p.name, n: js.reflows }) });
          }
          js.ep.peak = Math.max(js.ep.peak, tj);
          js.ep.bodyPeak = Math.max(js.ep.bodyPeak, T);
          if (c.state.shunts?.includes(pi)) js.ep.shunt = true;
          js.above += dt;
          if (ps.flux > 0) ps.flux = Math.max(0, ps.flux - dt / c.pads.length);
        } else {
          allMolten = false;
          // frozen again below the solidus (the pasty range of a non-eutectic alloy still counts as soft)
          if (js.ep && tj < L.alloy.solidus) { js.ep.open = false; js.ep = undefined; js.fed = false; }
          // cooled off: the next heating starts afresh (overheating lifts a pad within one long heating,
          // not across a desolder-and-resolder; an estimate, like the limits themselves)
          if (tj < L.alloy.solidus - 15) { js.above = 0; js.melted = false; js.hot = 0; }
        }
        if (!js.melted && js.above >= L.reflowSeconds) {
          js.melted = true;
          const hole = c.state.holes?.[pi];
          if (hole === 'clear') {
            // an empty hole: it takes fresh solder (fed to the joint, not the iron) to make a joint again
            if (js.fed && !c.state.lifted?.includes(pi)) {
              const { [pi]: _done, ...rest } = c.state.holes!; void _done;
              c.state.holes = Object.keys(rest).length ? rest : undefined;
              c.state.cold = c.state.cold.filter((x) => x !== pi);
              js.reflows = 0; // fresh solder
              c.state.solderFill = { ...(c.state.solderFill ?? {}), [pi]: js.vol }; // a new joint: its fill is graded
              if (c.state.oxidized?.includes(pi)) { const left = c.state.oxidized.filter((x) => x !== pi); c.state.oxidized = left.length ? left : undefined; }
              if (ps.flux > 0 && !c.state.fluxResidue?.includes(pi)) c.state.fluxResidue = [...(c.state.fluxResidue ?? []), pi].sort((a, b) => a - b);
              ev.push({ kind: 'filled', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: soldered, the hole filled', { ref: c.ref, pad: p.name }) });
            } else if (!js.fed) ev.push({ kind: 'no-solder', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: the hole is empty — feed fresh solder (Bench → Rework "+ flux": flux-cored solder)', { ref: c.ref, pad: p.name }) });
          } else {
          // rosin flux breaks down at soldering temperature and stays behind as residue (NEETS p. 3-25: remove it with alcohol)
          if (ps.flux > 0 && !lifted0(c, pi) && !c.state.fluxResidue?.includes(pi)) c.state.fluxResidue = [...(c.state.fluxResidue ?? []), pi].sort((a, b) => a - b);
          if (!c.state.cold.includes(pi) && !c.state.intermittent?.some((f) => f.pad === pi)) ev.push({ kind: 'wetted', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: solder flowed', { ref: c.ref, pad: p.name }) });
          const lifted = c.state.lifted?.includes(pi);
          // hook-up wires on this terminal: the solder flows round them. Fresh solder makes the
          // fillet; without it there is only what the tinning and the terminal carried (T.O. 08-5.7)
          for (const { j, end } of lifted ? [] : endsAt(this.board, c, pi)) {
            const we = j.ends![end];
            if (we.soldered) continue;
            we.soldered = js.fed ? 'ok' : 'starved';
            ev.push({ kind: js.fed ? 'wire-soldered' : 'wire-starved', ref: c.ref, pad: pi, detail: js.fed
              ? t('{ref}: wire soldered', { ref: c.ref })
              : t('{ref}: the wire is held only by the tinning — no solder was added, so the fillet is starved', { ref: c.ref }) });
          }
          if (!lifted && c.state.cold.includes(pi)) {
            const ok = ps.flux > 0 || rng(seedOf(`${c.ref}|${pi}|${Math.round(this.thermal.time)}`))() < 0.4;
            if (ok) {
              c.state.cold = c.state.cold.filter((x) => x !== pi);
              if (c.state.coldOhms) { delete c.state.coldOhms[pi]; if (!Object.keys(c.state.coldOhms).length) c.state.coldOhms = undefined; }
              ev.push({ kind: 'reflowed', ref: c.ref, pad: pi, detail: ps.flux > 0 ? t('{ref} pad {pad} reflowed with flux', { ref: c.ref, pad: p.name }) : t('{ref} pad {pad} reflowed', { ref: c.ref, pad: p.name }) });
            } else ev.push({ kind: 'dull-joint', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: no flux — oxidised, still dull', { ref: c.ref, pad: p.name }) });
          }
          if (!lifted && c.state.intermittent?.some((f) => f.pad === pi)) {
            c.state.intermittent = c.state.intermittent.filter((f) => f.pad !== pi);
            if (!c.state.intermittent.length) c.state.intermittent = undefined;
            ev.push({ kind: 'reflowed', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: cracked joint reflowed', { ref: c.ref, pad: p.name }) });
          }
          }
        }
        // pad delamination from prolonged overheating
        if (tj >= L.padLiftTemp) js.hot += dt;
        if (js.hot >= L.padLiftSeconds && !c.state.lifted?.includes(pi)) {
          c.state.lifted = [...(c.state.lifted ?? []), pi];
          if (!c.state.cold.includes(pi)) c.state.cold = [...c.state.cold, pi].sort((a, b) => a - b);
          ev.push({ kind: 'pad-lifted', ref: c.ref, pad: pi, detail: t('{ref} pad {pad} lifted (overheated {s} s above {temp} °C) — needs a jumper wire', { ref: c.ref, pad: p.name, s: js.hot.toFixed(1), temp: L.padLiftTemp }) });
        }
      });
      if (allMolten && !ps.molten) ev.push({ kind: 'molten', ref: c.ref, detail: t('{ref}: all joints molten — can be lifted', { ref: c.ref }) });
      ps.molten = allMolten;
      // part body overheating
      if (T >= L.partMaxTemp) ps.overheat += dt;
      if (ps.overheat >= L.partMaxSeconds && !c.state.burnt && c.kind !== 'testpoint' && !terminalType(c)) { // a bare metal post has nothing to burn
        c.state.burnt = true;
        ev.push({ kind: 'part-overheated', ref: c.ref, detail: t('{ref} overheated ({s} s above {temp} °C)', { ref: c.ref, s: ps.overheat.toFixed(1), temp: L.partMaxTemp }) });
      }
      // MLCC thermal shock
      // thermal-shock cracking is a large-ceramic problem (0805 and up); small MLCCs survive iron contact
      const area = c.body.w * c.body.h;
      // (only when not preheated: guidance is to bring ceramics to ≥ 100 °C before tip contact)
      if (c.kind === 'capacitor' && !ps.cracked && area >= 1.2 && ps.base < 100 && T > 120 && ps.rate > L.mlccShockRate
        && rng(seedOf(`shock|${c.ref}|${Math.round(this.thermal.time * 10)}`))() < Math.min(1, ps.rate / L.mlccShockRate - 1) * (area / 3)) {
        ps.cracked = true;
        const ohms = sampleSeverity('cap-partial-short', rng(seedOf(`crack|${c.ref}`)));
        c.state.leak = { ohms };
        ev.push({ kind: 'mlcc-cracked', ref: c.ref, detail: t('{ref} cracked by thermal shock ({rate} K/s) — now leaks {r} Ω; preheat the board first', { ref: c.ref, rate: ps.rate.toFixed(0), r: ohms }) });
      }
      // small molten part under strong airflow is blown off its pads (tombstone / skew)
      if (allMolten && !ps.displaced && c.body.w * c.body.h <= L.smallPartArea && !c.pads.some((p) => (p.drill ?? 0) > 0)) {
        const strong = hotAir.some((s) => s.kind === 'hotair' && s.h >= L.blowAwayH && (c.at[0] - s.x) ** 2 + (c.at[1] - s.y) ** 2 <= s.r * s.r);
        if (strong) {
          ps.displaced = true;
          if (!c.state.cold.includes(0)) c.state.cold = [...c.state.cold, 0].sort((a, b) => a - b);
          ev.push({ kind: 'part-displaced', ref: c.ref, detail: t('{ref} blown off one pad by the airflow (tombstoned) — re-seat and reflow', { ref: c.ref }) });
        }
      }
    }
    for (const e of ev) this.log.push({ ...e, t: this.thermal.time });
    return ev;
  }
}
