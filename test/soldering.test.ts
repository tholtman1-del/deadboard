// High-reliability soldering: through-hole joint physics, solder alloys, flux residue, the
// workmanship inspection, the track's boards and the lesson data (NEETS Module 14).
import type { Board } from '../src/types';
import { Builder } from '../src/scenarios/builder';
import { ThermalModel, copperThickness, THERMAL_DEFAULTS } from '../src/thermal';
import { ALLOYS, IRON_G, ReworkMonitor, heldPads, limitsFor, type ReworkEvent } from '../src/rework';
import { cleanFluxWithIpa, fluxResidueNear } from '../src/residue';
import { RULES, inspect } from '../src/workmanship';
import { TABLE_3_1, applyCoating, removeCoating, workable } from '../src/coating';
import { TABLE_3_2, benchCharge, handle as handleEsd } from '../src/esd';
import { LESSONS, lessonFor } from '../src/lessons/neets14';
import { lessonAccepted } from '../src/ui/lesson-ui';
import { SOLDERING_TRACK_IDS, solderingScenarios } from '../src/scenarios/soldering';
import { referenceBoard } from '../src/scenarios/reference';
import { buildConnectivity } from '../src/connectivity';
import { evaluateObjectives } from '../src/verify';
import { BOARD_INFO, PATH_ORDER } from '../src/scenarios/catalog';
import { addBlob, addJumper, installPart, removePart } from '../src/ops';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }

interface Fs { existsSync(p: string): boolean }
const fsName = 'node:fs';
const { existsSync } = (await import(/* @vite-ignore */ fsName)) as Fs;
const root = new URL('..', import.meta.url).pathname;

/** Holds the iron on one pad for `hold` s (tip `temp`), then lets the board cool for `after` s. */
function solder(b: Board, ref: string, pad: string, opts: { hold: number; temp?: number; flux?: boolean; after?: number; alloy?: 'sn63' | 'sac305'; delay?: number }) {
  const m = new ThermalModel(b), rw = new ReworkMonitor(b, m, limitsFor(opts.alloy ?? 'sn63'));
  if (opts.delay) { m.step(opts.delay); rw.update(opts.delay); } // a later moment on the bench (the no-flux outcome is seeded by time)
  const c = b.components.find((x) => x.ref === ref)!, pi = c.pads.findIndex((p) => p.name === pad);
  if (opts.flux !== false) rw.applyFlux(c.at[0], c.at[1], 12);
  m.addSource({ kind: 'iron', x: 0, y: 0, temp: opts.temp ?? 350, g: opts.flux === false ? IRON_G.dry : IRON_G.flux, pmax: 60, until: m.time + opts.hold, partId: c.id, pad: pi });
  const events: (ReworkEvent & { t: number })[] = [];
  let peak = 0, bodyPeak = 0;
  for (let t = 0; t < opts.hold + (opts.after ?? 2); t += 0.05) {
    m.step(0.05);
    peak = Math.max(peak, m.jointTemp(c, pi));
    bodyPeak = Math.max(bodyPeak, m.partTemp(c.id)!);
    for (const e of rw.update(0.05)) events.push({ ...e, t });
  }
  return { m, rw, c, pi, peak, bodyPeak, events, other: m.jointTemp(c, 1 - pi) };
}

async function main() {
  // ---- alloys (NEETS 14 p. 2-19; SAC305 datasheets) ----
  assert(ALLOYS.sn63.solidus === 183 && ALLOYS.sn63.liquidus === 183, '63/37 is eutectic at 183 °C (361 °F)');
  assert(ALLOYS.sn60.solidus === 183 && ALLOYS.sn60.liquidus === 188, '60/40 is plastic from 183 to 188 °C (361–370 °F)');
  assert(ALLOYS.sac305.solidus === 217 && ALLOYS.sac305.liquidus === 220, 'SAC305 melts 217–220 °C');
  assert(limitsFor().alloy.id === 'sac305', 'boards are lead-free unless they say otherwise');

  // ---- copper map: per-cell conductivity from the copper actually there ----
  {
    const bare: Board = { w: 20, h: 20, thickness: 1.6, components: [], traces: [], vias: [], blobs: [], jumpers: [], zones: [], silk: [], texts: [], nextId: 1 };
    assert(copperThickness(bare, 10, 10, 2, 35e-6) === null, 'a board without copper geometry keeps the uniform multilayer value');
    const pour = { ...bare, zones: [{ id: 'z', layer: 'B' as const, net: 'GND', poly: [[0, 0], [20, 0], [20, 10], [0, 10]] as [number, number][] }] };
    const cu = copperThickness(pour, 10, 10, 2, 35e-6)!;
    assert(Math.abs(cu[0] - 35e-6) < 1e-12 && cu[99] === 0, 'a pour covers its cells with one layer of copper, the rest is bare laminate');
    assert(THERMAL_DEFAULTS.kLaminate < 1, 'bare FR-4 conducts poorly in-plane');
  }

  // ---- through-hole joint physics ----
  const lone = () => { const k = new Builder(60, 40); k.resistor('R1', 100, [20, 20]); k.track('F', [[25.08, 20], [50, 20]], 0.8, 'N'); return k.b; };
  {
    const r = solder(lone(), 'R1', '1', { hold: 3 });
    assert(r.peak > 270 && r.peak < 340, `a 350 °C tip brings a small THT joint near 288 °C (NEETS 3-23): ${r.peak.toFixed(0)} °C`);
    assert(r.bodyPeak < r.peak - 100, `the body warms only through the lead (${r.bodyPeak.toFixed(0)} °C vs joint ${r.peak.toFixed(0)} °C)`);
    assert(r.other < 150, `the other joint of the part stays solid (${r.other.toFixed(0)} °C)`);
    assert(r.rw.episodes.length === 1 && r.rw.episodes[0].molten > 2.5 && r.rw.episodes[0].flux, 'the heating is logged as one molten episode with flux');
    assert(r.c.state.fluxResidue?.includes(r.pi), 'reflow with rosin leaves residue on the joint');
    assert(r.events.some((e) => e.kind === 'wetted'), 'a sound joint reports that its solder flowed');
    const long = solder(lone(), 'R1', '1', { hold: 15 });
    assert(long.c.state.lifted?.includes(long.pi), 'a hot tip held 15 s on a small joint lifts its pad');
    const lifted = long.events.find((e) => e.kind === 'pad-lifted')!;
    assert(lifted.t > 4, `…but not within a normal 2–3 s joint (lifted at ${lifted.t.toFixed(1)} s)`);
  }
  {
    // a joint in a ground pour runs cooler than one on a track: the pour pulls heat away
    const sc = (await solderingScenarios()).find((s) => s.id === 'hr-heat-time')!;
    const pour = solder(structuredClone(sc.board), 'D1', '1', { hold: 3 });
    const track = solder(structuredClone(sc.board), 'R2', '2', { hold: 3 });
    assert(pour.peak < track.peak - 15, `pour joint ${pour.peak.toFixed(0)} °C, track joint ${track.peak.toFixed(0)} °C`);
    assert(pour.peak < 288, 'at 350 °C the pour joint stays below the textbook\'s 288 °C…');
    const hot = solder(structuredClone(sc.board), 'D1', '1', { hold: 3, temp: 400 });
    assert(hot.peak > pour.peak + 25, `…a hotter station gets it there (${hot.peak.toFixed(0)} °C at 400 °C)`);
    assert(!pour.c.state.cold.length && !track.c.state.cold.length, 'both joints reflow with flux in 3 s');
  }
  {
    // no flux: an oxidised joint usually stays dull; with flux it always wets
    let dull = 0;
    for (let i = 0; i < 8; i++) {
      const b = lone(); b.components[0].state.cold = [0];
      const r = solder(b, 'R1', '1', { hold: 2, flux: false, temp: 400, delay: 3 + i * 7 });
      if (r.c.state.cold.includes(0)) dull++;
    }
    assert(dull >= 2, `without flux a cold joint often stays dull (${dull}/8)`);
    const b = lone(); b.components[0].state.cold = [0];
    assert(!solder(b, 'R1', '1', { hold: 2 }).c.state.cold.length, 'with flux it wets');
  }
  {
    // flux residue: one alcohol scrub over the pad takes it off
    const r = solder(lone(), 'R1', '1', { hold: 2 });
    const b = r.c && r.m.board;
    assert(fluxResidueNear(b, 14.92, 20, 2), 'residue is found at the pad');
    assert(!fluxResidueNear(b, 40, 20, 2), '…and not elsewhere');
    const off = cleanFluxWithIpa(b, 14.92, 20, 2);
    assert(off.length === 1 && off[0] === 'R1.1' && !b.components[0].state.fluxResidue, `IPA washes it off (${off})`);
  }

  // ---- workmanship inspection ----
  {
    const ref = lone();
    const ok = solder(lone(), 'R1', '1', { hold: 2 });
    cleanFluxWithIpa(ok.m.board, 14.92, 20, 3);
    const i1 = inspect(ok.m.board, ref, ok.rw.episodes, ok.rw.log);
    assert(i1.accepted && !i1.findings.length, `clean, quick work is accepted (${JSON.stringify(i1.findings)})`);
    assert(i1.joints.length === 1 && i1.joints[0].peak > 250, 'the inspection lists the joint with its measured numbers');
    const dirty = solder(lone(), 'R1', '1', { hold: 2 });
    const i2 = inspect(dirty.m.board, ref, dirty.rw.episodes, dirty.rw.log);
    assert(!i2.accepted && i2.findings[0].kind === 'flux-residue', 'flux left on the board is rejected (NEETS 3-25)');
    const burnt = solder(lone(), 'R1', '1', { hold: 15 });
    const i3 = inspect(burnt.m.board, ref, burnt.rw.episodes, burnt.rw.log);
    assert(i3.findings.some((f) => f.kind === 'pad-lifted') && i3.findings.some((f) => f.kind === 'long-dwell'), 'a lifted pad is rejected and the long heating noted');
    assert(RULES['long-dwell'].severity === 'note', 'a long heating alone is advice, not a reject');
    const splash = lone();
    addBlob(splash, [30, 30], 'B', 0.75);
    assert(inspect(splash, ref, [], []).findings.some((f) => f.kind === 'loose-solder'), 'solder the board was not designed with is loose solder (NEETS 3-19)');
    // a lesson grades only its own rules
    const l1 = lessonFor('hr-solder-flux')!;
    assert(lessonAccepted(l1, i2), 'lesson 1 (before cleaning is taught) does not grade flux residue');
    assert(!lessonAccepted(lessonFor('hr-clean-inspect'), i2), 'lesson 3 does');
    for (const r of Object.values(RULES)) assert(/^\d-\d+/.test(r.source.page), `${r.kind} cites a page`);
  }

  // ---- the track's boards ----
  const scs = await solderingScenarios();
  assert(scs.map((s) => s.id).join() === SOLDERING_TRACK_IDS.join(), 'the track lists its boards in order');
  for (const sc of scs) {
    assert(sc.alloy === 'sn63', `${sc.id}: tin-lead 63/37, as in the textbook`);
    const good = referenceBoard(sc)!;
    assert(!evaluateObjectives(sc.board, buildConnectivity(sc.board), sc.objectives, 'spice').allPassed, `${sc.id}: broken as shipped`);
    assert(evaluateObjectives(good, buildConnectivity(good), sc.objectives, 'spice').allPassed, `${sc.id}: the reference works`);
    assert(BOARD_INFO[sc.id] && !PATH_ORDER.includes(sc.id), `${sc.id}: in the catalogue, but not on the main path`);
  }
  {
    // lesson 1 played through on the real board: flux and hold each joint, all LEDs light
    const sc = scs[0], b = structuredClone(sc.board);
    for (const [ref, pad] of [['R1', '2'], ['D2', '1'], ['R3', '1']] as const) solder(b, ref, pad, { hold: 2 });
    assert(evaluateObjectives(b, buildConnectivity(b), sc.objectives, 'spice').allPassed, 'lesson 1: three fluxed reflows fix the board');
  }

  // ---- desoldering (NEETS 14 pp. 3-15 – 3-19) ----
  {
    const sc = scs.find((x) => x.id === 'hr-desoldering')!;
    const b = structuredClone(sc.board);
    const m = new ThermalModel(b), rw = new ReworkMonitor(b, m, limitsFor('sn63'));
    const r2 = b.components.find((c) => c.ref === 'R2')!;
    const heat = (pi: number, secs: number, feed = false) => {
      rw.applyFlux(r2.at[0], r2.at[1], 8);
      if (feed) rw.feedSolder(r2, pi);
      m.addSource({ kind: 'iron', x: 0, y: 0, temp: 350, g: IRON_G.flux, pmax: 60, until: m.time + secs, partId: r2.id, pad: pi });
      const ev: ReworkEvent[] = [];
      for (let t = 0; t < secs; t += 0.05) { m.step(0.05); ev.push(...rw.update(0.05)); }
      return ev;
    };
    const cool = () => { for (let t = 0; t < 20; t += 0.1) { m.step(0.1); rw.update(0.1); } };
    assert(heldPads(r2).length === 2, 'a soldered through-hole part is held at every pad');
    assert(rw.extract(r2, 0, 'vacuum').kind === 'not-molten' && !r2.state.holes, 'nothing comes out of a solid joint');
    heat(0, 1.5);
    assert(rw.extract(r2, 0, 'wick').kind === 'wick-surface' && !r2.state.holes, 'wick cannot empty a plated hole');
    heat(0, 1.5);
    assert(rw.extract(r2, 0, 'vacuum').kind === 'extracted' && r2.state.holes?.[0] === 'clear' && r2.state.cold.includes(0), 'continuous vacuum clears the hole, the lead is loose');
    cool();
    heat(1, 1.5);
    rw.extract(r2, 1, 'vacuum');
    assert(heldPads(r2).length === 0, 'both holes clear: the part can come out');
    removePart(r2);
    installPart(r2, { value: 330 });
    r2.state.holes = { 0: 'clear', 1: 'clear' }; r2.state.cold = [0, 1]; // a new part's leads, not yet soldered (the app's leadsUnsoldered)
    cool();
    const dry = heat(0, 2);
    assert(dry.some((e) => e.kind === 'no-solder') && r2.state.holes?.[0] === 'clear', 'heat without fresh solder does not fill an empty hole');
    cool();
    for (const pi of [0, 1]) { const ev = heat(pi, 2, true); assert(ev.some((e) => e.kind === 'filled'), `fresh solder fills hole ${pi}`); cool(); }
    assert(!r2.state.holes && !r2.state.cold.length, `the new part is soldered in (${JSON.stringify(r2.state)})`);
    assert(evaluateObjectives(b, buildConnectivity(b), sc.objectives, 'spice').allPassed, 'desoldering lesson: the replaced R2 lights D2');
  }

  {
    // a manual plunger: a sweat joint stays (and now and then the jolt lifts the pad)
    const sc = scs.find((x) => x.id === 'hr-desoldering')!;
    let sweat = 0, lifts = 0;
    for (let i = 0; i < 12; i++) {
      const b = structuredClone(sc.board), r2 = b.components.find((c) => c.ref === 'R2')!;
      const m = new ThermalModel(b), rw = new ReworkMonitor(b, m, limitsFor('sn63'));
      m.step(1 + i * 0.37);
      m.addSource({ kind: 'iron', x: 0, y: 0, temp: 350, g: IRON_G.flux, pmax: 60, until: m.time + 1.5, partId: r2.id, pad: 0 });
      for (let t = 0; t < 1.5; t += 0.05) { m.step(0.05); rw.update(0.05); }
      const e = rw.extract(r2, 0, 'plunger');
      if (e.kind === 'sweat' && r2.state.holes?.[0] === 'sweat' && heldPads(r2).includes(0)) sweat++;
      if (r2.state.lifted?.includes(0)) lifts++; else assert(!r2.state.cold.includes(0), 'a sweat joint still conducts');
    }
    assert(sweat === 12, 'a plunger always leaves a sweat joint in a plated hole (the part stays held)');
    assert(lifts >= 1 && lifts <= 5, `the plunger's jolt lifts a pad now and then (${lifts}/12)`);
  }

  // ---- thermal shunt (p. 3-23) ----
  {
    const sc = scs.find((x) => x.id === 'hr-thermal-shunt')!;
    const run = (shunt: boolean) => {
      const b = structuredClone(sc.board), q = b.components.find((c) => c.ref === 'Q1')!;
      if (shunt) q.state.shunts = [1, 2];
      const m = new ThermalModel(b), rw = new ReworkMonitor(b, m, limitsFor('sn63'));
      for (const pi of [1, 2]) {
        rw.applyFlux(q.at[0], q.at[1], 6);
        m.addSource({ kind: 'iron', x: 0, y: 0, temp: 350, g: IRON_G.flux, pmax: 60, until: m.time + 3, partId: q.id, pad: pi });
        for (let t = 0; t < 8; t += 0.05) { m.step(0.05); rw.update(0.05); }
      }
      for (const c of b.components) c.state.fluxResidue = undefined; // cleaned
      return { b, q, rw, ins: inspect(b, referenceBoard(sc)!, rw.episodes, rw.log) };
    };
    const bare = run(false), clipped = run(true);
    const peak = (r: typeof bare) => Math.max(...r.ins.joints.map((j) => j.bodyPeak));
    assert(peak(bare) > 100 && peak(clipped) < peak(bare) - 40, `a shunt keeps the transistor body cool (${peak(clipped).toFixed(0)} °C vs ${peak(bare).toFixed(0)} °C)`);
    assert(!bare.q.state.cold.length && !clipped.q.state.cold.length, 'both ways the joints are made');
    const l5 = lessonFor('hr-thermal-shunt')!;
    assert(bare.ins.findings.some((f) => f.kind === 'no-shunt') && !lessonAccepted(l5, bare.ins), 'lesson 5: a transistor lead heated without a shunt fails');
    assert(lessonAccepted(l5, clipped.ins), `lesson 5: with shunts it passes (${JSON.stringify(clipped.ins.findings)})`);
    assert(lessonAccepted(lessonFor('hr-solder-flux'), bare.ins), 'earlier lessons do not grade the shunt');
  }

  // ---- skipping pattern (pp. 3-26, 3-30): neighbouring pins of a multilead part in a row ----
  {
    const k = new Builder(40, 20);
    const u = k.resistor('U1', 1, [20, 10]);
    u.pads = [0, 1, 2, 3, 4, 5].map((i) => ({ name: String(i + 1), at: [i * 2.54 - 6.35, 0] as [number, number], size: [1.6, 1.6] as [number, number], shape: 'circle' as const, layers: 'FB' as const, drill: 0.8 }));
    const ep = (pad: number, t: number) => ({ ref: 'U1', pad, molten: 1, peak: 260, flux: true, t, open: false, shunt: false, bodyPeak: 40 });
    assert(inspect(k.b, k.b, [ep(0, 0), ep(1, 3)], []).findings.some((f) => f.kind === 'skip-pattern'), 'pins 1 then 2: heat builds up');
    assert(!inspect(k.b, k.b, [ep(0, 0), ep(2, 3), ep(4, 6), ep(1, 9), ep(3, 12), ep(5, 15)], []).findings.some((f) => f.kind === 'skip-pattern'), 'pins 1, 3, 5, 2, 4, 6: a skipping pattern');
  }

  {
    // lesson 6 on its board: the same four joints in a row fail, in a skipping pattern they pass
    const sc = scs.find((x) => x.id === 'hr-skipping-pattern')!;
    const play = (order: number[]) => {
      const b = structuredClone(sc.board), rn = b.components.find((c) => c.ref === 'RN1')!;
      const m = new ThermalModel(b), rw = new ReworkMonitor(b, m, limitsFor('sn63'));
      for (const pi of order) {
        rw.applyFlux(rn.at[0], rn.at[1], 14);
        m.addSource({ kind: 'iron', x: 0, y: 0, temp: 350, g: IRON_G.flux, pmax: 60, until: m.time + 2, partId: rn.id, pad: pi });
        for (let t = 0; t < 3; t += 0.05) { m.step(0.05); rw.update(0.05); }
      }
      for (const c of b.components) c.state.fluxResidue = undefined;
      return { b, ins: inspect(b, referenceBoard(sc)!, rw.episodes, rw.log) };
    };
    const l6 = lessonFor('hr-skipping-pattern')!;
    const inRow = play([0, 1, 2, 3]), skipped = play([1, 3, 0, 2]);
    assert(evaluateObjectives(skipped.b, buildConnectivity(skipped.b), sc.objectives, 'spice').allPassed, 'lesson 6: the DIP network lights all four LEDs once its joints are made');
    assert(!lessonAccepted(l6, inRow.ins) && inRow.ins.findings.some((f) => f.kind === 'skip-pattern'), 'lesson 6: pins 1, 2, 3, 4 in a row fail');
    assert(lessonAccepted(l6, skipped.ins), `lesson 6: pins 2, 4, 1, 3 pass (${JSON.stringify(skipped.ins.findings)})`);
  }

  {
    // lesson 7: staples across the crack and the nick pass; a solder bridge or a wire works but fails
    const sc = scs.find((x) => x.id === 'hr-conductor-repair')!;
    const l7 = lessonFor('hr-conductor-repair')!;
    const ref = referenceBoard(sc)!;
    const check = (fix: (b: Board) => void) => {
      const b = structuredClone(sc.board);
      fix(b);
      return { works: evaluateObjectives(b, buildConnectivity(b), sc.objectives, 'spice').allPassed, ins: inspect(b, ref, [], []) };
    };
    assert(check(() => {}).ins.findings.some((f) => f.kind === 'nick'), 'a 50 % nick is a defect even though D2 lights');
    const blob = check((b) => addBlob(b, [37, 11], 'F', 0.75));
    assert(blob.works && !lessonAccepted(l7, blob.ins), 'a solder bridge across the crack works but fails lesson 7');
    const wire = check((b) => { addJumper(b, [34, 11], 'F', [40, 11], 'F'); addJumper(b, [34, 23], 'F', [40, 23], 'F'); });
    assert(wire.works && wire.ins.findings.some((f) => f.kind === 'wire-repair') && !lessonAccepted(l7, wire.ins), 'lap-soldered wires work but fail lesson 7');
    const staple = check((b) => { addJumper(b, [34, 11], 'F', [40, 11], 'F', 'staple'); addJumper(b, [34, 23], 'F', [40, 23], 'F', 'staple'); });
    assert(staple.works && lessonAccepted(l7, staple.ins), `clinched staples across both pass (${JSON.stringify(staple.ins.findings)})`);
    const one = check((b) => addJumper(b, [34, 11], 'F', [40, 11], 'F', 'staple'));
    assert(one.works && !lessonAccepted(l7, one.ins), 'the nick left alone still fails');
  }

  // ---- conformal coating (pp. 3-2 – 3-7, Table 3-1) ----
  {
    const sc = scs.find((x) => x.id === 'hr-conformal-coating')!;
    const l8 = lessonFor('hr-conformal-coating')!;
    const fresh = () => { const b = structuredClone(sc.board); return { b, r2: b.components.find((c) => c.ref === 'R2')! }; };
    {
      const { b, r2 } = fresh();
      assert(!workable(b, r2), 'a coated part cannot be worked on');
      assert(!removeCoating(b, r2, 'ballmill').ok && !removeCoating(b, r2, 'peel').ok, 'methods Table 3-1 does not list for polyurethane do nothing');
      assert(!removeCoating(b, r2, 'solvent').ok, 'solvent only for specific polyurethane compositions (A): not this one');
      const r = removeCoating(b, r2, 'hotair');
      assert(r.ok && r.rank === 1 && r.best === 1 && r.identifies && workable(b, r2), 'hot air jet: first choice for polyurethane, and it identifies the coating');
    }
    {
      const b: Board = structuredClone(sc.board); b.coating = { type: 'epoxy', thick: true };
      const c = b.components[1];
      const r = removeCoating(b, c, 'brush');
      assert(!r.ok && r.why === 'thin-only', 'a rotary brush only takes thin epoxy (C)');
      const m = removeCoating(b, c, 'ballmill');
      assert(m.ok && m.rank === 5 && m.best === 2, `thick epoxy: ball mill works (B) but the thermal parting tool ranks first (best ${m.ok && m.best})`);
    }
    assert(TABLE_3_1.rtv.peel?.rank === 1 && TABLE_3_1.acrylic.solvent?.rank === 1 && TABLE_3_1.parylene.parting?.rank === 1, 'Table 3-1 first choices: peel RTV, solvent on acrylic, thermal parting tool on parylene');
    // a whole repair: method 1, reflow, clean, same coating back
    const repair = (method: 'hotair' | 'brush', back: 'polyurethane' | 'acrylic' | null) => {
      const { b, r2 } = fresh();
      removeCoating(b, r2, method);
      r2.state.cold = [];
      if (back) applyCoating(b, r2, back);
      return { works: evaluateObjectives(b, buildConnectivity(b), sc.objectives, 'spice').allPassed, ins: inspect(b, referenceBoard(sc)!, [], []) };
    };
    const good = repair('hotair', 'polyurethane');
    assert(good.works && lessonAccepted(l8, good.ins), `lesson 8: method 1 and the same coating back pass (${JSON.stringify(good.ins.findings)})`);
    assert(repair('hotair', null).ins.findings.some((f) => f.kind === 'coating-missing'), 'coating left off: rejected');
    assert(repair('hotair', 'acrylic').ins.findings.some((f) => f.kind === 'coating-mismatch'), 'a different coating type: rejected');
    const rough = repair('brush', 'polyurethane');
    assert(rough.ins.findings.some((f) => f.kind === 'coating-method') && !lessonAccepted(l8, rough.ins), 'a rotary brush (3rd choice) when hot air (1st) works: fails lesson 8');
    { const { b, r2 } = fresh(); r2.state.coatCharred = true; assert(inspect(b, referenceBoard(sc)!, [], []).findings.some((f) => f.kind === 'coating-charred'), 'an iron on the coating chars it: rejected'); }
  }

  // ---- ESD (pp. 3-38 – 3-42, Table 3-2) ----
  {
    assert(benchCharge('low') === 6000 && benchCharge('high') === 100 && TABLE_3_2.length === 6, 'Table 3-2: a worker at the bench carries 6,000 V in dry air, 100 V in humid air');
    const sc = scs.find((x) => x.id === 'hr-esd')!;
    const l9 = lessonFor('hr-esd')!;
    const fit = (grounded: boolean, humidity: 'low' | 'high') => {
      const b = structuredClone(sc.board), q = b.components.find((c) => c.ref === 'Q1')!;
      installPart(q);
      const out = handleEsd(q, grounded, humidity);
      return { out, works: evaluateObjectives(b, buildConnectivity(b), sc.objectives, 'spice').allPassed, ins: inspect(b, referenceBoard(sc)!, [], []) };
    };
    const strap = fit(true, 'low');
    assert(strap.out === 'protected' && strap.works && lessonAccepted(l9, strap.ins), 'grounded: the new MOSFET works and the lesson passes');
    const zap = fit(false, 'low');
    assert(zap.out === 'gate-ruptured' && !zap.works && zap.ins.findings.some((f) => f.kind === 'esd-damage'), '6,000 V into a MOSFET (35 V): the gate ruptures, D1 stays dark');
    const humid = fit(false, 'high');
    assert(humid.out === 'gate-ruptured', 'even humid air (100 V) is above a MOSFET\'s 35 V');
    const b = structuredClone(sc.board), led = b.components.find((c) => c.ref === 'D1')!;
    assert(handleEsd(led, false, 'high') === 'safe' && handleEsd(led, false, 'low') === 'latent', 'an LED (a diode, < 3,000 V): safe at 100 V, degraded at 6,000 V without a visible effect');
  }

  // ---- lesson data ----
  assert(LESSONS.length === SOLDERING_TRACK_IDS.length && LESSONS.every((l, i) => l.scenario === SOLDERING_TRACK_IDS[i]), 'one lesson per board, in order');
  for (const l of LESSONS) {
    assert(l.points.length >= 3 && l.original.length >= 1 && l.questions.length >= 1, `${l.scenario}: rules, original text and review questions`);
    assert(l.original.every((p) => p.length > 80 && !/-\s$/.test(p)), `${l.scenario}: whole quoted paragraphs`);
    assert(l.grades.every((g) => g in RULES), `${l.scenario}: grades known rules`);
    if (l.bench) assert(['low', 'high'].includes(l.bench.humidity), `${l.scenario}: bench humidity`);
    assert(['r350', 'r350f', 'r400f'].includes(l.station), `${l.scenario}: a station the bench offers`);
    if (l.figure) assert(existsSync(`${root}public/${l.figure.src}`), `${l.scenario}: figure ${l.figure.src} is in public/`);
    for (const q of l.questions) assert(/^Q\d+$/.test(q.ref) && /^\d-\d+$/.test(q.page) && q.a.length > 2, `${l.scenario} ${q.ref}: numbered, with page and answer`);
  }

  console.log('SOLDERING TESTS PASSED (alloys, copper map, THT joint physics, pour vs track, flux and residue, inspection rules, desoldering: wick / plunger / vacuum + refit, thermal shunt, skipping pattern, track boards, lessons)');
}

await main();
