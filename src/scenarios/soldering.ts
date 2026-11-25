// High-reliability soldering track: hand-made through-hole boards, one lesson each, following
// NEETS Module 14 (NAVEDTRA 14186, public domain) chapter by chapter. Tin-lead solder (63/37)
// as in the source; the lessons and their review questions live in src/lessons/neets14.ts.
import type { Board, Component, LedColor, Objective, Scenario, ScenarioMeta } from '../types';
import { buildConnectivity } from '../connectivity';
import { lockFlag, topology } from '../crypto';
import { addBlob, cutTrace, removePart } from '../ops';
import { Builder } from './builder';
import { clinchFitted } from '../clinch';
import { applyLeak } from '../laminate';
import { addWire, endsAt, targetEnd, terminalType, type TerminalType } from '../terminals';
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
function ledRows(w: number, h: number, rows: { color: LedColor; y: number }[], label: string, pour = false, resBottom = false): Builder {
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
    // resBottom: the resistor's runs on the solder side (a via down from the +5V bus), so its
    // leads can be clinched along them
    const rl = resBottom ? 'B' : 'F';
    if (resBottom) k.b.vias.push({ id: 'v' + (k.b.nextId++).toString(36), at: [busX, r.y], d: 1.2, drill: 0.6, net: '+5V' });
    k.track(rl, [[busX, r.y], k.pad(res, '1')], 0.9, '+5V');
    k.track(rl, [k.pad(res, '2'), k.pad(led, '2')], 0.8, `LED${n}_A`);
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

/** The transistor switch (2N3904 sinking two LEDs), through-hole: shared by lessons 5 and 11. */
function transistorSwitchBoard(label: string, can = false): Builder {
  const k = new Builder(82, 46);
  const j1 = k.header('J1', 3, [6, 24], 0, '2×AA');
  k.tactile('SW1', [20, 14]);
  const r1 = k.resistor('R1', 1000, [34, 16.25]);
  // `can`: Q1 is a 2N2219A in a TO-39 metal can, mounted on a spacer (NEETS 14 fig. 3-19); same pins and tracks
  const q1 = can ? k.to5('Q1', '2N2219A', [50, 30], 180) : k.to92('Q1', '2N3904', [50, 30], 180);
  if (can) q1.state.mount = 'spacer';
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
  k.text([16, 41], label, 1.4);
  return k;
}

/** The transistor switch, through-hole and tin-lead: Q1's base and collector joints never bonded. */
async function thermalShunt(): Promise<Scenario> {
  const k = transistorSwitchBoard('HI-REL 5  THERMAL SHUNT');
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
/**
 * The DIP-16 network board (lessons 6 and the final practical). `wired`: +5V from J1 lands on
 * turret E1 and the supply run starts at hook E2, joined by a hook-up wire (as on the 2M
 * practical's card, Appendix C).
 */
function dipNetworkBoard(label: string, wired = false) {
  const k = new Builder(64, 46);
  const j1 = k.header('J1', 5, [6, 22], 0, '5V DC');
  const rn = k.dip('RN1', '4116R-2-331', [32, 22], 16);
  const ledX = [14, 25.65, 38, 50];
  const leds = ledX.map((x, i) => k.led(`D${i + 1}`, 'red', [x, 38], -90)); // anode up (36.73), cathode down (39.27)
  const bus = (n: number) => (!wired ? '+5V' : n >= 15 ? 'VBUS1' : 'VBUS2');
  if (wired) {
    // Appendix C: a double wire on a turret (E1) and a single wire on a pierced tab (E3); E2 is a hook
    const e1 = k.terminal('E1', 'turret', [6, 5]), e2 = k.terminal('E2', 'hook', [14, 9]), e3 = k.terminal('E3', 'tab', [40, 5]);
    setNets(e1, { '1': '+5V' }); setNets(e2, { '1': 'VBUS1' }); setNets(e3, { '1': 'VBUS2' });
    k.track('F', [k.pad(j1, '1'), k.pad(e1, '1')], 0.9, '+5V');
    k.track('F', [k.pad(e2, '1'), [14, 12], [25.65, 12]], 0.9, 'VBUS1');
    k.track('F', [k.pad(e3, '1'), [40, 12], [28.19, 12]], 0.9, 'VBUS2');
    for (const [a, z] of [[e1, e2], [e1, e3]]) {
      const j = addWire(k.b, a, targetEnd(a, terminalType(a)!, endsAt(k.b, a, 0).length), z, targetEnd(z, terminalType(z)!, endsAt(k.b, z, 0).length));
      for (const e of j.ends!) e.soldered = 'ok';
    }
    // a power indicator: R5 mounted horizontally with full-clinched leads along its bottom runs
    // (a via down from VBUS2), feeding green D5 (Appendix C: the full-clinch axial part)
    const r5 = k.resistor('R5', 330, [52, 10]);
    const d5 = k.led('D5', 'green', [60, 20], -90); // anode 18.73, cathode 21.27
    setNets(r5, { '1': 'VBUS2', '2': 'LED5_A' }); setNets(d5, { '2': 'LED5_A', '1': 'GND' });
    k.b.vias.push({ id: 'v' + (k.b.nextId++).toString(36), at: [40, 10], d: 1.2, drill: 0.6, net: 'VBUS2' });
    k.track('B', [[40, 10], k.pad(r5, '1')], 0.8, 'VBUS2');
    k.track('B', [k.pad(r5, '2'), [60, 10], k.pad(d5, '2')], 0.8, 'LED5_A');
    k.track('B', [k.pad(d5, '1'), [60, 42], [50, 42]], 0.9, 'GND');
    clinchFitted(r5, 'full', 1, true);
  } else k.track('F', [k.pad(j1, '1'), [6, 12], [30.73, 12]], 0.9, '+5V');
  for (const n of [16, 15, 14, 13]) { const p = k.pad(rn, String(n)); k.track('F', [[p[0], 12], p], 0.8, bus(n)); }
  const pin = (n: number) => k.pad(rn, String(n));
  k.track('F', [pin(1), [pin(1)[0], 31], [ledX[0], 31], k.pad(leds[0], '2')], 0.8, 'LED1_A');
  k.track('F', [pin(2), k.pad(leds[1], '2')], 0.8, 'LED2_A');
  k.track('F', [pin(3), [pin(3)[0], 33], [ledX[2], 33], k.pad(leds[2], '2')], 0.8, 'LED3_A');
  k.track('F', [pin(4), [pin(4)[0], 29], [ledX[3], 29], k.pad(leds[3], '2')], 0.8, 'LED4_A');
  k.track('B', [k.pad(leds[0], '1'), [ledX[0], 42], [ledX[3], 42], k.pad(leds[3], '1')], 0.9, 'GND');
  for (const i of [1, 2]) k.track('B', [k.pad(leds[i], '1'), [ledX[i], 42]], 0.9, 'GND');
  k.track('B', [[ledX[0], 42], [6, 42], k.pad(j1, '2')], 0.9, 'GND');
  k.text(wired ? [32, 44.6] : [16, 4], label, 1.4);
  return { k, leds };
}

async function skippingPattern(): Promise<Scenario> {
  const { k, leds } = dipNetworkBoard('HI-REL 6  SKIPPING PATTERN');
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

/** A coated board whose coating type is not given: identify it by test before taking it off. */
async function coatingId(): Promise<Scenario> {
  const k = ledRows(64, 34, [{ color: 'green', y: 11 }, { color: 'red', y: 23 }], 'HI-REL 9  COATING ID');
  k.b.coating = { type: 'epoxy', thick: false };
  return finalize('hr-coating-id', {
    title: 'Coating Identification',
    author: 'DEADBOARD',
    difficulty: 3,
    description: 'D1 is dark: R1 pad 1 never bonded. The board is conformally coated, but its drawing is missing: nobody knows which coating it is. Identify it by test, record it, then take it off, repair, and put the same type back.',
    hints: [
      'Coating test (Q) on any part, three tests set in Bench → Coating test: press, a drop of alcohol, controlled heat. Follow the flowchart in the lesson.',
      'Not soft, no reaction to alcohol, and heat turns it into a white powder: that is epoxy. Record it in Bench → Identified as.',
      'Table 3-1\'s first choice for thin epoxy is the hot air jet. Then reflow R1 pad 1 with flux, clean, and coat R1 with epoxy again.',
    ],
    par: 6,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{1d3nt1fy_b3f0r3_y0u_str1p}',
  (b) => { b.components.find((c) => c.ref === 'R1')!.state.cold = [pad(b, 'R1', '1')]; });
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

/** A MOSFET switch: SW1 drives Q1's gate (1 kΩ, 100 kΩ pull-down), Q1 sinks the LED. Q1 is missing. */
async function esdBoard(): Promise<Scenario> {
  const k = new Builder(64, 42);
  const j1 = k.header('J1', 5, [6, 20], 0, '5V DC');
  k.tactile('SW1', [18, 12]);
  const r1 = k.resistor('R1', 1000, [32, 14.25]);
  const r2 = k.resistor('R2', 100000, [36, 30], 90);
  const r3 = k.resistor('R3', 330, [46, 8]);
  const d1 = k.led('D1', 'red', [52, 12], -90); // anode up (10.73), cathode down (13.27)
  const q1 = k.to92('Q1', '2N7000', [44, 26], 0, { S: '1', G: '2', D: '3' });
  k.track('F', [k.pad(j1, '1'), [6, 4], [40.92, 4], k.pad(r3, '1')], 0.9, '+5V');
  k.track('F', [[14.75, 9.75], [14.75, 4]], 0.8, '+5V');
  k.track('F', [[21.25, 14.25], k.pad(r1, '1')], 0.8, 'SW_OUT');
  k.track('F', [k.pad(r1, '2'), [44, 14.25], k.pad(q1, '2')], 0.8, 'GATE');
  k.track('F', [k.pad(r2, '1'), [k.pad(r2, '1')[0], 20], [44, 20]], 0.8, 'GATE'); // clear of Q1's source pad
  k.track('F', [k.pad(r3, '2'), [52, 8], k.pad(d1, '2')], 0.8, 'LED_A');
  k.track('F', [k.pad(d1, '1'), [52, 26], k.pad(q1, '3')], 0.8, 'DRAIN');
  k.track('B', [k.pad(q1, '1'), [41.46, 38], [6, 38], k.pad(j1, '2')], 0.9, 'GND');
  k.track('B', [k.pad(r2, '2'), [36, 38]], 0.9, 'GND');
  k.text([10, 41], 'HI-REL 10  ESD', 1.4);
  const sw = (on: boolean) => ({ SW1: on });
  const sc = await finalize('hr-esd', {
    title: 'ESD',
    author: 'DEADBOARD',
    difficulty: 3,
    description: 'A MOSFET switch: pressing SW1 should light D1. Q1, a 2N7000, is missing. A MOS transistor is damaged by as little as 35 V of static, and it is winter: the air is dry. Fit and solder a new Q1 without zapping it.',
    hints: [
      'Q1\'s footprint is empty. Before you touch the new part: Bench → ESD protection, put the wrist strap on.',
      'Fit Q1 from the Parts bin (8), then hold the iron on its three leads with "+ flux" and clean with Isopropyl.',
      'If D1 stays dark after a fit without the strap, the gate is ruptured: take Q1 out again (extractor, X) and fit a new one, grounded this time.',
    ],
    par: 5,
  }, k.b, [{ type: 'led', ref: 'D1', on: true, switches: sw(true) }, { type: 'led', ref: 'D1', on: false, switches: sw(false) }], 'PCB{gr0und3d_b3f0r3_y0u_t0uch}',
  (b) => { removePart(b.components.find((c) => c.ref === 'Q1')!); });
  sc.solver = 'spice';
  return sc;
}

function padRepair() {
  const k = ledRows(64, 34, [{ color: 'red', y: 11 }, { color: 'green', y: 23 }], 'HI-REL 11  PAD REPAIR');
  return finalize('hr-pad-repair', {
    title: 'Pad Repair',
    author: 'DEADBOARD',
    difficulty: 3,
    description: 'D2 is dark: R2 pad 2 was overheated in an earlier repair and lifted off the board. Repair the board the high-reliability way: a new pad, not a wire around the old one.',
    hints: [
      'Flip to the bottom (F): R2 pad 2 is lifted. Its lead touches nothing.',
      'Use Pad repair (E) on that pad: a new pad is epoxied on, an eyelet set through it, and it is lap-soldered to the track.',
      'The lead in the new eyelet still needs its joint: hold the iron on it with "+ flux", then clean with Isopropyl.',
    ],
    par: 3,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{n3w_p4d_3p0xy_3y3l3t}',
  (b) => { const r2 = b.components.find((c) => c.ref === 'R2')!; const pi = pad(b, 'R2', '2'); r2.state.lifted = [pi]; r2.state.cold = [pi]; });
}

/**
 * A double-sided board whose resistors were fitted horizontally with full-clinched leads along
 * their bottom-side runs (T.O. 00-25-259 07-5.4, 07-6.18): R2 burned open and is replaced the same way.
 */
function clinchedLeads() {
  const k = ledRows(64, 34, [{ color: 'red', y: 11 }, { color: 'green', y: 23 }], 'HI-REL 15  CLINCHED LEADS', false, true);
  for (const c of k.b.components) if (c.kind === 'resistor') clinchFitted(c, 'full', 1, true);
  return finalize('hr-clinched-leads', {
    title: 'Clinched Leads',
    author: 'DEADBOARD',
    difficulty: 3,
    description: 'D2 is dark: R2 burned open. Like every resistor on this double-sided card, its leads are fully clinched along their runs on the bottom. A clinched lead cannot simply be sucked out: free it the way the manual says, then fit the new resistor the way the old one was fitted.',
    hints: [
      'Flip to the bottom (F): R2\'s leads are bent flat along their tracks. The extractor tip cannot fit over a bent lead.',
      'For each lead: Desolder wick (4) to take the surface solder off, then Lead pliers (L) to break the sweat joint and straighten the lead. Then clear the hole with the extractor (X) on continuous vacuum.',
      'Take R2 out, set Bench → Lead termination to a full clinch along the conductor, one pad diameter long, fit a new 330 Ω, solder both leads with "+ flux" and clean.',
    ],
    par: 9,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{full_cl1nch_str41ght3n_f1rst}',
  (b) => { b.components.find((c) => c.ref === 'R2')!.state.burnt = true; });
}

/**
 * Burned laminate (T.O. 00-25-259 11-5.2, NEETS 14 fig. 3-29): R2 overheated, burned open and charred
 * the board under its body. The char conducts (4.7 kΩ across R2's pads: an estimate, charred FR-4
 * varies widely), so a new R2 alone leaves the damage in the circuit; the surface patch removes it.
 */
async function burnedLaminate(): Promise<Scenario> {
  const k = ledRows(64, 34, [{ color: 'red', y: 11 }, { color: 'green', y: 23 }], 'HI-REL 16  BURNED LAMINATE');
  const sc = await finalize('hr-laminate', {
    title: 'Burned Laminate',
    author: 'DEADBOARD',
    difficulty: 4,
    description: 'D2 is dark: R2 overheated, burned open, and scorched the board under its body. The char is not just cosmetic: charred laminate conducts. Replace R2, and repair the board under it with a surface patch, the way the 2M manual says.',
    hints: [
      'Take R2 out first (extractor, X, on both leads): the burn is under its body, and the repair needs the area clear.',
      'Laminate repair (A) on the burn: excavate at least 75 % of the thickness and wider than the char, straight walls, a 50 % undercut, a bevel one laminate thickness wide. Then click it again: bubble-free fill, overfill, cure, level, buttercoat.',
      'Fit a new 330 Ω R2, solder both leads with "+ flux", clean the flux off, run the tests.',
    ],
    par: 9,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{3xc4v4t3_und3rcut_b3v3l}',
  (b) => {
    const r2 = b.components.find((c) => c.ref === 'R2')!;
    r2.state.burnt = true;
    b.burns = [{ id: 'burn' + (b.nextId++).toString(36), at: [r2.at[0], r2.at[1]], r: 2, depth: 0.4, comp: r2.id, leakOhms: 4700 }];
    applyLeak(b, b.burns[0]);
  });
  sc.solver = 'spice'; // the char's leak is a SPICE element
  return sc;
}

/**
 * TO packages (NEETS 14 pp. 3-27 – 3-28): the transistor switch with Q1 a 2N2219A metal can that the
 * manufacturer mounted on a spacer. Q1 is dead; the replacement goes in the same way.
 */
async function toPackages(): Promise<Scenario> {
  const k = transistorSwitchBoard('HI-REL 17  TO PACKAGES', true);
  const sw = (on: boolean) => ({ SW1: on });
  const sc = await finalize('hr-to-package', {
    title: 'TO Packages',
    author: 'DEADBOARD',
    difficulty: 3,
    description: 'Pressing SW1 should light both LEDs. Q1, a 2N2219A in a metal can, failed. The manufacturer mounted it on a spacer above the board. Take it out without forcing it, and fit the new one the way the old one was fitted.',
    hints: [
      'Q1 is a TO-39 can on a spacer: look at it in 3D (V). Its three leads go through plated holes.',
      'Clear each of the three holes (extractor, X, continuous vacuum). Only when every lead is free does the can slip out: take it out with the wick (4) or the Inspector.',
      'Bench → TO mounting: on a spacer, as the original. Fit a new 2N2219A, clip a thermal shunt (S) on each lead, solder with "+ flux", clean, test with SW1.',
    ],
    par: 9,
  }, k.b, [{ type: 'led', ref: 'D1', on: true, switches: sw(true) }, { type: 'led', ref: 'D2', on: true, switches: sw(true) }, { type: 'led', ref: 'D1', on: false, switches: sw(false) }, { type: 'led', ref: 'D2', on: false, switches: sw(false) }], 'PCB{t0_c4n_0n_4_sp4c3r}',
  (b) => { b.components.find((c) => c.ref === 'Q1')!.state.burnt = true; });
  sc.solver = 'spice';
  return sc;
}

/**
 * Flat packs (NEETS 14 pp. 3-29 – 3-31, T.O. 00-25-259 18-5.4.3, 18-5.7, 18-6.6): four LEDs fed through
 * FP1, a 10-lead flat-pack resistor network lap-soldered on top-side lands (resistor n between pins
 * n and 11 − n). FP1 burned out: lift its leads one by one, fit a new one with formed, trimmed leads.
 */
async function flatPacks(): Promise<Scenario> {
  const k = new Builder(64, 46);
  const j1 = k.header('J1', 5, [6, 22], 0, '5V DC');
  setNets(j1, { '1': '+5V', '2': 'GND' });
  const fp = k.flatpack('FP1', 'FP10-5R-331', [32, 22], 10);
  const ledX = [14, 25.65, 38, 50];
  const leds = ledX.map((x, i) => k.led(`D${i + 1}`, 'red', [x, 38], -90)); // anode at 36.73
  const pin = (n: number) => k.pad(fp, String(n));
  for (const n of [1, 2, 3, 4]) {
    setNets(leds[n - 1], { '2': `LED${n}_A`, '1': 'GND' });
    fp.pads[n - 1].net = `LED${n}_A`; fp.pads[10 - n].net = '+5V';
  }
  fp.pads[4].net = undefined; fp.pads[5].net = undefined; // pins 5 and 6: the fifth resistor, unused
  k.track('F', [k.pad(j1, '1'), [6, 12], [33.27, 12]], 0.9, '+5V');
  for (const n of [10, 9, 8, 7]) { const p = pin(n); k.track('F', [[p[0], 12], p], 0.5, '+5V'); }
  // fan-out from the lands (1.27 mm pitch) to the LEDs, without crossing
  k.track('F', [pin(1), [pin(1)[0], 31], [ledX[0], 31], k.pad(leds[0], '2')], 0.5, 'LED1_A');
  k.track('F', [pin(2), [pin(2)[0], 33], [ledX[1], 33], k.pad(leds[1], '2')], 0.5, 'LED2_A');
  k.track('F', [pin(3), [pin(3)[0], 33], [ledX[2], 33], k.pad(leds[2], '2')], 0.5, 'LED3_A');
  k.track('F', [pin(4), [pin(4)[0], 29], [ledX[3], 29], k.pad(leds[3], '2')], 0.5, 'LED4_A');
  k.track('B', [k.pad(leds[0], '1'), [ledX[0], 42], [ledX[3], 42], k.pad(leds[3], '1')], 0.9, 'GND');
  for (const i of [1, 2]) k.track('B', [k.pad(leds[i], '1'), [ledX[i], 42]], 0.9, 'GND');
  k.track('B', [[ledX[0], 42], [6, 42], k.pad(j1, '2')], 0.9, 'GND');
  k.text([16, 4], 'HI-REL 18  FLAT PACKS', 1.4);
  const sc = await finalize('hr-flat-pack', {
    title: 'Flat Packs',
    author: 'DEADBOARD',
    difficulty: 4,
    description: 'Four LEDs fed through FP1, a 10-lead flat-pack resistor network lap-soldered on its lands. All four are dark: FP1 burned out. A flat pack comes off lead by lead, and a new one arrives with straight leads that you form and cut before you fit it.',
    hints: [
      'FP1\'s leads lie on lands on the top. Hold the iron on a lead until the solder is completely molten, then, with the tip still on it, press L (on a phone: the Lift lead button) to lift it. Lifting early tears the land.',
      'Work round the leads in a skipping pattern (never the neighbour next). With every lead off its land, lift FP1 away (wick, 4, or Inspector).',
      'Bench → Flat pack leads: formed, 50–80 % of the land long. Fit a new FP1, hold the iron with "+ flux" on each lead in a skipping pattern until the fillet is full, then clean.',
    ],
    par: 30,
  }, k.b, leds.map((d) => lit(d.ref)), 'PCB{fl4t_p4ck_l34ds_f0rm3d}',
  (b) => { b.components.find((c) => c.ref === 'FP1')!.state.burnt = true; });
  sc.solver = 'spice';
  return sc;
}

/**
 * Point-to-point wiring on terminals (T.O. 00-25-259 WP 008 00 / 009 00): +5V from J1 reaches
 * terminal E1; each LED row is fed from its own terminal (E2, E3 …); hook-up wires join them as
 * `wires` lists. The good board carries target wires (one diameter clearance, 180°, cut flush,
 * soldered); the lesson takes them away.
 */
function wiredRows(label: string, src: TerminalType, rows: { type: TerminalType; color: LedColor; y: number; r?: number }[], wires: [number, number][], h = 40) {
  const w = 70, k = new Builder(w, h);
  const j1 = k.header('J1', 5, [6, h / 2], 0, '5V DC');
  setNets(j1, { '1': '+5V', '2': 'GND' });
  const y1 = k.pad(j1, '1')[1];
  const terms = [k.terminal('E1', src, [20, y1])];
  setNets(terms[0], { '1': '+5V' });
  k.track('F', [k.pad(j1, '1'), k.pad(terms[0], '1')], 0.9, '+5V');
  const gndX = 66;
  rows.forEach((r, i) => {
    const n = i + 1;
    const e = k.terminal(`E${n + 1}`, r.type, [36, r.y], r.r ?? 0);
    terms.push(e);
    const res = k.resistor(`R${n}`, 330, [48, r.y]);
    const led = k.led(`D${n}`, r.color, [62, r.y], 180);
    setNets(e, { '1': `FEED${n}` });
    setNets(res, { '1': `FEED${n}`, '2': `LED${n}_A` });
    setNets(led, { '2': `LED${n}_A`, '1': 'GND' });
    k.track('F', [k.pad(e, '1'), k.pad(res, '1')], 0.9, `FEED${n}`);
    k.track('F', [k.pad(res, '2'), k.pad(led, '2')], 0.8, `LED${n}_A`);
    k.track('B', [k.pad(led, '1'), [gndX, r.y]], 0.9, 'GND');
  });
  const ys = rows.map((r) => r.y);
  k.track('B', [[gndX, Math.min(...ys)], [gndX, h - 3], [6, h - 3], k.pad(j1, '2')], 0.9, 'GND');
  k.text([w / 2 - 4, 3], label, 1.4);
  for (const [a, b] of wires) {
    const ca = terms[a], cb = terms[b];
    const j = addWire(k.b, ca, targetEnd(ca, terminalType(ca)!, endsAt(k.b, ca, 0).length), cb, targetEnd(cb, terminalType(cb)!, endsAt(k.b, cb, 0).length));
    for (const e of j.ends!) e.soldered = 'ok'; // the good board's wires are soldered
  }
  return k;
}

function turretTerminals() {
  const k = wiredRows('HI-REL 12  TURRET TERMINALS', 'turret', [{ type: 'turret', color: 'red', y: 11 }, { type: 'turret', color: 'green', y: 29 }], [[0, 1], [1, 2]]);
  return finalize('hr-turret', {
    title: 'Turret Terminals',
    author: 'DEADBOARD',
    difficulty: 3,
    description: 'Point-to-point wiring: +5V arrives at turret E1, and each LED is fed from its own turret. The two wires are missing: E1 to E2, and E2 on to E3. Strip, tin, form and solder them to the 2M standard.',
    hints: [
      'Hook-up wire (W): click E1, prepare the end, then click E2 and prepare that end. The wire is M22759/16-22: 1.32 mm over the insulation.',
      'Thermal strippers; tin the end; keep one wire diameter (about 1.3 mm) of bare wire before the terminal; bend 180° round the post and cut the end flush. Strip enough for clearance plus the wrap.',
      'Then hold the iron on each turret with "+ flux" (fresh solder) until the wire is soldered. E2 carries two wires: place both before you solder it. Clean the flux with Isopropyl.',
    ],
    par: 8,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{turr3t_180_0n3_d14m3t3r}',
  (b) => { b.jumpers = []; });
}

function hookAndTab() {
  const k = wiredRows('HI-REL 13  HOOK + PIERCED TAB', 'hook', [{ type: 'tab', color: 'yellow', y: 11 }, { type: 'tab', color: 'blue', y: 29 }], [[0, 1], [0, 2]]);
  return finalize('hr-hook-tab', {
    title: 'Hook and Pierced Tab',
    author: 'DEADBOARD',
    difficulty: 3,
    description: '+5V arrives at hook terminal E1; the LEDs are fed from pierced tabs E2 and E3. Both wires from the hook are missing. A hook has its own rule for where the wire sits, and a tab wire must pass through the eye.',
    hints: [
      'Hook-up wire (W) from E1 to E2, and again from E1 to E3: E1 is a two-wire hook.',
      'On the hook, the wire sits inside the hook\'s 180° arc, not at its base or its tip. On a tab, through the eye: 180° is the target, 90° is the least.',
      'Solder E1 once both wires are on it, then E2 and E3, with fresh solder ("+ flux"), and clean the flux off.',
    ],
    par: 8,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{h00k_4rc_th3n_th3_3y3}',
  (b) => { b.jumpers = []; });
}

function solderCups() {
  const k = wiredRows('HI-REL 14  SOLDER CUPS', 'turret', [{ type: 'cup', color: 'green', y: 11 }, { type: 'cup', color: 'red', y: 29 }], [[0, 1], [0, 2]]);
  return finalize('hr-solder-cup', {
    title: 'Solder Cups',
    author: 'DEADBOARD',
    difficulty: 3,
    description: 'The LEDs are fed through solder cups E2 and E3, like the pins of a connector. Wire both cups from turret E1. A cup takes the wire straight in, to the bottom, and has to be filled with solder.',
    hints: [
      'Hook-up wire (W) from E1 to each cup. In a cup, the stripped length is the cup depth (2.5 mm) plus the clearance above the rim: one wire diameter.',
      'Strip too short and the wire does not reach the bottom, or the insulation sits in the solder; too long and the bare wire stands out of the cup.',
      'Fill each cup with fresh solder ("+ flux"): the tinning alone does not fill it. Clean the flux off.',
    ],
    par: 8,
  }, k.b, [lit('D1'), lit('D2')], 'PCB{s0ld3r_cup_full_d3pth}',
  (b) => { b.jumpers = []; });
}

/**
 * The final practical, after the 2M miniature performance test (certification manual Appendix C):
 * on the DIP-16 network board under an unidentified coating (hard polyurethane), RN1 burned out and
 * is replaced whole (coating identified and taken off, 16 pins desoldered and soldered in a skipping
 * pattern), the pad under RN1 pin 1 has lifted (new pad + eyelet), the +5V run carries a deep nick
 * (staple), and the same coating goes back on.
 */
async function finalPractical(): Promise<Scenario> {
  const { k, leds } = dipNetworkBoard('HI-REL 19  FINAL PRACTICAL', true);
  k.b.coating = { type: 'polyurethane', thick: false };
  const sc = await finalize('hr-final-practical', {
    title: 'Final Practical',
    author: 'DEADBOARD',
    difficulty: 4,
    description: 'The course\'s practical, like the 2M miniature performance test. All five LEDs are dark: RN1, the DIP-16 resistor network, burned out; R5, the power indicator\'s resistor, burned open and scorched the board under it; and the supply wires from turret E1 to hook E2 and tab E3 were never fitted. The card is coated (no drawing), and the inspector checks everything you have learned. Replace RN1 and R5, repair the board, wire the terminals, and leave the card as the manuals demand.',
    hints: [
      'Order of work: identify the coating by test and record it, take it off RN1 with Table 3-1\'s first choice, then clear all 16 holes with continuous vacuum in a skipping pattern (never two neighbouring pins in a row).',
      'RN1 out: the pad under pin 1 has lifted, replace it (Pad repair, E). Fit a new RN1, solder all 16 pins in a skipping pattern, clean the flux. The +5V run has a deep nick: staple it (K).',
      'Wire E1 to E2 and E1 to E3 (Hook-up wire, W): a double wire on the turret, the hook wire in the arc, the tab wire through the eye. Solder E1 with both wires on it, then clean.',
      'R5 (bottom right): its leads are full-clinched on the bottom. Coating off, wick the surface solder, straighten the leads (Lead pliers, L), extract, take it out. Patch the burned laminate under it (Laminate repair, A), then fit a new 330 Ω R5 with a full clinch along its runs (Bench → Lead termination) and solder it.',
      'Last: the same coating back on RN1 and R5, then run the tests.',
    ],
    par: 52,
  }, k.b, [...leds.map((d) => lit(d.ref)), lit('D5')], 'PCB{2m_pr4ct1c4l_p4ss3d}',
  (b) => {
    const rn = b.components.find((c) => c.ref === 'RN1')!;
    rn.state.burnt = true;
    rn.state.lifted = [0];
    rn.state.cold = [0];
    const t = b.traces.find((x) => x.net === 'VBUS1' && x.layer === 'F' && Math.abs(x.a[1] - 12) < 0.01 && Math.abs(x.b[1] - 12) < 0.01 && Math.abs(x.b[0] - x.a[0]) > 10)!;
    const depth = 0.4;
    b.nicks = [{ id: 'n' + (b.nextId++).toString(36), at: [18, 12 - t.w / 2 + (depth * t.w) / 2], layer: 'F', len: 0.6, depth, rot: 0, width: t.w }];
    b.jumpers = []; // the supply wires from E1 to E2 and E3 are not fitted yet
    // R5 overheated: burned open, the laminate under its body charred (and conducting)
    const r5 = b.components.find((c) => c.ref === 'R5')!;
    r5.state.burnt = true;
    b.burns = [{ id: 'burn' + (b.nextId++).toString(36), at: [r5.at[0], r5.at[1]], r: 2, depth: 0.4, comp: r5.id, leakOhms: 4700 }];
    applyLeak(b, b.burns[0]);
  });
  sc.solver = 'spice';
  return sc;
}

export async function solderingScenarios(): Promise<Scenario[]> {
  return Promise.all([solderAndFlux(), heatAndTime(), cleanAndInspect(), desoldering(), thermalShunt(), skippingPattern(), conductorRepair(), conformalCoating(), coatingId(), esdBoard(), padRepair(), turretTerminals(), hookAndTab(), solderCups(), clinchedLeads(), burnedLaminate(), toPackages(), flatPacks(), finalPractical()]);
}

/** The track's boards, in order. */
export const SOLDERING_TRACK_IDS = ['hr-solder-flux', 'hr-heat-time', 'hr-clean-inspect', 'hr-desoldering', 'hr-thermal-shunt', 'hr-skipping-pattern', 'hr-conductor-repair', 'hr-conformal-coating', 'hr-coating-id', 'hr-esd', 'hr-pad-repair', 'hr-turret', 'hr-hook-tab', 'hr-solder-cup', 'hr-clinched-leads', 'hr-laminate', 'hr-to-package', 'hr-flat-pack', 'hr-final-practical'] as const;
