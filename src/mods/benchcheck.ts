// Bench check: an automatic test of a mod, run before sharing it (and, later, by a bot on mod.io
// uploads). Same code in the app (Mods window), on the command line (npm run bench-check) and in
// tests. It never trusts the mod: everything is measured with the simulator.
//
//  - boards: a challenge must fail its tests as shipped; a board without a flag should pass them;
//    nothing may overload (burn) at power-up.
//  - puzzles: the working board passes the tests; the puzzle fails them; each fault shows on its own.
//  - board patches: a working board still passes the patched tests; a challenge still fails them.
//  - knowledge packs: every part and net they name is on the board.
//  - devices (added or patched): every board that uses the part is solved with and without the
//    mod; the report lists the nets that moved and any test that changes result.
import type { Board, Scenario } from '../types';
import { lessonMeta } from '../lessons/track';
import type { LoadedMod } from './mods';
import { buildConnectivity, type Conn } from '../connectivity';
import { evaluateObjectives, evaluateObjectivesAsync, runSolver, type Solver } from '../verify';
import { netVoltage, type Sim } from '../sim';
import type { SwitchMap } from '../types';
import { referenceBoard } from '../scenarios/reference';
import { buildPuzzle } from './puzzles';
import { staleEntries } from './knowledge';
import { buildDeviceOverlay } from './devices';
import { buildFaultRegistry, faultTypeFits, injectFaultType } from './faulttypes';
import { buildRuleSet } from './rules';
import { recallTest } from './rules-engine';
import { FAULT_CLASSES } from './puzzles';
import { rng, seedOf } from '../faults';
import { findDevice, setDeviceOverlay, deviceOverlay, type DeviceDef } from '../spice/devicelib';

export type Level = 'pass' | 'warn' | 'fail';
export interface Finding { level: Level; item: string; text: string }
export interface NetMove { net: string; before: number; after: number }
export interface MovedBoard { address: string; title: string; nets: NetMove[]; netsMoved: number; testsBefore: boolean; testsAfter: boolean }
export interface BenchReport { modId: string; findings: Finding[]; moved: MovedBoard[]; ms: number }

/** Solves with a code mod's solver (the app's sandbox, or in-process for an author's own mod). */
export type SolveWith = (address: string, board: Board, conn: Conn, title: string, opts: { switches?: SwitchMap; meters: [number, number][] }) => Promise<Sim>;

export interface BenchContext {
  /** Code mods: their running solvers, and how to call one. Absent where code can't run. */
  modSolvers?(modId: string): { address: string; id: string; name: string }[];
  solveWith?: SolveWith;
  /** A board by address, fully loaded and as players see it (running mods' patches applied). */
  board(address: string): Promise<{ title: string; scenario: Scenario } | null>;
  /** Addresses of every board that can be checked for device changes. */
  boardAddresses(): string[];
  /** Called between solves (a UI stays responsive); may report progress. */
  step?(what: string): Promise<void>;
}

const solverFor = (sc: Scenario, devicesMatter = false): Solver => sc.solver ?? (devicesMatter ? 'spice' : 'fast');

function testsPass(sc: Scenario, board: Board, solver: Solver) {
  return evalOn(board, sc.objectives, solver);
}

/** Tests on a copy of `board` (connectivity is tied to the board object, so it's built from the copy). */
function evalOn(board: Board, objectives: Scenario['objectives'], solver: Solver) {
  const b = structuredClone(board);
  return evaluateObjectives(b, buildConnectivity(b), objectives, solver);
}

/** Voltages of named nets on a board (the board fully on, as the tests see it). */
function netVolts(board: Board, solver: Solver): Map<string, number> {
  const conn = buildConnectivity(board);
  return voltsOf(runSolver(solver, board, conn, solver === 'spice-power' ? { powerState: 'S0SW' } : {}), conn);
}

function voltsOf(sim: Sim, conn: Conn): Map<string, number> {
  const out = new Map<string, number>();
  conn.netNames.forEach((name, i) => {
    if (!name) return;
    const v = netVoltage(sim, i);
    if (v !== null && Number.isFinite(v)) out.set(name, v);
  });
  return out;
}

/** Checks `mod`, which must be one of `active` (the running mods, in load order). */
export async function benchCheck(mod: LoadedMod, active: LoadedMod[], ctx: BenchContext): Promise<BenchReport> {
  const t0 = Date.now();
  const mf = mod.manifest;
  const findings: Finding[] = [];
  const moved: MovedBoard[] = [];
  const add = (level: Level, item: string, text: string) => findings.push({ level, item, text });
  const step = async (what: string) => { await ctx.step?.(what); };

  // ---- boards ----
  for (const b of mod.boards) {
    if (b.basedOn) continue; // puzzles below
    await step(b.stub.meta.title);
    let sc: Scenario;
    try { sc = await b.load(); } catch (e) { add('fail', b.address, `doesn't load: ${e instanceof Error ? e.message : e}`); continue; }
    if (!sc.objectives.length) { add('warn', b.address, 'has no tests, so players can\'t check a repair'); continue; }
    const ev = testsPass(sc, sc.board, solverFor(sc));
    if (ev.overloads.length) add('warn', b.address, `overloads at power-up (${ev.overloads.map((o) => o.ref).join(', ')}): the part burns as soon as a player powers it`);
    if (sc.lock) add(ev.allPassed ? 'fail' : 'pass', b.address, ev.allPassed ? 'is a challenge but already passes its tests' : 'challenge fails its tests as shipped');
    else add(ev.allPassed ? 'pass' : 'warn', b.address, ev.allPassed ? 'working board passes its tests' : 'has no flag but fails its own tests (a working board should pass them)');
  }

  const faultDefs = buildFaultRegistry(active.includes(mod) ? active : [...active, mod], FAULT_CLASSES).defs;

  // ---- puzzles ----
  for (const pz of mf.puzzles) {
    const at = `${mf.id}/puzzles/${pz.id}`;
    await step(pz.title);
    const base = await ctx.board(pz.board);
    if (!base) { add('fail', at, `needs the board ${pz.board}, which isn't available`); continue; }
    const ref = referenceBoard(base.scenario);
    if (!ref) { add('fail', at, `${pz.board} is a challenge whose repair isn't known; a puzzle needs a working board`); continue; }
    let built: Scenario;
    try { built = await buildPuzzle(pz, mf, base.scenario, ref, faultDefs); } catch (e) { add('fail', at, e instanceof Error ? e.message : String(e)); continue; }
    const solver = solverFor(built);
    const good = evalOn(ref, built.objectives, solver);
    if (!good.allPassed) { add('fail', at, 'the working board fails the puzzle\'s tests, so no repair can pass them'); continue; }
    const broken = testsPass(built, built.board, solver);
    if (broken.allPassed) { add('fail', at, 'the faults don\'t show: the puzzle passes its tests before any repair'); continue; }
    if (broken.overloads.length) add('warn', at, `overloads at power-up (${broken.overloads.map((o) => o.ref).join(', ')}): a part burns before the player starts`);
    if (pz.faults.length > 1) {
      for (const [i, f] of pz.faults.entries()) {
        const one = await buildPuzzle({ ...pz, faults: [f] }, mf, base.scenario, ref, faultDefs);
        if (testsPass(one, one.board, solver).allPassed) add('warn', at, `fault ${i + 1} (${f.ref} ${f.fault}) doesn't show on its own`);
      }
    }
    add('pass', at, `the working board passes, the puzzle fails (${solver})`);
  }

  // ---- fault types: planted on the parts they fit, across the working boards ----
  for (const ft of mf.faultTypes) {
    const at = `${mf.id}/faultTypes/${ft.id}`;
    const def = faultDefs.get(at) ?? ft;
    let tried = 0, shows = 0, burns = 0, failed = 0;
    for (const addr of ctx.boardAddresses()) {
      const b = await ctx.board(addr);
      const ref = b && referenceBoard(b.scenario);
      if (!b || !ref || !b.scenario.objectives.length) continue;
      const fits = ref.components.filter((c) => faultTypeFits(def, c)).slice(0, 6);
      if (!fits.length) continue;
      await step(`${def.name}: ${b.title}`);
      for (const part of fits) {
        const board = structuredClone(ref);
        const c = board.components.find((x) => x.id === part.id)!;
        try { injectFaultType(def, c, rng(seedOf(`${at}|${addr}|${c.ref}`))); } catch (e) {
          failed++;
          add('fail', at, `can't be planted on ${c.ref} (${b.title}): ${e instanceof Error ? e.message : e}`);
          continue;
        }
        tried++;
        const ev = evalOn(board, b.scenario.objectives, solverFor(b.scenario, true));
        if (!ev.allPassed) shows++;
        if (ev.overloads.length) burns++;
      }
    }
    if (!tried && !failed) add('warn', at, 'fits no part on the available working boards, so it wasn\'t tried');
    else if (tried) add(shows ? 'pass' : 'warn', at, `planted on ${tried} part(s) of working boards: fails the tests in ${shows}${shows ? '' : ' (it never shows on the bench there)'}${burns ? `; a part burns at power-up in ${burns}` : ''}`);
  }

  // ---- meters: valid profiles (checked when the mod loads); what they change ----
  for (const m of mf.meters) add('pass', `${mf.id}/meters/${m.id}`, `meter profile «${m.name}»: ${m.counts} counts, ${m.vInputOhms >= 1e6 ? `${m.vInputOhms / 1e6} MΩ` : `${m.vInputOhms / 1e3} kΩ`} input, ±${(m.vGainError * 100).toFixed(2)} % gain error`);

  // ---- rules: the recall test, with and without this mod's rules ----
  if (mf.rules.length || mf.patches.some((p) => p.target.includes('/rules/'))) {
    const boards = [];
    for (const addr of ctx.boardAddresses()) {
      const b = await ctx.board(addr);
      const ref = b && referenceBoard(b.scenario);
      if (!b || !ref || !b.scenario.objectives.length || ref.components.length > 60) continue; // small working boards: hundreds of faults are planted
      if (lessonMeta(b.scenario.id)) continue; // soldering lessons show no «Where to look?»: the lesson names the joints
      boards.push({ title: b.title, reference: ref, objectives: b.scenario.objectives, solver: solverFor(b.scenario, true) });
    }
    const withMod = buildRuleSet(active.includes(mod) ? active : [...active, mod]);
    for (const [addr, l] of withMod.log) for (const sk of l.res.skipped.filter((x) => x.modId === mf.id)) add('fail', addr, `patch skipped: ${sk.problems.join('; ')}`);
    if (!boards.length) add('warn', `${mf.id}/rules`, 'no small working board with tests to run the recall test on');
    else {
      await step('recall test');
      const before = recallTest(boards, buildRuleSet(active.filter((m) => m !== mod)).rules);
      const after = recallTest(boards, withMod.rules);
      const pct = (r: typeof after) => (r.visible ? Math.round((100 * r.hits) / r.visible) : 0);
      const level: Level = after.invented ? 'fail' : after.hits >= before.hits ? 'pass' : 'warn';
      add(level, `${mf.id}/rules`, `recall test on ${boards.length} working boards: the planted part is among the top 3 suggestions for ${after.hits} of ${after.visible} faults (${pct(after)} %; ${pct(before)} % without this mod)${after.none ? `; no suggestion at all for ${after.none}` : ''}${after.invented ? `; ${after.invented} suggestion(s) name a part that isn't on the board` : ''}`);
    }
  }

  // ---- board patches ----
  const boardTargets = [...new Set(mf.patches.filter((p) => p.target.includes('/boards/')).map((p) => p.target))];
  for (const addr of boardTargets) {
    await step(addr);
    const b = await ctx.board(addr);
    if (!b) { add('warn', addr, 'patched board isn\'t available'); continue; }
    const sc = b.scenario;
    const ref = referenceBoard(sc);
    if (!sc.objectives.length) { add('pass', addr, 'patched (no tests to check)'); continue; }
    if (ref && ref !== sc.board) {
      const ev = evalOn(ref, sc.objectives, solverFor(sc));
      add(ev.allPassed ? 'pass' : 'fail', addr, ev.allPassed ? 'the working board passes the patched tests' : 'the working board fails the patched tests, so no repair can pass them');
    }
    if (sc.lock) {
      const ev = testsPass(sc, sc.board, solverFor(sc));
      if (ev.allPassed) add('fail', addr, 'with this patch the challenge passes its tests before any repair');
    } else if (!ref || ref === sc.board) {
      const ev = testsPass(sc, sc.board, solverFor(sc));
      add(ev.allPassed ? 'pass' : 'warn', addr, ev.allPassed ? 'passes the patched tests' : 'fails the patched tests');
    }
  }

  // ---- knowledge packs ----
  for (const k of mf.knowledge) {
    const b = await ctx.board(k.board);
    const at = `${mf.id}/knowledge/${k.id}`;
    if (!b) { add('warn', at, `board ${k.board} isn't available`); continue; }
    const st = staleEntries(k, b.scenario.board);
    const bad = [...st.refs, ...st.nets];
    add(bad.length ? 'warn' : 'pass', at, bad.length ? `names what the board doesn't have: ${bad.join(', ')}` : 'every part and net it names is on the board');
  }

  // ---- devices: which boards move ----
  const touched = new Set<string>([...mf.devices.map((d) => d.mpn.toUpperCase())]);
  const devicePatches = mf.patches.filter((p) => p.target.includes('/devices/'));
  if (touched.size || devicePatches.length) {
    const without = buildDeviceOverlay(active.filter((m) => m !== mod));
    const withMod = buildDeviceOverlay(active.includes(mod) ? active : [...active, mod]);
    for (const [addr, l] of withMod.log) {
      if (!devicePatches.some((p) => p.target === addr)) continue;
      touched.add(l.title.toUpperCase());
      for (const s of l.res.skipped.filter((x) => x.modId === mf.id)) add('fail', addr, `patch skipped: ${s.problems.join('; ')}`);
    }
    const saved: DeviceDef[] = [...deviceOverlay()];
    try {
      for (const addr of ctx.boardAddresses()) {
        const b = await ctx.board(addr);
        if (!b) continue;
        const sc = b.scenario;
        const board = referenceBoard(sc) ?? sc.board;
        // matched with the mod's devices in place: a part only the mod adds isn't found without it
        setDeviceOverlay(withMod.overlay);
        const usesWith = board.components.filter((c) => c.label && touched.has((findDevice(c.label)?.mpn ?? '').toUpperCase()));
        if (!usesWith.length) continue;
        await step(b.title);
        const solver = solverFor(sc, true);
        setDeviceOverlay(without.overlay);
        const before = netVolts(board, solver);
        const tb = sc.objectives.length ? evalOn(board, sc.objectives, solver).allPassed : true;
        setDeviceOverlay(withMod.overlay);
        const after = netVolts(board, solver);
        const ta = sc.objectives.length ? evalOn(board, sc.objectives, solver).allPassed : true;
        const nets: NetMove[] = [];
        for (const [net, v0] of before) {
          const v1 = after.get(net);
          if (v1 === undefined) continue;
          if (Math.abs(v1 - v0) > Math.max(0.005, 0.01 * Math.abs(v0))) nets.push({ net, before: v0, after: v1 });
        }
        nets.sort((a, b2) => Math.abs(b2.after - b2.before) - Math.abs(a.after - a.before));
        const refs = [...new Set(usesWith.map((c) => c.ref))];
        moved.push({ address: addr, title: b.title, nets: nets.slice(0, 12), netsMoved: nets.length, testsBefore: tb, testsAfter: ta });
        if (tb && !ta) add('fail', addr, `the working board fails its tests with this mod's devices (${refs.join(', ')})`);
        else add(nets.length ? 'warn' : 'pass', addr, nets.length ? `${nets.length} net(s) move with this mod's devices (${refs.join(', ')}); tests still ${ta ? 'pass' : 'fail as before'}` : `uses ${refs.join(', ')}; no net moves`);
      }
    } finally {
      setDeviceOverlay(saved);
    }
    if (!moved.length) add('pass', mf.id, 'no available board uses the devices this mod adds or changes');
  }

  // ---- code: the mod's solvers against the official ones, on every working board ----
  if (mf.code && !ctx.solveWith) add('warn', mf.id, 'contains code: its solvers are checked in the app (Mods → Bench check, with code mods on)');
  for (const s of ctx.solveWith ? ctx.modSolvers?.(mf.id) ?? [] : []) {
    const at = s.address;
    let total = 0, agree = 0, failed = 0;
    const off: string[] = [];
    for (const addr of ctx.boardAddresses()) {
      const b = await ctx.board(addr);
      const ref = b && referenceBoard(b.scenario);
      if (!b || !ref || !b.scenario.objectives.length) continue; // working boards with tests only
      await step(`${s.name}: ${b.title}`);
      total++;
      const board = structuredClone(ref);
      const conn = buildConnectivity(board);
      const official = solverFor(b.scenario);
      let mine, volts;
      try {
        mine = await evaluateObjectivesAsync(board, conn, b.scenario.objectives, (o, bd, cn) => ctx.solveWith!(s.address, bd, cn, b.title, o));
        volts = voltsOf(await ctx.solveWith!(s.address, board, conn, b.title, { meters: [] }), conn);
      } catch (e) {
        failed++;
        add('fail', addr, `${s.name} failed: ${e instanceof Error ? e.message : e}`);
        continue;
      }
      const ref0 = evalOn(board, b.scenario.objectives, official).allPassed;
      const base = netVolts(board, official);
      const differs = [...base].filter(([net, v]) => { const w = volts.get(net); return w === undefined || Math.abs(w - v) > Math.max(0.05, 0.05 * Math.abs(v)); });
      if (mine.allPassed === ref0 && !differs.length) agree++;
      else off.push(`${b.title}${mine.allPassed !== ref0 ? ` (tests ${mine.allPassed ? 'pass' : 'fail'}, official ${ref0 ? 'pass' : 'fail'})` : ''}${differs.length ? ` (${differs.length} net(s) off, e.g. ${differs.slice(0, 2).map(([n, v]) => `${n} ${v.toFixed(2)} V vs ${volts.get(n)?.toFixed(2) ?? '—'} V`).join(', ')})` : ''}`);
    }
    if (!total) { add('warn', at, 'no working board with tests to compare on'); continue; }
    if (!failed) add(agree === total ? 'pass' : 'warn', at, `runs on all ${total} working boards; agrees with the official solvers on ${agree} (tests, and voltages within 50 mV / 5%)${off.length ? `. Differs on: ${off.slice(0, 6).join('; ')}${off.length > 6 ? '; …' : ''}` : ''}`);
  }

  if (!findings.length) add('pass', mf.id, 'nothing to check (the mod only lists other mods)');
  return { modId: mf.id, findings, moved, ms: Date.now() - t0 };
}
