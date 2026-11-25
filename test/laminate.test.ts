// Burned laminate (src/laminate.ts): the T.O. 00-25-259 11-6.1 – 11-6.4 checks of a surface patch,
// the char's leak, and the Burned Laminate lesson played through: a new part alone leaves the
// damage in the circuit and locks the flag; the full patch passes.
import type { Board, Component } from '../src/types';
import { ThermalModel } from '../src/thermal';
import { IRON_G, ReworkMonitor, heldPads, limitsFor } from '../src/rework';
import { inspect } from '../src/workmanship';
import { applyLeak, charRemoved, excavate, fillBurn, judgeBurn, partsOver, type Burn, type Excavation, type Fill } from '../src/laminate';
import { installPart, removePart } from '../src/ops';
import { solderingScenarios } from '../src/scenarios/soldering';
import { referenceBoard } from '../src/scenarios/reference';
import { buildConnectivity } from '../src/connectivity';
import { evaluateObjectives, verifyScenario } from '../src/verify';
import { lessonFor } from '../src/lessons/neets14';
import { lessonAccepted } from '../src/ui/lesson-ui';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }

const GOOD_EX: Excavation = { depth: 0.75, dia: 5, straight: true, undercut: 0.5, bevel: 1 };
const GOOD_FILL: Fill = { bubbleFree: true, overfill: 0.05, cured: true, leveled: true, buttercoat: true };

async function main() {
  // ---- the checks ----
  const burn = (): Burn => ({ id: 'b', at: [0, 0], r: 2, depth: 0.4 });
  const defects = (b: Burn) => judgeBurn(b).filter((c) => c.verdict === 'defect').map((c) => c.area);
  const empty: Board = { w: 10, h: 10, thickness: 1.6, components: [], traces: [], vias: [], blobs: [], jumpers: [], zones: [], silk: [], texts: [], nextId: 1 };
  assert(defects(burn()).includes('burn'), '11-6.1: an unrepaired burn is a defect');
  { const b = burn(); excavate(empty, b, GOOD_EX); fillBurn(b, GOOD_FILL); assert(judgeBurn(b).every((c) => c.verdict === 'target'), `a textbook surface patch meets every target (${JSON.stringify(judgeBurn(b).filter((c) => c.verdict !== 'target'))})`); }
  { const b = burn(); excavate(empty, b, { ...GOOD_EX, depth: 0.5 }); assert(charRemoved(b) && defects(b).includes('excavation'), '11-6.2: the char is gone, but under 75 % deep is a defect'); }
  { const b = burn(); excavate(empty, b, { ...GOOD_EX, depth: 0.25 }); assert(!charRemoved(b), 'shallower than the char leaves it'); }
  { const b = burn(); excavate(empty, b, { ...GOOD_EX, dia: 3 }); assert(!charRemoved(b), 'narrower than the char leaves it'); }
  { const b = burn(); excavate(empty, b, { ...GOOD_EX, depth: 1 }); assert(defects(b).includes('excavation'), 'through the board: not a surface patch'); }
  { const b = burn(); excavate(empty, b, { ...GOOD_EX, undercut: 0 }); assert(defects(b).includes('excavation'), '11-6.2: no undercut'); }
  { const b = burn(); excavate(empty, b, { ...GOOD_EX, bevel: 0.5 }); assert(defects(b).includes('excavation'), '11-6.2: a bevel under one laminate thickness'); }
  { const b = burn(); excavate(empty, b, { ...GOOD_EX, straight: false }); assert(!defects(b).includes('excavation') && judgeBurn(b).some((c) => c.verdict === 'acceptable'), '11-6.2: walls not straight are acceptable'); }
  { const b = burn(); excavate(empty, b, GOOD_EX); assert(defects(b).includes('fill'), 'an excavation left open'); }
  { const b = burn(); excavate(empty, b, GOOD_EX); fillBurn(b, { ...GOOD_FILL, cured: false }); assert(defects(b).includes('fill') && defects(b).includes('buttercoat'), '11-6.3 / 11-6.4: uncured epoxy'); }
  { const b = burn(); excavate(empty, b, GOOD_EX); fillBurn(b, { ...GOOD_FILL, overfill: 0 }); assert(defects(b).includes('fill'), '11-6.3: no overfill, so the fill sits below the surface'); }
  { const b = burn(); excavate(empty, b, GOOD_EX); fillBurn(b, { ...GOOD_FILL, bubbleFree: false }); assert(defects(b).includes('fill'), '11-6.3: voids'); }
  { const b = burn(); excavate(empty, b, GOOD_EX); fillBurn(b, { ...GOOD_FILL, buttercoat: false }); assert(defects(b).includes('buttercoat'), '11-6.4: no buttercoat'); }

  // ---- the lesson board ----
  const scs = await solderingScenarios();
  const sc = scs.find((x) => x.id === 'hr-laminate')!, lesson = lessonFor('hr-laminate')!, ref = referenceBoard(sc)!;
  assert(sc.board.burns?.length === 1 && !ref.burns?.length, 'the burn is the damage: the good board has none');
  const r2Of = (b: Board) => b.components.find((c) => c.ref === 'R2')!;
  assert(r2Of(sc.board).state.leak?.ohms === 4700 && r2Of(sc.board).state.burnt, 'R2 burned open over charred laminate that leaks');
  assert(!evaluateObjectives(sc.board, buildConnectivity(sc.board), sc.objectives, 'spice').allPassed, 'D2 starts dark');
  assert(partsOver(sc.board, sc.board.burns![0]).some((c) => c.ref === 'R2'), 'R2 sits over the burn');

  const play = (repair: (b: Board, burn: Burn) => void) => {
    const b: Board = structuredClone(sc.board), r2 = r2Of(b);
    const m = new ThermalModel(b), rw = new ReworkMonitor(b, m, limitsFor('sn63'));
    const heat = (c: Component, pi: number, s: number, feed = false) => {
      rw.applyFlux(c.at[0], c.at[1], 8);
      if (feed) rw.feedSolder(c, pi);
      m.addSource({ kind: 'iron', x: 0, y: 0, temp: 371, g: IRON_G.flux, pmax: 60, until: m.time + s, partId: c.id, pad: pi });
      for (let t = 0; t < s; t += 0.05) { m.step(0.05); rw.update(0.05); }
    };
    const cool = () => { for (let t = 0; t < 4; t += 0.1) { m.step(0.1); rw.update(0.1); } };
    for (const pi of [0, 1]) { heat(r2, pi, 1.2); rw.extract(r2, pi, 'vacuum'); cool(); }
    assert(heldPads(r2).length === 0, 'R2 holes clear');
    removePart(r2);
    assert(partsOver(b, b.burns![0]).length === 0, 'nothing over the burn now');
    repair(b, b.burns![0]);
    installPart(r2, { value: 330 });
    for (const x of b.burns ?? []) if (x.comp === r2.id) applyLeak(b, x); // what the bench does on a fit
    r2.state.holes = { 0: 'clear', 1: 'clear' }; r2.state.cold = [0, 1];
    for (const pi of [0, 1]) { heat(r2, pi, 1.5, true); cool(); }
    for (const c of b.components) c.state.fluxResidue = undefined;
    return { b, ins: inspect(b, ref, rw.episodes, rw.log) };
  };
  const good = play((b, x) => { excavate(b, x, GOOD_EX); fillBurn(x, GOOD_FILL); });
  assert(evaluateObjectives(good.b, buildConnectivity(good.b), sc.objectives, 'spice').allPassed, 'patched and refitted: both LEDs light');
  assert(!r2Of(good.b).state.leak, 'the leak went with the char');
  assert((await verifyScenario(sc, good.b, 'spice')).flag, 'the flag unlocks');
  assert(lessonAccepted(lesson, good.ins), `the textbook patch passes (${JSON.stringify(good.ins.findings)})`);

  const partOnly = play(() => {});
  assert(r2Of(partOnly.b).state.leak?.ohms === 4700, 'a new R2 over the char: the char still leaks across it');
  assert(!(await verifyScenario(sc, partOnly.b, 'spice')).flag, 'no flag while the char is in the circuit');
  assert(!lessonAccepted(lesson, partOnly.ins) && partOnly.ins.findings.some((f) => f.kind === 'laminate-burn'), 'and the burn fails inspection');

  const shallow = play((b, x) => { excavate(b, x, { ...GOOD_EX, dia: 3 }); fillBurn(x, GOOD_FILL); });
  assert(r2Of(shallow.b).state.leak && !lessonAccepted(lesson, shallow.ins), 'too narrow: char left, still leaking, fails');

  console.log('LAMINATE TESTS PASSED (11-6.1 – 11-6.4 checks, the char\'s leak, the surface patch lesson played through)');
}

await main();
