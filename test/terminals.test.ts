// Wires on terminals (src/terminals.ts): the T.O. 00-25-259 workmanship checks for stripping,
// tinning, insulation clearance, forming and soldering on turret, hook, pierced tab and solder cup
// terminals; the rework model soldering a wire; and the three lesson boards played through.
import type { Board, Component } from '../src/types';
import { ThermalModel } from '../src/thermal';
import { IRON_G, ReworkMonitor, limitsFor } from '../src/rework';
import { inspect } from '../src/workmanship';
import { TERM_GEOM, WIRE, addWire, endsAt, form, judge, targetEnd, targetStrip, terminalType, type TerminalType, type WireEnd, type WirePrep } from '../src/terminals';
import { solderingScenarios } from '../src/scenarios/soldering';
import { referenceBoard } from '../src/scenarios/reference';
import { buildConnectivity } from '../src/connectivity';
import { evaluateObjectives } from '../src/verify';
import { lessonFor } from '../src/lessons/neets14';
import { lessonAccepted } from '../src/ui/lesson-ui';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }

const GOOD: WirePrep = { stripper: 'thermal', strip: 8, tinned: true, gap: WIRE.od, wrap: 180, flush: true, hook: 'arc', eye: true };
const end = (type: TerminalType, p: Partial<WirePrep> = {}, soldered: WireEnd['soldered'] = 'ok'): WireEnd => ({ ...GOOD, strip: type === 'cup' ? 4 : 8, ...p, type, comp: 'x', pad: 0, soldered });
const verdicts = (e: WireEnd) => judge(e).filter((c) => c.verdict === 'defect').map((c) => c.area);

async function main() {
  // ---- the wire and the geometry ----
  assert(WIRE.cond === 0.76 && WIRE.od === 1.32 && WIRE.strands === 19, 'M22759/16-22: 19 × AWG 34, .030 in conductor, .052 in over the insulation');
  assert(Math.abs(targetStrip('turret') - (WIRE.od + Math.PI * (TERM_GEOM.turretPost + WIRE.cond) / 2)) < 1e-9, 'a turret end needs one diameter of clearance plus half a turn round the post');
  assert(Math.abs(targetStrip('cup') - (TERM_GEOM.cupDepth + WIRE.od)) < 1e-9, 'a cup needs its depth plus one diameter above the rim');

  // ---- the T.O.'s checks ----
  for (const type of ['turret', 'hook', 'tab', 'cup'] as const) {
    assert(judge(end(type)).every((c) => c.verdict === 'target'), `${type}: a textbook end meets every target (${JSON.stringify(judge(end(type)).filter((c) => c.verdict !== 'target'))})`);
  }
  assert(verdicts(end('turret', { stripper: 'mechanical' })).includes('strip'), '08-5.3: no mechanical strippers on AWG 22');
  assert(verdicts(end('turret', { tinned: false })).includes('tinning'), '08-6.3: stranded wire is tinned');
  assert(verdicts(end('turret', { gap: 0 })).includes('clearance'), '08-6.4: insulation against the terminal is a defect');
  assert(verdicts(end('turret', { gap: 3 })).includes('clearance'), '08-6.4: more than two diameters is a defect');
  assert(judge(end('turret', { gap: 2.5 })).find((c) => c.area === 'clearance')!.verdict === 'acceptable', '08-6.4: up to two diameters is acceptable');
  assert(verdicts(end('turret', { wrap: 90 })).includes('forming'), '08-6.5: under 180° on a turret is a defect');
  assert(judge(end('turret', { wrap: 270 })).filter((c) => c.area === 'forming').every((c) => c.verdict !== 'defect'), '08-6.5: over 180° without overlapping is acceptable');
  assert(verdicts(end('turret', { wrap: 360, strip: 12 })).includes('forming'), '08-6.5: a wire overlapping itself is a defect');
  const short = form({ ...GOOD, strip: 3 }, 'turret');
  assert(short.contact < 180, `too short a strip cannot make the half turn (${short.contact.toFixed(0)}°)`);
  assert(verdicts(end('turret', { flush: false, strip: 10 })).includes('forming'), '08-6.5: a long cut end is a defect');
  const tail = form({ ...GOOD, flush: false, strip: targetStrip('turret') + 0.5 }, 'turret').tail;
  assert(tail > 0.4 && tail < WIRE.cond && judge(end('turret', { flush: false, strip: targetStrip('turret') + 0.5 })).every((c) => c.verdict !== 'defect'), '08-6.5: a cut end within one wire diameter is acceptable');
  assert(verdicts(end('hook', { hook: 'base' })).includes('forming') && verdicts(end('hook', { hook: 'tip' })).includes('forming'), '08-6.6: in the arc of the hook, not at its base or tip');
  assert(judge(end('tab', { wrap: 90 })).filter((c) => c.area === 'forming').every((c) => c.verdict !== 'defect'), '08-6.7: 90° on a pierced tab is acceptable');
  assert(verdicts(end('tab', { eye: false })).includes('forming'), '08-6.7: the wire passes through the eye');
  assert(verdicts(end('cup', { strip: 2 })).includes('forming') && verdicts(end('cup', { strip: 2 })).includes('clearance'), '09-6.1: too short for the cup: not full depth, insulation in the fillet');
  assert(verdicts(end('cup', { strip: 7 })).includes('clearance'), '09-6.1: over two diameters above the rim');
  assert(verdicts(end('turret', {}, 'starved')).includes('solder') && verdicts(end('cup', {}, 'starved')).includes('solder'), '08-6.12 / 09-6.1: no solder added is a starved fillet, an unfilled cup');
  assert(verdicts({ ...end('turret'), soldered: undefined }).includes('solder'), 'an end that was never soldered');
  // more than one wire on a terminal (08-6.5 – 08-6.7): judged against the wires installed before it
  const multi = (type: TerminalType, p: Partial<WirePrep>, first: Partial<WirePrep> = {}) => judge(end(type, p), [end(type, first)]);
  const worst = (cs: ReturnType<typeof judge>) => (cs.some((c) => c.verdict === 'defect') ? 'defect' : cs.some((c) => c.verdict === 'acceptable') ? 'acceptable' : 'target');
  assert(worst(multi('turret', { seat: 'close' })) === 'target', '08-6.5: the next wire against the first, down at the base, is the target');
  assert(worst(multi('turret', { seat: 'apart' })) === 'acceptable', '08-6.5: not touching the wire installed before it is acceptable');
  assert(multi('turret', { seat: 'over' }).some((c) => c.verdict === 'defect' && c.area === 'forming'), '08-6.5: wires crossing over or overlapping are a defect');
  for (const type of ['hook', 'tab'] as const) {
    assert(worst(multi(type, { dir: 'ccw' }, { dir: 'cw' })) === 'target', `${type}: wires in alternating directions are the target`);
    assert(worst(multi(type, { dir: 'cw' }, { dir: 'cw' })) === 'acceptable', `${type}: the same direction is only acceptable`);
    assert(multi(type, { dir: 'ccw', seat: 'over' }, { dir: 'cw' }).some((c) => c.verdict === 'defect' && c.area === 'forming'), `${type}: overlapping wires are a defect`);
  }
  assert(judge(end('turret', { seat: 'over' })).every((c) => c.verdict === 'target'), 'the first wire on a terminal has nothing to cross');
  assert(judge(end('cup'), [end('cup')]).every((c) => c.verdict === 'target'), 'no multiple-wire forming rules in a solder cup');

  const scs = await solderingScenarios();

  // ---- a wire conducts only once soldered; the iron with fresh solder makes the fillet ----
  const play = (id: string, prep: (type: TerminalType, nth: number) => WirePrep, feed: boolean) => {
    const sc = scs.find((x) => x.id === id)!;
    const b: Board = structuredClone(sc.board);
    const terms = b.components.filter((c) => terminalType(c));
    const ref = referenceBoard(sc)!;
    const ok = () => evaluateObjectives(b, buildConnectivity(b), sc.objectives, 'fast').allPassed;
    assert(!ok(), `${id}: starts broken`);
    // the wires the good board has, between the same terminals
    for (const j of ref.jumpers) {
      const [a, z] = j.ends!.map((e) => b.components.find((c) => c.id === e.comp)!) as [Component, Component];
      addWire(b, a, prep(terminalType(a)!, endsAt(b, a, 0).length), z, prep(terminalType(z)!, endsAt(b, z, 0).length));
    }
    assert(!ok(), `${id}: wires formed but not soldered do not conduct`);
    const m = new ThermalModel(b), rw = new ReworkMonitor(b, m, limitsFor('sn63'));
    for (const c of terms) {
      rw.applyFlux(c.at[0], c.at[1], 3);
      if (feed) rw.feedSolder(c, 0);
      m.addSource({ kind: 'iron', x: 0, y: 0, temp: 316, g: IRON_G.flux, pmax: 60, until: m.time + 2, partId: c.id, pad: 0 });
      for (let t = 0; t < 2; t += 0.05) { m.step(0.05); rw.update(0.05); }
      for (let t = 0; t < 4; t += 0.1) { m.step(0.1); rw.update(0.1); }
      assert(endsAt(b, c, 0).every(({ j, end: k }) => j.ends![k].soldered === (feed ? 'ok' : 'starved')), `${id} ${c.ref}: every wire on it soldered (${feed ? 'fresh solder' : 'starved'})`);
    }
    assert(ok(), `${id}: works once the wires are soldered`);
    for (const c of b.components) c.state.fluxResidue = undefined; // cleaned with alcohol
    return { b, sc, ins: inspect(b, ref, rw.episodes, rw.log), rw };
  };
  for (const id of ['hr-turret', 'hr-hook-tab', 'hr-solder-cup']) {
    const lesson = lessonFor(id)!;
    const good = play(id, (type, nth) => ({ ...targetEnd({ id: 'x' } as Component, type, nth) }), true);
    assert(lessonAccepted(lesson, good.ins), `${id}: textbook wires pass (${JSON.stringify(good.ins.findings)})`);
    assert(good.ins.wires.length === good.b.jumpers.length * 2, `${id}: every end is in the inspection record`);
    assert(good.ins.findings.every((f) => !f.kind.startsWith('wire-')), `${id}: no wire findings`);
    assert(!good.ins.findings.some((f) => f.kind === 'part-overheated'), `${id}: a brass terminal does not "burn"`);
    const starved = play(id, (type) => ({ ...targetEnd({ id: 'x' } as Component, type) }), false);
    assert(!lessonAccepted(lesson, starved.ins) && starved.ins.findings.some((f) => f.kind === 'wire-solder'), `${id}: no solder added fails`);
    const sloppy = play(id, () => ({ ...START, strip: 4 }), true);
    assert(!lessonAccepted(lesson, sloppy.ins), `${id}: an untinned, short, unformed wire fails`);
    const crossed = play(id, (type, nth) => ({ ...targetEnd({ id: 'x' } as Component, type, nth), seat: nth ? 'over' : 'close' }), true);
    assert(!lessonAccepted(lesson, crossed.ins) && crossed.ins.findings.some((f) => f.kind === 'wire-forming' && /\(2\)/.test(f.where)), `${id}: a second wire across the first fails (${JSON.stringify(crossed.ins.findings)})`);
  }
  {
    // two wires on turret E2 soldered in separate heats: the second heat reflows the first joint (T.O. 08-5.7 step 19)
    const sc = scs.find((x) => x.id === 'hr-turret')!;
    const b: Board = structuredClone(sc.board), m = new ThermalModel(b), rw = new ReworkMonitor(b, m, limitsFor('sn63'));
    const term = (ref: string) => b.components.find((c) => c.ref === ref)!;
    const heat = (c: Component) => {
      rw.applyFlux(c.at[0], c.at[1], 3); rw.feedSolder(c, 0);
      m.addSource({ kind: 'iron', x: 0, y: 0, temp: 316, g: IRON_G.flux, pmax: 60, until: m.time + 2, partId: c.id, pad: 0 });
      for (let t = 0; t < 2; t += 0.05) { m.step(0.05); rw.update(0.05); }
      for (let t = 0; t < 8; t += 0.1) { m.step(0.1); rw.update(0.1); }
    };
    const [e1, e2, e3] = ['E1', 'E2', 'E3'].map(term);
    addWire(b, e1, targetEnd(e1, 'turret'), e2, targetEnd(e2, 'turret'));
    heat(e1); heat(e2);
    for (let t = 0; t < 40; t += 0.2) { m.step(0.2); rw.update(0.2); } // E2 freezes: the next heat is a separate one
    assert(m.jointTemp(e2, 0) < 150, `E2 has cooled (${m.jointTemp(e2, 0).toFixed(0)} °C)`);
    addWire(b, e2, targetEnd(e2, 'turret', 1), e3, targetEnd(e3, terminalType(e3)!));
    heat(e2); heat(e3);
    for (const c of b.components) c.state.fluxResidue = undefined;
    const ins = inspect(b, referenceBoard(sc)!, rw.episodes, rw.log);
    assert(ins.findings.some((f) => f.kind === 'wire-heats' && f.where === 'E2') && !lessonAccepted(lessonFor('hr-turret')!, ins), `E2's wires soldered in two heats: caught (${JSON.stringify(ins.findings)})`);
  }
  // the lesson boards: terminals on both ends of every wire of the good board
  for (const id of ['hr-turret', 'hr-hook-tab', 'hr-solder-cup']) {
    const sc = scs.find((x) => x.id === id)!;
    const ref = referenceBoard(sc)!;
    assert(ref.jumpers.length === 2 && ref.jumpers.every((j) => j.kind === 'wire' && j.ends!.every((e) => e.soldered === 'ok')), `${id}: the good board has its two wires`);
    assert(sc.board.jumpers.length === 0, `${id}: the lesson takes them away`);
  }

  console.log('TERMINAL TESTS PASSED (wire spec, T.O. 08-6 / 09-6 checks, multiple wires, soldering a wire, three lesson boards)');
}

const START: WirePrep = { stripper: 'thermal', strip: 4, tinned: false, gap: 0.5, wrap: 90, flush: false, hook: 'arc', eye: true, dir: 'cw', seat: 'apart' };

await main();
