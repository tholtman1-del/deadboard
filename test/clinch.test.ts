// Clinched leads (src/clinch.ts): the T.O. 00-25-259 checks for semi and full clinches, freeing a
// clinched lead in the manual's order (wick, break the sweat joint, straighten, extract), and the
// Clinched Leads lesson played through: done right it passes, shortcuts fail.
import type { Board, Component } from '../src/types';
import { ThermalModel } from '../src/thermal';
import { IRON_G, ReworkMonitor, heldPads, limitsFor } from '../src/rework';
import { inspect } from '../src/workmanship';
import { clinchFitted, conductorDir, judgeClinch, straighten, terminationOf } from '../src/clinch';
import { installPart, removePart } from '../src/ops';
import { solderingScenarios } from '../src/scenarios/soldering';
import { referenceBoard } from '../src/scenarios/reference';
import { buildConnectivity } from '../src/connectivity';
import { evaluateObjectives } from '../src/verify';
import { lessonFor } from '../src/lessons/neets14';
import { lessonAccepted } from '../src/ui/lesson-ui';
import { Builder } from '../src/scenarios/builder';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }

async function main() {
  // ---- the checks (07-6.17 / 07-6.18) ----
  {
    const k = new Builder(30, 20);
    const r = k.resistor('R1', 330, [15, 10]);
    k.track('B', [k.pad(r, '1'), [2, 10]], 0.8, 'A'); // pad 1 has a run on the solder side, pad 2 is isolated there
    const v = (pi: number) => judgeClinch(k.b, r, pi).map((c) => c.verdict);
    assert(conductorDir(k.b, r, 0) && !conductorDir(k.b, r, 1), 'pad 1 has a conductor on the lead side, pad 2 none');
    clinchFitted(r, 'full', 1, true);
    assert(v(0).every((x) => x === 'target'), 'full clinch, one pad diameter, along the run: target');
    assert(v(1).includes('defect'), 'a full clinch on an isolated pad is a defect');
    clinchFitted(r, 'semi', 1, true);
    assert(!v(1).includes('defect'), 'a semi-clinch on an isolated pad is fine');
    clinchFitted(r, 'full', 0.25, true);
    assert(v(0).includes('defect'), 'shorter than one pad radius');
    clinchFitted(r, 'full', 3, true);
    assert(v(0).includes('defect'), 'longer than two pad diameters');
    clinchFitted(r, 'full', 2, true);
    assert(v(0).includes('acceptable') && !v(0).includes('defect'), 'two pad diameters along the run: acceptable');
    clinchFitted(r, 'full', 1, false);
    assert(v(0).includes('defect'), 'a full clinch across the run extends past the pad');
    clinchFitted(r, 'semi', 1, false);
    assert(!v(0).includes('defect') && v(0).includes('acceptable'), 'a semi-clinch not along the run: acceptable');
    clinchFitted(r, 'straight', 1, true);
    assert(!r.state.clinch && terminationOf(r) === 'straight', 'straight-through: no clinch');
  }

  const scs = await solderingScenarios();
  const sc = scs.find((x) => x.id === 'hr-clinched-leads')!, lesson = lessonFor('hr-clinched-leads')!, ref = referenceBoard(sc)!;
  assert(ref.components.filter((c) => c.kind === 'resistor').every((c) => terminationOf(c) === 'full'), 'the resistors were fitted with full clinches');
  assert(ref.components.filter((c) => c.kind === 'resistor').every((c) => [0, 1].every((pi) => judgeClinch(ref, c, pi).every((k) => k.verdict === 'target'))), "the factory's clinches meet the target");

  const bench = () => {
    const b: Board = structuredClone(sc.board), r2 = b.components.find((c) => c.ref === 'R2')!;
    const m = new ThermalModel(b), rw = new ReworkMonitor(b, m, limitsFor('sn63'));
    const heat = (c: Component, pi: number, s: number, feed = false) => {
      rw.applyFlux(c.at[0], c.at[1], 6);
      if (feed) rw.feedSolder(c, pi);
      m.addSource({ kind: 'iron', x: 0, y: 0, temp: 371, g: IRON_G.flux, pmax: 60, until: m.time + s, partId: c.id, pad: pi });
      for (let t = 0; t < s; t += 0.05) { m.step(0.05); rw.update(0.05); }
    };
    const cool = () => { for (let t = 0; t < 4; t += 0.1) { m.step(0.1); rw.update(0.1); } };
    return { b, r2, m, rw, heat, cool };
  };

  // ---- shortcuts the manual forbids ----
  {
    const { r2, rw, heat } = bench();
    heat(r2, 0, 1.2);
    assert(rw.extract(r2, 0, 'vacuum').kind === 'clinched' && heldPads(r2).includes(0), 'the extractor tip cannot clear a clinched lead');
    assert(straighten(r2, 1) === 'tore' && r2.state.lifted?.includes(1), 'straightening a lead still soldered over its pad tears the pad off');
  }

  // ---- the manual's way ----
  const play = (refit: (c: Component) => void) => {
    const { b, r2, rw, heat, cool } = bench();
    for (const pi of [0, 1]) {
      heat(r2, pi, 1.2);
      assert(rw.extract(r2, pi, 'wick').kind === 'wick-surface' && r2.state.surfaceWicked?.includes(pi), `R2 pad ${pi}: the wick takes the surface solder`);
      cool();
      assert(straighten(r2, pi) === 'freed' && !r2.state.lifted?.includes(pi), `R2 pad ${pi}: sweat joint broken, lead straightened, pad intact`);
      heat(r2, pi, 1.2);
      assert(rw.extract(r2, pi, 'vacuum').kind === 'extracted', `R2 pad ${pi}: the straight lead's hole clears`);
      cool();
    }
    assert(heldPads(r2).length === 0, 'both holes clear');
    removePart(r2);
    installPart(r2, { value: 330 });
    refit(r2);
    r2.state.holes = { 0: 'clear', 1: 'clear' }; r2.state.cold = [0, 1];
    for (const pi of [0, 1]) { heat(r2, pi, 1.5, true); cool(); }
    for (const c of b.components) c.state.fluxResidue = undefined;
    assert(evaluateObjectives(b, buildConnectivity(b), sc.objectives, 'fast').allPassed, `the board works (${JSON.stringify(r2.state)})`);
    const fills = Object.values(r2.state.solderFill ?? {});
    assert(fills.length === 2 && fills.every((v) => v >= 1 && v <= 2), `both new joints filled within limits (${fills.map((v) => v.toFixed(2)).join(', ')})`);
    return inspect(b, ref, rw.episodes, rw.log);
  };
  const good = play((c) => clinchFitted(c, 'full', 1, true));
  assert(lessonAccepted(lesson, good), `refitted with a full clinch along the runs: accepted (${JSON.stringify(good.findings)})`);
  const straight = play((c) => clinchFitted(c, 'straight', 1, true));
  assert(!lessonAccepted(lesson, straight) && straight.findings.some((f) => f.kind === 'termination-style'), 'refitted straight-through: not like the original');
  const across = play((c) => clinchFitted(c, 'full', 1, false));
  assert(!lessonAccepted(lesson, across) && across.findings.some((f) => f.kind === 'clinch'), 'clinched across the runs: past the pad');

  console.log('CLINCH TESTS PASSED (07-6.17 / 07-6.18 checks, forbidden shortcuts, freeing a clinched lead, refit like the original)');
}

await main();
