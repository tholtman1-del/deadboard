// The soldering track's lessons as the bench needs them at once: which board, its title, the station
// and bench it starts with, and the inspection rules it grades. The lesson text itself (rules,
// quotes from NEETS Module 14, tables, review questions) is in ./neets14.ts, loaded with the dialog.
import { tk } from '../i18n';
import type { FindingKind } from '../workmanship';

export interface LessonMeta {
  /** The board this lesson belongs to. */
  scenario: string;
  title: string;
  /** Station setting the board starts with (Bench → Rework). */
  station: 'r350' | 'r316f' | 'r350f' | 'r400f';
  /** Bench conditions the board starts with: wrist strap on or off, and the air's humidity. */
  bench?: { grounded: boolean; humidity: 'low' | 'high' };
  /** Inspection rules graded on this board (the others are shown as notes). */
  grades: FindingKind[];
}

export const LESSON_META: LessonMeta[] = [
  { scenario: 'hr-solder-flux', title: tk('Solder and flux'), station: 'r350', grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'overheated-joint'] },
  { scenario: 'hr-heat-time', title: tk('Heat and time'), station: 'r350f', grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'overheated-joint', 'slow-melt'] },
  { scenario: 'hr-clean-inspect', title: tk('Clean and inspect'), station: 'r350f', grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'loose-solder', 'overheated-joint'] },
  { scenario: 'hr-desoldering', title: tk('Desoldering'), station: 'r350f', grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'loose-solder', 'overheated-joint'] },
  { scenario: 'hr-thermal-shunt', title: tk('Thermal shunt'), station: 'r350f', grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'no-shunt', 'overheated-joint'] },
  { scenario: 'hr-skipping-pattern', title: tk('Skipping pattern'), station: 'r350f', grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'skip-pattern', 'overheated-joint'] },
  { scenario: 'hr-conductor-repair', title: tk('Conductor repair'), station: 'r350f', grades: ['loose-solder', 'wire-repair', 'nick', 'pad-lifted', 'part-overheated', 'overheated-joint'] },
  { scenario: 'hr-conformal-coating', title: tk('Conformal coating'), station: 'r350f', grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'coating-charred', 'coating-missing', 'coating-mismatch', 'coating-method', 'overheated-joint'] },
  { scenario: 'hr-coating-id', title: tk('Coating identification'), station: 'r316f', grades: ['coating-id', 'coating-id-order', 'coating-charred', 'coating-missing', 'coating-mismatch', 'coating-method', 'dull-joint', 'flux-residue', 'pad-lifted', 'overheated-joint'] },
  { scenario: 'hr-esd', title: tk('Electrostatic discharge'), station: 'r350f', bench: { grounded: false, humidity: 'low' }, grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'esd-damage', 'esd-handling', 'overheated-joint'] },
  { scenario: 'hr-pad-repair', title: tk('Pad repair'), station: 'r350f', grades: ['pad-lifted', 'wire-repair', 'loose-solder', 'dull-joint', 'flux-residue', 'part-overheated', 'overheated-joint'] },
  { scenario: 'hr-turret', title: tk('Turret terminals'), station: 'r316f', grades: ['wire-strip', 'wire-tinning', 'wire-clearance', 'wire-forming', 'wire-solder', 'flux-residue', 'overheated-joint', 'slow-melt', 'dull-joint', 'loose-solder'] },
  { scenario: 'hr-hook-tab', title: tk('Hook and pierced tab terminals'), station: 'r316f', grades: ['wire-strip', 'wire-tinning', 'wire-clearance', 'wire-forming', 'wire-solder', 'flux-residue', 'overheated-joint', 'slow-melt', 'dull-joint', 'loose-solder'] },
  { scenario: 'hr-solder-cup', title: tk('Solder cups'), station: 'r316f', grades: ['wire-strip', 'wire-tinning', 'wire-clearance', 'wire-forming', 'wire-solder', 'flux-residue', 'overheated-joint', 'slow-melt', 'dull-joint', 'loose-solder'] },
  { scenario: 'hr-final-practical', title: tk('Final practical'), station: 'r316f', bench: { grounded: false, humidity: 'low' }, grades: ['wire-strip', 'wire-tinning', 'wire-clearance', 'wire-forming', 'wire-solder', 'coating-id', 'coating-id-order', 'coating-charred', 'coating-missing', 'coating-mismatch', 'coating-method', 'skip-pattern', 'dull-joint', 'overheated-joint', 'slow-melt', 'pad-lifted', 'part-overheated', 'flux-residue', 'loose-solder', 'wire-repair', 'nick', 'esd-damage', 'esd-handling'] },
];

export function lessonMeta(scenarioId: string): LessonMeta | undefined {
  return LESSON_META.find((l) => l.scenario === scenarioId);
}
