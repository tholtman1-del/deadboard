// High-reliability soldering track: hand-made through-hole boards, one lesson each, following
// NEETS Module 14 (NAVEDTRA 14186, public domain) chapter by chapter. Tin-lead solder (63/37)
// as in the source; the lessons and their review questions live in src/lessons/neets14.ts.
import type { Board, Component, LedColor, Objective, Scenario, ScenarioMeta } from '../types';
import { buildConnectivity } from '../connectivity';
import { lockFlag, topology } from '../crypto';
import { addBlob } from '../ops';
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

export async function solderingScenarios(): Promise<Scenario[]> {
  return Promise.all([solderAndFlux(), heatAndTime(), cleanAndInspect()]);
}

/** The track's boards, in order. */
export const SOLDERING_TRACK_IDS = ['hr-solder-flux', 'hr-heat-time', 'hr-clean-inspect'] as const;
