// Workmanship inspection: after rework, what a high-reliability inspector would check, from what
// actually happened on the bench (src/rework.ts episodes and events) and the board as it is now.
// Every rule cites its source; a "reject" means the work would not pass inspection, a "note"
// is advice. Universal: nothing here knows any particular board.
import { tk } from './i18n';
import type { Board } from './types';
import { isHeatSensitive, type JointEpisode, type ReworkEvent } from './rework';

/** Where a rule comes from (public-domain source, page as printed). */
export interface RuleSource { doc: string; page: string }
export const NEETS14 = 'NEETS Module 14 (NAVEDTRA 14186)';
const src = (page: string): RuleSource => ({ doc: NEETS14, page });

export type FindingKind =
  | 'pad-lifted' | 'part-overheated' | 'mlcc-cracked' | 'part-displaced' | 'dull-joint'
  | 'flux-residue' | 'loose-solder' | 'long-dwell' | 'wire-repair' | 'no-shunt' | 'skip-pattern' | 'nick'
  | 'coating-charred' | 'coating-missing' | 'coating-mismatch' | 'coating-method' | 'esd-damage' | 'esd-handling';

/**
 * `procedural`: about how the work was done, which the finished board does not show; listed only
 * where a lesson teaches it.
 */
export interface Rule { kind: FindingKind; severity: 'reject' | 'note'; title: string; rule: string; source: RuleSource; procedural?: boolean }

/** The rules, as the source states them (English keys, translated where shown). */
export const RULES: Record<FindingKind, Rule> = {
  'pad-lifted': { kind: 'pad-lifted', severity: 'reject', title: tk('Lifted pad'), rule: tk('Examine the board for nicked, cracked, lifted, or delaminated conductors and lifted or delaminated pads.'), source: src('3-19') },
  'part-overheated': { kind: 'part-overheated', severity: 'reject', title: tk('Overheated part'), rule: tk('None of the remaining components should be cracked, broken, or show signs of overheating.'), source: src('3-19') },
  'mlcc-cracked': { kind: 'mlcc-cracked', severity: 'reject', title: tk('Cracked part'), rule: tk('None of the remaining components should be cracked, broken, or show signs of overheating.'), source: src('3-19') },
  'part-displaced': { kind: 'part-displaced', severity: 'reject', title: tk('Part moved off its pads'), rule: tk('Parts should always be remounted in the same position and with the termination methods used by the original manufacturer.'), source: src('3-20') },
  'dull-joint': { kind: 'dull-joint', severity: 'reject', title: tk('Dull, unwetted joint'), rule: tk('The completed solder joint should be bright and shiny, with no cracks or pits, and the solder should cover the pad. Flux removes the oxides that stop solder wetting.'), source: src('2-20, 3-24') },
  'flux-residue': { kind: 'flux-residue', severity: 'reject', title: tk('Flux residue left'), rule: tk('When a solder joint is completed, solvent must be used to remove all flux residue: 99.5 % ethyl or isopropyl alcohol.'), source: src('3-25') },
  'loose-solder': { kind: 'loose-solder', severity: 'reject', title: tk('Loose or splattered solder'), rule: tk('The solder joints should not be covered by loose or splattered solder, which may cause shorts. A solder bridge across a cracked conductor is not a high-reliability repair.'), source: src('3-19, 3-32') },
  'long-dwell': { kind: 'long-dwell', severity: 'note', title: tk('Long heating'), rule: tk('Bring the joint to about 550 °F (288 °C) rapidly and hold it there briefly: in most cases the soldering action is complete within 2 or 3 seconds.'), source: src('3-23') },
  'no-shunt': { kind: 'no-shunt', severity: 'note', procedural: true, title: tk('No thermal shunt'), rule: tk('Before heat is applied to solder the joint, a thermal shunt is attached to sensitive component leads (diodes, transistors, and ICs) to conduct heat away from the component.'), source: src('3-23') },
  'skip-pattern': { kind: 'skip-pattern', severity: 'note', procedural: true, title: tk('Neighbouring pins heated in a row'), rule: tk('When multilead components such as ICs are soldered or desoldered, a skipping pattern is used: never heat two pads next to each other, to prevent heat build-up in one area.'), source: src('3-26, 3-30') },
  'coating-charred': { kind: 'coating-charred', severity: 'reject', title: tk('Charred coating'), rule: tk('Soldering irons should never be used for coating removal: the high temperatures char the coating, possibly damaging the board materials.'), source: src('3-4') },
  'coating-missing': { kind: 'coating-missing', severity: 'reject', title: tk('Coating not replaced'), rule: tk('Once the required repairs have been completed, the conformal coating must be replaced.'), source: src('3-6') },
  'coating-mismatch': { kind: 'coating-mismatch', severity: 'reject', title: tk('Wrong coating type'), rule: tk('To ensure the same protective characteristics, use the same type of replacement coating as that removed.'), source: src('3-6') },
  'coating-method': { kind: 'coating-method', severity: 'note', procedural: true, title: tk('Not the gentlest removal method'), rule: tk('Removal techniques are listed in ascending order of their damageability: always try the method which causes the least amount of damage first.'), source: src('3-3, Table 3-1') },
  'esd-damage': { kind: 'esd-damage', severity: 'reject', title: tk('Damaged by static'), rule: tk('A MOS device can be damaged by a static potential of as little as 35 volts, bipolar transistors and diodes by less than 3,000 volts. Damage does not always cause sudden failure: it can degrade the device so that it fails early.'), source: src('3-39') },
  'esd-handling': { kind: 'esd-handling', severity: 'note', procedural: true, title: tk('Handled without a ground strap'), rule: tk('Before servicing equipment the technician is grounded to discharge any static charge built up on the body; ESD-sensitive devices are handled by their body, never by their leads.'), source: src('3-40 – 3-41') },
  'nick': { kind: 'nick', severity: 'reject', title: tk('Nicked conductor'), rule: tk('Nicks or scratches in a conductor must be repaired if over one-tenth of its cross-sectional area is affected, as its current-carrying capability is reduced.'), source: src('3-31') },
  'wire-repair': { kind: 'wire-repair', severity: 'note', title: tk('Wire repair'), rule: tk('A wire lap-soldered across a break is stronger than a solder bridge but not highly reliable; the clinched staple is the preferred repair of a broken conductor.'), source: src('3-32') },
};

/** Molten longer than this counts as a long heating (the source: "within 2 or 3 seconds"). */
export const DWELL_LIMIT_S = 3;
/** The joint temperature the source names as most efficient (550 °F). */
export const BEST_JOINT_C = 288;

export interface Finding { kind: FindingKind; where: string; detail?: string }

export interface Inspection {
  /** True when no rule rejects the work. */
  accepted: boolean;
  findings: Finding[];
  /** Joints that were heated, with their measured numbers (each joint's last and longest episode). */
  joints: { where: string; molten: number; peak: number; flux: boolean; times: number; bodyPeak: number; shunt: boolean }[];
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
  const refJumpers = (reference?.jumpers ?? []).filter((j) => j.kind !== 'staple').length;
  const wires = board.jumpers.filter((j) => j.kind !== 'staple');
  if (wires.length > refJumpers) add({ kind: 'wire-repair', where: String(wires.length - refJumpers) });

  // a nick over a tenth of the conductor stays a defect until a staple bridges it
  const staples = board.jumpers.filter((j) => j.kind === 'staple');
  const distToSeg = (p: [number, number], a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1e-9;
    const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
    return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy);
  };
  for (const n of board.nicks ?? []) {
    if (n.depth <= 0.1) continue;
    const bridged = staples.some((j) => j.la === n.layer && distToSeg(n.at, j.a, j.b) < 1 && Math.hypot(j.a[0] - n.at[0], j.a[1] - n.at[1]) > 0.8 && Math.hypot(j.b[0] - n.at[0], j.b[1] - n.at[1]) > 0.8);
    if (!bridged) add({ kind: 'nick', where: `${n.at[0].toFixed(1)}, ${n.at[1].toFixed(1)} mm`, detail: `${Math.round(n.depth * 100)} %` });
  }

  // static: a sensitive part fitted by an ungrounded technician, and what the discharge did
  for (const c of board.components) {
    if (c.state.esdDamaged && c.state.populated) add({ kind: 'esd-damage', where: c.ref });
    if (c.state.esdHandled && c.state.populated) add({ kind: 'esd-handling', where: c.ref });
  }

  // conformal coating: taken off where needed, never charred, put back with the same type
  if (board.coating) for (const c of board.components) {
    const st = c.state.coating;
    if (c.state.coatCharred) add({ kind: 'coating-charred', where: c.ref });
    if (st === 'removed') add({ kind: 'coating-missing', where: c.ref });
    else if (st && st !== board.coating.type) add({ kind: 'coating-mismatch', where: c.ref, detail: st });
    if (c.state.coatMethodRank !== undefined && c.state.coatBestRank !== undefined && c.state.coatMethodRank > c.state.coatBestRank) add({ kind: 'coating-method', where: c.ref, detail: `#${c.state.coatMethodRank}` });
  }

  // how the joints were heated
  const byJoint = new Map<string, Inspection['joints'][number]>();
  for (const ep of episodes) {
    const where = padName(ep.ref, ep.pad);
    const j = byJoint.get(where);
    if (!j) byJoint.set(where, { where, molten: ep.molten, peak: ep.peak, flux: ep.flux, times: 1, bodyPeak: ep.bodyPeak, shunt: ep.shunt });
    else { j.molten = Math.max(j.molten, ep.molten); j.peak = Math.max(j.peak, ep.peak); j.flux = ep.flux; j.times++; j.bodyPeak = Math.max(j.bodyPeak, ep.bodyPeak); j.shunt = ep.shunt; }
  }
  for (const j of byJoint.values()) if (j.molten > DWELL_LIMIT_S) add({ kind: 'long-dwell', where: j.where, detail: `${j.molten.toFixed(1)} s` });

  // procedure: shunts on sensitive leads, and the skipping pattern on multilead parts
  for (const ep of episodes) {
    const c = board.components.find((x) => x.ref === ep.ref);
    if (c && isHeatSensitive(c) && !ep.shunt) add({ kind: 'no-shunt', where: padName(ep.ref, ep.pad) });
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
  return { accepted: !findings.some((f) => RULES[f.kind].severity === 'reject'), findings, joints: [...byJoint.values()] };
}
