import type { Board, Component, LedColor, Pad, Side, V2 } from '../types';
import { rot } from '../geom';
import type { TerminalType } from '../terminals';

export function emptyBoard(w: number, h: number): Board {
  return { w, h, thickness: 1.6, components: [], traces: [], vias: [], blobs: [], jumpers: [], zones: [], silk: [], texts: [], nextId: 1 };
}

const tht = (name: string, at: V2, d = 1.8, shape: Pad['shape'] = 'circle', drill = 0.9): Pad =>
  ({ name, at, size: [d, d], shape, layers: 'FB', drill });

type CompInit = Omit<Component, 'id' | 'state' | 'side'> & { side?: Side; closed?: boolean };

/** Small DSL for authoring boards in code. */
export class Builder {
  b: Board;
  constructor(w: number, h: number) { this.b = emptyBoard(w, h); }

  private comp(c: CompInit): Component {
    const { closed, ...rest } = c;
    const comp: Component = {
      id: 'c' + (this.b.nextId++).toString(36), side: 'F',
      state: { populated: true, reversed: false, burnt: false, cold: [], closed: !!closed },
      ...rest,
    };
    this.b.components.push(comp);
    return comp;
  }

  resistor(ref: string, ohms: number, at: V2, r = 0, pitch = 10.16) {
    return this.comp({
      ref, kind: 'resistor', value: ohms, at, rot: r,
      pads: [tht('1', [-pitch / 2, 0]), tht('2', [pitch / 2, 0])], pins: { '1': '1', '2': '2' },
      body: { shape: 'axial', w: 6.3, h: 2.5, z: 3.4 },
    });
  }

  led(ref: string, color: LedColor, at: V2, r = 0) {
    return this.comp({
      ref, kind: 'led', value: 0, color, at, rot: r,
      pads: [tht('1', [-1.27, 0], 1.8, 'rect'), tht('2', [1.27, 0])], pins: { A: '2', K: '1' },
      body: { shape: 'led', w: 5, h: 5, z: 8.6 },
    });
  }

  diode(ref: string, at: V2, r = 0, pitch = 10.16) {
    return this.comp({
      ref, kind: 'diode', value: 0.7, at, rot: r,
      pads: [tht('1', [-pitch / 2, 0], 1.9, 'rect'), tht('2', [pitch / 2, 0])], pins: { A: '2', K: '1' },
      body: { shape: 'axial', w: 5.2, h: 2.7, z: 2.8 },
    });
  }

  coin(ref: string, volts: number, at: V2) {
    return this.comp({
      ref, kind: 'battery', value: volts, label: 'CR2032', at, rot: 0,
      pads: [tht('1', [-12, 0], 2.6, 'rect', 1.2), tht('2', [12, 0], 2.6, 'circle', 1.2)], pins: { '+': '1', '-': '2' },
      body: { shape: 'coin', w: 20, h: 20, z: 3.4 },
    });
  }

  header(ref: string, volts: number, at: V2, r = 0, label = 'DC IN') {
    return this.comp({
      ref, kind: 'battery', value: volts, label, at, rot: r,
      pads: [tht('1', [0, -1.27], 1.7, 'rect', 1.0), tht('2', [0, 1.27], 1.7, 'circle', 1.0)], pins: { '+': '1', '-': '2' },
      body: { shape: 'header', w: 2.54, h: 5.08, z: 8.5 },
    });
  }

  tactile(ref: string, at: V2) {
    return this.comp({
      ref, kind: 'switch', value: 0, at, rot: 0, closed: false,
      pads: [tht('1', [-3.25, -2.25], 2, 'circle', 1), tht('1', [-3.25, 2.25], 2, 'circle', 1),
        tht('2', [3.25, -2.25], 2, 'circle', 1), tht('2', [3.25, 2.25], 2, 'circle', 1)],
      pins: { '1': '1', '2': '2' },
      body: { shape: 'tactile', w: 6, h: 6, z: 5 },
    });
  }

  fuse(ref: string, amps: number, at: V2, r = 0, pitch = 12.7) {
    return this.comp({
      ref, kind: 'fuse', value: amps, at, rot: r,
      pads: [tht('1', [-pitch / 2, 0], 2), tht('2', [pitch / 2, 0], 2)], pins: { '1': '1', '2': '2' },
      body: { shape: 'fuse', w: 8.5, h: 2.6, z: 3.6 },
    });
  }

  /**
   * A small transistor in a TO-92 package: three pads in a row, the D-shaped body standing in front
   * of them, flat face forward. `mpn` names a part in the SPICE device library (src/spice/devicelib.ts),
   * which models it and maps its pins (2N3904: pad 1 E, 2 B, 3 C); the fast solver has no transistor,
   * so a board with one sets `solver: 'spice'`.
   */
  to92(ref: string, mpn: string, at: V2, r = 0, pins: Record<string, string> = { E: '1', B: '2', C: '3' }) {
    return this.comp({
      ref, kind: 'generic', value: 0, label: mpn, at, rot: r,
      pads: [tht('1', [-2.54, 0], 1.6, 'rect', 0.8), tht('2', [0, 0], 1.6, 'circle', 0.8), tht('3', [2.54, 0], 1.6, 'circle', 0.8)],
      pins,
      body: { shape: 'to92', w: 4.8, h: 3.6, z: 4.6, off: [0, -2.9] },
    });
  }

  /**
   * A metal-can transistor (TO-39, the 3-lead TO-5 family): leads on a 5.08 mm (0.200 in) circle,
   * E and C opposite each other, B between them on the side of the tab (seen from the top at rot 0:
   * E left, B up, C right); can ≈ 8.9 mm across, 6.3 mm tall (typical, estimate).
   */
  to5(ref: string, mpn: string, at: V2, r = 0, pins: Record<string, string> = { E: '1', B: '2', C: '3' }) {
    return this.comp({
      ref, kind: 'generic', value: 0, label: mpn, at, rot: r,
      pads: [tht('1', [-2.54, 0], 1.6, 'rect', 0.9), tht('2', [0, 2.54], 1.6, 'circle', 0.9), tht('3', [2.54, 0], 1.6, 'circle', 0.9)],
      pins,
      body: { shape: 'to5', w: 8.9, h: 8.9, z: 6.3 },
    });
  }

  /**
   * A through-hole DIP: `pins` pads on a 2.54 mm pitch, rows 7.62 mm apart, seen from the top with
   * pin 1 bottom left: 1 … n/2 left to right along the bottom row, then back along the top row.
   * `label` names a part in the SPICE device library (src/spice/devicelib.ts), which models it.
   */
  dip(ref: string, label: string, at: V2, pins = 16) {
    const half = pins / 2, x0 = -((half - 1) * 2.54) / 2;
    const pads = Array.from({ length: pins }, (_, i) => {
      const bottom = i < half, k = bottom ? i : pins - 1 - i;
      return tht(String(i + 1), [x0 + k * 2.54, bottom ? 3.81 : -3.81], 1.6, i === 0 ? 'rect' : 'circle', 0.8);
    });
    return this.comp({
      ref, kind: 'generic', value: 0, label, at, rot: 0,
      pads, pins: Object.fromEntries(pads.map((p) => [p.name, p.name])),
      body: { shape: 'chip', w: half * 2.54 + 0.6, h: 6.4, z: 3.3 },
    });
  }

  /**
   * A wire terminal swaged into a plated hole (T.O. 00-25-259 WP 008 00; sizes are estimates for
   * small board terminals). `rot` turns a hook's opening or a tab's eye.
   */
  terminal(ref: string, type: TerminalType, at: V2, r = 0) {
    const g = { turret: { pad: 3.2, drill: 1.7, w: 2.4, h: 2.4 }, hook: { pad: 2.6, drill: 1.1, w: 2.6, h: 1.4 }, tab: { pad: 2.6, drill: 1.1, w: 2.8, h: 0.6 }, cup: { pad: 2.8, drill: 1.4, w: 2.0, h: 2.0 } }[type];
    return this.comp({
      ref, kind: 'connector', value: 0, at, rot: r, footprint: `TERMINAL_${type.toUpperCase()}`,
      pads: [tht('1', [0, 0], g.pad, 'circle', g.drill)], pins: { '1': '1' },
      body: { shape: type, w: g.w, h: g.h, z: 5 },
    });
  }

  testpoint(ref: string, at: V2, label?: string) {
    return this.comp({
      ref, kind: 'testpoint', value: 0, label, at, rot: 0,
      pads: [tht('1', [0, 0], 2.0, 'circle', 1.0)], pins: { '1': '1' },
      body: { shape: 'pin', w: 1.4, h: 1.4, z: 4 },
    });
  }

  pad(c: Component, name: string): V2 {
    const p = c.pads.find((q) => q.name === name)!;
    const r = rot(p.at, c.rot);
    return [c.at[0] + r[0], c.at[1] + r[1]];
  }

  track(layer: Side, pts: V2[], w = 0.8, net?: string): string[] {
    const ids: string[] = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const id = 't' + (this.b.nextId++).toString(36);
      ids.push(id);
      this.b.traces.push({ id, layer, a: pts[i], b: pts[i + 1], w, net });
    }
    return ids;
  }

  via(at: V2, net?: string) {
    this.b.vias.push({ id: 'v' + (this.b.nextId++).toString(36), at, d: 1.2, drill: 0.6, net });
  }

  text(at: V2, text: string, size = 1.6, side: Side = 'F') {
    this.b.texts.push({ at, text, size, side });
  }

  trace(id: string) { return this.b.traces.find((t) => t.id === id)!; }
}
