// High-reliability soldering track: hand-made through-hole boards, one lesson each, following
// NEETS Module 14 (NAVEDTRA 14186, public domain) chapter by chapter. Tin-lead solder (63/37)
// as in the source; the lessons and their review questions live in src/lessons/neets14.ts.
import type { Board, Component, LedColor, Objective, Scenario, ScenarioMeta } from '../types';
import { buildConnectivity } from '../connectivity';
import { lockFlag, topology } from '../crypto';
import { addBlob, cutTrace } from '../ops';
import { Builder } from './builder';
import { setReference } from './reference';

async function finalize(id: string, meta: ScenarioMeta, b: Board, objectives: Objective[], flag: string, sabotage: (b: Board) => void): Promise<Scenario> {
  const lock = await lockFlag(flag, topology(b, buildConnectivity(b), id));
  const good = structuredClone(b);
  sabotage(b);
  const sc: Scenario = { format: 'pcbfix/1', id, meta, board: b, objectives, lock, alloy: 'sn63' };
  setReference(sc, good);
  return sc;
}

const lit = (ref: string): Objective => ({ type: 'led', ref, on: true });
const pad = (b: Board, ref: string, name: string) => {
  const c = b.components.find((x) => x.ref === ref)!;
  return c.pads.findIndex((p) => p.name === name);
};
const setNets = (c: Component, nets: Record<string, string>) => { for (const p of c.pads) p.net = nets[p.name]; };

/**
 * A 5 V header and LED rows: each row a 330 Ω resistor into an LED (turned 180° so its anode
 * faces the resistor), cathodes to ground. +5V runs on the top, ground on the bottom (or a pour).
 */
function ledRows(w: number, h: number, rows: { color: LedColor; y: number }[], label: string, pour = false): Builder {
  const k = new Builder(w, h);
  const j1 = k.header('J1', 5, [6, h / 2], 0, '5V DC');
  setNets(j1, { '1': '+5V', '2': 'GND' });
  const busX = 13, gndX = w - 10;
  k.track('F', [k.pad(j1, '1'), [busX, h / 2 - 1.27]], 0.9, '+5V');
  k.track('F', [[busX, rows[0].y], [busX, rows[rows.length - 1].y]], 0.9, '+5V');
  rows.forEach((r, i) => {
    const n = i + 1;
    const res = k.resistor(`R${n}`, 330, [26, r.y]);
    const led = k.led(`D${n}`, r.color, [44, r.y], 180); // A (pad 2) at x 42.73, K (pad 1) at 45.27
    setNets(res, { '1': '+5V', '2': `LED${n}_A` });
    setNets(led, { '2': `LED${n}_A`, '1': 'GND' });
    k.track('F', [[busX, r.y], k.pad(res, '1')], 0.9, '+5V');
    k.track('F', [k.pad(res, '2'), k.pad(led, '2')], 0.8, `LED${n}_A`);
    if (!pour) k.track('B', [k.pad(led, '1'), [gndX, r.y]], 0.9, 'GND');
  });
  if (pour) {
    // a ground pour over the whole bottom: the cathodes and J1's ground pin sit in it
    k.b.zones.push({ id: 'z' + (k.b.nextId++).toString(36), layer: 'B', net: 'GND', poly: [[1.5, 1.5], [w - 1.5, 1.5], [w - 1.5, h - 1.5], [1.5, h - 1.5]] });
  } else {
    k.track('B', [[gndX, rows[0].y], [gndX, h - 3], [6, h - 3], k.pad(j1, '2')], 0.9, 'GND');
  }
  k.text([w / 2 - 12, 3], label, 1.4);
  return k;
}

function solderAndFlux() {
  const k = ledRows(64, 40, [{ color: 'red', y: 10 }, { color: 'green', y: 20 }, { color: 'yellow', y: 30 }], 'HI-REL 1  SOLDER + FLUX');
  return finalize('hr-solder-flux', {
    title: 'Solder and Flux',
    author: 'DEADBOARD',
    difficulty: 1,
    description: 'Three LEDs on a 5 V supply, soldered with 63/37 tin-lead. None of them lights. Three joints on the bottom never bonded: the old solder is oxidised. Remake them so they wet, the way the textbook says.',
    hints: [
      'Flip to the bottom (F). Three joints look dull and grainy: R1 pad 2, D2 pad 1 and R3 pad 1.',
      'Heat alone does not fix an oxidised joint: flux removes the oxides. Put rosin on the joint (Rosin tool, R) or switch the station to "+ flux", then hold the iron on the joint.',
      'Hold the tip on each joint until the solder flows (about 1 s), then lift. A joint that stays dull needs fresh flux.',
    ],
    par: 3,
  }, k.b, [lit('D1'), lit('D2'), lit('D3')], 'PCB{r0s1n_r3m0v3s_0x1d3s}',
  (b) => {
    b.components.find((c) => c.ref === 'R1')!.state.cold = [pad(b, 'R1', '2')];
    b.components.find((c) => c.ref === 'D2')!.state.cold = [pad(b, 'D2', '1')];
    b.components.find((c) => c.ref === 'R3')!.state.cold = [pad(b, 'R3', '1')];
  });
}

function heatAndTime() {
  const k = ledRows(64, 34, [{ color: 'red', y: 11 }, { color: 'green', y: 23 }], 'HI-REL 2  HEAT + TIME', true);
  return finalize('hr-heat-time', {
    title: 'Heat and Time',
    author: 'DEADBOARD',
    difficulty: 2,
    description: 'Two LEDs on a board with a ground pour on the bottom. Both are dark: one joint sits in the pour, one on a thin signal track. The pour pulls heat away; the thin track does not. Make both joints without lifting a pad.',
    hints: [
      'Flip to the bottom (F): D1 pad 1 (in the ground pour) and R2 pad 2 (on a track) are dull.',
      'Watch the Thermal view while you hold the iron. The pour pulls heat away, so that joint stays cooler; the joint on the thin track gets hot fast.',
      'About 2–3 s of contact makes a joint. Holding a hot tip on a small joint much longer lifts its pad.',
    ],
    par: 2,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{h34t_m4ss_4nd_t1m3}',
  (b) => {
    b.components.find((c) => c.ref === 'D1')!.state.cold = [pad(b, 'D1', '1')];
    b.components.find((c) => c.ref === 'R2')!.state.cold = [pad(b, 'R2', '2')];
  });
}

function cleanAndInspect() {
  const k = ledRows(64, 34, [{ color: 'red', y: 11 }, { color: 'blue', y: 23 }], 'HI-REL 3  CLEAN + INSPECT');
  return finalize('hr-clean-inspect', {
    title: 'Clean and Inspect',
    author: 'DEADBOARD',
    difficulty: 2,
    description: 'Someone reworked this board and left it a mess. D1 is dark and D2 is dark. Find what is wrong, fix it, then leave the board as an inspector wants to see it: no splattered solder and no flux residue.',
    hints: [
      'Flip to the bottom (F) and look at every joint and the space between pads.',
      'R1 pad 1 is dull (reflow it with flux). A splash of solder joins D2\'s two pads: take it off with the wick.',
      'Every reflow leaves rosin behind. Scrub it off with Isopropyl (0) before you call the board done.',
    ],
    par: 3,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{cl34n_b04rd_n0_spl4tt3r}',
  (b) => {
    b.components.find((c) => c.ref === 'R1')!.state.cold = [pad(b, 'R1', '1')];
    addBlob(b, [44, 23], 'B', 0.75); // across D2's pads (K at 45.27, A at 42.73)
  });
}

function desoldering() {
  const k = ledRows(64, 34, [{ color: 'red', y: 11 }, { color: 'green', y: 23 }], 'HI-REL 4  DESOLDERING');
  return finalize('hr-desoldering', {
    title: 'Desoldering',
    author: 'DEADBOARD',
    difficulty: 2,
    description: 'D2 is dark: R2 burned open and has to be replaced. Its leads sit in plated-through holes. Take it out without damaging the board, fit a new 330 Ω resistor, solder it, clean and inspect.',
    hints: [
      'Measure across R2 (Ω, power off): it reads open. The part has to come out.',
      'A plated hole holds its solder: wick only takes the surface, a manual plunger leaves a sweat joint. Hold the Solder extractor (X) on continuous vacuum on each R2 joint until the hole is clear.',
      'With both holes clear, take R2 out (Desolder wick on the part, or Inspector), fit a new one (Parts bin, 8), hold the iron on each lead with "+ flux" (flux-cored solder), then clean with Isopropyl.',
    ],
    par: 6,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{pl4t3d_h0l3s_n33d_v4cuum}',
  (b) => { b.components.find((c) => c.ref === 'R2')!.state.burnt = true; });
}

/** The transistor switch, through-hole and tin-lead: Q1's base and collector joints never bonded. */
async function thermalShunt(): Promise<Scenario> {
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
  k.track('F', [k.pad(j1, '1'), [6, 3], [54.92, 3], k.pad(r2, '1'), k.pad(r3, '1')], 0.8, '+3V');
  k.track('F', [[16.75, 3], [16.75, 11.75]], 0.8, '+3V');
  k.track('F', [[23.25, 16.25], k.pad(r1, '1')], 0.8, 'SW_OUT');
  k.track('F', [k.pad(r1, '2'), [50, 16.25], k.pad(q1, '2')], 0.8, 'BASE');
  k.track('F', [k.pad(r2, '2'), k.pad(d1, '2')], 0.8, 'LED1_A');
  k.track('F', [k.pad(r3, '2'), k.pad(d2, '2')], 0.8, 'LED2_A');
  k.track('F', [k.pad(d1, '1'), [76, 9], [76, 38], [44, 38], [44, 30], k.pad(q1, '3')], 0.8, 'COLLECTOR');
  k.track('F', [k.pad(d2, '1'), [76, 18]], 0.8, 'COLLECTOR');
  k.track('B', [k.pad(j1, '2'), [6, 43], [58, 43], [58, 30], k.pad(q1, '1')], 0.8, 'GND');
  k.text([16, 41], 'HI-REL 5  THERMAL SHUNT', 1.4);
  const sw = (on: boolean) => ({ SW1: on });
  const sc = await finalize('hr-thermal-shunt', {
    title: 'Thermal Shunt',
    author: 'DEADBOARD',
    difficulty: 2,
    description: 'A transistor switch: pressing SW1 should light both LEDs. Nothing lights. Two of Q1\'s joints never bonded. A transistor is heat-sensitive: protect it the way the textbook says while you make its joints.',
    hints: [
      'Flip to the bottom (F): Q1\'s base (pad 2) and collector (pad 3) joints are dull.',
      'Before heating a transistor lead, clip a Thermal shunt (S) on that lead: it carries heat away from the body.',
      'With the shunts on, hold the iron on each dull joint until it flows. Compare the body temperature in the Thermal view with and without a shunt.',
    ],
    par: 4,
  }, k.b, [{ type: 'led', ref: 'D1', on: true, switches: sw(true) }, { type: 'led', ref: 'D2', on: true, switches: sw(true) }, { type: 'led', ref: 'D1', on: false, switches: sw(false) }, { type: 'led', ref: 'D2', on: false, switches: sw(false) }], 'PCB{sh0nt_th3_h34t_4w4y}',
  (b) => { b.components.find((c) => c.ref === 'Q1')!.state.cold = [pad(b, 'Q1', '2'), pad(b, 'Q1', '3')]; });
  sc.solver = 'spice';
  return sc;
}

/**
 * A DIP-16 resistor network (8 × 330 Ω isolated) driving four LEDs: resistor n sits between pin n
 * (bottom row, to the LED) and pin 17 − n (top row, on +5V). Pins 1–4 never bonded.
 */
async function skippingPattern(): Promise<Scenario> {
  const k = new Builder(64, 46);
  const j1 = k.header('J1', 5, [6, 22], 0, '5V DC');
  const rn = k.dip('RN1', '4116R-2-331', [32, 22], 16);
  const ledX = [14, 25.65, 38, 50];
  const leds = ledX.map((x, i) => k.led(`D${i + 1}`, 'red', [x, 38], -90)); // anode up (36.73), cathode down (39.27)
  k.track('F', [k.pad(j1, '1'), [6, 12], [30.73, 12]], 0.9, '+5V');
  for (const n of [16, 15, 14, 13]) { const p = k.pad(rn, String(n)); k.track('F', [[p[0], 12], p], 0.8, '+5V'); }
  const pin = (n: number) => k.pad(rn, String(n));
  k.track('F', [pin(1), [pin(1)[0], 31], [ledX[0], 31], k.pad(leds[0], '2')], 0.8, 'LED1_A');
  k.track('F', [pin(2), k.pad(leds[1], '2')], 0.8, 'LED2_A');
  k.track('F', [pin(3), [pin(3)[0], 33], [ledX[2], 33], k.pad(leds[2], '2')], 0.8, 'LED3_A');
  k.track('F', [pin(4), [pin(4)[0], 29], [ledX[3], 29], k.pad(leds[3], '2')], 0.8, 'LED4_A');
  k.track('B', [k.pad(leds[0], '1'), [ledX[0], 42], [ledX[3], 42], k.pad(leds[3], '1')], 0.9, 'GND');
  for (const i of [1, 2]) k.track('B', [k.pad(leds[i], '1'), [ledX[i], 42]], 0.9, 'GND');
  k.track('B', [[ledX[0], 42], [6, 42], k.pad(j1, '2')], 0.9, 'GND');
  k.text([16, 4], 'HI-REL 6  SKIPPING PATTERN', 1.4);
  const sc = await finalize('hr-skipping-pattern', {
    title: 'Skipping Pattern',
    author: 'DEADBOARD',
    difficulty: 2,
    description: 'Four LEDs fed through RN1, a DIP-16 resistor network. All four are dark: pins 1 to 4 of RN1, side by side, never bonded. Remake them the way the textbook says for a multilead part, without heating two neighbouring pins one after the other.',
    hints: [
      'Flip to the bottom (F): RN1 pins 1, 2, 3 and 4 are dull. They sit 2.54 mm apart.',
      'A skipping pattern never heats two neighbouring pins in a row: for pins 1–4 that is 2, 4, 1, 3 (or 3, 1, 4, 2).',
      'Hold the iron on each joint in that order until it flows, then clean the flux off with Isopropyl (0).',
    ],
    par: 5,
  }, k.b, leds.map((d) => lit(d.ref)), 'PCB{sk1p_p4tt3rn_n0_h34t_bu1ldup}',
  (b) => { b.components.find((c) => c.ref === 'RN1')!.state.cold = [0, 1, 2, 3]; });
  sc.solver = 'spice';
  return sc;
}

function conductorRepair() {
  const k = ledRows(64, 34, [{ color: 'red', y: 11 }, { color: 'green', y: 23 }], 'HI-REL 7  CONDUCTOR REPAIR');
  return finalize('hr-conductor-repair', {
    title: 'Conductor Repair',
    author: 'DEADBOARD',
    difficulty: 2,
    description: 'D1 is dark: its track is cracked through. D2 lights, but its track has a deep nick. Repair both conductors so the board works and passes a high-reliability inspection.',
    hints: [
      'Look closely at the tracks between R1 and D1, and between R2 and D2, on the top side.',
      'A solder bridge or a wire across the crack would work, but neither is a high-reliability repair. The textbook\'s choice is the clinched staple (K): click the conductor on one side of the damage, then the other.',
      'The nick takes half the width of D2\'s track: more than a tenth, so it must be repaired too, with a staple across it.',
    ],
    par: 2,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{cl1nch3d_st4pl3_h1_r3l}',
  (b) => {
    const t1 = b.traces.find((t) => t.net === 'LED1_A' && t.layer === 'F')!;
    cutTrace(b, t1, [37, 11], 0.5);
    const t2 = b.traces.find((t) => t.net === 'LED2_A' && t.layer === 'F')!;
    const depth = 0.5;
    b.nicks = [{ id: 'n' + (b.nextId++).toString(36), at: [37, 23 + t2.w / 2 - (depth * t2.w) / 2], layer: 'F', len: 0.6, depth, rot: 0, width: t2.w }];
  });
}

async function conformalCoating(): Promise<Scenario> {
  const k = ledRows(64, 34, [{ color: 'red', y: 11 }, { color: 'yellow', y: 23 }], 'HI-REL 8  CONFORMAL COATING');
  // the whole assembly is coated; the coating is known from the board's drawing
  k.b.coating = { type: 'polyurethane', thick: false };
  return finalize('hr-conformal-coating', {
    title: 'Conformal Coating',
    author: 'DEADBOARD',
    difficulty: 3,
    description: 'A coated board: thin polyurethane over both sides, according to its drawing. D2 is dark because R2 pad 2 never bonded. The coating has to come off that joint first, and go back on afterwards.',
    hints: [
      'Flip to the bottom (F): R2 pad 2 is dull, under the clear coating.',
      'Never take coating off with the soldering iron: it chars. Set Bench → Coating removal to the least damaging method Table 3-1 lists for polyurethane (number 1), then use Coating removal (U) on R2.',
      'Reflow the joint with flux, clean it with Isopropyl, then put polyurethane back with Conformal coating (J): the same type as removed.',
    ],
    par: 4,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{s4m3_c04t1ng_b4ck_0n}',
  (b) => { b.components.find((c) => c.ref === 'R2')!.state.cold = [pad(b, 'R2', '2')]; });
}

export async function solderingScenarios(): Promise<Scenario[]> {
  return Promise.all([solderAndFlux(), heatAndTime(), cleanAndInspect(), desoldering(), thermalShunt(), skippingPattern(), conductorRepair(), conformalCoating()]);
}

/** The track's boards, in order. */
export const SOLDERING_TRACK_IDS = ['hr-solder-flux', 'hr-heat-time', 'hr-clean-inspect', 'hr-desoldering', 'hr-thermal-shunt', 'hr-skipping-pattern', 'hr-conductor-repair', 'hr-conformal-coating'] as const;
