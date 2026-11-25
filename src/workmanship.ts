// Workmanship inspection: after rework, what a high-reliability inspector would check, from what
// actually happened on the bench (src/rework.ts episodes and events) and the board as it is now.
// Every rule cites its source; a "reject" means the work would not pass inspection, a "note"
// is advice. Universal: nothing here knows any particular board.
import { t, tk } from './i18n';
import type { Board } from './types';
import { FILL_LIMITS, isHeatSensitive, isPlated, type JointEpisode, type ReworkEvent } from './rework';
import { judgeClinch, terminationName, terminationOf } from './clinch';
import { judgeBurn, type LamArea } from './laminate';
import { judgeLeadForm } from './flatpack';
import { isWire, judge, type Check, type CheckArea, type TerminalType, type WireEnd } from './terminals';

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
  | 'coating-charred' | 'coating-missing' | 'coating-mismatch' | 'coating-method' | 'esd-damage' | 'esd-handling' | 'esd-workarea'
  | 'overheated-joint' | 'slow-melt' | 'coating-id' | 'coating-id-order'
  | 'wire-strip' | 'wire-tinning' | 'wire-clearance' | 'wire-forming' | 'wire-solder' | 'wire-heats'
  | 'clinch' | 'termination-style'
  | 'laminate-burn' | 'laminate-excavation' | 'epoxy-fill' | 'buttercoat'
  | 'solder-insufficient' | 'solder-excess' | 'mounting-style' | 'flatpack-leads' | 'solder-projection';

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
  'flux-residue': { kind: 'flux-residue', severity: 'reject', title: tk('Flux residue left'), rule: tk('When a solder joint is completed, solvent must be used to remove all flux residue: 99.5 % isopropyl alcohol, after the joint has cooled (NEETS also names ethyl alcohol; the 2M manual allows isopropyl only).'), source: src('3-25'), also: [to('05-6.2')] },
  'loose-solder': { kind: 'loose-solder', severity: 'reject', title: tk('Loose or splattered solder'), rule: tk('The solder joints should not be covered by loose or splattered solder, which may cause shorts. A solder bridge across a cracked conductor is not a high-reliability repair.'), source: src('3-19, 3-32'), also: [to('05-6.1')] },
  'long-dwell': { kind: 'long-dwell', severity: 'note', title: tk('Long heating'), rule: tk('Bring the joint to about 550 °F (288 °C) rapidly and hold it there briefly: in most cases the soldering action is complete within 2 or 3 seconds.'), source: src('3-23'), also: [to('05-5')] },
  'no-shunt': { kind: 'no-shunt', severity: 'note', procedural: true, title: tk('No thermal shunt'), rule: tk('Before heat is applied to solder the joint, a thermal shunt is attached to sensitive component leads (diodes, transistors, and ICs) to conduct heat away from the component.'), source: src('3-23') },
  'skip-pattern': { kind: 'skip-pattern', severity: 'note', procedural: true, title: tk('Neighbouring pins heated in a row'), rule: tk('When multilead components such as ICs are soldered or desoldered, a skipping pattern is used: never heat two pads next to each other, to prevent heat build-up in one area.'), source: src('3-26, 3-30') },
  'coating-charred': { kind: 'coating-charred', severity: 'reject', title: tk('Charred coating'), rule: tk('Soldering irons should never be used for coating removal: the high temperatures char the coating, possibly damaging the board materials.'), source: src('3-4') },
  'coating-missing': { kind: 'coating-missing', severity: 'reject', title: tk('Coating not replaced'), rule: tk('Once the required repairs have been completed, the conformal coating must be replaced.'), source: src('3-6') },
  'coating-mismatch': { kind: 'coating-mismatch', severity: 'reject', title: tk('Wrong coating type'), rule: tk('To ensure the same protective characteristics, use the same type of replacement coating as that removed.'), source: src('3-6') },
  'coating-method': { kind: 'coating-method', severity: 'note', procedural: true, title: tk('Not the gentlest removal method'), rule: tk('Removal techniques are listed in ascending order of their damageability: always try the method which causes the least amount of damage first.'), source: src('3-3, Table 3-1') },
  'esd-damage': { kind: 'esd-damage', severity: 'reject', title: tk('Damaged by static'), rule: tk('A MOS device can be damaged by a static potential of as little as 35 volts, bipolar transistors and diodes by less than 3,000 volts. Damage does not always cause sudden failure: it can degrade the device so that it fails early.'), source: src('3-39') },
  'wire-heats': { kind: 'wire-heats', severity: 'note', procedural: true, title: tk('Wires on one terminal soldered in separate heats'), rule: tk('When soldering multiple wires, complete all soldering before removing the soldering iron tip from its original position on the terminal: place every wire first, then solder them in one heat. A second heat reflows the first joint.'), source: to('08-5.7') },
  'esd-workarea': { kind: 'esd-workarea', severity: 'note', procedural: true, title: tk('Worked without a ground strap'), rule: tk('Personnel are required to wear a properly grounded ESD wrist strap and cord while working in or around the Electrostatic Protected Area: put it on before the first touch, not just for the sensitive part.'), source: to('03-3'), also: [src('3-40')] },
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
  'clinch': { kind: 'clinch', severity: 'reject', title: tk('Clinched lead'), rule: tk('A clinched lead is cut to one pad diameter (at least one pad radius, at most two) and formed in the direction of the connecting conductor; it must not extend beyond the edge of the pad or of the conductor. A lead on an isolated pad is not fully clinched.'), source: src('3-22'), also: [to('07-6.17, 07-6.18')] },
  'termination-style': { kind: 'termination-style', severity: 'reject', title: tk('Not terminated like the original'), rule: tk('The replacement component should be mounted in the same manner as the original: if the manufacturer clinched the leads (full or semi), the replacement part is reinstalled with clinched leads.'), source: src('3-22'), also: [to('07-5.5')] },
  'laminate-burn': { kind: 'laminate-burn', severity: 'reject', title: tk('Burned laminate'), rule: tk('Burns that physically damage the surface of the laminate, or extend through it, are defects; all of them are repaired. Slight discoloration is acceptable.'), source: src('3-36'), also: [to('11-6.1, 11-5.1.3')] },
  'laminate-excavation': { kind: 'laminate-excavation', severity: 'reject', title: tk('Laminate excavation'), rule: tk('All burnt laminate is removed. For a surface patch the excavation is 75 % of the laminate thickness deep, its walls straight and perpendicular, undercut about 50 % of the thickness, and the top edge beveled one laminate thickness wide.'), source: src('3-37'), also: [to('11-6.2, 11-5.2')] },
  'epoxy-fill': { kind: 'epoxy-fill', severity: 'reject', title: tk('Epoxy fill'), rule: tk('The undercut is filled with bubble-free epoxy, the excavation overfilled by about 5 % of the thickness, cured, and restored to the original laminate level. No voids over 20 % of the thickness, no uncured epoxy.'), source: src('3-37'), also: [to('11-6.3')] },
  'buttercoat': { kind: 'buttercoat', severity: 'reject', title: tk('Buttercoat'), rule: tk('A thin, smooth, continuous layer of cured epoxy covers and overlaps the exposed fiber weave in the repair area.'), source: to('11-6.4') },
  'solder-insufficient': { kind: 'solder-insufficient', severity: 'reject', title: tk('Insufficient solder'), rule: tk('The pad on the termination side is at least 75 % covered with wetted solder (100 % is the target), and the vertical fill of a plated-through hole is 100 %.'), source: src('3-24'), also: [to('07-6.20')] },
  'solder-excess': { kind: 'solder-excess', severity: 'reject', title: tk('Excessive solder'), rule: tk('Too much solder hides the parts being joined: the fillet is convex and their outline is not discernible. The solder must be removed and the joint resoldered.'), source: to('05-4.2.10, 05-6.1') },
  'mounting-style': { kind: 'mounting-style', severity: 'reject', title: tk('Not mounted like the original'), rule: tk('TOs are mounted flush, on a spacer or over an air gap, as the manufacturer chose (heat dissipation, short-circuit protection, support): the technician replaces them the same way.'), source: src('3-27') },
  'flatpack-leads': { kind: 'flatpack-leads', severity: 'reject', title: tk('Flat pack leads'), rule: tk('Replacement flat pack leads are tinned, formed with two distinct bends and cut to length: the lead on the land is 50–80 % of the land length, never shorter than the lead width, and its toe never overhangs the land.'), source: src('3-30'), also: [to('18-6.6, 18-5.7')] },
  'solder-projection': { kind: 'solder-projection', severity: 'reject', title: tk('Solder projection'), rule: tk('A solder projection (icicle) sticks out of the joint: it comes from reflowing a joint without flux, or lifting the iron before the solder. It is a defect and must be reflowed, with flux.'), source: to('05-4.2.12, 05-6.1') },
  'wire-repair': { kind: 'wire-repair', severity: 'note', title: tk('Wire repair'), rule: tk('A wire lap-soldered across a break is stronger than a solder bridge but not highly reliable; the clinched staple is the preferred repair of a broken conductor.'), source: src('3-32') },
};

/** How to put each finding right on the bench (ours): shown under a rejected rule in the debrief. */
export const FIXES: Record<FindingKind, string> = {
  'pad-lifted': tk('Replace the pad with Pad repair (E): a new pad and eyelet. Then solder the lead in it with fresh solder.'),
  'part-overheated': tk('Replace the part (Parts bin, 8). Next time: a shunt on sensitive leads, 2–3 s per joint, no hotter tip than needed.'),
  'mlcc-cracked': tk('Replace the part, and preheat the board before the tip touches a ceramic capacitor.'),
  'part-displaced': tk('Reflow it and seat it back on its pads where the original sat.'),
  'dull-joint': tk('Reflow it with flux ("+ flux" in Bench → Rework, or the Rosin tool, R) and hold until the solder flows.'),
  'flux-residue': tk('Let the joint cool, then clean it with Isopropyl (0).'),
  'loose-solder': tk('Take the splash off with Desolder wick (4). A bridge across a crack is replaced by a Clinched staple (K).'),
  'long-dwell': tk('Lift the tip once the solder has flowed: 2–3 s. If it melts slowly, clean the tip, use flux or preheat rather than hold longer.'),
  'wire-repair': tk('Repair a broken conductor with a Clinched staple (K) instead of a wire.'),
  'no-shunt': tk('Clip a Thermal shunt (S) on the lead, between the joint and the body, before you heat it.'),
  'skip-pattern': tk('Heat pins that are not next to each other: for pins 1–4, for example, 2, 4, 1, 3.'),
  'nick': tk('Bridge the nick with a Clinched staple (K): click the conductor on one side of it, then the other.'),
  'coating-charred': tk('Never put the iron on a coating: take it off with Coating removal (U) first.'),
  'coating-missing': tk('Coat the part again with Conformal coating (J), the board\'s own type.'),
  'coating-mismatch': tk('Take the wrong coating off and apply the board\'s own type (Bench → Conformal coating).'),
  'coating-method': tk('Use the first method in the removal table that applies to this coating (Bench → Coating removal).'),
  'esd-damage': tk('Replace the part with the wrist strap on (Bench → ESD protection).'),
  'esd-handling': tk('Put the wrist strap on before you fit a sensitive part (Bench → ESD protection).'),
  'esd-workarea': tk('Put the wrist strap on before the first touch (Bench → ESD protection). Work done without it stays on the record: undo it or restart the board.'),
  'overheated-joint': tk('Take the old solder off (Solder extractor, X, or wick) and resolder with fresh solder and flux, in 2–3 s.'),
  'slow-melt': tk('Solder should melt within 2 s: clean the tip and the joint, use flux, preheat the board, and only then turn the tip up.'),
  'coating-id': tk('Test the coating (Coating test, Q), follow the flowchart and record the type in Bench → Identified as.'),
  'coating-id-order': tk('Identify and record the coating before you take any of it off.'),
  'wire-strip': tk('Strip AWG 22 and smaller with thermal strippers (the wire dialog\'s Stripper).'),
  'wire-tinning': tk('Tin the stripped end in the wire dialog before you form it.'),
  'wire-clearance': tk('Change the strip length or the clearance in the wire dialog: one wire diameter (1.3 mm) between the insulation and the terminal.'),
  'wire-forming': tk('Undo and form the end again: 180° round the post and cut flush, in the arc of a hook, through the eye of a tab, and a second wire beside the first, never across it.'),
  'wire-solder': tk('Solder the terminal with fresh solder ("+ flux"): the tinning alone leaves a starved fillet.'),
  'wire-heats': tk('Place every wire the terminal takes, then solder them all in one heat.'),
  'clinch': tk('Set the clinch in Bench → Lead termination: along the conductor, one pad diameter long; a semi-clinch on an isolated pad.'),
  'termination-style': tk('Fit the part as the factory did (Bench → Lead termination): clinched if the original was.'),
  'laminate-burn': tk('Repair it with Laminate repair (A): excavate, then fill and finish.'),
  'laminate-excavation': tk('Excavate again (Laminate repair, A): 75 % deep, straight walls, a 50 % undercut with rounded corners, a bevel one thickness wide.'),
  'epoxy-fill': tk('Fill again: bubble-free epoxy, about 5 % overfill, cured, then levelled.'),
  'buttercoat': tk('Finish with a buttercoat over the exposed weave (Laminate repair, A).'),
  'solder-insufficient': tk('Reflow the joint and feed more solder (hold "+ flux" a little longer) until the hole is full and the pad covered.'),
  'solder-excess': tk('Take the extra off with Desolder wick (4) and reflow: the lead\'s outline should show.'),
  'mounting-style': tk('Refit the part the way the factory mounted it (Bench → TO mounting).'),
  'flatpack-leads': tk('Fit a new part with its leads formed and cut to 50–80 % of the land (Bench → Flat pack leads).'),
  'solder-projection': tk('Reflow the joint with flux: the icicle pulls back into the fillet.'),
};

const mountName = (m?: 'flush' | 'spacer' | 'gap') => (m === 'spacer' ? t('on a spacer') : m === 'gap' ? t('air gap') : t('flush'));

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

  // a nick over NICK_LIMIT (20 %) of the conductor stays a defect until a staple bridges it
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
  // the work area: any work on the card while the technician was not grounded (Appendix C grades it SAT/UNSAT)
  if (board.workUngrounded) add({ kind: 'esd-workarea', where: t('bench') });

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

  // icicles: joints reflowed with no flux (05-4.2.12)
  for (const c of board.components) if (c.state.populated) for (const pi of c.state.projection ?? []) if (!c.state.cold.includes(pi)) add({ kind: 'solder-projection', where: padName(c.ref, pi) });

  // flat packs: how the replacement's leads were formed and cut (18-6.6)
  for (const c of board.components) {
    if (!c.state.populated || !c.state.leadForm) continue;
    const bad = judgeLeadForm(c.state.leadForm).filter((x) => x.verdict === 'defect').map((x) => x.what);
    if (bad.length) add({ kind: 'flatpack-leads', where: c.ref, detail: bad.join('; ') });
  }

  // new joints: how much fresh solder went in (07-6.20, 05-4.2.10)
  for (const c of board.components) {
    if (!c.state.populated) continue;
    for (const [k, v] of Object.entries(c.state.solderFill ?? {})) {
      const pi = Number(k), pct = `${Math.round(v * 100)} %`;
      if (c.state.cold.includes(pi)) continue; // not a joint yet
      if (v < FILL_LIMITS.pad) add({ kind: 'solder-insufficient', where: padName(c.ref, pi), detail: pct });
      else if (v < FILL_LIMITS.hole && isPlated(c, pi)) add({ kind: 'solder-insufficient', where: padName(c.ref, pi), detail: pct });
      else if (v > FILL_LIMITS.excess) add({ kind: 'solder-excess', where: padName(c.ref, pi), detail: pct });
    }
  }

  // clinched leads (07-6.17 / 07-6.18), and a replacement terminated like the original (07-5.5)
  for (const c of board.components) {
    if (!c.state.populated) continue;
    for (const pi of Object.keys(c.state.clinch ?? {}).map(Number)) for (const ck of judgeClinch(board, c, pi)) if (ck.verdict === 'defect') add({ kind: 'clinch', where: padName(c.ref, pi), detail: ck.what });
    const orig = reference?.components.find((x) => x.id === c.id);
    if (orig && (orig.state.mount ?? 'flush') !== (c.state.mount ?? 'flush')) add({ kind: 'mounting-style', where: c.ref, detail: `${mountName(c.state.mount)} ≠ ${mountName(orig.state.mount)}` });
    if (orig && terminationOf(orig) !== terminationOf(c)) add({ kind: 'termination-style', where: c.ref, detail: `${terminationName(terminationOf(c))} ≠ ${terminationName(terminationOf(orig))}` });
  }

  // burned laminate and its surface patch (11-6.1 – 11-6.4)
  const lamRule: Record<LamArea, FindingKind> = { burn: 'laminate-burn', excavation: 'laminate-excavation', fill: 'epoxy-fill', buttercoat: 'buttercoat' };
  for (const b of board.burns ?? []) {
    const where = `${b.at[0].toFixed(1)}, ${b.at[1].toFixed(1)} mm`;
    const bad = new Map<FindingKind, string[]>();
    for (const ck of judgeBurn(b)) if (ck.verdict === 'defect') bad.set(lamRule[ck.area], [...(bad.get(lamRule[ck.area]) ?? []), ck.what]);
    for (const [kind, what] of bad) add({ kind, where, detail: what.join('; ') });
  }

  // hook-up wires on terminals, end by end, to the T.O.'s workmanship standards
  const wireEnds: Inspection['wires'] = [];
  const areaRule: Record<CheckArea, FindingKind> = { strip: 'wire-strip', tinning: 'wire-tinning', clearance: 'wire-clearance', forming: 'wire-forming', solder: 'wire-solder' };
  const onTerm = new Map<string, WireEnd[]>(); // the ends on each terminal so far, in the order installed
  for (const j of board.jumpers) {
    if (!isWire(j)) continue;
    for (const e of j.ends) {
      const c = board.components.find((x) => x.id === e.comp);
      const ref = c?.ref ?? '?', key = `${e.comp}.${e.pad}`, before = onTerm.get(key) ?? [];
      onTerm.set(key, [...before, e]);
      const where = before.length ? `${ref} (${before.length + 1})` : ref;
      const checks = judge(e, before);
      wireEnds.push({ where, type: e.type, checks });
      const bad = new Map<FindingKind, string[]>();
      for (const ck of checks) if (ck.verdict === 'defect') bad.set(areaRule[ck.area], [...(bad.get(areaRule[ck.area]) ?? []), `${ck.what} (${ck.value})`]);
      for (const [kind, what] of bad) add({ kind, where, detail: what.join('; ') });
    }
  }
  // several wires on one terminal: soldered in one heat (T.O. 08-5.7 step 19)
  for (const ends of onTerm.values()) {
    const heats = new Set(ends.map((e) => e.heat).filter((h): h is number => h !== undefined));
    if (heats.size > 1) {
      const c = board.components.find((x) => x.id === ends[0].comp);
      add({ kind: 'wire-heats', where: c?.ref ?? '?', detail: String(heats.size) });
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
