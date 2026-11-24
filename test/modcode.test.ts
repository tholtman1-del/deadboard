// Mod platform, phase 4 (docs/MOD_PLATFORM.md): code mods. Manifest rules (entry, API range,
// permissions, the "import" rule), the runtime ↔ host protocol in-process (start, registration,
// solve, events, queries, crash and time-out handling), the netlist given to solvers and the
// result coming back (untrusted), the example solver against the official ones, the bench check
// of a code solver, and the @deadboard/mod-api package being current.
// The sandbox itself (iframe + worker + CSP) needs a browser: it is checked in Chrome
// (docs/MOD_PLATFORM.md → Security review).
import { loadMod, parseManifest, type LoadedMod, type ModSource } from '../src/mods/mods';
import { CodeModHost, inProcessTransport } from '../src/mods/api/host';
import { buildNetlist, simFromResult } from '../src/mods/api/netlist';
import { codeProblem, API_VERSION } from '../src/mods/api/version';
import { apiPackageFiles } from '../src/mods/api/package';
import { connectSrc } from '../src/mods/api/csp';
import { builtinScenarios } from '../src/scenarios/builtin';
import { referenceBoard } from '../src/scenarios/reference';
import { buildConnectivity } from '../src/connectivity';
import { evaluateObjectives, evaluateObjectivesAsync, verifyScenario } from '../src/verify';
import { checkMods, formatReport, shippedBoards } from '../src/mods/benchrun';
import { readZip } from '../src/mods/zip';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
function throws(fn: () => unknown, re: RegExp, m: string) {
  try { fn(); } catch (e) { const msg = e instanceof Error ? e.message : String(e); assert(re.test(msg), `${m}: wrong error "${msg}"`); return; }
  throw new Error(`${m}: did not throw`);
}
async function rejects(p: Promise<unknown>, re: RegExp, m: string) {
  try { await p; } catch (e) { const msg = e instanceof Error ? e.message : String(e); assert(re.test(msg), `${m}: wrong error "${msg}"`); return; }
  throw new Error(`${m}: did not throw`);
}

interface Fs { readFileSync(p: string, enc?: string): Uint8Array & string; readdirSync(p: string, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] }
let fs: Fs;
const te = new TextEncoder();
const b64 = (s: string) => btoa(String.fromCharCode(...te.encode(s)));
const load = (code: string) => import(/* @vite-ignore */ `data:text/javascript;base64,${b64(code)}`) as Promise<{ default?: unknown }>;
const v2 = (o: Record<string, unknown>) => ({ format: 'deadboard-mod/2', id: 'jane-code', name: 'Code', version: '1.0.0', license: 'MIT', ...o });
/** A code mod held in memory. */
function codeMod(js: string, id = 'jane-code', extra: Record<string, unknown> = {}): Promise<LoadedMod> {
  const files: Record<string, string> = { 'mod.json': JSON.stringify(v2({ id, code: { entry: 'main.js', api: '^1' }, ...extra })), 'main.js': js };
  const src: ModSource = { origin: 'test', name: id, files: Object.keys(files), read: async (p) => te.encode(files[p]) };
  return loadMod(src);
}
function folderSource(dir: string): ModSource {
  const files: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (!e.isDirectory()) files.push(e.name);
  return { origin: 'test', name: dir, files, read: async (p) => new Uint8Array(fs.readFileSync(`${dir}/${p}`)) };
}
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const modName = 'node:fs';
  fs = (await import(/* @vite-ignore */ modName)) as Fs;

  // ---- manifest: code ----
  {
    const mf = parseManifest(JSON.stringify(v2({ code: { entry: 'dist/main.js', api: '^1', permissions: ['network:localhost', 'network:https://models.example.org'] } })));
    assert(mf.code?.entry === 'dist/main.js' && mf.code.permissions.length === 2 && mf.boards.length === 0, 'a code mod needs no boards');
    throws(() => parseManifest(JSON.stringify(v2({ code: { entry: 'main.py', api: '^1' } }))), /\.js or \.mjs/, 'entry must be JS');
    throws(() => parseManifest(JSON.stringify(v2({ code: { entry: 'main.js', api: '^2' } }))), new RegExp(`asks for \\^2, but this version of DEADBOARD has plug-in API ${API_VERSION.replace(/\./g, '\\.')}`), 'API range checked');
    throws(() => parseManifest(JSON.stringify(v2({ code: { entry: 'main.js', api: '^1', permissions: ['camera'] } }))), /unknown permission "camera"/, 'unknown permission');
    throws(() => parseManifest(JSON.stringify(v2({ code: { entry: 'main.js', api: '^1', permissions: ['network:http://evil.example'] } }))), /unknown permission/, 'only https origins');
    const w: string[] = [];
    const later = parseManifest(JSON.stringify(v2({ code: { entry: 'main.js', api: '^1', permissions: ['panel'] } })), w);
    assert(later.code?.permissions.join() === 'panel' && w.length === 0, 'panel is granted (phase 6)');
    const w1: string[] = [];
    parseManifest(JSON.stringify({ format: 'deadboard-mod/1', id: 'old', name: 'Old', license: 'MIT', boards: [{ file: 'amp.brd' }], code: { entry: 'main.js' } }), w1);
    assert(w1.some((x) => /"code" needs "format": "deadboard-mod\/2"/.test(x)), '/1 ignores code with a note');
    assert(connectSrc([]) === "'none'" && connectSrc(['network:localhost']) === 'http://127.0.0.1:* http://localhost:*' && connectSrc(['network:https://a.example:8443']) === 'https://a.example:8443', 'permissions → connect-src');
  }

  // ---- the "import" rule (Chrome lets a worker's import() through the sandbox's CSP) ----
  {
    assert(codeProblem('export default function activate(api) {}') === null, 'plain module is fine');
    for (const bad of ['import x from "y"', 'await import("http://x")', 'import /* */ ("x")', '// import is mentioned', 'const s = "import"', 'import.meta.url']) {
      assert(codeProblem(bad), `refused: ${bad}`);
    }
    assert(codeProblem('const important = reimport_ + _import; x.$imports') === null, 'words containing it are fine');
    // module syntax is how code left the sandbox in Chrome (import() and `export … from`): one default export only
    for (const bad of ['export * from "https://evil.example/x.js"; export default function activate() {}', 'export { a } from "b"; export default function activate() {}', 'export * as ns from "b"', 'export const x = 1; export default function activate() {}', 'export default 1; export default 2', '// export\nexport default function activate() {}']) {
      assert(/only export is/.test(codeProblem(bad) ?? ''), `refused: ${bad}`);
    }
    assert(codeProblem('export default async function activate(api) {}') === null && codeProblem('export  default  function (api) {}') === null, 'one default export is fine');
    await rejects(codeMod('export default function activate() { return import("x"); }'), /can't use import/, 'refused at load');
  }

  // ---- runtime ↔ host: start, register, solve, events, queries, failures ----
  const logs: string[] = [];
  const crashes: string[] = [];
  const host = new CodeModHost(inProcessTransport(load), { solveMs: 300, startMs: 300, onLog: (id, t) => logs.push(`${id}: ${t}`), onCrash: (id, e) => crashes.push(`${id}: ${e}`) });
  {
    const m = await codeMod(`
      let seen = null;
      export default function activate(api) {
        api.register.solver('half', { name: 'Half', solve: (input) => ({ nets: Object.fromEntries(input.netlist.nets.map((n) => [n.id, n.id / 2])), parts: {} }) });
        api.register.solver('slow', { name: 'Slow', solve: () => new Promise(() => {}) });
        api.register.solver('bad', { name: 'Bad', solve: () => { throw new Error('nope'); } });
        api.on('board:loaded', (p) => { seen = p.title; api.log('loaded', p.title, api.queries.findRef('D1').found, api.queries.findRef('D9').matches.map((x) => x.ref).join()); });
        api.on('power:changed', () => api.log('rail', JSON.stringify(api.queries.railState('VCC'))));
        api.on('tests:run', () => { throw new Error('handler bug'); });
        setTimeout(() => { try { api.register.solver('late', { name: 'Late', solve: () => ({}) }); } catch (e) {} }, 0);
      }`);
    await host.start(m);
    assert(host.status('jane-code')?.state === 'running', 'running');
    assert(host.solvers().map((s) => s.address).join() === 'jane-code/solvers/half,jane-code/solvers/slow,jane-code/solvers/bad', 'solvers registered with addresses');
    await tick();
    assert(logs.some((l) => /after activate\(\) finished: ignored/.test(l)) && !host.solvers().some((s) => s.id === 'late'), 'late registration ignored');

    const sc = (await builtinScenarios()).find((s) => s.id === 'builtin-ghost-short')!;
    const conn = buildConnectivity(sc.board);
    const nl = buildNetlist(sc.board, conn, sc.meta.title, { SW1: true });
    const res = await host.solve('jane-code/solvers/half', { netlist: nl, meters: [] });
    assert(res.nets[3] === 1.5, `solve answered (${JSON.stringify(res).slice(0, 200)})`);
    await rejects(host.solve('jane-code/solvers/bad', { netlist: nl, meters: [] }), /nope/, 'solver error passed on');
    await rejects(host.solve('jane-code/solvers/nope', { netlist: nl, meters: [] }), /isn't running/, 'unknown solver');

    host.emit('board:loaded', { title: 'Ghost Short', netlist: nl });
    host.emit('power:changed', { on: true, nets: { VCC: 4.98 } });
    host.emit('tests:run', { passed: true, results: [] });
    await tick();
    assert(logs.some((l) => /loaded Ghost Short true D1/.test(l)), `events + findRef reached the mod (${logs.join(' | ')})`);
    assert(logs.some((l) => /rail \{"volts":4\.98,"powered":true\}/.test(l)), 'railState from the power event');
    assert(logs.some((l) => /tests:run handler failed: handler bug/.test(l)) && host.status('jane-code')?.state === 'running', 'a throwing handler is logged, the mod keeps running');

    await rejects(host.solve('jane-code/solvers/slow', { netlist: nl, meters: [] }), /took longer than 0\.3 s/, 'a hanging solve times out');
    assert(host.status('jane-code')?.state === 'crashed' && crashes.some((c) => /jane-code: the solver took longer/.test(c)), 'and stops the mod');
    assert(!host.solvers().length, 'a stopped mod has no solvers');
  }
  {
    await rejects(host.start(await codeMod('export default function activate() { throw new Error("broken on purpose"); }', 'jane-broken')), /broken on purpose/, 'activate() error');
    await rejects(host.start(await codeMod('const x = 1;', 'jane-nodefault')), /default export/, 'needs a default export');
    await rejects(host.start(await codeMod('export default function activate() { return new Promise(() => {}); }', 'jane-stuck')), /didn't finish starting within 0\.3 s/, 'stuck activate() times out');
    assert(host.status('jane-stuck')?.state === 'crashed', 'stuck mod marked crashed');
    host.stopAll();
  }

  // ---- netlist and untrusted results ----
  {
    const sc = (await builtinScenarios()).find((s) => s.id === 'builtin-tut-polarity')!;
    const board = structuredClone(sc.board);
    const conn = buildConnectivity(board);
    const nl = buildNetlist(board, conn, 'x');
    const d1 = nl.parts.find((p) => p.ref === 'D1')!;
    const bt = nl.parts.find((p) => p.kind === 'battery')!;
    assert(d1.vf && d1.pins.some((p) => p.role === 'A') && d1.pins.some((p) => p.role === 'K') && bt.rint && bt.pins.some((p) => p.role === '+'), 'roles, vf and battery rint');
    assert(nl.nets.length === conn.netCount && nl.nets.every((n, i) => n.id === i), 'net ids are the app\'s net indices');
    const sim = simFromResult(board, conn, { nets: { 0: 1.5, 1: NaN, 2: 'x' as never, 99999: 3, [-1]: 2 }, parts: { D1: { i: Infinity, v: 2, p: 0.1, on: 'yes' as never, bright: 7, over: true, overMsg: 'x'.repeat(500) }, NOPE: { i: 1, v: 1, p: 1 } } });
    const s1 = sim.comps.get(board.components.find((c) => c.ref === 'D1')!.id)!;
    assert(sim.nodeOfNet.size === 1 && sim.V[sim.nodeOfNet.get(0)!] === 1.5, 'only valid nets kept');
    assert(s1.i === 0 && s1.on === false && s1.bright === 1 && s1.over && s1.overMsg!.length === 200 && sim.comps.size === 1, 'part values sanitised, unknown refs ignored');
    const empty = simFromResult(board, conn, null as never);
    assert(empty.nodeOfNet.size === 0 && empty.comps.size === 0, 'garbage result reads as nothing');
  }

  // ---- the example solver against the official solvers ----
  const ex = await loadMod(folderSource('examples/mods/ideal-dc'));
  {
    const h2 = new CodeModHost(inProcessTransport(load), { onLog: () => {} });
    await h2.start(ex);
    const addr = 'ideal-dc/solvers/ideal-dc';
    assert(h2.solvers()[0]?.address === addr, 'example registers its solver');
    // boards that name their own solver (the transistor switch: SPICE) have parts this small DC example doesn't model
    for (const sc of (await builtinScenarios()).filter((s) => !s.solver)) {
      const board = structuredClone(referenceBoard(sc)!);
      const conn = buildConnectivity(board);
      const official = evaluateObjectives(board, conn, sc.objectives, sc.solver ?? 'fast');
      const mine = await evaluateObjectivesAsync(board, conn, sc.objectives, async (o, bd, cn) => simFromResult(bd, cn, await h2.solve(addr, { netlist: buildNetlist(bd, cn, sc.meta.title, o.switches), meters: o.meters })));
      assert(mine.allPassed === official.allPassed, `${sc.id}: example agrees with the official solver (${mine.results.map((r) => r.detail).join(' | ')})`);
      // and as shipped (broken), the flag stays locked under it
      const broken = await verifyScenario(sc, sc.board, 'fast', async (o, bd, cn) => simFromResult(bd, cn, await h2.solve(addr, { netlist: buildNetlist(bd, cn, sc.meta.title, o.switches), meters: o.meters })));
      assert(!broken.flag, `${sc.id}: no flag on the broken board`);
    }
    // the bench check of a code solver
    const r = await checkMods([ex], await shippedBoards(), undefined, h2);
    const f = r.findings.find((x) => x.item === addr);
    // it agrees on every board except the transistor switch (the example models no transistors, its
    // description says so) and the soldering-track boards (its LED is a fixed 1.89 V red drop; their red
    // LED runs at 9 mA, where SPICE reads 2.00 V): the bench check rightly warns the author about those
    const differs = (f?.text.split('Differs on: ')[1] ?? '').split('; ').map((x) => x.split(' (')[0]);
    assert(f?.level === 'warn' && /agrees with the official solvers on 11\b/.test(f.text)
      && differs.join('|') === 'Transistor Switch|Solder and Flux|Heat and Time|Clean and Inspect'
      && !r.findings.some((x) => x.level === 'fail'), `bench check: agrees everywhere but the transistor switch and the LED drop on the soldering track:\n${formatReport(r)}`);
    h2.stopAll();
    const noCode = await checkMods([ex], await shippedBoards());
    assert(noCode.findings.some((x) => x.level === 'warn' && /checked in the app/.test(x.text)), 'without a way to run code, the check says where it runs');
  }

  // ---- @deadboard/mod-api is current (npm run mod-api), the example download too ----
  {
    const files = apiPackageFiles(fs.readFileSync('src/mods/api/types.ts', 'utf8'));
    for (const [name, text] of Object.entries(files)) assert(fs.readFileSync(`packages/mod-api/${name}`, 'utf8') === text, `packages/mod-api/${name} is stale: run npm run mod-api`);
    assert(!/\bimport\b/.test(fs.readFileSync('examples/mods/ideal-dc/main.js', 'utf8')), 'the example obeys the import rule');
    const zipped = await readZip(new Uint8Array(fs.readFileSync('public/examples/ideal-dc.zip')));
    const folder = folderSource('examples/mods/ideal-dc');
    assert(zipped.size === folder.files.length, 'ideal-dc.zip is stale: run npm run example-mod');
    for (const f of folder.files) assert(new TextDecoder().decode(zipped.get(`ideal-dc/${f}`)!) === fs.readFileSync(`examples/mods/ideal-dc/${f}`, 'utf8'), `${f} in ideal-dc.zip is stale: run npm run example-mod`);
  }

  console.log('MOD CODE TESTS PASSED (manifest code + permissions, the import rule, host ↔ runtime: registration, solve, errors, events, queries, handler errors, hang / stuck / broken mods stopped; netlist roles, untrusted results sanitised; example solver = official on every shipped board without a SPICE-only part, no flag on broken boards; bench check of a code solver; mod-api package + example download current)');
}

run().catch((e) => { console.error(e); (globalThis as unknown as { process: { exitCode: number } }).process.exitCode = 1; });
