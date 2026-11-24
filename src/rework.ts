// Rework process outcomes from thermal history. The thermal model supplies temperatures under
// real heat sources (iron, hot air, preheater); this monitor turns them into what happens to the
// solder joints, pads and parts. Limits are typical process-window values (estimates, as data).
import { t } from './i18n';
import type { Board, Component } from './types';
import type { ThermalModel } from './thermal';
import { rng, seedOf, sampleSeverity } from './faults';

/**
 * A solder alloy: solid below `solidus`, liquid above `liquidus` (°C); between them a pasty
 * ("plastic") range. Values: NEETS Module 14 p. 2-19 for tin-lead (63/37 melts at 361 °F with no
 * plastic state; 60/40 is plastic between 361 and 370 °F); SAC305 maker datasheets (217–220 °C).
 */
export interface Alloy { id: AlloyId; name: string; solidus: number; liquidus: number }
export type AlloyId = 'sac305' | 'sn63' | 'sn60';
export const SAC305: Alloy = { id: 'sac305', name: 'SAC305 (lead-free)', solidus: 217, liquidus: 220 };
export const SN63: Alloy = { id: 'sn63', name: 'Sn63Pb37', solidus: 183, liquidus: 183 };
export const SN60: Alloy = { id: 'sn60', name: 'Sn60Pb40', solidus: 183, liquidus: 188 };
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
  /** Pad adhesion: cumulative seconds above `padLiftTemp` before the pad delaminates. */
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

export type ReworkEventKind = 'molten' | 'reflowed' | 'wetted' | 'dull-joint' | 'pad-lifted' | 'part-overheated' | 'mlcc-cracked' | 'part-displaced';
export interface ReworkEvent { kind: ReworkEventKind; ref: string; pad?: number; detail: string }

/**
 * One heating of a solder joint, from the moment it melted until it froze again: what an
 * inspector would want to know about how the joint was made.
 */
export interface JointEpisode {
  ref: string; pad: number;
  /** Seconds the joint was molten (above liquidus). */
  molten: number;
  /** Peak joint temperature (°C). */
  peak: number;
  /** Flux was active when it melted. */
  flux: boolean;
  /** Board time at melting (s). */
  t: number;
  /** Still molten (the episode is not over). */
  open: boolean;
}

interface JointState { above: number; melted: boolean; hot: number; ep?: JointEpisode }

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
        if (!js) this.joints.set(key, (js = { above: 0, melted: false, hot: 0 }));
        const tj = this.thermal.jointTemp(c, pi);
        if (tj >= L.alloy.liquidus) {
          if (!js.ep) { js.ep = { ref: c.ref, pad: pi, molten: 0, peak: tj, flux: ps.flux > 0, t: this.thermal.time, open: true }; this.episodes.push(js.ep); }
          js.ep.molten += dt;
          js.ep.peak = Math.max(js.ep.peak, tj);
          js.above += dt;
          if (ps.flux > 0) ps.flux = Math.max(0, ps.flux - dt / c.pads.length);
        } else {
          allMolten = false;
          // frozen again below the solidus (the pasty range of a non-eutectic alloy still counts as soft)
          if (js.ep && tj < L.alloy.solidus) { js.ep.open = false; js.ep = undefined; }
          if (tj < L.alloy.solidus - 15) { js.above = 0; js.melted = false; }
        }
        if (!js.melted && js.above >= L.reflowSeconds) {
          js.melted = true;
          // rosin flux breaks down at soldering temperature and stays behind as residue (NEETS p. 3-25: remove it with alcohol)
          if (ps.flux > 0 && !lifted0(c, pi) && !c.state.fluxResidue?.includes(pi)) c.state.fluxResidue = [...(c.state.fluxResidue ?? []), pi].sort((a, b) => a - b);
          if (!c.state.cold.includes(pi) && !c.state.intermittent?.some((f) => f.pad === pi)) ev.push({ kind: 'wetted', ref: c.ref, pad: pi, detail: t('{ref} pad {pad}: solder flowed', { ref: c.ref, pad: p.name }) });
          const lifted = c.state.lifted?.includes(pi);
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
      if (ps.overheat >= L.partMaxSeconds && !c.state.burnt && c.kind !== 'testpoint') {
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
