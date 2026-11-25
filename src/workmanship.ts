// Workmanship inspection: after rework, what a high-reliability inspector would check, from what
// actually happened on the bench (src/rework.ts episodes and events) and the board as it is now.
// Every rule cites its source; a "reject" means the work would not pass inspection, a "note"
// is advice. Universal: nothing here knows any particular board.
import { tk } from './i18n';
import type { Board } from './types';
import { isHeatSensitive, type JointEpisode, type ReworkEvent } from './rework';
import { isWire, judge, type Check, type CheckArea, type TerminalType } from './terminals';

/** Where a rule comes from (public-domain source, page as printed). */
export interface RuleSource { doc: string; page: string }
export const NEETS14 = 'NEETS Module 14 (NAVEDTRA 14186)';
/** The 2M workmanship manual: NAVAIR 01-1A-23 / NAVSEA SE004-AK-TRS-010/2M / T.O. 00-25-259 (Rev 4, 2013; Distribution A). */
export const TO_2M = 'T.O. 00-25-259 (NAVAIR 01-1A-23)';
const src = (page: string): RuleSource => ({ doc: NEETS14, page });
const to = (para: string): RuleSource => ({ doc: TO_2M, page: para });

export type FindingKind =
  | 'pad-lifted' | 'part-overheated' | 'mlcc-cracked' | 'part-displaced' | 'dull-joint'
  | 'flux-residue' | 'loose-solder' | 'long-dwell' | 'wire-repair' | 'no-shunt' | 'skip-pattern' | 'nick'
  | 'coating-charred' | 'coating-missing' | 'coating-mismatch' | 'coating-method' | 'esd-damage' | 'esd-handling'
  | 'overheated-joint' | 'slow-melt' | 'coating-id' | 'coating-id-order'
  | 'wire-strip' | 'wire-tinning' | 'wire-clearance' | 'wire-forming' | 'wire-solder';

/**
 * `procedural`: about how the work was done, which the finished board does not show; listed only
 * where a lesson teaches it.
 */
export interface Rule { kind: FindingKind; severity: 'reject' | 'note'; title: string; rule: string; source: RuleSource; procedural?: boolean; /** The same rule in the other manual. */ also?: RuleSource[] }

/** The rules, as the source states them (English keys, translated where shown). */
export const RULES: Record<FindingKind, Rule> = {
  'pad-lifted': { kind: 'pad-lifted', severity: 'reject', title: tk('Lifted pad'), rule: tk('Examine the board for nicked, cracked, lifted, or delaminated conductors and lifted or delaminated pads.'), source: src('3-19'), also: [to('12-6.1')] },
  'part-overheated': { kind: 'part-overheated', severity: 'reject', title: tk('Overheated part'), rule: tk('None of the remaining components should be cracked, broken, or show signs of overheating.'), source: src('3-19') },
  'mlcc-cracked': { kind: 'mlcc-cracked', severity: 'reject', title: tk('Cracked part'), rule: tk('None of the remaining components should be cracked, broken, or show signs of overheating.'), source: src('3-19') },
  'part-displaced': { kind: 'part-displaced', severity: 'reject', title: tk('Part moved off its pads'), rule: tk('Parts should always be remounted in the same position and with the termination methods used by the original manufacturer.'), source: src('3-20') },
  'dull-joint': { kind: 'dull-joint', severity: 'reject', title: tk('Dull, unwetted joint'), rule: tk('The completed solder joint should be bright and shiny, with no cracks or pits, and the solder should cover the pad. Flux removes the oxides that stop solder wetting.'), source: src('2-20, 3-24'), also: [to('05-6.1')] },
  'flux-residue': { kind: 'flux-residue', severity: 'reject', title: tk('Flux residue left'), rule: tk('When a solder joint is completed, solvent must be used to remove all flux residue: 99.5 % ethyl or isopropyl alcohol.'), source: src('3-25'), also: [to('05-6.2')] },
  'loose-solder': { kind: 'loose-solder', severity: 'reject', title: tk('Loose or splattered solder'), rule: tk('The solder joints should not be covered by loose or splattered solder, which may cause shorts. A solder bridge across a cracked conductor is not a high-reliability repair.'), source: src('3-19, 3-32'), also: [to('05-6.1')] },
  'long-dwell': { kind: 'long-dwell', severity: 'note', title: tk('Long heating'), rule: tk('Bring the joint to about 550 °F (288 °C) rapidly and hold it there briefly: in most cases the soldering action is complete within 2 or 3 seconds.'), source: src('3-23'), also: [to('05-5')] },
  'no-shunt': { kind: 'no-shunt', severity: 'note', procedural: true, title: tk('No thermal shunt'), rule: tk('Before heat is applied to solder the joint, a thermal shunt is attached to sensitive component leads (diodes, transistors, and ICs) to conduct heat away from the component.'), source: src('3-23') },
  'skip-pattern': { kind: 'skip-pattern', severity: 'note', procedural: true, title: tk('Neighbouring pins heated in a row'), rule: tk('When multilead components such as ICs are soldered or desoldered, a skipping pattern is used: never heat two pads next to each other, to prevent heat build-up in one area.'), source: src('3-26, 3-30') },
  'coating-charred': { kind: 'coating-charred', severity: 'reject', title: tk('Charred coating'), rule: tk('Soldering irons should never be used for coating removal: the high temperatures char the coating, possibly damaging the board materials.'), source: src('3-4') },
  'coating-missing': { kind: 'coating-missing', severity: 'reject', title: tk('Coating not replaced'), rule: tk('Once the required repairs have been completed, the conformal coating must be replaced.'), source: src('3-6') },
  'coating-mismatch': { kind: 'coating-mismatch', severity: 'reject', title: tk('Wrong coating type'), rule: tk('To ensure the same protective characteristics, use the same type of replacement coating as that removed.'), source: src('3-6') },
  'coating-method': { kind: 'coating-method', severity: 'note', procedural: true, title: tk('Not the gentlest removal method'), rule: tk('Removal techniques are listed in ascending order of their damageability: always try the method which causes the least amount of damage first.'), source: src('3-3, Table 3-1') },
  'esd-damage': { kind: 'esd-damage', severity: 'reject', title: tk('Damaged by static'), rule: tk('A MOS device can be damaged by a static potential of as little as 35 volts, bipolar transistors and diodes by less than 3,000 volts. Damage does not always cause sudden failure: it can degrade the device so that it fails early.'), source: src('3-39') },
  'esd-handling': { kind: 'esd-handling', severity: 'note', procedural: true, title: tk('Handled without a ground strap'), rule: tk('Before servicing equipment the technician is grounded to discharge any static charge built up on the body; ESD-sensitive devices are handled by their body, never by their leads.'), source: src('3-40 – 3-41') },
  'overheated-joint': { kind: 'overheated-joint', severity: 'reject', title: tk('Overheated, oxidized joint'), rule: tk('Excessively long dwell times or repeated reflow oxidize the solder: a dull, grainy or crusty joint. This is a defect: the solder must be removed and the joint resoldered.'), source: to('05-4.2.5, 05-4.2.6') },
  'slow-melt': { kind: 'slow-melt', severity: 'note', procedural: true, title: tk('Kept heating a joint that would not melt'), rule: tk('If solder melt does not occur in two to three seconds, remove the tip: make sure the tip and the joint are clean before increasing the tip temperature.'), source: to('03-5.4, 05-5.3.4') },
  'coating-id': { kind: 'coating-id', severity: 'reject', procedural: true, title: tk('Coating not identified correctly'), rule: tk('The conformal coating type must be identified before removal, so the appropriate removal technique can be used (by its hardness, transparency, thickness, solubility in isopropyl alcohol and reaction to heat).'), source: to('06-5.2, 06-4.1') },
  'coating-id-order': { kind: 'coating-id-order', severity: 'note', procedural: true, title: tk('Coating removed before it was identified'), rule: tk('Identify the coating first: the removal method depends on its type.'), source: to('06-5.2') },
  'nick': { kind: 'nick', severity: 'reject', title: tk('Nicked conductor'), rule: tk('Damage that reduces a conductor\'s cross-sectional area must be repaired, as its current-carrying capability is reduced: over one tenth in NEETS (1998), over 20 % in the current 2M manual, which is the limit used here.'), source: src('3-31'), also: [to('12-6.1')] },
  'wire-strip': { kind: 'wire-strip', severity: 'reject', procedural: true, title: tk('Wrong wire stripper'), rule: tk('Thermal stripping is the preferred method. Do not use mechanical strippers on wire sizes AWG-22 or smaller: the pulling action of the stripper may stretch the smaller-sized wires.'), source: to('08-5.3') },
  'wire-tinning': { kind: 'wire-tinning', severity: 'reject', title: tk('Wire not tinned'), rule: tk('Stranded wires are tinned on all portions of the wire coming into contact with the soldered area: tinning prevents birdcaging during forming and enhances solder flow.'), source: to('08-6.3, 08-5.4') },
  'wire-clearance': { kind: 'wire-clearance', severity: 'reject', title: tk('Insulation clearance'), rule: tk('Target: one wire diameter (including insulation) between the end of the insulation and the terminal. Acceptable: up to two wire diameters. Defect: more than two, or the insulation contacts the terminal (in a solder cup: the solder fillet).'), source: to('08-6.4, 09-6.1') },
  'wire-forming': { kind: 'wire-forming', severity: 'reject', title: tk('Wire forming'), rule: tk('Turret and hook: the wire contacts the post for 180°, more is acceptable if the wire does not overlap itself. Pierced tab: through the eye, at least 90° of contact. The cut end may extend at most one wire diameter beyond the terminal. A wire goes to the full depth of a solder cup.'), source: to('08-6.5 – 08-6.7, 09-6.1') },
  'wire-solder': { kind: 'wire-solder', severity: 'reject', title: tk('Wire solder connection'), rule: tk('A discernible solder fillet covers 100 % of the wire and terminal contact area, the contour of the wire still visible. A solder cup is filled at least 75 % of its cutout, with complete wetting between the wire and the cup.'), source: to('08-6.12, 09-6.1') },
  'wire-repair': { kind: 'wire-repair', severity: 'note', title: tk('Wire repair'), rule: tk('A wire lap-soldered across a break is stronger than a solder bridge but not highly reliable; the clinched staple is the preferred repair of a broken conductor.'), source: src('3-32') },
};

/** A nick deeper than this share of the conductor is a defect (T.O. 00-25-259 12-6.1: 20 %; NEETS 14 p. 3-31 had one tenth). */
export const NICK_LIMIT = 0.2;
/** The tip on a molten joint longer than this counts as a long heating (the source: "within 2 or 3 seconds"). */
export const DWELL_LIMIT_S = 3;
/** The joint temperature the source names as most efficient (550 °F). */
export const BEST_JOINT_C = 288;

export interface Finding { kind: FindingKind; where: string; detail?: string }

export interface Inspection {
  /** True when no rule rejects the work. */
  accepted: boolean;
  findings: Finding[];
  /** Joints that were heated, with their measured numbers (each joint's last and longest episode). */
  joints: { where: string; molten: number; dwell: number; peak: number; flux: boolean; times: number; bodyPeak: number; shunt: boolean }[];
  /** Hook-up wire ends on terminals, each with the T.O.'s checks. */
  wires: { where: string; type: TerminalType; checks: Check[] }[];
}

/**
 * Inspects the work on a board. `reference` is the board as designed (to tell solder blobs and
 * jumpers the player added from the board's own); `events` and `episodes` come from the
 * ReworkMonitor (they are empty in instant rework, then only the board state counts).
 */
export function inspect(board: Board, reference: Board | undefined, episodes: readonly JointEpisode[], events: readonly ReworkEvent[]): Inspection {
  const findings: Finding[] = [];
  const padName = (ref: string, pi?: number) => {
    const c = board.components.find((x) => x.ref === ref);
    return pi === undefined || !c?.pads[pi] ? ref : `${ref}.${c.pads[pi].name}`;
  };
  const seen = new Set<string>();
  const add = (f: Finding) => { const k = `${f.kind}|${f.where}`; if (!seen.has(k)) { seen.add(k); findings.push(f); } };

  // damage the rework caused, as it is on the board now
  for (const e of events) {
    if (e.kind === 'pad-lifted' && board.components.find((c) => c.ref === e.ref)?.state.lifted?.includes(e.pad!)) add({ kind: 'pad-lifted', where: padName(e.ref, e.pad) });
    if (e.kind === 'part-overheated' && board.components.find((c) => c.ref === e.ref)?.state.burnt) add({ kind: 'part-overheated', where: e.ref });
    if (e.kind === 'mlcc-cracked' && board.components.find((c) => c.ref === e.ref)?.state.leak) add({ kind: 'mlcc-cracked', where: e.ref });
    if (e.kind === 'part-displaced' && board.components.find((c) => c.ref === e.ref)?.state.populated) add({ kind: 'part-displaced', where: e.ref });
  }
  // a lifted pad still on the board, however it got there (an inspector sees it)
  for (const c of board.components) if (c.state.populated) for (const pi of c.state.lifted ?? []) add({ kind: 'pad-lifted', where: padName(c.ref, pi) });
  // overheated / heavily oxidized solder still on a joint (it has to be removed and the joint resoldered)
  for (const c of board.components) if (c.state.populated) for (const pi of c.state.oxidized ?? []) add({ kind: 'overheated-joint', where: padName(c.ref, pi) });
  // a tip kept on a joint that did not melt within 3 s
  for (const e of events) if (e.kind === 'slow-melt') add({ kind: 'slow-melt', where: padName(e.ref, e.pad) });
  // a dull joint that was never made good afterwards (its last episode had no flux and it is still marked)
  for (const e of events) {
    if (e.kind !== 'dull-joint') continue;
    const c = board.components.find((x) => x.ref === e.ref);
    if (c?.state.populated && c.state.cold.includes(e.pad!) && !c.state.lifted?.includes(e.pad!)) add({ kind: 'dull-joint', where: padName(e.ref, e.pad) });
  }
  for (const c of board.components) for (const pi of c.state.fluxResidue ?? []) add({ kind: 'flux-residue', where: padName(c.ref, pi) });

  // solder blobs and wires the board was not designed with
  const refBlobs = new Set((reference?.blobs ?? []).map((b) => `${b.at[0].toFixed(2)},${b.at[1].toFixed(2)}`));
  for (const b of board.blobs) if (!refBlobs.has(`${b.at[0].toFixed(2)},${b.at[1].toFixed(2)}`)) add({ kind: 'loose-solder', where: `${b.at[0].toFixed(1)}, ${b.at[1].toFixed(1)} mm` });
  const refJumpers = (reference?.jumpers ?? []).filter((j) => !j.kind).length;
  const wires = board.jumpers.filter((j) => !j.kind);
  if (wires.length > refJumpers) add({ kind: 'wire-repair', where: String(wires.length - refJumpers) });

  // a nick over a tenth of the conductor stays a defect until a staple bridges it
  const staples = board.jumpers.filter((j) => j.kind === 'staple');
  const distToSeg = (p: [number, number], a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1e-9;
    const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
    return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy);
  };
  for (const n of board.nicks ?? []) {
    if (n.depth <= NICK_LIMIT) continue;
    const bridged = staples.some((j) => j.la === n.layer && distToSeg(n.at, j.a, j.b) < 1 && Math.hypot(j.a[0] - n.at[0], j.a[1] - n.at[1]) > 0.8 && Math.hypot(j.b[0] - n.at[0], j.b[1] - n.at[1]) > 0.8);
    if (!bridged) add({ kind: 'nick', where: `${n.at[0].toFixed(1)}, ${n.at[1].toFixed(1)} mm`, detail: `${Math.round(n.depth * 100)} %` });
  }

  // static: a sensitive part fitted by an ungrounded technician, and what the discharge did
  for (const c of board.components) {
    if (c.state.esdDamaged && c.state.populated) add({ kind: 'esd-damage', where: c.ref });
    if (c.state.esdHandled && c.state.populated) add({ kind: 'esd-handling', where: c.ref });
  }

  // conformal coating: identified first, taken off where needed, never charred, put back with the same type
  if (board.coating && board.coatingId !== board.coating.type) add({ kind: 'coating-id', where: board.coatingId ? board.coatingId : '—', detail: board.coatingId ? undefined : 'not identified' });
  if (board.coating) for (const c of board.components) if (c.state.coatRemovedBlind) add({ kind: 'coating-id-order', where: c.ref });
  if (board.coating) for (const c of board.components) {
    const st = c.state.coating;
    if (c.state.coatCharred) add({ kind: 'coating-charred', where: c.ref });
    if (st === 'removed') add({ kind: 'coating-missing', where: c.ref });
    else if (st && st !== board.coating.type) add({ kind: 'coating-mismatch', where: c.ref, detail: st });
    if (c.state.coatMethodRank !== undefined && c.state.coatBestRank !== undefined && c.state.coatMethodRank > c.state.coatBestRank) add({ kind: 'coating-method', where: c.ref, detail: `#${c.state.coatMethodRank}` });
  }

  // hook-up wires on terminals, end by end, to the T.O.'s workmanship standards
  const wireEnds: Inspection['wires'] = [];
  const areaRule: Record<CheckArea, FindingKind> = { strip: 'wire-strip', tinning: 'wire-tinning', clearance: 'wire-clearance', forming: 'wire-forming', solder: 'wire-solder' };
  const onTerm = new Map<string, number>();
  for (const j of board.jumpers) {
    if (!isWire(j)) continue;
    for (const e of j.ends) {
      const c = board.components.find((x) => x.id === e.comp);
      const ref = c?.ref ?? '?', n = (onTerm.get(ref) ?? 0) + 1;
      onTerm.set(ref, n);
      const where = n > 1 ? `${ref} (${n})` : ref;
      const checks = judge(e);
      wireEnds.push({ where, type: e.type, checks });
      const bad = new Map<FindingKind, string[]>();
      for (const ck of checks) if (ck.verdict === 'defect') bad.set(areaRule[ck.area], [...(bad.get(areaRule[ck.area]) ?? []), `${ck.what} (${ck.value})`]);
      for (const [kind, what] of bad) add({ kind, where, detail: what.join('; ') });
    }
  }

  // how the joints were heated
  const byJoint = new Map<string, Inspection['joints'][number]>();
  for (const ep of episodes) {
    const where = padName(ep.ref, ep.pad);
    const j = byJoint.get(where);
    if (!j) byJoint.set(where, { where, molten: ep.molten, dwell: ep.dwell ?? ep.molten, peak: ep.peak, flux: ep.flux, times: 1, bodyPeak: ep.bodyPeak, shunt: ep.shunt });
    else { j.molten = Math.max(j.molten, ep.molten); j.dwell = Math.max(j.dwell, ep.dwell ?? ep.molten); j.peak = Math.max(j.peak, ep.peak); j.flux = ep.flux; j.times++; j.bodyPeak = Math.max(j.bodyPeak, ep.bodyPeak); j.shunt = ep.shunt; }
  }
  for (const j of byJoint.values()) if (j.dwell > DWELL_LIMIT_S) add({ kind: 'long-dwell', where: j.where, detail: `${j.dwell.toFixed(1)} s` });

  // procedure: shunts on sensitive leads, and the skipping pattern on multilead parts
  for (const ep of episodes) {
    const c = board.components.find((x) => x.ref === ep.ref);
    if (c && isHeatSensitive(c) && !ep.shunt && !ep.dead) add({ kind: 'no-shunt', where: padName(ep.ref, ep.pad) });
  }
  const ordered = [...episodes].sort((a, b) => a.t - b.t);
  for (let i = 1; i < ordered.length; i++) {
    const a = ordered[i - 1], b = ordered[i];
    const c = board.components.find((x) => x.ref === b.ref);
    if (!c || a.ref !== b.ref || c.pads.length < 4 || b.t - a.t > 15) continue;
    const pa = c.pads[a.pad], pb = c.pads[b.pad];
    if (pa && pb && Math.hypot(pa.at[0] - pb.at[0], pa.at[1] - pb.at[1]) < 2.6) add({ kind: 'skip-pattern', where: `${padName(a.ref, a.pad)} → ${pb.name}` });
  }

  const order = (f: Finding) => (RULES[f.kind].severity === 'reject' ? 0 : 1);
  findings.sort((a, b) => order(a) - order(b));
  return { accepted: !findings.some((f) => RULES[f.kind].severity === 'reject'), findings, joints: [...byJoint.values()], wires: wireEnds };
}
