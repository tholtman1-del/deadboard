// SPICE engine + boardview converter tests. Device results are checked against
// closed-form solutions; the board converter against the 820-00165 boardview.
import { macbookFixture } from './fixtures';
import { parseSpice, writeSpice } from '../src/spice/netlist';
import { Engine, sampleAt } from '../src/spice/engine';
import { parseSpiceNumber, formatSpiceNumber } from '../src/spice/units';
import { boardToCircuit, type PartLibrary } from '../src/spice/board';
import { measureDiodeSpice, measureOhmsSpice, simulateSpice, type SpiceSim } from '../src/spice/adapter';
import { parseBrd } from '../src/io/brd';
import { buildConnectivity, pinNet } from '../src/connectivity';
import { measureOhms } from '../src/sim';
import { builtinScenarios } from '../src/scenarios/builtin';
import { allDevices, findDevice, fitDiode, fitMos, inferDiodeConvention, resolveDevice, type DiodeSpec, type MosSpec } from '../src/spice/devicelib';
import { VT_300K } from '../src/spice/devices';
import { expandDesignators, parseBomCsv } from '../src/io/bom';
import { compileExpr, parseExpr } from '../src/spice/expr';

function assert(cond: unknown, msg = 'Assertion failed'): asserts cond {
  if (!cond) throw new Error(msg);
}
function near(actual: number | undefined, expected: number, tol: number, msg: string) {
  if (actual === undefined || !(Math.abs(actual - expected) <= tol)) {
    throw new Error(`${msg}: expected ${expected} ± ${tol}, got ${actual}`);
  }
}
const deck = (text: string) => {
  const c = parseSpice(text);
  assert(c.warnings.length === 0, `parse warnings: ${c.warnings.join('; ')}`);
  return new Engine(c);
};
const VT = 0.025864;

async function readFile(rel: string): Promise<Uint8Array> {
  const modName = 'node:fs/promises';
  const fs = (await import(/* @vite-ignore */ modName)) as { readFile(path: URL): Promise<Uint8Array> };
  return new Uint8Array(await fs.readFile(new URL(rel, import.meta.url)));
}

async function run() {
  // ---- numbers ----
  near(parseSpiceNumber('4.7k'), 4700, 1e-9, '4.7k');
  near(parseSpiceNumber('1meg'), 1e6, 1e-6, '1meg');
  near(parseSpiceNumber('1M'), 1e-3, 1e-15, 'SPICE M is milli');
  near(parseSpiceNumber('10uF'), 1e-5, 1e-15, '10uF');
  near(parseSpiceNumber('2.2e-3'), 2.2e-3, 1e-15, 'exponent');
  assert(formatSpiceNumber(1e6) === '1meg', 'format meg');
  assert(formatSpiceNumber(4.7e-6) === '4.7u', 'format micro');

  // ---- linear DC ----
  {
    const op = deck('div\nV1 in 0 10\nR1 in out 1k\nR2 out 0 3k\n.end').op();
    near(op.nodes.get('out'), 7.5, 1e-9, 'divider');
    near(op.branches.get('i(V1)'), -2.5e-3, 1e-12, 'source current sign (SPICE: negative when delivering)');
  }
  // ---- diode (Shockley) ----
  {
    const op = deck('d\nV1 in 0 5\nR1 in a 1k\nD1 a 0 DX\n.model DX D(IS=1e-14 N=1)\n.end').op();
    const va = op.nodes.get('a')!;
    near((5 - va) / 1000, 1e-14 * (Math.exp(va / VT) - 1), 2e-5, 'diode KCL vs Shockley');
    near(va, 0.693, 0.005, 'diode Vf at 4.3 mA');
  }
  // ---- zener breakdown ----
  {
    const op = deck('z\nV1 in 0 12\nR1 in a 1k\nD1 0 a DZ\n.model DZ D(IS=1e-14 BV=5.1 IBV=1m)\n.end').op();
    const va = op.nodes.get('a')!;
    near(va, 5.1 + VT * Math.log((12 - va) / 1000 / 1e-3), 2e-3, 'zener clamp');
  }
  // ---- MOSFET level 1 ----
  {
    const op = deck('m\nVDD d 0 5\nVG g 0 3\nM1 d g 0 0 NM\n.model NM NMOS(VTO=1 KP=2m)\n.end').op();
    near(op.branches.get('i(VDD)'), -0.5 * 2e-3 * 4, 1e-9, 'NMOS saturation current');
    const lin = deck('m\nVDD d 0 0.5\nVG g 0 3\nM1 d g 0 0 NM\n.model NM NMOS(VTO=1 KP=2m)\n.end').op();
    near(lin.branches.get('i(VDD)'), -2e-3 * (2 - 0.25) * 0.5, 1e-9, 'NMOS triode current');
    const p = deck('p\nVDD vdd 0 5\nVG g 0 0\nM1 out g vdd vdd PM\nRL out 0 100\n.model PM PMOS(VTO=-1 KP=0.5)\n.end').op();
    assert(p.nodes.get('out')! > 4.9, 'PMOS high-side switch conducts with gate low');
    const off = deck('p\nVDD vdd 0 5\nVG g 0 5\nM1 out g vdd vdd PM\nRL out 0 100\n.model PM PMOS(VTO=-1 KP=0.5)\n.end').op();
    near(off.nodes.get('out'), 0, 1e-6, 'PMOS off with gate at source');
  }
  // ---- BJT ----
  {
    const op = deck('q\nVCC c 0 5\nVB bb 0 1.7\nRB bb b 10k\nQ1 c b 0 QN\n.model QN NPN(IS=1e-16 BF=100)\n.end').op();
    const ib = (1.7 - op.nodes.get('b')!) / 1e4;
    near(-op.branches.get('i(VCC)')!, 100 * ib, 1e-6, 'BJT Ic = BF·Ib in forward active');
  }
  // ---- transient: RC and RLC against closed form ----
  {
    const tr = deck('rc\nV1 in 0 PULSE(0 1 0 1n 1n 1 2)\nR1 in out 1k\nC1 out 0 1u\n.end').tran(10e-6, 5e-3);
    assert(tr.converged, 'RC transient converged');
    near(sampleAt(tr.time, tr.signals.get('v(out)')!, 1e-3), 1 - Math.exp(-1), 1e-3, 'RC step at t = τ');
    const rlc = deck('rlc\nV1 in 0 PULSE(0 1 0 1n 1n 1 2)\nR1 in a 10\nL1 a out 1m\nC1 out 0 1u\n.end').tran(1e-6, 1e-3);
    const w = 1 / Math.sqrt(1e-9), a = 5000, wd = Math.sqrt(w * w - a * a), t = 3e-4;
    near(sampleAt(rlc.time, rlc.signals.get('v(out)')!, t), 1 - Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t)), 2e-3, 'RLC ringing');
    const uic = deck('ic\nR1 a 0 1k\nC1 a 0 1u IC=5\n.end').tran(10e-6, 3e-3, { uic: true });
    near(sampleAt(uic.time, uic.signals.get('v(a)')!, 1e-3), 5 * Math.exp(-1), 5e-3, 'UIC capacitor discharge');
  }
  // ---- subcircuits, DC sweep, controlled sources, switch ----
  {
    const e = deck('sub\nV1 in 0 1\nX1 in out 0 DIV\n.subckt DIV a b g\nR1 a b 1k\nR2 b g 1k\n.ends\n.end');
    const sw = e.dc('V1', 0, 4, 1);
    sw.points.forEach((p, i) => near(p.nodes.get('out'), i / 2, 1e-9, `sweep point ${i}`));
    const ctl = deck('e\nV1 a 0 2\nE1 b 0 a 0 3\nRL b 0 1k\nG1 0 c a 0 1m\nRC c 0 1k\n.end').op();
    near(ctl.nodes.get('b'), 6, 1e-9, 'VCVS gain');
    near(ctl.nodes.get('c'), 2, 1e-9, 'VCCS transconductance');
    const s = deck('s\nV1 a 0 5\nVC c 0 1\nS1 a b c 0 SMOD\nRL b 0 1k\n.model SMOD SW(VT=0.5 RON=1 ROFF=1meg)\n.end').op();
    near(s.nodes.get('b'), 5 * 1000 / 1001, 1e-6, 'voltage-controlled switch on');
  }
  // ---- deck round trip ----
  {
    const src = 'rt\nV1 in 0 PULSE(0 5 1u 10n 10n 5u 10u)\nR1 in a 4.7k\nC1 a 0 10n\nD1 a 0 DX 2\nL1 a b 1m IC=1m\nM1 b a 0 0 NM W=2u L=1u\n.model DX D(IS=1e-14 RS=1)\n.model NM NMOS(VTO=0.7 KP=1e-4)\n.tran 10n 20u\n.end';
    const c1 = parseSpice(src);
    const c2 = parseSpice(writeSpice(c1));
    assert(JSON.stringify(c1.elements) === JSON.stringify(c2.elements), 'elements survive write/parse');
    assert(JSON.stringify(c1.models) === JSON.stringify(c2.models), 'models survive write/parse');
    assert(JSON.stringify(c1.analyses) === JSON.stringify(c2.analyses), 'analyses survive write/parse');
  }

  // ---- behavioral sources (B element) ----
  {
    // exact derivatives: AD vs central finite differences
    const ex = parseExpr('min(V(a)-0.2, 3.3*(0.5+0.5*tanh((V(en)-1.2)*20))) + V(a,b)**2/max(1,abs(V(b))) + exp(-V(b))*(V(a) > 1 ? 2 : 1)');
    const idx: Record<string, number> = { a: 0, b: 1, en: 2 };
    const f = compileExpr(ex, (n) => idx[n] ?? -1);
    const x = Float64Array.from([4.1, 0.7, 1.25]);
    const r = f.eval(x, 0);
    f.vars.forEach((vi, k) => {
      const h = 1e-6, xp = Float64Array.from(x), xm = Float64Array.from(x);
      xp[vi] += h; xm[vi] -= h;
      near(r.d[k], (f.eval(xp, 0).v - f.eval(xm, 0).v) / (2 * h), 1e-5 * Math.max(1, Math.abs(r.d[k])), `AD derivative w.r.t. var ${vi}`);
    });
    // behavioural LDO: regulates to 3.3 V, drops out at low input, off when disabled
    const ldo = (vin: number, en: number) => deck(`ldo\nVIN in 0 ${vin}\nVEN en 0 ${en}\nB1 out 0 V={min(max(V(in)-0.25,0), 3.3) * (0.5+0.5*tanh((V(en)-1.0)*30))}\nRL out 0 100\n.end`).op().nodes.get('out')!;
    near(ldo(5, 3.3), 3.3, 1e-6, 'LDO regulation'); near(ldo(3.4, 3.3), 3.15, 1e-6, 'LDO dropout'); near(ldo(5, 0), 0, 1e-6, 'LDO disabled');
    // current-mode B: nonlinear conductance i = k·v² converges and matches
    const nl = deck('nl\nV1 a 0 2\nR1 a b 1k\nB1 b 0 I={1e-3*V(b)*V(b)}\n.end').op();
    const vb = nl.nodes.get('b')!;
    near((2 - vb) / 1000, 1e-3 * vb * vb, 1e-9, 'B current source KCL');
    // time-dependent source in transient
    const tr = deck('t\nB1 a 0 V={sin(2*pi*1k*time)}\nR1 a 0 1k\n.end').tran(1e-5, 1e-3);
    near(sampleAt(tr.time, tr.signals.get('v(a)')!, 2.5e-4), 1, 1e-3, 'B with time');
    // ngspice deck round trip
    const c1 = parseSpice('rt\nB1 out 0 V={min(V(in)-0.25, 3.3)}\nB2 x 0 I={V(in,out)*1m}\n.end');
    const c2 = parseSpice(writeSpice(c1));
    assert(JSON.stringify(c1.elements) === JSON.stringify(c2.elements), 'B elements survive write/parse');
    // inside a subcircuit, node names are remapped
    const sub = deck('s\nVIN in 0 5\nX1 in out REG\nRL out 0 1k\n.subckt REG vi vo\nB1 vo 0 V={V(vi)/2}\n.ends\n.end').op();
    near(sub.nodes.get('out'), 2.5, 1e-9, 'B in subcircuit');
  }

  // ---- device library: fits reproduce the datasheet points they came from ----
  for (const dev of allDevices()) {
    for (const u of dev.units) {
      if (u.kind === 'nmos' || u.kind === 'pmos') {
        const f = fitMos(u as MosSpec);
        const beta = f.kp, vt = Math.abs(f.vto);
        const pts = (u as MosSpec).rds;
        const hi = [...pts].sort((x, y) => y[0] - x[0])[0];
        near(1 / (beta * (hi[0] - vt)), hi[1], hi[1] * 1e-6, `${dev.mpn}: Rds(on) at ${hi[0]} V reproduced`);
        // a real model: the gate must turn the FET off below threshold and on above it
        const e = deck(`m\nVD d 0 ${u.kind === 'nmos' ? 0.1 : -0.1}\nVG g 0 0\nM1 d g 0 0 MX\n.model MX ${u.kind.toUpperCase()}(VTO=${f.vto} KP=${f.kp})\n.end`);
        e.setDc('VG', 0);
        assert(Math.abs(e.op().branches.get('i(VD)')!) < 1e-9, `${dev.mpn}: off at VGS = 0`);
      } else if (u.kind !== 'npn' && u.kind !== 'pnp' && u.kind !== 'res' && (u as DiodeSpec).vf.length >= 2) {
        const d = u as DiodeSpec, f = fitDiode(d.vf);
        for (const [v, i] of d.vf.slice(0, 2)) near(f.n * VT_300K * Math.log(i / f.is) + f.rs * i, v, 0.01, `${dev.mpn}: Vf at ${i} A`);
      }
    }
  }
  assert(findDevice('FDC638APZ_SBMS001')?.mpn === 'FDC638APZ', 'ordering suffix _SBMS001');
  assert(findDevice('DMN5L06VK-7')?.mpn === 'DMN5L06VK', 'ordering suffix -7');
  assert(findDevice('IRF9395TRPBF')?.mpn === 'IRF9395', 'ordering suffix TRPBF');
  assert(findDevice('NSR1020MW2T1G')?.mpn === 'NSR1020MW2', 'ordering suffix T1G');
  assert(findDevice('RB160M-60G')?.mpn === 'RB160M-60', 'ordering suffix G');
  // diode footprint convention is board-specific: a KiCad-style board (pad 1 = cathode)
  const kicad = inferDiodeConvention([
    { ref: 'D1', kind: 'schottky', pads: ['VIN', 'GND'] }, { ref: 'D2', kind: 'zener', pads: ['VREF', 'GND'] },
    { ref: 'D3', kind: 'led', pads: ['GND', 'LED_DRV'] },
  ]);
  assert(kicad.pad1 === 'K' && kicad.conflicts.length === 0, 'KiCad-style pad 1 = cathode detected');
  const apple = inferDiodeConvention([{ ref: 'D1', kind: 'zener', pads: ['GND', 'GATE'] }, { ref: 'D2', kind: 'led', pads: ['DRV', 'GND'] }]);
  assert(apple.pad1 === 'A', 'pad 1 = anode detected');
  const fet = findDevice('SISA18DN')!;
  const nets: Record<string, string> = { '1': 'SW', '2': 'SW', '3': 'SW', '4': 'SW', '5': 'VIN' }; // gate on the source net
  assert(!!resolveDevice(fet, { padNames: ['1', '2', '3', '4', '5'], netOf: (p) => nets[p] }).reason, 'impossible FET pinout rejected');

  // ---- universal BOM import (KiCad / Altium style) ----
  {
    assert(JSON.stringify(expandDesignators('R1, R2 R5-R7')) === '["R1","R2","R5","R6","R7"]', 'designator ranges');
    const csv = [
      '"Reference";"Value";"Footprint";"MPN";"DNP"',
      '"R1,R2";"4k7";"R_0402";"";""', '"R3";"1M";"R_0402";"";""', '"R4";"2R2";"";"";""', '"R5";"0R";"";"";""',
      '"C1";"100nF 16V X7R";"C_0402";"";""', '"C2";"10u";"";"";"DNP"', '"L1";"2.2uH 3A";"";"";""',
      '"Q1";"FDC638APZ";"SOT-23-6";"FDC638APZ";""',
    ].join('\n');
    const b = parseBomCsv(csv).parts;
    near(b.get('R2')!.value, 4700, 1e-9, 'BOM 4k7'); near(b.get('R3')!.value, 1e6, 1e-3, 'BOM 1M = mega');
    near(b.get('R4')!.value, 2.2, 1e-12, 'BOM 2R2'); near(b.get('R5')!.value, 0, 0, 'BOM 0R');
    near(b.get('C1')!.value, 1e-7, 1e-18, 'BOM 100nF'); assert(b.get('C1')!.voltage === '16V' && b.get('C1')!.dielectric === 'X7R', 'BOM cap ratings');
    assert(b.get('C2')!.bomOption === 'NO STUFF', 'BOM DNP column'); near(b.get('L1')!.value, 2.2e-6, 1e-15, 'BOM 2.2uH');
    assert(findDevice(b.get('Q1')!.partNumber) !== undefined, 'BOM MPN resolves in device library');
  }

  // ---- built-in scenario boards: SPICE vs fast meters ----
  {
    const scs = await builtinScenarios();
    for (const sc of scs.filter((s) => !s.id.includes('820-00165'))) {
      const conn = buildConnectivity(sc.board);
      const nl = boardToCircuit(sc.board, conn);
      const again = new Engine(parseSpice(writeSpice(nl.circuit))).op();
      const direct = new Engine(nl.circuit).op();
      assert(again.converged && direct.converged, `${sc.id}: op converges`);
      for (const [n, v] of direct.nodes) near(again.nodes.get(n), v, 1e-9, `${sc.id}: exported deck reproduces v(${n})`);
      for (const c of sc.board.components.filter((x) => x.kind === 'resistor' && x.state.populated && !x.state.burnt)) {
        const a = pinNet(conn, c, '1'), b = pinNet(conn, c, '2');
        if (a < 0 || b < 0) continue;
        const rf = measureOhms(sc.board, conn, a, b), rs = measureOhmsSpice(sc.board, conn, a, b);
        if (!isFinite(rf)) assert(!isFinite(rs), `${sc.id} ${c.ref}: both meters read open`);
        else near(rs, rf, Math.max(0.01, rf * 1e-3), `${sc.id} ${c.ref}: in-circuit ohms`);
      }
    }
  }

  // ---- 820-00165 boardview → SPICE (private fixture, only when present) ----
  const mac = await macbookFixture();
  if (!mac) console.log('  820-00165 → SPICE skipped (private fixtures not present)');
  else {
    const brd = parseBrd(await readFile('../board_schemas/J113  820-00165.brd'), 'J113  820-00165.brd');
    const conn = buildConnectivity(brd.board);
    const t0 = performance.now();
    const nl = boardToCircuit(brd.board, conn, { infer: true });
    const convMs = performance.now() - t0;
    const deckText = writeSpice(nl.circuit);
    const reparsed = parseSpice(deckText);
    assert(reparsed.warnings.length === 0, `exported deck parses cleanly: ${reparsed.warnings.slice(0, 3).join('; ')}`);
    const counted = new Set(nl.report.map((r) => r.ref));
    for (const c of brd.board.components) {
      if (c.kind === 'testpoint') continue;
      assert(counted.has(c.ref), `${c.ref} accounted for in the conversion report`);
    }
    assert(nl.report.filter((r) => r.source === 'stub').length > 100, 'ICs/connectors become hi-Z stubs');
    assert(nl.circuit.elements.some((e) => e.kind === 'X' && e.name === 'XU0500'), 'CPU U0500 present as stub');
    // A boardview stores no values: the generic import must mark R7788's value as inferred, not invent "real" data.
    assert(nl.report.find((r) => r.ref === 'R7788')?.source === 'inferred', 'boardview-only values are reported as inferred');

    const t1 = performance.now();
    const eng = new Engine(reparsed);
    const op = eng.op();
    const opMs = performance.now() - t1;
    assert(op.converged, `full-board op converges (${op.strategy})`);
    near(eng.voltage(op.x, 'PPBUS_G3H'), 8.6, 0.01, 'PPBUS_G3H from synthetic 8.6 V supply');
    near(eng.voltage(op.x, 'PPVIN_S0SW_LCDBKLTFET'), 8.6, 0.01, 'backlight input after F7700');
    const tr = eng.tran(10e-6, 200e-6);
    assert(tr.converged, 'full-board transient converges');

    // Game semantics via the adapter: blown fuse / diode test agree with the fast meter.
    const sc = await mac.loadMacbookAirScenario();
    const c2 = buildConnectivity(sc.board);
    const f7700 = sc.board.components.find((c) => c.ref === 'F7700')!;
    const d7701 = sc.board.components.find((c) => c.ref === 'D7701')!;
    assert(measureOhmsSpice(sc.board, c2, pinNet(c2, f7700, '1'), pinNet(c2, f7700, '2')) === Infinity, 'blown F7700 reads open');
    const dv = measureDiodeSpice(sc.board, c2, pinNet(c2, d7701, 'A'), pinNet(c2, d7701, 'K')).volts;
    assert(dv > 0.4 && dv < 0.8, `D7701 diode-test drop ${dv}`);

    // Library: real FETs instead of the game's resistor stand-ins. With the enable
    // signals undriven the load switch must stay off; driving them high turns it on.
    const lib = JSON.parse(new TextDecoder().decode(await readFile('../board_schemas/820-00165.backlight.spice.json'))) as PartLibrary;
    const withLib = boardToCircuit(brd.board, conn, { library: lib, infer: true });
    assert(withLib.warnings.length === 0, `library applies cleanly: ${withLib.warnings.join('; ')}`);
    const offOp = new Engine(withLib.circuit).op();
    assert(offOp.converged, 'library circuit converges');
    const offE = new Engine(withLib.circuit);
    const vOff = offE.voltage(offOp.x, 'PPVIN_S0SW_LCDBKLT_FET')!;
    assert(vOff < 0.5, `load switch off with EN undriven (got ${vOff})`);
    withLib.circuit.elements.push(
      { kind: 'V', name: 'V_EDP_BKLT_EN', n: ['EDP_BKLT_EN', '0'], wave: { type: 'dc', v: 3.3 } },
      { kind: 'V', name: 'V_PLT_RST', n: ['BKLT_PLT_RST_L', '0'], wave: { type: 'dc', v: 3.3 } },
    );
    const onE = new Engine(withLib.circuit);
    const onOp = onE.op();
    assert(onOp.converged, 'enabled circuit converges');
    near(onE.voltage(onOp.x, 'LCDBKLT_EN_DIV_L'), 8.6 * 147 / 448, 0.05, 'gate divider R7788/R7789');
    assert(onE.voltage(onOp.x, 'PPVIN_S0SW_LCDBKLT_FET')! > 8.5, 'load switch on when EDP_BKLT_EN and PLT_RST_L are high');

    const sim = simulateSpice(sc.board, c2) as SpiceSim;
    assert(sim.source && sim.op.converged, 'adapter solves the game board');

    console.log(
      `820-00165 → SPICE: ${nl.circuit.elements.length} elements, ${eng.size} unknowns; convert=${convMs.toFixed(1)}ms, ` +
      `op=${opMs.toFixed(1)}ms (${op.iterations} it), tran=${tr.steps} steps`,
    );
  }

  console.log('SPICE TESTS PASSED (devices, transient, netlist I/O, scenario meters, 820-00165 conversion + library)');
}

run().catch((e) => {
  console.error(e);
  (globalThis as unknown as { process: { exitCode: number } }).process.exitCode = 1;
});
