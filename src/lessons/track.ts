// The soldering track's lessons as the bench needs them at once: which board, its title, the station
// and bench it starts with, and the inspection rules it grades. The lesson text itself (rules,
// quotes from NEETS Module 14, tables, review questions) is in ./neets14.ts, loaded with the dialog.
import { tk } from '../i18n';
import type { FindingKind } from '../workmanship';

export interface LessonMeta {
  /** The board this lesson belongs to. */
  scenario: string;
  title: string;
  /** Station setting the board starts with (Bench → Rework): the 2M manual's 600 °F (316 °C) start for tin-lead (T.O. 05-5.3.4). */
  station: 'r316' | 'r316f' | 'r350' | 'r350f' | 'r400f';
  /** Bench conditions the board starts with: wrist strap on or off, and the air's humidity. */
  bench?: { grounded: boolean; humidity: 'low' | 'high' };
  /** Inspection rules graded on this board (the others are shown as notes). */
  grades: FindingKind[];
  /**
   * The tools this lesson's dock pins (tool ids), most needed first, in place of the bench set: for a
   * lesson that uses many tools taught earlier, so they fit a laptop's screen. The tools its
   * BOARD_INFO `teaches` are always pinned; when the window is short the list folds from its end.
   * Kept apart from `teaches` so the skill chips stay what the lesson is about.
   */
  dock?: string[];
  /** The coating removal table graded here: NEETS 14 Table 3-1 for its own lesson, else the 2M manual's Table 06-3. */
  coatTable?: '3-1';
}

export const LESSON_META: LessonMeta[] = [
  { scenario: 'hr-solder-flux', title: tk('Solder and flux'), station: 'r316', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'dull-joint', 'pad-lifted', 'part-overheated', 'overheated-joint'] },
  { scenario: 'hr-heat-time', title: tk('Heat and time'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'dull-joint', 'pad-lifted', 'part-overheated', 'overheated-joint', 'slow-melt'] },
  { scenario: 'hr-clean-inspect', title: tk('Clean and inspect'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'loose-solder', 'overheated-joint'] },
  { scenario: 'hr-desoldering', title: tk('Desoldering'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'loose-solder', 'overheated-joint'] },
  { scenario: 'hr-thermal-shunt', title: tk('Thermal shunt'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'no-shunt', 'overheated-joint'] },
  { scenario: 'hr-skipping-pattern', title: tk('Skipping pattern'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'skip-pattern', 'overheated-joint'] },
  { scenario: 'hr-conductor-repair', title: tk('Conductor repair'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'loose-solder', 'wire-repair', 'nick', 'pad-lifted', 'part-overheated', 'overheated-joint'] },
  { scenario: 'hr-conformal-coating', title: tk('Conformal coating'), station: 'r316f', coatTable: '3-1', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'coating-charred', 'coating-missing', 'coating-mismatch', 'coating-method', 'overheated-joint'] },
  { scenario: 'hr-coating-id', title: tk('Coating identification'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'coating-id', 'coating-id-order', 'coating-charred', 'coating-missing', 'coating-mismatch', 'coating-method', 'dull-joint', 'flux-residue', 'pad-lifted', 'overheated-joint'] },
  { scenario: 'hr-esd', title: tk('Electrostatic discharge'), station: 'r316f', bench: { grounded: false, humidity: 'low' }, grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'esd-damage', 'esd-handling', 'esd-workarea', 'overheated-joint'] },
  { scenario: 'hr-pad-repair', title: tk('Pad repair'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'pad-lifted', 'wire-repair', 'loose-solder', 'dull-joint', 'flux-residue', 'part-overheated', 'overheated-joint'] },
  { scenario: 'hr-turret', title: tk('Turret terminals'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'wire-strip', 'wire-tinning', 'wire-clearance', 'wire-forming', 'wire-solder', 'wire-heats', 'flux-residue', 'overheated-joint', 'slow-melt', 'dull-joint', 'loose-solder'] },
  { scenario: 'hr-hook-tab', title: tk('Hook and pierced tab terminals'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'wire-strip', 'wire-tinning', 'wire-clearance', 'wire-forming', 'wire-solder', 'wire-heats', 'flux-residue', 'overheated-joint', 'slow-melt', 'dull-joint', 'loose-solder'] },
  { scenario: 'hr-solder-cup', title: tk('Solder cups'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'wire-strip', 'wire-tinning', 'wire-clearance', 'wire-forming', 'wire-solder', 'wire-heats', 'flux-residue', 'overheated-joint', 'slow-melt', 'dull-joint', 'loose-solder'] },
  { scenario: 'hr-clinched-leads', title: tk('Clinched leads'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'clinch', 'termination-style', 'pad-lifted', 'dull-joint', 'flux-residue', 'loose-solder', 'part-overheated', 'overheated-joint', 'slow-melt'] },
  { scenario: 'hr-laminate', title: tk('Burned laminate'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'laminate-burn', 'laminate-excavation', 'epoxy-fill', 'buttercoat', 'termination-style', 'pad-lifted', 'dull-joint', 'flux-residue', 'loose-solder', 'part-overheated', 'overheated-joint', 'slow-melt'] },
  { scenario: 'hr-to-package', title: tk('TO packages'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'mounting-style', 'no-shunt', 'pad-lifted', 'dull-joint', 'flux-residue', 'loose-solder', 'part-overheated', 'overheated-joint', 'slow-melt'] },
  { scenario: 'hr-flat-pack', title: tk('Flat packs'), station: 'r316f', grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'flatpack-leads', 'skip-pattern', 'pad-lifted', 'dull-joint', 'flux-residue', 'loose-solder', 'overheated-joint', 'slow-melt'] },
  { scenario: 'hr-final-practical', title: tk('Final practical'), station: 'r316f', bench: { grounded: false, humidity: 'low' }, dock: ['inspect', 'iron', 'coatest', 'decoat', 'extract', 'padfix', 'replace', 'staple', 'ipa', 'hookup', 'wick', 'pliers', 'laminate', 'coat', 'shunt', 'rosin', 'dmm'], grades: ['solder-insufficient', 'solder-excess', 'solder-projection', 'mounting-style', 'wire-strip', 'wire-tinning', 'wire-clearance', 'wire-forming', 'wire-solder', 'wire-heats', 'clinch', 'termination-style', 'laminate-burn', 'laminate-excavation', 'epoxy-fill', 'buttercoat', 'coating-id', 'coating-id-order', 'coating-charred', 'coating-missing', 'coating-mismatch', 'coating-method', 'skip-pattern', 'dull-joint', 'overheated-joint', 'slow-melt', 'pad-lifted', 'part-overheated', 'flux-residue', 'loose-solder', 'wire-repair', 'nick', 'esd-damage', 'esd-handling', 'esd-workarea'] },
];

export function lessonMeta(scenarioId: string): LessonMeta | undefined {
  return LESSON_META.find((l) => l.scenario === scenarioId);
}
