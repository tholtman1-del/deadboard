import type { Board, Side, V2 } from '../types';
import type { Conn } from '../connectivity';
import type { VizMode } from '../render/renderer';
import { t } from '../i18n';

// Step texts and topics are English keys, translated where they are shown (app.ts); the i18n
// test collects them from these tables.

export interface TutorialCheckState {
  scenarioId: string;
  board: Board;
  conn: Conn;
  cameraMode: '2d' | '3d';
  cameraSide: Side;
  vizMode: VizMode;
  powerOn: boolean;
  activeTool: string;
  selectedCompId: string | null;
  dmmMode: 'V' | 'OHM' | 'DIODE' | 'CAP' | 'AMP';
  probeRed: { net: number; pos?: V2 } | null;
  probeBlack: { net: number; pos?: V2 } | null;
  revealedFlag: string | null;
}

export interface TutorialStep {
  title: string;
  concept: string;
  task: string;
  /** The task for the phone layout: short, touch wording, no coordinates (no cursor readout there). */
  phone?: string;
  target: { pos: V2; side: Side; radius: number; zoomHalfH: number; label: string } | null;
  quickAction?: { id: string; label: string };
  isDone: (st: TutorialCheckState) => boolean;
}

export const TUTORIAL_SCENARIO_IDS = [
  'builtin-first-light',
  'builtin-tut-cold-joint',
  'builtin-tut-solder-bridge',
  'builtin-tut-polarity',
  'builtin-tut-resistor',
  'builtin-tut-divider',
] as const;

/**
 * After the tutorials: the repair challenges by difficulty (small boards, more than one fault),
 * then the open-hardware demos: two ESP32 dev boards (≈60 parts, real products), then the
 * carrier and laptop boards (hundreds of parts). Shown as a track so the step from one-LED
 * tutorials to real boards isn't a jump (a player's report, 2026-11-21).
 */
export const CHALLENGE_TRACK_IDS = [
  'builtin-transistor-switch',
  'builtin-bridge-troll',
  'builtin-backwards-day',
  'builtin-smoke-test',
  'builtin-ghost-short',
  'builtin-sagging-rail',
  'demo-olimex-esp32-devkit-lipo',
  'demo-rana-tadpole-v1',
  'demo-olimex-esp32-c3-devkit-lipo',
  'demo-esp32-c3-rust-board',
  'demo-rana-tadpole-v2',
  'demo-antmicro-jetson-nano-bb',
  'demo-mnt-reform2-mb30',
] as const;

export const TUTORIAL_TOPICS: Record<string, string[]> = {
  'builtin-first-light': ['Traces & Pads', 'V⎓ & Ω Meter', 'Bridge Cut Trace'],
  'builtin-tut-cold-joint': ['Bottom Side (F)', 'Cold Solder Joint', 'Iron Reflow'],
  'builtin-tut-solder-bridge': ['Short vs. Open', 'Supply Current', 'Desolder Wick'],
  'builtin-tut-polarity': ['Anode & Cathode', 'Diode Mode', 'Rotate 180°'],
  'builtin-tut-resistor': ['Ohm\'s Law', 'Colour Bands', 'Parts Bin'],
  'builtin-tut-divider': ['Test Points', 'Empty Footprint', 'Voltage Divider'],
};

function padNet(board: Board, conn: Conn, ref: string, padName: string): number {
  const c = board.components.find((x) => x.ref === ref);
  if (!c) return -1;
  const pi = c.pads.findIndex((p) => p.name === padName);
  if (pi < 0) return -1;
  const itemIdx = conn.padItem.get(c)?.[pi];
  return itemIdx !== undefined ? conn.net[itemIdx] : -1;
}

function compByRef(board: Board, ref: string) {
  return board.components.find((c) => c.ref === ref);
}

function probesAcross(st: TutorialCheckState, ref: string, padA: string, padB: string, requireDistinctPos = false): boolean {
  if (!st.probeRed || !st.probeBlack) return false;
  if (requireDistinctPos && st.probeRed.pos && st.probeBlack.pos) {
    if (Math.hypot(st.probeRed.pos[0] - st.probeBlack.pos[0], st.probeRed.pos[1] - st.probeBlack.pos[1]) < 1.0) return false;
  }
  const na = padNet(st.board, st.conn, ref, padA);
  const nb = padNet(st.board, st.conn, ref, padB);
  if (na < 0 || nb < 0) return false;
  return (
    (st.probeRed.net === na && st.probeBlack.net === nb) ||
    (st.probeRed.net === nb && st.probeBlack.net === na)
  );
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    // The hook comes first: the player sees the fault before any theory (the old opening step,
    // "Anatomy of a PCB" with a switch to 3D, lost 60% of new players; Cold Joint 101 teaches the flip).
    title: 'A broken flashlight',
    concept:
      'This board is a tiny flashlight: coin cell BT1, push button SW1, resistor R1 (100 Ω, it limits the current) and LED D1. Flat copper strips called traces carry the current between the round pads where the parts are soldered. Pressing SW1 should light D1.',
    task: 'Click push button SW1 to press it. Does LED D1 light up?',
    phone: 'Tap push button SW1. Does LED D1 light up?',
    target: { pos: [40, 27], side: 'F', radius: 5.5, zoomHalfH: 13, label: 'Push button SW1' },
    quickAction: { id: 'tool-inspect', label: 'Select tool (1)' },
    isDone: (st) => !!compByRef(st.board, 'SW1')?.state.closed,
  },
  {
    title: 'The closed circuit loop',
    concept:
      'D1 stays dark, so the current is not getting through. Electricity works like water in pipes: a battery (BT1) pushes current out of its positive terminal (+3V), through the components, and back to Ground (GND, 0 V). If the loop has a single break anywhere, zero current flows and nothing turns on.',
    task: 'Switch Display mode in the top bar to Voltage map to color every connected copper trace by its voltage — or select BT1 with Select (1).',
    phone: 'More ⋯ → Display → Voltage map. Or tap BT1 with Select.',
    target: { pos: [17, 18], side: 'F', radius: 11, zoomHalfH: 18, label: 'BT1 coin battery' },
    quickAction: { id: 'viz-heatmap', label: 'Enable Voltage map' },
    isDone: (st) => {
      const bt = compByRef(st.board, 'BT1');
      return st.vizMode === 'heatmap' || (bt !== undefined && st.selectedCompId === bt.id);
    },
  },
  {
    title: 'Measuring voltage (V⎓)',
    concept:
      'In Voltage map you may notice +3V reaches BT1 → SW1 → R1, yet LED D1 is dark. A Multimeter measures electrical pressure (Volts) at exact copper pads when Power is ON. One probe at 3.000 V and the next pad at 0.000 V reveals where electricity stopped.',
    task: 'Choose Multimeter (2) in the left dock (mode V⎓, Power on), then left-click pad R1.2 (right leg of resistor R1) or D1.2.',
    phone: 'Pick Meter (V⎓, power on) and tap pad R1.2 or D1.2.',
    target: { pos: [57.08, 27], side: 'F', radius: 3.5, zoomHalfH: 12, label: 'Pad R1.2' },
    quickAction: { id: 'tool-dmm', label: 'Multimeter (2)' },
    isDone: (st) => {
      if (st.activeTool !== 'dmm' && !st.probeRed) return false;
      const nR1 = padNet(st.board, st.conn, 'R1', '2');
      const nD1 = padNet(st.board, st.conn, 'D1', '2');
      return !!st.probeRed && (st.probeRed.net === nR1 || st.probeRed.net === nD1);
    },
  },
  {
    title: 'Finding broken traces (Ω)',
    concept:
      'To test if two pads are physically connected by copper, switch the Multimeter to Resistance (Ω). Golden rule: ALWAYS turn Power off before measuring Ω! An intact wire reads near 0.0 Ω and beeps; a broken path reads OL (Open Loop).',
    task: 'Turn Power off (P), click Ω on the Multimeter, left-click R1.2 (Red probe), then right-click or Shift+click D1.2 (Black probe).',
    phone: 'Power off, meter on Ω: tap R1.2 (red), then D1.2 (black).',
    target: { pos: [57.27, 11], side: 'F', radius: 3.5, zoomHalfH: 14, label: 'Pad D1.2 (Anode +)' },
    quickAction: { id: 'prep-ohm', label: 'Power off + Ω mode' },
    isDone: (st) => {
      if (st.powerOn || st.dmmMode !== 'OHM' || !st.probeRed || !st.probeBlack) return false;
      const nR1 = padNet(st.board, st.conn, 'R1', '2');
      const nD1 = padNet(st.board, st.conn, 'D1', '2');
      return (
        (st.probeRed.net === nR1 && st.probeBlack.net === nD1) ||
        (st.probeRed.net === nD1 && st.probeBlack.net === nR1)
      );
    },
  },
  {
    title: 'Locate the open fault',
    concept:
      'The Multimeter read OL between R1.2 and D1.2 — there is an air gap cutting the copper trace between them. Follow the green/gold copper line leading down the right edge of the board.',
    task: 'Click Locate on board below to zoom straight to the damaged trace at 62, 19 mm, and select Soldering iron (3).',
    phone: 'Tap Locate on board, then pick the Iron.',
    target: { pos: [62, 19], side: 'F', radius: 3.0, zoomHalfH: 9, label: 'Cut trace gap' },
    quickAction: { id: 'tool-iron', label: 'Soldering iron (3)' },
    isDone: (st) => st.activeTool === 'iron',
  },
  {
    title: 'Solder across the break',
    concept:
      'Technicians bridge small trace cuts by melting a tiny bead of solder across the exposed copper ends, or by soldering an insulated jumper wire (tool 6) between the two pads on long spans.',
    task: 'With Soldering iron (3) selected, click directly on the gap at 62, 19 mm (inside the pulsing ring) to deposit solder and reconnect R1.2 to D1.2.',
    phone: 'With the Iron, tap the gap inside the pulsing ring.',
    target: { pos: [62, 19], side: 'F', radius: 2.6, zoomHalfH: 9, label: 'Bridge gap here' },
    quickAction: { id: 'tool-iron', label: 'Soldering iron (3)' },
    isDone: (st) => {
      const nR1 = padNet(st.board, st.conn, 'R1', '2');
      const nD1 = padNet(st.board, st.conn, 'D1', '2');
      return nR1 >= 0 && nR1 === nD1;
    },
  },
  {
    title: 'Power on & capture the flag',
    concept:
      'When your repair closes the copper loop, turning on the bench power supply energizes the board and illuminates LED D1 when SW1 is closed. Run tests verifies every objective automatically (with SW1 both pressed and released).',
    task: 'Turn Power on (P) to watch LED D1 light up, then click Run tests in the top bar to claim your first CTF flag.',
    phone: 'Power on to light D1, then tap ▶ to claim your flag.',
    target: { pos: [56, 11], side: 'F', radius: 4.5, zoomHalfH: 18, label: 'LED D1' },
    quickAction: { id: 'power-on', label: 'Turn Power on' },
    isDone: (st) => st.powerOn && st.revealedFlag !== null,
  },
];

/**
 * Tools each beginner lesson brings to the dock (src/ui/app.ts `updateToolDock`): on a lesson the dock
 * shows Select plus the tools of this lesson and the ones before it, so a new player meets one or two
 * tools at a time. test/catalog.test.ts checks every tool a lesson's steps mention is on its dock.
 */
export const LESSON_TOOLS: Record<(typeof TUTORIAL_SCENARIO_IDS)[number], readonly string[]> = {
  'builtin-first-light': ['dmm', 'jumper', 'iron'],
  'builtin-tut-cold-joint': ['iron'],
  'builtin-tut-solder-bridge': ['wick'],
  'builtin-tut-polarity': ['flip180'],
  'builtin-tut-resistor': ['replace'],
  'builtin-tut-divider': [],
};

/** The dock on a lesson: every tool up to this lesson, and the ones it introduces (shown as new). Null off the lessons. */
export function lessonDock(id: string): { tools: Set<string>; fresh: Set<string> } | null {
  const at = (TUTORIAL_SCENARIO_IDS as readonly string[]).indexOf(id);
  if (at < 0) return null;
  const tools = new Set<string>(['inspect']);
  for (const l of TUTORIAL_SCENARIO_IDS.slice(0, at + 1)) for (const tl of LESSON_TOOLS[l]) tools.add(tl);
  const before = new Set<string>(['inspect']);
  for (const l of TUTORIAL_SCENARIO_IDS.slice(0, at)) for (const tl of LESSON_TOOLS[l]) before.add(tl);
  return { tools, fresh: at === 0 ? new Set() : new Set(LESSON_TOOLS[TUTORIAL_SCENARIO_IDS[at]].filter((x) => !before.has(x))) };
}

export const TUTORIALS_BY_SCENARIO: Record<string, TutorialStep[]> = {
  'builtin-first-light': TUTORIAL_STEPS,
  'builtin-tut-cold-joint': [
    {
      title: 'Two-sided through-hole boards',
      concept:
        'On through-hole PCBs, components sit on the Top while their metal legs poke through to the Bottom where solder holds them and makes electrical contact. A bad solder joint ("cold joint") looks connected from above, yet leaves the circuit broken underneath.',
      task: 'Flip the board to the Bottom side (press F or click Bottom in the top bar) to inspect the solder joints.',
      phone: 'Flip to Bottom (button, top right) to see the joints.',
      target: { pos: [32.92, 26], side: 'B', radius: 6, zoomHalfH: 18, label: 'Bottom solder joints' },
      quickAction: { id: 'flip-bottom', label: 'Flip to Bottom (F)' },
      isDone: (st) => st.cameraSide === 'B',
    },
    {
      title: 'Spotting a cold solder joint',
      concept:
        'Good solder joints are smooth, shiny silver cones. A cold joint looks dull, grey, and grainy because the solder never properly wetted the leg and copper pad. Measuring Ω across R1 (R1.1 to R1.2) reads OL instead of 100 Ω!',
      task: 'Turn Power off (P), switch Multimeter (2) to Ω, and probe R1.1 (left-click) and R1.2 (right-click) on the Bottom side.',
      phone: 'Power off, meter on Ω: tap R1.1 (red), then R1.2 (black).',
      target: { pos: [32.92, 26], side: 'B', radius: 3.5, zoomHalfH: 11, label: 'Cold joint R1.1' },
      quickAction: { id: 'prep-ohm', label: 'Power off + Ω mode' },
      isDone: (st) => !st.powerOn && st.dmmMode === 'OHM' && probesAcross(st, 'R1', '1', '2'),
    },
    {
      title: 'Reflow the cold joint',
      concept:
        'Touching a soldering iron to a cold joint melts the solder cleanly so it bonds the component leg to the gold-plated pad, turning it shiny and conductive again.',
      task: 'Select Soldering iron (3) and click pad R1.1 at 32.92, 26 mm on the Bottom side to reflow the dull joint.',
      phone: 'With the Iron, tap the dull pad R1.1 to reflow it.',
      target: { pos: [32.92, 26], side: 'B', radius: 2.5, zoomHalfH: 9, label: 'Reflow R1.1' },
      quickAction: { id: 'tool-iron', label: 'Soldering iron (3)' },
      isDone: (st) => {
        const r1 = compByRef(st.board, 'R1');
        return !!r1 && r1.state.cold.length === 0;
      },
    },
    {
      title: 'Power on & capture the flag',
      concept:
        'With R1.1 bonded to its pad, current flows cleanly from BT1 through R1 and lights green LED D1.',
      task: 'Flip back to Top (F), turn Power on (P) to watch LED D1 glow, then click Run tests to claim the flag.',
      phone: 'Flip to Top, power on to light D1, then tap ▶.',
      target: { pos: [48, 14], side: 'F', radius: 4.5, zoomHalfH: 18, label: 'Green LED D1' },
      quickAction: { id: 'power-on', label: 'Turn Power on' },
      isDone: (st) => st.powerOn && st.revealedFlag !== null,
    },
  ],
  'builtin-tut-solder-bridge': [
    {
      title: 'Short circuit vs. open circuit',
      concept:
        'In an open circuit, 0.0 mA flows. Look at the Bench supply here: ~28 mA is flowing out of the battery, yet LED D1 is dark! That means current is taking an accidental shortcut ("short circuit") around D1 straight to Ground.',
      task: 'Flip to the Bottom side (press F or click Bottom) and inspect the space between D1\'s two closely spaced pads.',
      phone: 'Flip to Bottom and look between D1\'s two pads.',
      target: { pos: [48, 14], side: 'B', radius: 4.5, zoomHalfH: 13, label: 'D1 bottom pads' },
      quickAction: { id: 'flip-bottom', label: 'Flip to Bottom (F)' },
      isDone: (st) => st.cameraSide === 'B',
    },
    {
      title: 'Confirm the short (Ω mode)',
      concept:
        'When excess solder bridges two pins, a Multimeter in Ω mode reads ~0.0 Ω and beeps for continuity. Always turn Power off before measuring resistance.',
      task: 'Turn Power off (P), switch Multimeter (2) to Ω, then probe D1.1 (left-click) and D1.2 (right-click) on the Bottom side.',
      phone: 'Power off, meter on Ω: tap D1.1 (red), then D1.2 (black).',
      target: { pos: [48, 14], side: 'B', radius: 3.5, zoomHalfH: 10, label: 'Shorted D1 pads' },
      quickAction: { id: 'prep-ohm', label: 'Power off + Ω mode' },
      isDone: (st) => !st.powerOn && st.dmmMode === 'OHM' && probesAcross(st, 'D1', '1', '2', true),
    },
    {
      title: 'Remove the bridge with wick',
      concept:
        'Desolder wick is braided copper soaked in flux. Pressed against an unwanted solder blob with heat, it pulls the molten solder into the braid and separates the pads cleanly.',
      task: 'Choose Desolder wick (4) in the left dock and click the solder blob between D1\'s legs at 48, 14 mm on the Bottom side.',
      phone: 'With the Wick, tap the solder blob between D1\'s legs.',
      target: { pos: [48, 14], side: 'B', radius: 2.6, zoomHalfH: 9, label: 'Solder blob on D1' },
      quickAction: { id: 'tool-wick', label: 'Desolder wick (4)' },
      isDone: (st) => st.board.blobs.length === 0,
    },
    {
      title: 'Power on & capture the flag',
      concept:
        'Once the solder bridge is gone, current can no longer bypass D1 — it flows through the LED as designed (~10 mA).',
      task: 'Flip to Top (F), turn Power on (P) to watch red LED D1 light up, then click Run tests to capture the flag.',
      phone: 'Flip to Top, power on to light D1, then tap ▶.',
      target: { pos: [48, 14], side: 'F', radius: 4.5, zoomHalfH: 18, label: 'Red LED D1' },
      quickAction: { id: 'power-on', label: 'Turn Power on' },
      isDone: (st) => st.powerOn && st.revealedFlag !== null,
    },
  ],
  'builtin-tut-polarity': [
    {
      title: 'One-way parts (Polarity)',
      concept:
        'Resistors work either way round, but LEDs and diodes are one-way electrical valves: current only flows from Anode (+) to Cathode (K). On a PCB, the square pad, silkscreen K marker, and flat notch on the LED rim mark the Cathode.',
      task: 'Use Select (1) and click LED D1 at 48, 14 mm to inspect it — notice the flat cathode rim is facing the wrong side!',
      phone: 'Tap LED D1 with Select: its flat cathode rim is on the wrong side.',
      target: { pos: [48, 14], side: 'F', radius: 4.0, zoomHalfH: 10, label: 'LED D1 orientation' },
      quickAction: { id: 'tool-inspect', label: 'Select tool (1)' },
      isDone: (st) => {
        const d1 = compByRef(st.board, 'D1');
        return !!d1 && (st.selectedCompId === d1.id || !d1.state.reversed);
      },
    },
    {
      title: 'Test polarity in Diode mode',
      concept:
        'With Power OFF, the Multimeter\'s Diode mode pushes a tiny test current from the Red (+) probe to the Black (−) probe. A healthy yellow LED lights dimly and reads ~2.0 V forward, and reads OL backwards.',
      task: 'Turn Power off (P), switch Multimeter (2) to Diode, and probe across D1.1 and D1.2 (try swapping Red and Black!).',
      phone: 'Power off, meter on Diode: probe D1.1 and D1.2, then swap.',
      target: { pos: [48, 14], side: 'F', radius: 3.5, zoomHalfH: 10, label: 'Probe across D1' },
      quickAction: { id: 'prep-diode', label: 'Power off + Diode mode' },
      isDone: (st) => !st.powerOn && st.dmmMode === 'DIODE' && probesAcross(st, 'D1', '1', '2'),
    },
    {
      title: 'Rotate the backwards LED 180°',
      concept:
        'When a polarized part is installed backwards, removing and rotating it 180° aligns its Cathode with the K silkscreen pad so current flows properly.',
      task: 'Select Rotate 180° (5) in the left dock and click D1 to flip it to the correct orientation.',
      phone: 'With Rotate, tap D1 to turn it the right way round.',
      target: { pos: [48, 14], side: 'F', radius: 3.5, zoomHalfH: 11, label: 'Flip D1 180°' },
      quickAction: { id: 'tool-flip180', label: 'Rotate 180° (5)' },
      isDone: (st) => {
        const d1 = compByRef(st.board, 'D1');
        return !!d1 && !d1.state.reversed;
      },
    },
    {
      title: 'Power on & capture the flag',
      concept:
        'With D1 oriented from Anode (+) to Cathode (K), current flows smoothly through the LED.',
      task: 'Turn Power on (P) to watch yellow LED D1 light up, then click Run tests to capture the flag.',
      phone: 'Power on to light D1, then tap ▶ for the flag.',
      target: { pos: [48, 14], side: 'F', radius: 4.5, zoomHalfH: 18, label: 'Yellow LED D1' },
      quickAction: { id: 'power-on', label: 'Turn Power on' },
      isDone: (st) => st.powerOn && st.revealedFlag !== null,
    },
  ],
  'builtin-tut-resistor': [
    {
      title: 'Why LEDs need resistors',
      concept:
        'An LED drops a nearly fixed voltage (~3.0 V for blue). Without a resistor on a 5 V USB supply, excessive current would burn it out instantly. A resistor limits current by Ohm\'s Law: I = (Vsupply − Vled) / R.',
      task: 'Click resistor R1 with Select (1) to inspect its coloured bands in the right-hand Inspector.',
      phone: 'Tap R1 with Select and read its colour bands.',
      target: { pos: [29, 26], side: 'F', radius: 5.5, zoomHalfH: 13, label: 'Resistor R1' },
      quickAction: { id: 'tool-inspect', label: 'Select tool (1)' },
      isDone: (st) => {
        const r1 = compByRef(st.board, 'R1');
        return !!r1 && (st.selectedCompId === r1.id || Math.abs(r1.value - 150) < 1);
      },
    },
    {
      title: 'Read colour bands & measure Ω',
      concept:
        'Read 4-band resistors toward the gold band: Brown (1) – Black (0) – Yellow (×10,000) = 100 kΩ! At 100 kΩ, current is only (5 − 3) / 100,000 = 0.02 mA — far too tiny to light D1. Confirm this with Power OFF in Ω mode.',
      task: 'Turn Power off (P), switch Multimeter (2) to Ω, and probe R1.1 (left-click) and R1.2 (right-click).',
      phone: 'Power off, meter on Ω: tap R1.1 (red), then R1.2 (black).',
      target: { pos: [29, 26], side: 'F', radius: 6.5, zoomHalfH: 14, label: 'Measure R1 (Ω)' },
      quickAction: { id: 'prep-ohm', label: 'Power off + Ω mode' },
      isDone: (st) => !st.powerOn && st.dmmMode === 'OHM' && probesAcross(st, 'R1', '1', '2'),
    },
    {
      title: 'Install a 150 Ω resistor',
      concept:
        'To give the blue LED a healthy ~12–13 mA, Ohm\'s Law asks for R = (5 V − 3 V) / 0.013 A ≈ 150 Ω (Brown-Green-Brown-Gold). Use the Parts bin (8) to swap R1\'s value.',
      task: 'Click R1 with Parts bin (8), type 150 (or pick 150 Ω in Standard E12 value) in the Inspector, and click Apply.',
      phone: 'Tap R1 with Parts, enter 150 in the Inspector, tap Apply.',
      target: { pos: [29, 26], side: 'F', radius: 5.5, zoomHalfH: 13, label: 'Replace R1 with 150 Ω' },
      quickAction: { id: 'tool-replace', label: 'Parts bin (8)' },
      isDone: (st) => {
        const r1 = compByRef(st.board, 'R1');
        return !!r1 && Math.abs(r1.value - 150) < 1;
      },
    },
    {
      title: 'Power on & capture the flag',
      concept:
        'With R1 = 150 Ω, ~12 mA flows safely through blue LED D1 without exceeding its 30 mA rating.',
      task: 'Turn Power on (P) to watch blue LED D1 shine, then click Run tests to capture the flag.',
      phone: 'Power on to light D1, then tap ▶ for the flag.',
      target: { pos: [46, 18], side: 'F', radius: 4.5, zoomHalfH: 18, label: 'Blue LED D1' },
      quickAction: { id: 'power-on', label: 'Turn Power on' },
      isDone: (st) => st.powerOn && st.revealedFlag !== null,
    },
  ],
  'builtin-tut-divider': [
    {
      title: 'What is a Voltage Divider?',
      concept:
        'Not every circuit lights an LED — many create an exact reference voltage on a Test Point (TP1). Two resistors in series (R1 to +5V, R2 to GND) divide voltage by Vout = Vin × R2 / (R1 + R2). Let\'s measure TP1 first.',
      task: 'With Power on (P), choose Multimeter (2) in V⎓ mode and left-click Test Point TP1 at 46, 19 mm.',
      phone: 'Power on, meter on V⎓: tap test point TP1.',
      target: { pos: [46, 19], side: 'F', radius: 3.5, zoomHalfH: 13, label: 'Test Point TP1' },
      quickAction: { id: 'prep-volt', label: 'Power on + V⎓ mode' },
      isDone: (st) => {
        const tp1 = padNet(st.board, st.conn, 'TP1', '1');
        return st.powerOn && st.dmmMode === 'V' && !!st.probeRed && st.probeRed.net === tp1;
      },
    },
    {
      title: 'Spot the missing resistor',
      concept:
        'TP1 reads +5.000 V instead of +2.500 V! Look at R2 at 28, 12 mm: its footprint is empty (unpopulated). Without R2 pulling VOUT toward Ground, R1 passes the full 5 V straight to TP1.',
      task: 'Select Parts bin (8) and click the empty R2 footprint at 28, 12 mm to open its Rework options.',
      phone: 'With Parts, tap the empty R2 footprint.',
      target: { pos: [28, 12], side: 'F', radius: 5.5, zoomHalfH: 14, label: 'Empty footprint R2' },
      quickAction: { id: 'tool-replace', label: 'Parts bin (8)' },
      isDone: (st) => {
        const r2 = compByRef(st.board, 'R2');
        return !!r2 && (st.selectedCompId === r2.id || r2.state.populated);
      },
    },
    {
      title: 'Populate R2 with 10 kΩ',
      concept:
        'R1 is 10 kΩ (Brown-Black-Orange). Installing an equal 10 kΩ resistor at R2 gives Vout = 5 V × 10k / (10k + 10k) = 2.50 V — right inside the [2.30 V, 2.70 V] objective.',
      task: 'In the Inspector for R2, enter 10k (or pick 10 kΩ from Standard E12 value) and click Apply.',
      phone: 'In the Inspector, enter 10k for R2 and tap Apply.',
      target: { pos: [28, 12], side: 'F', radius: 5.5, zoomHalfH: 14, label: 'Install 10 kΩ at R2' },
      quickAction: { id: 'tool-replace', label: 'Parts bin (8)' },
      isDone: (st) => {
        const r2 = compByRef(st.board, 'R2');
        return !!r2 && r2.state.populated && Math.abs(r2.value - 10000) < 10;
      },
    },
    {
      title: 'Verify 2.50 V & capture the flag',
      concept:
        'Look at the Multimeter on TP1: it now reads +2.500 V! You have mastered the core beginner skills — traces, cold joints, solder bridges, polarity, Ohm\'s Law, and voltage dividers.',
      task: 'Click Run tests in the top bar to prove V(TP1) is within range and unlock the final beginner flag.',
      phone: 'Tap ▶ to check V(TP1) and win the last beginner flag.',
      target: { pos: [46, 19], side: 'F', radius: 4.5, zoomHalfH: 18, label: 'TP1 = 2.50 V' },
      quickAction: { id: 'run-verify', label: 'Run tests' },
      isDone: (st) => st.powerOn && st.revealedFlag !== null,
    },
  ],
};

export function isTutorialScenario(scenarioId: string): boolean {
  return Object.prototype.hasOwnProperty.call(TUTORIALS_BY_SCENARIO, scenarioId);
}

export function getTutorialSteps(scenarioId: string): TutorialStep[] | null {
  return TUTORIALS_BY_SCENARIO[scenarioId] ?? null;
}

export function nextTutorialScenarioId(scenarioId: string): string | null {
  const idx = TUTORIAL_SCENARIO_IDS.indexOf(scenarioId as (typeof TUTORIAL_SCENARIO_IDS)[number]);
  return idx >= 0 && idx + 1 < TUTORIAL_SCENARIO_IDS.length ? TUTORIAL_SCENARIO_IDS[idx + 1] : null;
}

/** "PCB basics" card of the help window (translated when shown). */
export function beginnerPrimerHtml(): string {
  return `
  <div class="card">
    <div class="card-title">${t('PCB basics (start here)')}</div>
    <ul>
      <li>${t('<b>Substrate &amp; silkscreen</b> — The rigid green (FR-4) plate insulates everything; white printed labels (<code>R1</code>, <code>D1</code>, <code>K</code>, <code>+</code>) are silkscreen markings telling you where parts belong.')}</li>
      <li>${t('<b>Copper traces, pads &amp; vias</b> — Flat metal tracks carry signals on the <b>Top</b> and <b>Bottom</b> sides. Gold-plated rings with holes are <b>pads</b> where part leads are soldered; tiny holes called <b>vias</b> pass signals between Top and Bottom.')}</li>
      <li>${t('<b>Common components</b> — <b>Batteries/Headers</b> supply DC voltage; <b>Resistors</b> limit current (colored bands encode ohms); <b>LEDs &amp; Diodes</b> conduct one way only (notch/band marks Cathode <code>K</code>); <b>Fuses</b> melt open to stop short circuits.')}</li>
      <li>${t('<b>Three-step troubleshooting rule</b> — (1) Visually inspect both Top and Bottom (<code>F</code> key) for cuts, burnt parts, dull cold solder joints, or unwanted solder blobs. (2) With <b>Power on</b>, probe pads in <b>V⎓</b> or use <b>Voltage map / Thermal</b>. (3) Turn <b>Power off</b> before checking continuity (<b>Ω</b>) or LED polarity (<b>Diode</b>).')}</li>
    </ul>
  </div>
`;
}
