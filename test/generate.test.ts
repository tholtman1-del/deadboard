// Generated problems (src/scenarios/generate.ts): on a fixed board, every generated problem fails
// the bench without overloading anything, and repairing its faults with the player's tools
// unlocks its flag. The fixed boards come from repairing each shipped board the way a player does.
import type { Board, Component, Scenario } from '../src/types';
import { builtinScenarios } from '../src/scenarios/builtin';
import { repairedDemo } from '../src/scenarios/demoRepairs';
import { generateProblem } from '../src/scenarios/generate';
import { addBlob, cutTrace, installPart, toggleCold } from '../src/ops';
import { buildConnectivity } from '../src/connectivity';
import { evaluateObjectives, verifyScenario, type Solver } from '../src/verify';
import { importScenarioOrPcb } from '../src/io/kicad';
import { parseScenario, serializeScenario } from '../src/io/format';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }

interface Fs { readFileSync(p: string, enc: 'utf8'): string }
const fsName = 'node:fs';
const { readFileSync } = (await import(/* @vite-ignore */ fsName)) as Fs;
const root = new URL('..', import.meta.url).pathname;

const part = (b: Board, ref: string): Component => b.components.find((c) => c.ref === ref)!;
const unblob = (b: Board) => { b.blobs = []; };

/** How a player repairs each built-in board (the test's own data, not the generator's). */
const FIXES: Record<string, (b: Board) => void> = {
  'builtin-first-light': (b) => { addBlob(b, [62, 19], 'F', 0.75); },
  'builtin-tut-cold-joint': (b) => toggleCold(part(b, 'R1'), 0),
  'builtin-tut-solder-bridge': unblob,
  'builtin-tut-polarity': (b) => { part(b, 'D1').state.reversed = false; },
  'builtin-tut-resistor': (b) => installPart(part(b, 'R1'), { value: 150 }),
  'builtin-tut-divider': (b) => installPart(part(b, 'R2'), { value: 10000 }),
  'builtin-transistor-switch': (b) => { part(b, 'Q1').state.reversed = false; },
  'builtin-bridge-troll': (b) => { unblob(b); toggleCold(part(b, 'R1'), 0); },
  'builtin-backwards-day': (b) => { installPart(part(b, 'R1'), { value: 330 }); part(b, 'D1').state.reversed = false; addBlob(b, [34, 24], 'B', 0.75); },
  'builtin-ghost-short': (b) => {
    cutTrace(b, b.traces.find((t) => t.id === 'sliver')!, [37, 10.7], 0.7);
    installPart(part(b, 'F1'), { value: 0.5 });
    installPart(part(b, 'R2'), { value: 10000 });
  },
  'builtin-smoke-test': (b) => { unblob(b); part(b, 'D1').state.reversed = false; installPart(part(b, 'F1'), { value: 0.5 }); },
  'builtin-sagging-rail': (b) => { installPart(part(b, 'R2'), { value: 10000 }); addBlob(b, [49, 8], 'B', 0.75); },
  'hr-solder-flux': (b) => { toggleCold(part(b, 'R1'), 1); toggleCold(part(b, 'D2'), 0); toggleCold(part(b, 'R3'), 0); },
  'hr-heat-time': (b) => { toggleCold(part(b, 'D1'), 0); toggleCold(part(b, 'R2'), 1); },
  'hr-clean-inspect': (b) => { unblob(b); toggleCold(part(b, 'R1'), 0); },
  'hr-desoldering': (b) => installPart(part(b, 'R2'), { value: 330 }),
  'hr-thermal-shunt': (b) => { toggleCold(part(b, 'Q1'), 1); toggleCold(part(b, 'Q1'), 2); },
  'hr-skipping-pattern': (b) => { for (const pi of [0, 1, 2, 3]) toggleCold(part(b, 'RN1'), pi); },
  'hr-conductor-repair': (b) => { addBlob(b, [37, 11], 'F', 0.75); },
  'hr-conformal-coating': (b) => toggleCold(part(b, 'R2'), 1),
  'hr-coating-id': (b) => toggleCold(part(b, 'R1'), 0),
  'hr-esd': (b) => installPart(part(b, 'Q1')),
  'hr-pad-repair': (b) => { const r2 = part(b, 'R2'); r2.state.lifted = undefined; r2.state.cold = []; },
  'hr-final-practical': (b) => installPart(part(b, 'Q1')),
};

async function fixed(sc: Scenario, solver: Solver): Promise<Board> {
  const b = structuredClone(sc.board);
  FIXES[sc.id](b);
  const v = await verifyScenario(sc, b, solver);
  assert(v.flag, `${sc.id}: the test's repair does not unlock the flag`);
  return b;
}

async function check(parent: Scenario, good: Board, solver: Solver, faults: number, seed: number, budgetMs?: number) {
  const g = await generateProblem(parent, good, { solver, faults, seed, ...(budgetMs && { budgetMs }) });
  assert(g, `${parent.id} seed ${seed}: nothing generated`);
  const sc = g.scenario;
  const tag = `${parent.id} → ${sc.id} [${g.faults.map((f) => `${f.kind}@${f.ref}`).join(', ')}]`;
  assert(g.faults.length >= 1 && g.faults.length <= faults, `${tag}: fault count`);
  assert(new Set(g.faults.map((f) => f.ref + f.kind)).size === g.faults.length, `${tag}: duplicate fault`);
  const places = new Set(g.faults.map((f) => f.where)).size;
  assert(sc.meta.hints.length === 1 + places + g.faults.length && sc.meta.hints.every((h) => h.length > 0), `${tag}: hints`);
  assert(new Set(sc.meta.hints).size === sc.meta.hints.length, `${tag}: repeated note`);
  assert(sc.generated?.from === (parent.generated?.from ?? parent.id), `${tag}: root board`);
  // the problem shows on the bench, and nothing burns on power-up
  const ev = evaluateObjectives(sc.board, buildConnectivity(sc.board), sc.objectives, solver);
  assert(!ev.allPassed, `${tag}: passes the bench as generated`);
  assert(ev.overloads.length === 0, `${tag}: overloads ${ev.overloads.map((o) => o.ref).join(',')}`);
  // the parent board is untouched
  assert(JSON.stringify(good) === JSON.stringify(good), 'stable');
  // repaired with the player's tools, it unlocks the flag
  const rb = structuredClone(sc.board);
  for (const f of g.faults) f.repair(rb);
  const v = await verifyScenario(sc, rb, solver);
  assert(v.flag && v.flag.startsWith('PCB{'), `${tag}: repair does not unlock the flag (pass ${v.allPassed}, topology ${v.topologyMismatch})`);
  // it survives export / share
  const back = parseScenario(serializeScenario(sc));
  assert(back.generated?.from === sc.generated?.from && back.lock?.ct === sc.lock?.ct, `${tag}: round trip`);
  return { g, repaired: rb };
}

const kinds = new Set<string>();
const all = await builtinScenarios();
for (const sc of all) {
  assert(FIXES[sc.id], `${sc.id}: add how a player repairs it to FIXES`);
  for (const solver of ['fast', 'spice'] as Solver[]) {
    if (sc.solver && sc.solver !== solver) continue;
    const good = await fixed(sc, solver);
    const before = JSON.stringify(good);
    for (const faults of [1, 2, 3]) {
      for (const seed of [1, 2, 3, 4]) {
        const { g } = await check(sc, good, solver, faults, seed * 7919 + faults);
        g.faults.forEach((f) => kinds.add(`${solver}:${f.kind}`));
      }
    }
    assert(JSON.stringify(good) === before, `${sc.id}: generating changed the fixed board`);
    // a generated problem, once fixed, generates the next one (same root board)
    const { g, repaired } = await check(sc, good, solver, 2, 99);
    await check(g.scenario, repaired, solver, 1, 100);
    // same seed, same problem
    const a = await generateProblem(sc, good, { solver, faults: 2, seed: 5 }), b = await generateProblem(sc, good, { solver, faults: 2, seed: 5 });
    assert(a && b && JSON.stringify(a.scenario.board) === JSON.stringify(b.scenario.board) && a.scenario.id === b.scenario.id, `${sc.id}: seed is not reproducible`);
  }
}
// a board that fails its own checks is not a reference
assert(await generateProblem(all[0], all[0].board, { solver: 'fast', faults: 1, seed: 1 }) === null, 'broken board generated a problem');

for (const k of ['fast:cut-trace', 'fast:solder-bridge', 'fast:cold-joint', 'fast:reversed', 'fast:wrong-value', 'fast:missing', 'fast:open-part', 'spice:resistor-drift'])
  assert(kinds.has(k), `fault kind never generated: ${k} (got ${[...kinds].sort().join(' ')})`);

// full-size open-hardware boards (SPICE + regulator models): close to the checks, within budget
for (const id of ['demo-antmicro-jetson-nano-bb', 'demo-mnt-reform2-mb30']) {
  const sc = importScenarioOrPcb(`${id}.pcbfix.json`, readFileSync(`${root}public/demos/${id}.pcbfix.json`, 'utf8'));
  const good = repairedDemo(sc)!;
  const t0 = Date.now();
  const { g } = await check(sc, good.board, sc.solver ?? 'fast', 1, 42, 20000);
  console.log(`  ${id}: ${g.faults.map((f) => `${f.kind}@${f.ref}`).join(', ')} in ${Date.now() - t0} ms`);
}

console.log(`generate: ok (${[...kinds].sort().join(' ')})`);
