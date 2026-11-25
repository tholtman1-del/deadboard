// Flat packs (src/flatpack.ts): point-to-point removal (heat a lead, lift it when its solder is
// completely molten), lead forming checks (T.O. 00-25-259 18-6.6), and the Flat Packs lesson played
// through: formed leads lap-soldered in a skipping pattern pass; unformed or overhanging leads fail.
import type { Board } from '../src/types';
import { ThermalModel } from '../src/thermal';
import { IRON_G, ReworkMonitor, limitsFor } from '../src/rework';
import { inspect } from '../src/workmanship';
import { FP_PRETIN, allLifted, judgeLeadForm, liftLead, type LeadForm } from '../src/flatpack';
import { installPart, removePart } from '../src/ops';
import { solderingScenarios } from '../src/scenarios/soldering';
import { referenceBoard } from '../src/scenarios/reference';
import { buildConnectivity } from '../src/connectivity';
import { evaluateObjectives, verifyScenario } from '../src/verify';
import { lessonFor } from '../src/lessons/neets14';
import { lessonAccepted } from '../src/ui/lesson-ui';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }

async function main() {
  // ---- lead forming (18-6.6) ----
  const v = (f: LeadForm) => judgeLeadForm(f).map((x) => x.verdict);
  assert(v({ formed: true, len: 0.65 }).every((x) => x === 'target'), '50–80 % of the land: target');
  assert(v({ formed: true, len: 0.35 }).includes('acceptable') && !v({ formed: true, len: 0.35 }).includes('defect'), 'shorter but over the lead width: acceptable');
  assert(v({ formed: true, len: 0.15 }).includes('defect'), 'shorter than the lead width: defect');
  assert(v({ formed: true, len: 1.1 }).includes('defect'), 'the toe overhangs the land: defect');
  assert(v({ formed: false, len: 0.65 }).includes('defect'), 'leads not formed: defect');

  const scs = await solderingScenarios();
  const sc = scs.find((x) => x.id === 'hr-flat-pack')!, lesson = lessonFor('hr-flat-pack')!, ref = referenceBoard(sc)!;
  assert(!evaluateObjectives(sc.board, buildConnectivity(sc.board), sc.objectives, 'spice').allPassed, 'all dark to start');
  // alternate the rows: never two neighbouring leads in a row (1.27 mm pitch: a row's neighbours are too close)
  const order = [0, 5, 1, 6, 2, 7, 3, 8, 4, 9];

  const bench = () => {
    const b: Board = structuredClone(sc.board), fp = b.components.find((c) => c.ref === 'FP1')!;
    const m = new ThermalModel(b), rw = new ReworkMonitor(b, m, limitsFor('sn63'));
    const at = (pi: number) => [fp.at[0] + fp.pads[pi].at[0], fp.at[1] + fp.pads[pi].at[1]] as const;
    const run = (s: number) => { for (let t = 0; t < s; t += 0.05) { m.step(0.05); rw.update(0.05); } };
    /** The tip on a lead for `hold` s (fresh solder fed if `feed`); `lift` at the end, still under the tip. */
    const iron = (pi: number, hold: number, opts: { feed?: boolean; lift?: boolean } = {}) => {
      const [x, y] = at(pi);
      rw.applyFlux(x, y, 1);
      if (opts.feed) rw.feedSolder(fp, pi);
      const src = { kind: 'iron' as const, x, y, temp: 316, g: IRON_G.flux, pmax: 60, until: m.time + hold + 1, partId: fp.id, pad: pi };
      m.addSource(src);
      run(hold);
      const r = opts.lift ? liftLead(fp, pi, m.jointTemp(fp, pi) >= rw.limits.alloy.liquidus) : undefined;
      src.until = m.time;
      run(2.5);
      return r;
    };
    return { b, fp, m, rw, iron };
  };

  // ---- lifting a lead whose solder is not completely molten tears the land ----
  {
    const { fp } = bench();
    assert(liftLead(fp, 0, false) === 'damaged' && fp.state.lifted?.includes(0), 'lifted cold: the land comes off with the lead');
  }

  const play = (form: LeadForm) => {
    const { b, fp, rw, iron } = bench();
    for (const pi of order) assert(iron(pi, 0.8, { lift: true }) === 'lifted', `lead ${pi + 1}: lifted off a molten joint`);
    assert(allLifted(fp) && !fp.state.lifted?.length, 'every lead off, no land damaged');
    removePart(fp); installPart(fp);
    // what the bench does on a fit: the prepared leads on pretinned lands, every joint still to make
    fp.state.leadForm = { ...form };
    fp.state.cold = fp.pads.map((_, i) => i);
    fp.state.solderFill = Object.fromEntries(fp.pads.map((_, i) => [i, FP_PRETIN]));
    for (const pi of order) iron(pi, 1.2, { feed: true });
    for (const c of b.components) c.state.fluxResidue = undefined;
    return { b, fp, ins: inspect(b, ref, rw.episodes, rw.log) };
  };
  const good = play({ formed: true, len: 0.65 });
  assert(evaluateObjectives(good.b, buildConnectivity(good.b), sc.objectives, 'spice').allPassed, `the new flat pack lights all four LEDs (cold: ${good.fp.state.cold})`);
  assert((await verifyScenario(sc, good.b, 'spice')).flag, 'the flag unlocks');
  assert(lessonAccepted(lesson, good.ins), `formed, trimmed, lap-soldered in a skipping pattern: accepted (${JSON.stringify(good.ins.findings)})`);

  const raw = play({ formed: false, len: 0.65 });
  assert(raw.fp.state.cold.length === 10 && !evaluateObjectives(raw.b, buildConnectivity(raw.b), sc.objectives, 'spice').allPassed, 'unformed leads do not lie on the lands: nothing joins');
  assert(raw.ins.findings.some((f) => f.kind === 'flatpack-leads'), 'unformed leads fail inspection');
  const long = play({ formed: true, len: 1.1 });
  assert(!lessonAccepted(lesson, long.ins) && long.ins.findings.some((f) => f.kind === 'flatpack-leads'), 'toes over the land edge fail');

  console.log('FLAT PACK TESTS PASSED (18-6.6 lead forming, lifting molten vs cold leads, the lesson played through)');
}

await main();
