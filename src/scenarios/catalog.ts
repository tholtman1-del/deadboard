/**
 * What the board picker knows about each shipped board beyond its scenario file: a level
 * estimate on a 0.0–10.0 scale, a one-line symptom for the hand-made boards (the demo boards
 * carry theirs in the title, after " · "), and what the board teaches.
 *
 * **Levels are estimates** (2026-11-22, set by hand from part count, fault count, how deep the
 * fault hides and how much help the board gives). They replace the 1–5 `meta.difficulty` in the
 * picker so the order matches the challenge track; later they get fitted from solve data.
 * Boards without an entry (mods, imports) get an estimate from `meta.difficulty`.
 *
 * **Teaches** lists tools, parts and fault kinds the board makes the player use. Fault kinds of
 * challenge boards are never shown before the board is solved (they would give the fault away);
 * tutorials show everything, since they teach it openly.
 */
import { tk } from '../i18n';
import type { Scenario } from '../types';
import { CHALLENGE_TRACK_IDS, TUTORIAL_SCENARIO_IDS } from '../ui/tutorial';
import { hasFittedLevel, puzzleLevel, targetLevel, type Skill } from './adaptive';

/** Level bands, like CVSS scores: same cut points, colours from the brand's status colours. */
export const LEVEL_BANDS = [
  { id: 'low', name: tk('Low'), from: 0.1, to: 3.9 },
  { id: 'medium', name: tk('Medium'), from: 4, to: 6.9 },
  { id: 'high', name: tk('High'), from: 7, to: 8.9 },
  { id: 'critical', name: tk('Critical'), from: 9, to: 10 },
] as const;
export type BandId = (typeof LEVEL_BANDS)[number]['id'];

export function levelBand(level: number): (typeof LEVEL_BANDS)[number] {
  return LEVEL_BANDS.find((b) => level < b.to + 0.05) ?? LEVEL_BANDS[LEVEL_BANDS.length - 1];
}

export type SkillKind = 'tool' | 'part' | 'fault';
export type SkillKey = `${SkillKind}:${string}`;

/** Labels: tools use the toolbar's own names, so the picker and the bench say the same thing. */
export const SKILLS: Record<SkillKind, Record<string, string>> = {
  tool: {
    dmm: tk('Multimeter'), flip: tk('Flip'), jumper: tk('Jumper wire'), iron: tk('Soldering iron'),
    supply: tk('Bench supply'), wick: tk('Desolder wick'), diode: tk('Diode test'), rotate: tk('Rotate 180°'),
    replace: tk('Parts bin'), thermal: tk('Thermal'), ocp: tk('Current limit'), ipa: tk('Isopropyl'),
    press: tk('Press / flex'), freeze: tk('Freeze spray'), heatmap: tk('Voltage map'), rosin: tk('Rosin'), extract: tk('Solder extractor'), shunt: tk('Thermal shunt'), staple: tk('Clinched staple'), decoat: tk('Coating removal'), coat: tk('Conformal coating'), padfix: tk('Pad repair'), coatest: tk('Coating test'),
  },
  part: {
    cell: tk('Coin cell'), button: tk('Push button'), bjt: tk('Transistor (NPN)'), resistor: tk('Resistor'), led: tk('LED'),
    testpoint: tk('Test point'), fuse: tk('Fuse'), diode: tk('Diode'), schottky: tk('Schottky diode'),
    charger: tk('Li-ion charger'), ldo: tk('LDO regulator'), cap: tk('Capacitor'), mosfet: tk('MOSFET'),
    mcu: tk('Microcontroller'), buck: tk('Buck converter'),
  },
  fault: {
    open: tk('Cut trace'), cold: tk('Cold joint'), bridge: tk('Solder bridge'), reversed: tk('Reversed part'),
    wrongval: tk('Wrong value'), missing: tk('Missing part'), multi: tk('Two faults at once'),
    short: tk('Shorted part'), rootcause: tk('Cause before fuse'), layers: tk('Both copper layers'),
    masked: tk('Masked fault'), residue: tk('Residue'), intermittent: tk('Intermittent fault'),
    sequencing: tk('Power sequencing'),
  },
};
export const SKILL_GROUPS: { kind: SkillKind; label: string }[] = [
  { kind: 'tool', label: tk('Tools') }, { kind: 'part', label: tk('Parts') }, { kind: 'fault', label: tk('Faults') },
];
/** English label of a skill (translate where shown). */
export function skillLabel(key: SkillKey): string {
  const [kind, id] = key.split(':') as [SkillKind, string];
  return SKILLS[kind]?.[id] ?? id;
}

export interface BoardInfo {
  /** 0.0–10.0, an estimate. */
  level: number;
  /** One-line symptom for boards whose title has none (English; translate where shown). */
  symptom?: string;
  teaches: SkillKey[];
}

export const BOARD_INFO: Record<string, BoardInfo> = {
  'builtin-first-light': { level: 0.8, symptom: tk('Press the button: the LED stays dark'), teaches: ['tool:dmm', 'tool:jumper', 'part:cell', 'part:button', 'part:resistor', 'part:led', 'fault:open'] },
  'builtin-tut-cold-joint': { level: 1.0, symptom: tk('Every trace is fine, yet no current flows'), teaches: ['tool:flip', 'tool:iron', 'fault:cold'] },
  'builtin-tut-solder-bridge': { level: 1.2, symptom: tk('28 mA from the battery, LED dark'), teaches: ['tool:supply', 'tool:wick', 'fault:bridge'] },
  'builtin-tut-polarity': { level: 1.3, symptom: tk('Good supply, LED stays dark'), teaches: ['tool:diode', 'tool:rotate', 'fault:reversed'] },
  'builtin-tut-resistor': { level: 1.5, symptom: tk('Blue LED starved to 0.02 mA'), teaches: ['tool:replace', 'fault:wrongval'] },
  'builtin-tut-divider': { level: 1.8, symptom: tk('TP1 should read 2.50 V'), teaches: ['part:testpoint', 'fault:missing'] },
  'builtin-transistor-switch': { level: 2.0, symptom: tk('Pressed, the LEDs only glow faintly'), teaches: ['part:bjt', 'fault:reversed'] },
  'builtin-bridge-troll': { level: 2.4, symptom: tk('Two LEDs, one button: both stay dark'), teaches: ['fault:multi'] },
  'builtin-backwards-day': { level: 2.8, symptom: tk('USB status light, neither LED lights'), teaches: [] },
  'builtin-smoke-test': { level: 3.2, symptom: tk('Blown fuse, dead 5 V rail'), teaches: ['tool:thermal', 'tool:ocp', 'part:fuse', 'part:diode', 'fault:short'] },
  'builtin-ghost-short': { level: 3.6, symptom: tk('Back from the field: blown fuse, a part missing'), teaches: ['fault:rootcause'] },
  'builtin-sagging-rail': { level: 3.9, symptom: tk('VREF sags below 0.5 V, LED dark'), teaches: ['fault:layers'] },
  // high-reliability soldering track (src/scenarios/soldering.ts): its own path, not in PATH_ORDER
  'hr-solder-flux': { level: 1.4, symptom: tk('Three LEDs on 5 V, none lights'), teaches: ['tool:iron', 'tool:rosin', 'fault:cold'] },
  'hr-heat-time': { level: 1.9, symptom: tk('Two LEDs dark on a ground-pour board'), teaches: ['tool:iron', 'tool:thermal', 'fault:cold'] },
  'hr-desoldering': { level: 2.6, symptom: tk('One of two LEDs stays dark'), teaches: ['tool:extract', 'tool:replace', 'tool:iron'] },
  'hr-skipping-pattern': { level: 3.1, symptom: tk('Four LEDs, all dark'), teaches: ['tool:iron', 'fault:cold'] },
  'hr-conductor-repair': { level: 3.3, symptom: tk('One of two LEDs stays dark'), teaches: ['tool:staple', 'fault:open'] },
  'hr-conformal-coating': { level: 3.6, symptom: tk('One of two LEDs stays dark'), teaches: ['tool:decoat', 'tool:coat', 'fault:cold'] },
  'hr-coating-id': { level: 3.7, symptom: tk('One of two LEDs stays dark'), teaches: ['tool:coatest', 'tool:decoat', 'tool:coat'] },
  'hr-esd': { level: 3.8, symptom: tk('Pressed, the LED stays dark'), teaches: ['tool:replace', 'part:mosfet', 'fault:missing'] },
  'hr-pad-repair': { level: 4.0, symptom: tk('One of two LEDs stays dark'), teaches: ['tool:padfix', 'tool:iron', 'fault:open'] },
  'hr-final-practical': { level: 5.2, symptom: tk('Pressed, the LEDs stay dark'), teaches: ['tool:extract', 'tool:shunt', 'tool:decoat', 'tool:staple'] },
  'hr-thermal-shunt': { level: 2.9, symptom: tk('Pressed, the LEDs stay dark'), teaches: ['tool:shunt', 'part:bjt', 'fault:cold'] },
  'hr-clean-inspect': { level: 2.2, symptom: tk('Reworked, both LEDs dark, left a mess'), teaches: ['tool:wick', 'tool:ipa', 'fault:bridge'] },
  'demo-olimex-esp32-devkit-lipo': { level: 4.4, teaches: ['part:schottky', 'part:charger', 'part:mcu'] },
  'demo-rana-tadpole-v1': { level: 4.7, teaches: ['part:ldo'] },
  'demo-olimex-esp32-c3-devkit-lipo': { level: 5.6, teaches: ['part:cap', 'fault:masked'] },
  'demo-esp32-c3-rust-board': { level: 6.1, teaches: ['tool:ipa', 'part:mosfet', 'fault:residue'] },
  'demo-rana-tadpole-v2': { level: 6.6, teaches: [] },
  'demo-antmicro-jetson-nano-bb': { level: 7.8, teaches: ['tool:press', 'tool:freeze', 'part:buck', 'fault:intermittent'] },
  'demo-mnt-reform2-mb30': { level: 9.2, teaches: ['tool:heatmap', 'fault:sequencing'] },
};

/** The recommended order: tutorials, then the challenge track. */
export const PATH_ORDER: readonly string[] = [...TUTORIAL_SCENARIO_IDS, ...CHALLENGE_TRACK_IDS];

/** Level estimate of any board: the table, a generated problem from its board, else from the author's 1–5 difficulty. */
export function boardLevel(s: Pick<Scenario, 'id' | 'meta'> & Partial<Pick<Scenario, 'generated'>>): number {
  const known = BOARD_INFO[s.id];
  if (known) return known.level;
  // a generated problem (daily repair, "new problem"): its board's level, a little more per extra fault
  const root = s.generated && BOARD_INFO[s.generated.from];
  if (root) return Math.min(10, Math.round((root.level + 0.4 * Math.max(0, (s.meta.par ?? 1) - 1)) * 10) / 10);
  const d = Math.min(5, Math.max(1, Math.round(s.meta.difficulty || 1)));
  return [1.0, 2.5, 4.5, 6.5, 8.5][d - 1];
}

/**
 * The level a puzzle shows players: the fitted "real" level from players' results once there is one
 * (public stats → public/fitted-levels.json, src/scenarios/adaptive.ts), else the hand-set estimate.
 * `boardLevel` stays the hand-set one: the attempt records carry it, so the fit is always measured
 * against the same fixed scale.
 */
export function shownLevel(s: Pick<Scenario, 'id' | 'meta'> & Partial<Pick<Scenario, 'generated'>>): number {
  const known = BOARD_INFO[s.id];
  if (known) return puzzleLevel(s.id, known.level);
  const root = s.generated && BOARD_INFO[s.generated.from];
  if (root) return Math.min(10, Math.round((puzzleLevel(s.generated!.from, root.level) + 0.4 * Math.max(0, (s.meta.par ?? 1) - 1)) * 10) / 10);
  return boardLevel(s);
}

/** The shown level comes from players' results (not the hand-set estimate). */
export function levelFromPlayers(s: Pick<Scenario, 'id'> & Partial<Pick<Scenario, 'generated'>>): boolean {
  return hasFittedLevel(s.id) || (!!s.generated && hasFittedLevel(s.generated.from));
}

/** "Name · symptom" titles split; other boards take the symptom from the table. Both untranslated. */
export function splitTitle(title: string): { name: string; symptom: string } {
  const i = title.indexOf(' · ');
  return i > 0 ? { name: title.slice(0, i), symptom: title.slice(i + 3) } : { name: title, symptom: '' };
}

/** Skills used on solved boards, in the order they were solved. */
export function learnedSkills(solvedInOrder: Iterable<string>): SkillKey[] {
  const out: SkillKey[] = [];
  for (const id of solvedInOrder) for (const k of BOARD_INFO[id]?.teaches ?? []) if (!out.includes(k)) out.push(k);
  return out;
}

/** What a board would add for this player; challenge boards keep their fault kinds hidden. */
export function newSkillsFor(id: string, learned: ReadonlySet<SkillKey>): SkillKey[] {
  const tutorial = (TUTORIAL_SCENARIO_IDS as readonly string[]).includes(id);
  return (BOARD_INFO[id]?.teaches ?? []).filter((k) => !learned.has(k) && (tutorial || !k.startsWith('fault:')));
}

export type PickReason = 'first' | 'open' | 'next' | 'after' | 'skip';
export interface TodayPick { id: string; reason: PickReason }

/** Below this hidden estimate, unsolved lessons are never skipped: they teach the tools. */
export const LESSON_SKIP_LEVEL = 2;

/**
 * Today's picks: one main pick and up to two more. A new player (no counted attempts yet) follows
 * the path order. After that the hidden estimate (src/scenarios/adaptive.ts, never shown) chooses
 * the main pick: the unsolved path board closest to the level they fix about 70 % of the time,
 * path order breaking ties; unsolved lessons come first until the estimate shows real skill. The
 * board you have open, if on the path and unsolved, still comes first. Then the next board on the
 * path, and a "skip ahead" choice at least 1.5 levels higher so players who know the basics are
 * not held back. No placement test, no "you levelled up".
 */
export function todayPicks(available: ReadonlySet<string>, solved: ReadonlySet<string>, openId?: string, skill?: Skill): TodayPick[] {
  const todo = PATH_ORDER.filter((id) => available.has(id) && !solved.has(id));
  if (!todo.length) return [];
  const level = (id: string) => puzzleLevel(id, BOARD_INFO[id]?.level ?? 0);
  const isLesson = (id: string) => (TUTORIAL_SCENARIO_IDS as readonly string[]).includes(id);
  let main = todo[0];
  if (openId && todo.includes(openId) && openId !== todo[0] && solved.size > 0) main = openId;
  else if (skill && skill.n > 0 && !(skill.r < LESSON_SKIP_LEVEL && todo.some(isLesson))) {
    const target = targetLevel(skill);
    main = todo.reduce((best, id) => (Math.abs(level(id) - target) < Math.abs(level(best) - target) - 1e-9 ? id : best), todo[0]);
  }
  const picks: TodayPick[] = [{ id: main, reason: solved.size === 0 ? 'first' : main === openId && main !== todo[0] ? 'open' : 'next' }];
  const rest = todo.filter((id) => id !== main);
  const after = rest.find((id) => PATH_ORDER.indexOf(id) > PATH_ORDER.indexOf(main)) ?? rest[0];
  if (after) picks.push({ id: after, reason: 'after' });
  const lvl = level(main);
  const skip = rest.find((id) => id !== after && PATH_ORDER.indexOf(id) > PATH_ORDER.indexOf(main) && level(id) >= lvl + 1.5);
  if (skip) picks.push({ id: skip, reason: 'skip' });
  else { const more = rest.find((id) => id !== after); if (more) picks.push({ id: more, reason: 'after' }); }
  return picks;
}
