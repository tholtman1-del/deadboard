// Mod platform, phase 5 (docs/MOD_PLATFORM.md): fault types as data (official ranges patchable,
// mod types from primitives, in puzzles), meters (official patchable, mods add; the active profile
// drives readings), importers from code mods, and the diagnostic rules engine with its recall
// test (official rules, and a rules mod that improves it), plus the repair-lab example.
import { loadMod, parseManifest, type LoadedMod, type ModSource } from '../src/mods/mods';
import { buildFaultRegistry, faultTypeFits, faultTypesFor, injectFaultType, parseFaultType, type FaultTypeDef } from '../src/mods/faulttypes';
import { FAULT_CLASSES, buildPuzzle } from '../src/mods/puzzles';
import { buildMeterRegistry, OFFICIAL_METER, parseMeter } from '../src/mods/meters';
import { OFFICIAL_RULES, buildRuleSet, parseRule } from '../src/mods/rules';
import { observe, rankCandidates, recallTest } from '../src/mods/rules-engine';
import { lessonMeta } from '../src/lessons/track';
import { CodeModHost, inProcessTransport } from '../src/mods/api/host';
import { scenarioFromImport } from '../src/mods/api/importing';
import { checkMods, formatReport, shippedBoards } from '../src/mods/benchrun';
import { faultRange, listFaults, clearFault, rng, sampleSeverity, setFaultRangeOverlay } from '../src/faults';
import { activeDmm, displayVolts, setActiveDmm, GENERIC_DMM } from '../src/spice/dmm';
import { DIODE_TEST, ohmOL } from '../src/sim';
import { builtinScenarios } from '../src/scenarios/builtin';
import { referenceBoard } from '../src/scenarios/reference';
import { serializeScenario } from '../src/io/format';
import { cleanWithIpa } from '../src/residue';
import { verifyScenario } from '../src/verify';
import { readZip } from '../src/mods/zip';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
function throws(fn: () => unknown, re: RegExp, m: string) {
  try { fn(); } catch (e) { const msg = e instanceof Error ? e.message : String(e); assert(re.test(msg), `${m}: wrong error "${msg}"`); return; }
  throw new Error(`${m}: did not throw`);
}
interface Fs { readFileSync(p: string, enc?: string): Uint8Array & string; readdirSync(p: string, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] }
let fs: Fs;
const te = new TextEncoder();
const v2 = (o: Record<string, unknown>) => ({ format: 'deadboard-mod/2', id: 'jane-x', name: 'X', version: '1.0.0', license: 'MIT', ...o });
const mem = (manifest: Record<string, unknown>, files: Record<string, string> = {}): Promise<LoadedMod> => {
  const all = { 'mod.json': JSON.stringify(manifest), ...files };
  const src: ModSource = { origin: 'test', name: String(manifest.id), files: Object.keys(all), read: async (p) => te.encode(all[p as keyof typeof all]) };
  return loadMod(src);
};
function folderSource(dir: string): ModSource {
  const files: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (!e.isDirectory()) files.push(e.name);
  return { origin: 'test', name: dir, files, read: async (p) => new Uint8Array(fs.readFileSync(`${dir}/${p}`)) };
}

async function run() {
  const modName = 'node:fs';
  fs = (await import(/* @vite-ignore */ modName)) as Fs;
  const scenarios = await builtinScenarios();
  const byId = (id: string) => scenarios.find((s) => s.id === id)!;

  // ---- fault types ----
  {
    const errs: string[] = [];
    parseFaultType({ id: 'x1', name: 'X', applies: { kinds: ['flux-capacitor'] }, effects: [{ do: 'melt' }, { do: 'leak', ohms: { min: 5, max: 1 } }] }, 'f', errs, []);
    assert(errs.some((e) => /applies.kinds/.test(e)) && errs.some((e) => /do must be one of/.test(e)) && errs.some((e) => /min ≤ max/.test(e)), `fault type checks (${errs.join('; ')})`);
    const salt = parseFaultType({ id: 'salt', name: 'Salt', applies: { kinds: ['resistor', 'capacitor'], minPads: 2 }, effects: [{ do: 'leak', ohms: { min: 300, max: 30000 } }, { do: 'residue', amount: 0.8, leaky: true }] }, 'f', [], [])!;
    const board = structuredClone(referenceBoard(byId('builtin-tut-divider'))!);
    const r2 = board.components.find((c) => c.ref === 'R2')!;
    const led = board.components.find((c) => c.kind === 'battery') ?? board.components[0];
    assert(faultTypeFits(salt, r2) && !faultTypeFits(salt, led), 'fits by kind');
    injectFaultType(salt, r2, rng(1), { severity: 2000 });
    assert(r2.state.leak?.ohms === 2000 && r2.state.residue?.leaky, 'leak with the given severity + residue');
    assert(listFaults(r2).some((f) => f.key === 'leak'), 'listed like a built-in fault');
    clearFault(r2, 'residue');
    assert(!r2.state.leak && !r2.state.residue, 'cleaning the residue clears its leak');
    const reg = buildFaultRegistry([await mem(v2({ id: 'jane-x', faultTypes: [{ id: 'salt', name: 'Salt', applies: { kinds: ['resistor'] }, effects: [{ do: 'drift', factor: { min: 2, max: 3 } }] }] }))], FAULT_CLASSES);
    const offer = faultTypesFor(r2, reg);
    assert(offer.some((x) => x.cls === 'resistor-drift') && offer.some((x) => x.address === 'jane-x/faultTypes/salt' && x.severity?.unit === '×'), 'Author tab offers official classes and mod types');

    // patching an official range: sampling follows it, an invalid patch is skipped
    const patcher = await mem(v2({ id: 'harsh', requires: { 'official-faults': '^1' }, patches: [{ target: 'official-faults/faultTypes/mlcc-dead-short', set: { range: { min: 0.01, max: 0.02 } } }, { target: 'official-faults/faultTypes/resistor-drift', set: { range: { min: 50, max: 10 } } }] }));
    const pr = buildFaultRegistry([patcher], FAULT_CLASSES);
    setFaultRangeOverlay(pr.ranges);
    assert(faultRange('mlcc-dead-short').max === 0.02 && sampleSeverity('mlcc-dead-short', rng(7)) <= 0.02, 'patched range used when sampling');
    assert(faultRange('resistor-drift').min === 1.5 && pr.log.get('official-faults/faultTypes/resistor-drift')!.res.skipped.length === 1, 'invalid range skipped');
    setFaultRangeOverlay(null);
    assert(faultRange('mlcc-dead-short').max === 2, 'overlay cleared');
    const w: string[] = [];
    const pm = parseManifest(JSON.stringify(v2({ requires: { 'official-faults': '^1' }, patches: [{ target: 'official-faults/faultTypes/cold-joint', set: { name: 'x', range: { min: 1, max: 2 } } }] })), w);
    assert(w.some((x) => /faultTypes can't change "name" \(only range\)/.test(x)) && Object.keys(pm.patches[0].set).join() === 'range', 'official fault classes: only the range can be patched');
  }

  // ---- meters ----
  {
    const errs: string[] = [];
    const m = parseMeter({ id: 'cheap', name: 'Cheap', counts: 2000, vInputOhms: 1e6 }, 'm', errs, []);
    assert(m && m.counts === 2000 && m.ohmRanges.length === GENERIC_DMM.ohmRanges.length && m.diode.voc === GENERIC_DMM.diode.voc, 'fields left out come from the official meter');
    parseMeter({ id: 'bad', name: 'Bad', counts: 7, ohmRanges: [{ fullScale: 600, itest: 1e-3, voc: 1 }, { fullScale: 60, itest: 1e-3, voc: 1 }] }, 'm', errs, []);
    assert(errs.some((e) => /counts/.test(e)) && errs.some((e) => /increasing/.test(e)), 'meter checks');
    const mod = await mem(v2({ requires: { 'official-instruments': '^1' }, meters: [{ id: 'cheap', name: 'Cheap', counts: 2000 }], patches: [{ target: OFFICIAL_METER, set: { diode: { itest: 1e-3, voc: 2, olVolts: 1.8 }, ohmRanges: [{ fullScale: 2e3, itest: 1e-4, voc: 1 }, { fullScale: 2e6, itest: 1e-7, voc: 1 }] } }] }));
    const reg = buildMeterRegistry([mod]);
    assert(reg.meters.length === 2 && reg.addresses.has('jane-x/meters/cheap'), 'official + added');
    const official = reg.meters.find((x) => x.address === OFFICIAL_METER)!;
    setActiveDmm(official.profile);
    assert(ohmOL() === 2e6 && DIODE_TEST.olVolts === 1.8 && activeDmm().diode.voc === 2, 'the active (patched) meter drives OL and the diode test');
    setActiveDmm(reg.meters.find((x) => x.address === 'jane-x/meters/cheap')!.profile);
    assert(displayVolts(1.23456).text.replace(/\D/g, '').length <= 4, 'a 2000-count meter shows fewer digits');
    setActiveDmm(null);
    assert(ohmOL() === 60e6 && (DIODE_TEST.olVolts as number) === 2.5, 'back to the official meter');
  }

  // ---- importers (code mods) ----
  {
    const sc = byId('builtin-ghost-short');
    const kicad = fs.readFileSync('examples/mods/starter-kit/boards/night-light.kicad_pcb', 'utf8');
    const host = new CodeModHost(inProcessTransport((code) => import(/* @vite-ignore */ `data:text/javascript;base64,${btoa(unescape(encodeURIComponent(code)))}`)), { onLog: () => {} });
    const imp = await mem(v2({ id: 'jane-imp', code: { entry: 'main.js', api: '^1' } }), {
      'main.js': `export default function activate(api) {
        api.register.importer('json', { name: 'Wrapped JSON', extensions: ['.wrapped'], read: ({ bytes }) => ({ pcbfix: JSON.parse(new TextDecoder().decode(bytes)) }) });
        api.register.importer('kc', { name: 'KiCad in disguise', extensions: ['.kc'], read: ({ bytes }) => ({ kicadPcb: new TextDecoder().decode(bytes) }) });
        api.register.importer('junk', { name: 'Junk', extensions: ['.junk'], read: () => ({ kicadPcb: 'hello' }) });
        api.register.importer('bad', { name: 'Bad', extensions: ['NOPE'], read: () => ({}) });
      }` });
    let refused = false;
    try { await host.start(imp); } catch (e) { refused = /extensions in lowercase/.test(String(e)); }
    assert(refused, 'importer extensions checked');
    const ok = await mem(v2({ id: 'jane-imp', code: { entry: 'main.js', api: '^1' } }), {
      'main.js': `export default function activate(api) {
        api.register.importer('json', { name: 'Wrapped JSON', extensions: ['.wrapped'], read: ({ bytes }) => ({ pcbfix: JSON.parse(new TextDecoder().decode(bytes)) }) });
        api.register.importer('kc', { name: 'KiCad in disguise', extensions: ['.kc'], read: ({ bytes }) => ({ kicadPcb: new TextDecoder().decode(bytes) }) });
        api.register.importer('junk', { name: 'Junk', extensions: ['.junk'], read: () => ({ kicadPcb: 'hello' }) });
      }` });
    await host.start(ok);
    assert(host.importers().map((x) => x.extensions.join()).join('|') === '.wrapped|.kc|.junk', 'importers registered');
    const a = scenarioFromImport(await host.importFile('jane-imp/importers/json', { name: 'g.wrapped', bytes: te.encode(serializeScenario(sc)) }), 'g.wrapped', 'jane-imp');
    assert(a.board.components.length === sc.board.components.length && /Imported by the mod "jane-imp"/.test(a.meta.credits ?? ''), 'pcbfix output goes through the app importer');
    const b = scenarioFromImport(await host.importFile('jane-imp/importers/kc', { name: 'n.kc', bytes: te.encode(kicad) }), 'n.kc', 'jane-imp');
    assert(b.board.components.some((c) => c.ref === 'D1'), 'KiCad output goes through the KiCad importer');
    const junk = await host.importFile('jane-imp/importers/junk', { name: 'x.junk', bytes: new Uint8Array() });
    throws(() => scenarioFromImport(junk, 'x.junk', 'jane-imp'), /not a KiCad board/, 'junk refused');
    throws(() => scenarioFromImport({ hello: 1 }, 'x', 'm'), /neither/, 'unknown shape refused');
    host.stopAll();
  }

  // ---- rules ----
  {
    const errs: string[] = [];
    parseRule({ id: 'r1', when: 'smells', suspect: { where: 'the-part' }, confirm: '' }, 'r', errs, []);
    parseRule({ id: 'r2', when: 'short', suspect: { where: 'the-part' }, confirm: 'x' }, 'r', errs, []);
    assert(errs.some((e) => /"when" must be/.test(e)) && errs.some((e) => /"confirm" must say/.test(e)) && errs.some((e) => /"the-part" only goes with/.test(e)), `rule checks (${errs.join('; ')})`);

    // soldering-track lessons are left out: their lesson names the bad joints, so the app shows no
    // «Where to look?» there (on two of them a resistive joint at the supply or a transistor ranks 4th)
    const boards = scenarios.filter((sc) => !lessonMeta(sc.id)).map((sc) => ({ title: sc.meta.title, reference: referenceBoard(sc)!, objectives: sc.objectives, solver: sc.solver ?? 'spice' as const }));
    const r = recallTest(boards, OFFICIAL_RULES);
    assert(r.visible >= 100 && r.hits === r.visible && r.invented === 0 && r.none === 0, `official rules: recall ${r.hits}/${r.visible}, none ${r.none}, invented ${r.invented}; missed ${r.misses.map((m) => `${m.board} ${m.ref} ${m.fault} (top ${m.top.join(',')})`).join('; ')}`);

    // a cold joint at the supply: its own copper already reads low, so the supply ranks first and what
    // goes wrong downstream (low nets, dark LEDs) doesn't outvote it
    for (const [id, refName] of [['builtin-bridge-troll', 'BT1'], ['builtin-ghost-short', 'J1']]) {
      const s5 = byId(id), ok = referenceBoard(s5)!, cold = structuredClone(ok);
      const part = cold.components.find((c) => c.ref === refName)!;
      part.state.cold = [0]; part.state.coldOhms = { 0: 1e6 };
      const top = rankCandidates(observe(cold, ok, s5.objectives, 'spice'), cold, OFFICIAL_RULES)[0];
      assert(top?.ref === refName && /joint/.test(top.reasons.map((x) => x.confirm).join(' ')), `${id}: cold joint at the supply ${refName} ranked first with a joint check (got ${top?.ref})`);
    }

    // one planted fault, end to end: observation → ranked parts with a reason and a measurement
    const sc = byId('builtin-ghost-short');
    const good = referenceBoard(sc)!;
    const bad = structuredClone(good);
    bad.components.find((c) => c.ref === 'F1')!.state.burnt = true;
    const obs = observe(bad, good, sc.objectives, 'spice');
    assert(obs.nets.some((n) => n.state === 'dead') && obs.hops.size > 0, 'dead nets observed');
    const ranked = rankCandidates(obs, bad, OFFICIAL_RULES);
    assert(ranked[0].ref === 'F1' && /measure across F1/i.test(ranked[0].reasons.map((x) => x.confirm).join(' ')), `open fuse ranked first with how to confirm (${ranked.slice(0, 3).map((c) => c.ref).join(',')})`);

    // a rules mod: add one, reweight one (patch), the rule set and the recall test follow
    const rm = await mem(v2({ id: 'jane-rules', requires: { 'official-rules': '^1' }, rules: [{ id: 'supply-joint', when: 'low', suspect: { where: 'on-net', kinds: ['battery', 'connector'] }, weight: 8, confirm: 'Measure at {ref}.' }], patches: [{ target: 'official-rules/rules/tested-part', set: { weight: 1 } }] }));
    const set = buildRuleSet([rm]);
    assert(set.rules.find((x) => x.address === 'official-rules/rules/tested-part')!.weight === 1 && set.rules.some((x) => x.address === 'jane-rules/rules/supply-joint'), 'rules added and patched');
    const r2 = recallTest(boards, set.rules);
    assert(r2.hits >= r.hits, `the extra rule doesn't make it worse (${r2.hits} vs ${r.hits})`);
  }

  // ---- the repair-lab example: bench check, puzzle with a mod fault type repaired by cleaning ----
  {
    const lab = await loadMod(folderSource('examples/mods/repair-lab'));
    assert(lab.warnings.length === 0 && lab.manifest.faultTypes.length === 1 && lab.manifest.meters.length === 1 && lab.manifest.rules.length === 1 && lab.manifest.puzzles.length === 1, 'example contents');
    const rep = await checkMods([lab], await shippedBoards());
    assert(rep.findings.every((f) => f.level === 'pass') && rep.findings.some((f) => /139 of 139/.test(f.text)), `repair-lab passes the bench check:\n${formatReport(rep)}`);

    const reg = buildFaultRegistry([lab], FAULT_CLASSES);
    const base = byId('builtin-tut-divider');
    const pz = await buildPuzzle(lab.manifest.puzzles[0], lab.manifest, base, referenceBoard(base)!, reg.defs as Map<string, FaultTypeDef>);
    assert(!(await verifyScenario(pz, pz.board, pz.solver ?? 'spice')).allPassed, 'the salt-water puzzle fails');
    const r2 = pz.board.components.find((c) => c.ref === 'R2')!;
    for (let k = 0; k < 8 && r2.state.residue; k++) cleanWithIpa(pz.board, r2.at[0], r2.at[1], 3);
    const fixed = await verifyScenario(pz, pz.board, pz.solver ?? 'spice');
    assert(fixed.allPassed && fixed.flag === 'DEAD{s4lt_w4t3r_l34k}', 'cleaning with IPA repairs it and unlocks the flag');

    const zipped = await readZip(new Uint8Array(fs.readFileSync('public/examples/repair-lab.zip')));
    assert(new TextDecoder().decode(zipped.get('repair-lab/mod.json')!) === fs.readFileSync('examples/mods/repair-lab/mod.json', 'utf8'), 'repair-lab.zip is stale: run npm run example-mod');
  }

  console.log('MOD PHASE 5 TESTS PASSED (fault types: checks, fit, inject, list/clear, Author offer, official range patch + skip; meters: defaults, checks, patched official drives OL / diode test / digits; importers: pcbfix + KiCad through the app importers, junk refused; rules: checks, official recall 100 %, cold joint at the supply first, fuse case end to end, rules mod add + patch; repair-lab: bench check 100 % recall, salt-water puzzle cleaned with IPA unlocks)');
}

run().catch((e) => { console.error(e); (globalThis as unknown as { process: { exitCode: number } }).process.exitCode = 1; });
