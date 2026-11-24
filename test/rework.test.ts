// Rework process physics: iron / hot air / preheat → reflow, plane heat-sinking, damage.
import type { Board, Component } from '../src/types';
import { ThermalModel } from '../src/thermal';
import { DEFAULT_LIMITS, HOTAIR_H, IRON_G, PREHEAT_H, ReworkMonitor, type ReworkEvent } from '../src/rework';
import { injectFault, rng } from '../src/faults';
import { installPart, toggleCold } from '../src/ops';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }

const part = (ref: string, kind: Component['kind'], nets: string[], at: [number, number], big = false): Component => ({
  id: ref, ref, kind, value: 1, at, rot: 0, side: 'F',
  pads: nets.map((n, i) => ({ name: String(i + 1), at: [big ? i * 2.0 - 1.0 : i * 1.0 - 0.5, 0], size: big ? [1.0, 1.3] : [0.6, 0.5], shape: 'rect', layers: 'F', net: n })),
  pins: { '1': '1', '2': '2' }, body: big ? { shape: 'box', w: 2.0, h: 1.25, z: 0.6 } : { shape: 'box', w: 1, h: 0.5, z: 0.5 },
  state: { populated: true, reversed: false, burnt: false, cold: [] },
});
function board(bigCap = false): Board {
  const comps = [part('R1', 'resistor', ['SA', 'SB'], [20, 20]), part('C1', 'capacitor', ['PP3V3', 'GND'], [50, 20], bigCap)];
  for (let k = 0; k < 30; k++) comps.push(part(`CX${k}`, 'capacitor', ['PP3V3', 'GND'], [10 + (k % 10) * 7, 30 + Math.floor(k / 10) * 4]));
  return { w: 90, h: 45, thickness: 1.0, components: comps, traces: [], vias: [], blobs: [], jumpers: [], zones: [], silk: [], texts: [], nextId: 1 };
}
function run(b: Board, secs: number, setup: (m: ThermalModel, rw: ReworkMonitor) => void) {
  const m = new ThermalModel(b), rw = new ReworkMonitor(b, m);
  setup(m, rw);
  const events: (ReworkEvent & { t: number })[] = [];
  for (let t = 0; t < secs; t += 0.05) { m.step(0.05); for (const e of rw.update(0.05)) events.push({ ...e, t: t + 0.05 }); }
  return { m, rw, events, first: (k: string, ref?: string) => events.find((e) => e.kind === k && (!ref || e.ref === ref)) };
}
const iron = (m: ThermalModel, x: number, partId: string, temp = 350, g: number = IRON_G.flux, dur = 4) =>
  m.addSource({ kind: 'iron', x, y: 20, temp, g, pmax: 60, until: m.time + dur, partId });

function main() {
  // reflow with flux on a signal pad: quick, fixes the cold joint
  const sig = (() => { const b = board(); b.components[0].state.cold = [0]; const r = run(b, 3, (m, rw) => { rw.applyFlux(20, 20); iron(m, 19.5, 'R1'); }); return { r, b }; })();
  const tSig = sig.r.first('reflowed', 'R1')?.t;
  assert(tSig !== undefined && tSig < 1.5, `iron + flux reflows a signal pad in < 1.5 s (got ${tSig})`);
  assert(!sig.b.components[0].state.cold.includes(0), 'reflow fixed the cold joint');

  // the same joint on a ground-plane pad takes longer (heat sinks into the plane through its vias)
  // (lead-free SAC305 is liquid only from 220 °C: at 350 °C a plane pad sits just above it, so it takes seconds)
  const gnd = (() => { const b = board(); b.components[1].state.cold = [1]; return run(b, 8, (m, rw) => { rw.applyFlux(50, 20); iron(m, 50.5, 'C1', 350, IRON_G.flux, 8); }); })();
  const tGnd = gnd.first('reflowed', 'C1')?.t;
  assert(tGnd !== undefined && tGnd > tSig!, `ground-plane pad needs longer than a signal pad (${tGnd} s vs ${tSig} s)`);

  // dry tip (no flux): poor heat transfer, much slower to melt
  const dry = run(board(), 6, (m) => iron(m, 19.5, 'R1', 350, IRON_G.dry, 6));
  const fluxMolten = run(board(), 3, (m, rw) => { rw.applyFlux(20, 20); iron(m, 19.5, 'R1'); }).first('molten', 'R1')?.t ?? 99;
  assert((dry.first('molten', 'R1')?.t ?? 99) > fluxMolten * 2, 'without flux the part melts far more slowly');

  // overheating: part damage, then lifted pad that neither reflow nor a new part can fix
  {
    const b = board();
    // signal pads lift; plane-stitched ground pads are hard to overheat (vias sink the heat)
    const r = run(b, 20, (m, rw) => { rw.applyFlux(20, 20); iron(m, 19.5, 'R1', 450, IRON_G.flux, 20); });
    assert(r.first('part-overheated', 'R1'), 'prolonged 450 °C overheats the part');
    const lift = r.first('pad-lifted', 'R1');
    assert(lift, `prolonged overheating lifts the signal pad (events: ${r.events.map((e) => e.kind).join(',')})`);
    const g = run(board(), 20, (m, rw) => { rw.applyFlux(50, 20); iron(m, 50.5, 'C1', 450, IRON_G.flux, 20); });
    assert(!g.first('pad-lifted'), 'the same abuse on a ground-plane pad does not lift it');
    const c1 = b.components[0];
    const pi = lift!.pad!;
    toggleCold(c1, pi);
    assert(c1.state.cold.includes(pi), 'a lifted pad cannot be reflowed back');
    installPart(c1, { value: 1e-6 });
    assert(c1.state.cold.includes(pi), 'a new part does not bond to a lifted pad (needs a jumper wire)');
  }

  // MLCC thermal shock: a cold 0805 cracks under the iron, a preheated one does not
  {
    const cold = run(board(true), 3, (m, rw) => { rw.applyFlux(50, 20); iron(m, 51, 'C1', 380); });
    assert(cold.first('mlcc-cracked', 'C1') && board(true) && cold.rw, 'un-preheated 0805 cracks under the iron');
    const pre = run(board(true), 3, (m, rw) => {
      rw.applyFlux(50, 20); m.addSource({ kind: 'preheat', temp: 150, h: PREHEAT_H, until: m.time + 200 }); m.step(60); iron(m, 51, 'C1', 380);
    });
    assert(!pre.first('mlcc-cracked'), 'preheated 0805 survives the iron');
  }

  // hot air with preheat: normal flow melts a small part, high flow blows it off its pad
  {
    const pre = (m: ThermalModel) => { m.addSource({ kind: 'preheat', temp: 150, h: PREHEAT_H, until: m.time + 200 }); m.step(60); };
    const normal = run(board(), 25, (m) => { pre(m); m.addSource({ kind: 'hotair', x: 20, y: 20, r: 4, temp: 400, h: HOTAIR_H.normal, until: m.time + 25 }); });
    assert(normal.first('molten', 'R1'), 'preheat + hot air (normal flow) melts the 0402 so it can be lifted');
    assert(!normal.first('part-displaced'), 'normal airflow does not blow the part away');
    const high = run(board(), 25, (m) => { pre(m); m.addSource({ kind: 'hotair', x: 20, y: 20, r: 4, temp: 400, h: HOTAIR_H.high, until: m.time + 25 }); });
    assert(HOTAIR_H.high > DEFAULT_LIMITS.blowAwayH && high.first('part-displaced', 'R1'), 'high airflow tombstones a molten 0402');
  }

  // a thermally cracked joint (intermittent) is cured by a proper reflow
  {
    const b = board();
    injectFault(b.components[0], 'thermal-open-joint', rng(4), { pad: 0, severity: 60 });
    run(b, 3, (m, rw) => { rw.applyFlux(20, 20); iron(m, 19.5, 'R1'); });
    assert(!b.components[0].state.intermittent, 'reflow with the iron cures the cracked joint');
  }
  console.log(`REWORK TESTS PASSED (reflow ${tSig!.toFixed(2)} s signal / ${tGnd!.toFixed(2)} s ground pad, dry tip, overheat + lifted pad, MLCC shock vs preheat, hot-air melt vs blow-off, intermittent cure)`);
}

main();
