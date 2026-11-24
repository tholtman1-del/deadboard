import type { Board, LedColor, Objective, Scenario, ScenarioMeta } from '../types';
import { buildConnectivity } from '../connectivity';
import { lockFlag, topology } from '../crypto';
import { addBlob, cutTrace, removePart } from '../ops';
import { Builder } from './builder';
import { setReference } from './reference';
import { realisticScenarios } from './realistic';
import { solderingScenarios } from './soldering';

async function finalize(id: string, meta: ScenarioMeta, b: Board, objectives: Objective[], flag: string, sabotage: (b: Board) => void): Promise<Scenario> {
  const lock = await lockFlag(flag, topology(b, buildConnectivity(b), id));
  const good = structuredClone(b);
  sabotage(b);
  const sc: Scenario = { format: 'pcbfix/1', id, meta, board: b, objectives, lock };
  setReference(sc, good);
  return sc;
}

const on = (ref: string, sw?: Record<string, boolean>): Objective => ({ type: 'led', ref, on: true, switches: sw });
const off = (ref: string, sw?: Record<string, boolean>): Objective => ({ type: 'led', ref, on: false, switches: sw });

/** Minimal 3-part coin-cell + resistor + LED board used across beginner lessons 2–4. */
function coinLedBoard(color: LedColor, label: string): Builder {
  const k = new Builder(58, 36);
  const bt = k.coin('BT1', 3, [16, 18]);
  const r1 = k.resistor('R1', 100, [38, 26]);
  const d1 = k.led('D1', color, [48, 14]);
  k.track('F', [k.pad(bt, '1'), [4, 30], [32.92, 30], k.pad(r1, '1')], 0.8, '+3V');
  k.track('F', [k.pad(r1, '2'), [49.27, 26], k.pad(d1, '2')], 0.8, 'LED_A');
  k.track('F', [k.pad(d1, '1'), [46.73, 6], [28, 6], k.pad(bt, '2')], 0.8, 'GND');
  k.text([29, 2.5], label, 1.4);
  return k;
}

function firstLight() {
  const k = new Builder(66, 36);
  const bt = k.coin('BT1', 3, [17, 18]);
  k.tactile('SW1', [40, 27]);
  const r1 = k.resistor('R1', 100, [52, 27]);
  const d1 = k.led('D1', 'red', [56, 11]);
  k.track('F', [k.pad(bt, '1'), [5, 32], [36.75, 32], [36.75, 29.25]], 0.8, '+3V');
  k.track('F', [[43.25, 29.25], [46.92, 29.25], k.pad(r1, '1')], 0.8, 'SW_OUT');
  const t3 = k.track('F', [k.pad(r1, '2'), [62, 27], [62, 11], k.pad(d1, '2')], 0.8, 'LED_A');
  k.track('F', [k.pad(d1, '1'), [54.73, 5], [29, 5], k.pad(bt, '2')], 0.8, 'GND');
  k.text([14, 2.2], 'FIRST LIGHT  rev A', 1.4);
  return finalize('builtin-first-light', {
    title: 'First Light',
    author: 'DEADBOARD',
    difficulty: 1,
    description: 'A tiny flashlight: coin cell, push button, resistor, red LED. Pressing SW1 should light D1 — but nothing happens. Find the fault, repair it, then run the test bench.',
    hints: [
      'Power OFF and use the multimeter (Ω mode) to check continuity from R1 to D1.',
      'Look closely along the long vertical trace on the right edge.',
      'Use the soldering iron on the gap to drop a solder blob across it — or bridge it with a jumper wire.',
    ],
    par: 1,
  }, k.b, [on('D1', { SW1: true }), off('D1', { SW1: false })], 'PCB{f1rst_l1ght_s0ld3r_br1dg3d}',
  (b) => cutTrace(b, b.traces.find((t) => t.id === t3[1])!, [62, 19], 0.9));
}

function tutColdJoint() {
  const k = coinLedBoard('green', 'TUTORIAL 2  COLD JOINT');
  return finalize('builtin-tut-cold-joint', {
    title: 'Cold Joint 101',
    author: 'DEADBOARD Academy',
    difficulty: 1,
    description: 'Beginner Tutorial 2: Only three parts — coin cell BT1, 100 Ω resistor R1, and green LED D1. Every trace on top is intact, yet no current flows and D1 is dark. Flip the board to inspect how through-hole parts are soldered underneath.',
    hints: [
      'Press F (or click Bottom) to flip the board and inspect the solder joints.',
      'Pad R1.1 on the bottom is dull and grainy — a cold solder joint that never bonded.',
      'Select the Soldering iron (3) and click pad R1.1 on the Bottom side to reflow it.',
    ],
    par: 1,
  }, k.b, [on('D1')], 'PCB{c0ld_j01nt_r3fl0w3d_ok}',
  (b) => { b.components.find((c) => c.ref === 'R1')!.state.cold = [0]; });
}

function tutSolderBridge() {
  const k = coinLedBoard('red', 'TUTORIAL 3  SOLDER BRIDGE');
  return finalize('builtin-tut-solder-bridge', {
    title: 'Solder Bridge 101',
    author: 'DEADBOARD Academy',
    difficulty: 1,
    description: 'Beginner Tutorial 3: The battery is delivering ~28 mA, yet red LED D1 is completely dark! Learn the difference between an open circuit and a short circuit, and clean up excess solder with Desolder wick.',
    hints: [
      'Look at the Bench supply: ~28 mA is flowing, so electricity is taking a shortcut around D1.',
      'Flip to the Bottom side (F) and look between D1\'s two closely spaced pads.',
      'Use Desolder wick (4) to click and remove the solder blob bridging D1\'s legs.',
    ],
    par: 1,
  }, k.b, [on('D1')], 'PCB{s0ld3r_br1dg3_w1ck3d_cl34n}',
  (b) => { addBlob(b, [48, 14], 'B', 1.05); });
}

function tutPolarity() {
  const k = coinLedBoard('yellow', 'TUTORIAL 4  POLARITY');
  return finalize('builtin-tut-polarity', {
    title: 'One-Way LED',
    author: 'DEADBOARD Academy',
    difficulty: 1,
    description: 'Beginner Tutorial 4: Resistors work either way round, but diodes and LEDs are one-way valves (Anode + to Cathode K). Use the silkscreen markings and Multimeter Diode mode to spot and fix a reversed LED.',
    hints: [
      'Compare the flat cathode rim of D1 with the white silkscreen K marking.',
      'Turn Power OFF, switch the Multimeter (2) to Diode mode, and probe across D1 both ways.',
      'Use Rotate 180° (5) and click D1 to orient its cathode with the K mark.',
    ],
    par: 1,
  }, k.b, [on('D1')], 'PCB{4n0d3_t0_c4th0d3_fl1pp3d}',
  (b) => { b.components.find((c) => c.ref === 'D1')!.state.reversed = true; });
}

function tutResistor() {
  const k = new Builder(58, 36);
  // J1 turned 180° so pin 1 (+) faces R1 and pin 2 faces the GND return: the two routes never share copper
  const j1 = k.header('J1', 5, [8, 18], 180, 'USB 5V');
  const r1 = k.resistor('R1', 150, [29, 26]);
  const d1 = k.led('D1', 'blue', [46, 18]);
  k.track('F', [k.pad(j1, '1'), [14, 19.27], [14, 26], k.pad(r1, '1')], 0.8, '+5V');
  k.track('F', [k.pad(r1, '2'), [47.27, 26], k.pad(d1, '2')], 0.8, 'LED_A');
  k.track('F', [k.pad(d1, '1'), [44.73, 8], [14, 8], [14, 16.73], k.pad(j1, '2')], 0.8, 'GND');
  k.text([29, 2.5], 'TUTORIAL 5  OHMS LAW', 1.4);
  return finalize('builtin-tut-resistor', {
    title: 'Resistor & Ohm\'s Law',
    author: 'DEADBOARD Academy',
    difficulty: 1,
    description: 'Beginner Tutorial 5: A 5 V USB supply feeds blue LED D1 through resistor R1. The design calls for R1 = 150 Ω (~12 mA), but someone fitted a 100 kΩ resistor from the wrong bin, starving D1 to 0.02 mA.',
    hints: [
      'Select R1 to read its colour bands in the Inspector: brown-black-yellow is 100 kΩ!',
      'By Ohm\'s Law, I = (5 V − 3 V) / 150 Ω ≈ 13 mA is needed to light the blue LED.',
      'In the Inspector (or Parts bin 8), set R1\'s resistance to 150 Ω and click Apply.',
    ],
    par: 1,
  }, k.b, [on('D1')], 'PCB{0hms_l4w_curr3nt_l1m1t3r}',
  (b) => { b.components.find((c) => c.ref === 'R1')!.value = 100000; });
}

function tutDivider() {
  const k = new Builder(58, 36);
  const j1 = k.header('J1', 5, [8, 18], 180, '5V IN');
  const r1 = k.resistor('R1', 10000, [28, 26]);
  const r2 = k.resistor('R2', 10000, [28, 12]);
  const tp1 = k.testpoint('TP1', [46, 19], 'VOUT');
  const tp2 = k.testpoint('TP2', [46, 6], 'GND');
  k.track('F', [k.pad(j1, '1'), [14, 19.27], [14, 26], k.pad(r1, '1')], 0.8, '+5V');
  k.track('F', [k.pad(r1, '2'), [38, 26], [38, 19], k.pad(tp1, '1')], 0.8, 'VOUT');
  k.track('F', [[38, 19], [38, 12], k.pad(r2, '2')], 0.8, 'VOUT');
  k.track('F', [k.pad(j1, '2'), [14, 16.73], [14, 6], k.pad(tp2, '1')], 0.8, 'GND');
  k.track('F', [[22.92, 6], k.pad(r2, '1')], 0.8, 'GND');
  k.text([29, 32.5], 'TUTORIAL 6  2.5V DIVIDER', 1.4);
  return finalize('builtin-tut-divider', {
    title: 'Voltage Divider 101',
    author: 'DEADBOARD Academy',
    difficulty: 1,
    description: 'Beginner Tutorial 6: Not every circuit lights an LED — many split a supply rail to create a reference voltage on a Test Point (TP1). Learn how two 10 kΩ resistors divide 5.0 V in half to 2.50 V, and populate the missing R2 footprint.',
    hints: [
      'Probe TP1 in V⎓ mode with Power ON: it reads 5.00 V instead of 2.50 V.',
      'Vout = 5 V × R2 / (R1 + R2). Since R2 is unpopulated (missing), nothing pulls VOUT down toward GND.',
      'Select the empty R2 footprint and fit a 10 kΩ resistor (matching R1) to get 2.50 V on TP1.',
    ],
    par: 1,
  }, k.b, [{ type: 'voltage', a: 'TP1', min: 2.3, max: 2.7 }], 'PCB{v0lt4g3_d1v1d3r_h4lf_r41l}',
  (b) => {
    const r = b.components.find((c) => c.ref === 'R2')!;
    removePart(r);
    r.value = 0;
  });
}

function bridgeTroll() {
  const k = new Builder(68, 40);
  const bt = k.coin('BT1', 3, [17, 20]);
  const sw = k.tactile('SW1', [40, 32]);
  const r1 = k.resistor('R1', 100, [52, 26]);
  const r2 = k.resistor('R2', 100, [52, 14]);
  const d1 = k.led('D1', 'red', [40, 26]);
  const d2 = k.led('D2', 'green', [40, 14]);
  k.track('F', [k.pad(bt, '1'), [5, 37], [36.75, 37], [36.75, 34.25]], 0.8, '+3V');
  k.track('F', [[43.25, 34.25], [62, 34.25], [62, 14]], 0.8, 'BUS');
  k.track('F', [[62, 26], k.pad(r1, '2')], 0.8, 'BUS');
  k.track('F', [[62, 14], k.pad(r2, '2')], 0.8, 'BUS');
  k.track('F', [k.pad(r1, '1'), k.pad(d1, '2')], 0.6);
  k.track('F', [k.pad(r2, '1'), k.pad(d2, '2')], 0.6);
  k.track('F', [k.pad(d1, '1'), [33, 26], [33, 14], k.pad(d2, '1')], 0.8, 'GND');
  k.track('F', [k.pad(bt, '2'), [33, 20]], 0.8, 'GND');
  k.text([52, 3], 'BRIDGE TROLL  2xLED', 1.4);
  void sw;
  return finalize('builtin-bridge-troll', {
    title: 'Bridge Troll',
    author: 'DEADBOARD',
    difficulty: 2,
    description: 'Two indicator LEDs share one button. Hand-soldered in a hurry: D1 stays dark and D2 never lights. There is more than one fault. Hint: the interesting side of a through-hole board is the bottom.',
    hints: [
      'Flip the board (F key or the Flip button) and look at the solder joints.',
      'One joint is dull and grainy — reflow it with the iron.',
      'A blob of solder is shorting the two legs of an LED. Use the desoldering wick.',
    ],
    par: 2,
  }, k.b, [on('D1', { SW1: true }), on('D2', { SW1: true }), off('D1', { SW1: false }), off('D2', { SW1: false })],
  'PCB{tr0ll_br1dg3_w1ck3d_4w4y}',
  (b) => {
    addBlob(b, [40, 14], 'B', 1.05);
    b.components.find((c) => c.ref === 'R1')!.state.cold = [0];
  });
}

function backwardsDay() {
  const k = new Builder(56, 40);
  const j1 = k.header('J1', 5, [6, 20], 0, 'USB 5V');
  const r1 = k.resistor('R1', 330, [24, 10]);
  const d1 = k.led('D1', 'yellow', [40, 10], 180);
  const r2 = k.resistor('R2', 150, [24, 24]);
  const d2 = k.led('D2', 'blue', [40, 24], 180);
  k.track('F', [k.pad(j1, '1'), [12, 18.73], [12, 10], k.pad(r1, '1')], 0.8, '+5V');
  k.track('F', [[12, 18.73], [16, 18.73]], 0.8, '+5V');
  k.via([16, 18.73], '+5V');
  k.track('B', [[16, 18.73], [16, 24], k.pad(r2, '1')], 0.8, '+5V');
  k.track('F', [k.pad(r1, '2'), k.pad(d1, '2')], 0.6);
  const blue = k.track('B', [k.pad(r2, '2'), k.pad(d2, '2')], 0.6, 'BLUE_A');
  k.track('F', [k.pad(d1, '1'), [48, 10], [48, 34]], 0.8, 'GND');
  k.track('F', [k.pad(d2, '1'), [44, 24], [44, 34]], 0.8, 'GND');
  k.track('F', [k.pad(j1, '2'), [6, 34], [48, 34]], 0.8, 'GND');
  k.text([30, 37.5], 'BACKWARDS DAY', 1.4);
  return finalize('builtin-backwards-day', {
    title: 'Backwards Day',
    author: 'DEADBOARD',
    difficulty: 3,
    description: 'A USB-powered status light with a yellow and a blue LED. The intern assembled it from the wrong reel and was not careful with orientation. Both LEDs must light when 5 V is applied.',
    hints: [
      'Read R1\'s colour bands, or measure it with power off. 330 Ω is what the design calls for.',
      'LEDs conduct one way only. Compare the cathode flat of each LED with the silkscreen mark.',
      'Not every trace lives on top. Flip the board and follow D2\'s anode.',
    ],
    par: 3,
  }, k.b, [on('D1'), on('D2')], 'PCB{p0l4r1ty_m4tt3rs_bl1nk}',
  (b) => {
    b.components.find((c) => c.ref === 'R1')!.value = 47000;
    b.components.find((c) => c.ref === 'D1')!.state.reversed = true;
    cutTrace(b, b.traces.find((t) => t.id === blue[0])!, [34, 24], 0.7);
  });
}

function ghostShort() {
  const k = new Builder(64, 44);
  const j1 = k.header('J1', 5, [6, 22], 0, '5V IN');
  const f1 = k.fuse('F1', 0.5, [18, 12]);
  const r3 = k.resistor('R3', 470, [30, 22], 90);
  const d1 = k.led('D1', 'green', [30, 33], -90);
  const r1 = k.resistor('R1', 10000, [44, 20], 90);
  const r2 = k.resistor('R2', 10000, [44, 33], 90);
  const tp1 = k.testpoint('TP1', [52, 26.5], 'VOUT');
  const tp2 = k.testpoint('TP2', [56, 40], 'GND');
  k.track('F', [k.pad(j1, '1'), [11.65, 20.73], k.pad(f1, '1')], 0.8, '+5V_RAW');
  k.track('F', [k.pad(f1, '2'), [44, 12], k.pad(r1, '1')], 1.0, '+5V');
  k.track('F', [[30, 12], k.pad(r3, '1')], 0.8, '+5V');
  k.track('F', [k.pad(r3, '2'), k.pad(d1, '2')], 0.6);
  k.track('F', [k.pad(r1, '2'), k.pad(r2, '1')], 0.6, 'VOUT');
  k.track('F', [[44, 26.5], k.pad(tp1, '1')], 0.6, 'VOUT');
  k.track('F', [k.pad(j1, '2'), [10, 23.27], [10, 40], k.pad(tp2, '1')], 1.0, 'GND');
  k.track('F', [k.pad(d1, '1'), [30, 40]], 0.8, 'GND');
  k.track('F', [k.pad(r2, '2'), [44, 40]], 0.8, 'GND');
  // ground return along the right edge and the top, beside the fused +5 V trace
  k.track('F', [k.pad(tp2, '1'), [60, 40], [60, 9.4], [28, 9.4]], 0.8, 'GND');
  k.text([36, 2.5], 'GHOST SHORT  5V REF', 1.4);
  return finalize('builtin-ghost-short', {
    title: 'Ghost Short',
    author: 'DEADBOARD',
    difficulty: 4,
    description: 'A 5 V reference board: power LED D1 plus a divider that must put 2.5 V (±0.2 V) on TP1. It came back from the field dead with a blown fuse and a missing part. Replace the fuse without finding the cause and it will just blow again.',
    hints: [
      'With power OFF, measure from TP2 (GND) to each side of F1. The open fuse splits the board: which side is shorted?',
      'Follow the +5 V trace after the fuse: a hairline sliver of copper joins it to the ground trace beside it. Cut it with the knife.',
      'Vout = 5 V × R2 / (R1 + R2). R1 is 10 kΩ.',
    ],
    par: 3,
  }, k.b, [on('D1'), { type: 'voltage', a: 'TP1', min: 2.3, max: 2.7 }], 'PCB{gh0st_sl1v3r_exorc1s3d}',
  (b) => {
    // downstream of F1 (a short before the fuse could never have blown it)
    b.traces.push({ id: 'sliver', layer: 'F', a: [37, 9.4], b: [37, 12], w: 0.15 });
    b.components.find((c) => c.ref === 'F1')!.state.burnt = true;
    const r = b.components.find((c) => c.ref === 'R2')!;
    removePart(r);
    r.value = 0;
  });
}

/**
 * Concept board: a transistor switch (the circuit behind a bike's rear light). A small base current
 * from SW1 through R1 (≈2 mA) lets ten times more flow through two red LEDs: R1 is sized for a forced
 * gain of 10, the usual rule for a transistor used as a switch. Q1 is a 2N3904 in TO-92,
 * modelled by the SPICE device library (the fast solver has no transistor, so this board runs SPICE).
 * The fault: Q1 fitted backwards. Collector and emitter swap; the transistor still conducts, but with
 * a gain near 1 (the library's BR = 1; the common 2N3904 SPICE model has ≈0.74), so the LEDs only glow
 * (≈1.2 mA each, under the 2 mA the bench counts as on).
 */
async function transistorSwitch(): Promise<Scenario> {
  const k = new Builder(82, 46);
  const j1 = k.header('J1', 3, [6, 24], 0, '2×AA');
  k.tactile('SW1', [20, 14]);
  const r1 = k.resistor('R1', 1000, [34, 16.25]);
  const q1 = k.to92('Q1', '2N3904', [50, 30], 180);
  const r2 = k.resistor('R2', 68, [60, 9]);
  const d1 = k.led('D1', 'red', [70, 9], 180);
  const r3 = k.resistor('R3', 68, [60, 18]);
  const d2 = k.led('D2', 'red', [70, 18], 180);
  k.testpoint('TP1', [44, 16.25], 'B');
  k.testpoint('TP2', [62, 38], 'C');
  // +3V: J1 → top rail → SW1 and both LED resistors
  k.track('F', [k.pad(j1, '1'), [6, 3], [54.92, 3], k.pad(r2, '1'), k.pad(r3, '1')], 0.8, '+3V');
  k.track('F', [[16.75, 3], [16.75, 11.75]], 0.8, '+3V');
  // base: SW1 → R1 → TP1 → Q1 B
  k.track('F', [[23.25, 16.25], k.pad(r1, '1')], 0.8, 'SW_OUT');
  k.track('F', [k.pad(r1, '2'), [50, 16.25], k.pad(q1, '2')], 0.8, 'BASE');
  // LEDs: R → anode, cathode → collector line → Q1 C
  k.track('F', [k.pad(r2, '2'), k.pad(d1, '2')], 0.8, 'LED1_A');
  k.track('F', [k.pad(r3, '2'), k.pad(d2, '2')], 0.8, 'LED2_A');
  k.track('F', [k.pad(d1, '1'), [76, 9], [76, 38], [44, 38], [44, 30], k.pad(q1, '3')], 0.8, 'COLLECTOR');
  k.track('F', [k.pad(d2, '1'), [76, 18]], 0.8, 'COLLECTOR');
  // ground on the bottom: J1 − → Q1 E
  k.track('B', [k.pad(j1, '2'), [6, 43], [58, 43], [58, 30], k.pad(q1, '1')], 0.8, 'GND');
  k.text([16, 41], 'TRANSISTOR SWITCH  rev A', 1.4);
  const sc = await finalize('builtin-transistor-switch', {
    title: 'Transistor Switch',
    author: 'DEADBOARD',
    difficulty: 2,
    description: 'A transistor switch, the circuit behind a bike\'s rear light: a small current from SW1 into the base of Q1 lets a much bigger one flow through two red LEDs. Pressed, both LEDs should light brightly. They only glow faintly.',
    hints: [
      'Power on, hold SW1 and measure. The base (TP1) should sit near 0.7 V; a switched-on collector (TP2) drops to about 0.1 V. Which one is wrong?',
      'The base gets its current, yet the collector barely pulls down: the transistor is not amplifying. Compare the flat face of Q1 with the D shape printed on the board.',
      'Q1 sits backwards, so collector and emitter are swapped: it still conducts, but with a gain near 1. Use Rotate 180° on Q1, then run the tests.',
    ],
    par: 1,
  }, k.b, [on('D1', { SW1: true }), on('D2', { SW1: true }), off('D1', { SW1: false }), off('D2', { SW1: false })], 'PCB{tr4ns1st0r_g41n_r3st0r3d}',
  (b) => { b.components.find((c) => c.ref === 'Q1')!.state.reversed = true; });
  sc.solver = 'spice';
  return sc;
}

export async function builtinScenarios(): Promise<Scenario[]> {
  const [base, extra, soldering] = await Promise.all([
    Promise.all([
      firstLight(),
      tutColdJoint(),
      tutSolderBridge(),
      tutPolarity(),
      tutResistor(),
      tutDivider(),
      transistorSwitch(),
      bridgeTroll(),
      backwardsDay(),
      ghostShort(),
    ]),
    realisticScenarios(),
    solderingScenarios(),
  ]);
  return [...base, ...extra, ...soldering];
}
