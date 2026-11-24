// Workmanship inspection: after rework, what a high-reliability inspector would check, from what
// actually happened on the bench (src/rework.ts episodes and events) and the board as it is now.
// Every rule cites its source; a "reject" means the work would not pass inspection, a "note"
// is advice. Universal: nothing here knows any particular board.
import { tk } from './i18n';
import type { Board } from './types';
import type { JointEpisode, ReworkEvent } from './rework';

/** Where a rule comes from (public-domain source, page as printed). */
export interface RuleSource { doc: string; page: string }
export const NEETS14 = 'NEETS Module 14 (NAVEDTRA 14186)';
const src = (page: string): RuleSource => ({ doc: NEETS14, page });

export type FindingKind =
  | 'pad-lifted' | 'part-overheated' | 'mlcc-cracked' | 'part-displaced' | 'dull-joint'
  | 'flux-residue' | 'loose-solder' | 'long-dwell' | 'wire-repair';

export interface Rule { kind: FindingKind; severity: 'reject' | 'note'; title: string; rule: string; source: RuleSource }

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
  joints: { where: string; molten: number; peak: number; flux: boolean; times: number }[];
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
  const refJumpers = (reference?.jumpers ?? []).length;
  if (board.jumpers.length > refJumpers) add({ kind: 'wire-repair', where: String(board.jumpers.length - refJumpers) });

  // how the joints were heated
  const byJoint = new Map<string, { where: string; molten: number; peak: number; flux: boolean; times: number }>();
  for (const ep of episodes) {
    const where = padName(ep.ref, ep.pad);
    const j = byJoint.get(where);
    if (!j) byJoint.set(where, { where, molten: ep.molten, peak: ep.peak, flux: ep.flux, times: 1 });
    else { j.molten = Math.max(j.molten, ep.molten); j.peak = Math.max(j.peak, ep.peak); j.flux = ep.flux; j.times++; }
  }
  for (const j of byJoint.values()) if (j.molten > DWELL_LIMIT_S) add({ kind: 'long-dwell', where: j.where, detail: `${j.molten.toFixed(1)} s` });

  const order = (f: Finding) => (RULES[f.kind].severity === 'reject' ? 0 : 1);
  findings.sort((a, b) => order(a) - order(b));
  return { accepted: !findings.some((f) => RULES[f.kind].severity === 'reject'), findings, joints: [...byJoint.values()] };
}
