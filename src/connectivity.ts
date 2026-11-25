import type { Blob, Board, Component, Jumper, Trace, Via, Zone } from './types';
import { Grid, makeShape, pointInPolygon, polyBB, shapeGap, type BB, type Shape } from './geom';
import { endOpen } from './terminals';
import { padMask, padShape, rolePadName } from './model';

export type ItemKind = 'pad' | 'trace' | 'via' | 'blob' | 'jend' | 'zone';

export interface CuItem {
  kind: ItemKind;
  layers: number; // bit 1 = F, bit 2 = B
  shape: Shape;
  comp?: Component;
  pi?: number;
  trace?: Trace;
  via?: Via;
  blob?: Blob;
  jumper?: Jumper;
  end?: number;
  zone?: Zone;
  net?: string;
}

export interface Conn {
  items: CuItem[];
  /** Net index per item. */
  net: Int32Array;
  netCount: number;
  netNames: string[];
  netItems: number[][];
  grid: Grid;
  /** Item index for each pad of each component. */
  padItem: Map<Component, number[]>;
  traceItem: Map<Trace, number>;
  viaItem: Map<Via, number>;
  blobItem: Map<Blob, number>;
}

export const sideMask = (s: 'F' | 'B') => (s === 'F' ? 1 : 2);

function find(p: Int32Array, i: number): number {
  while (p[i] !== i) { p[i] = p[p[i]]; i = p[i]; }
  return i;
}
function union(p: Int32Array, a: number, b: number) {
  a = find(p, a); b = find(p, b);
  if (a !== b) p[a < b ? b : a] = a < b ? a : b;
}

function zoneTouches(z: CuItem, o: CuItem): boolean {
  const poly = z.zone!.poly;
  for (const p of o.shape.pts) if (pointInPolygon(p, poly)) return true;
  // thermal relief: the pour keeps clear of its own pads and reaches them through spokes, so
  // only the spoke ends touch the pad edge — test the pour's edges near the item against it
  const bb = o.shape.bb, e = 0.02;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (Math.max(a[0], b[0]) < bb[0] - e || Math.min(a[0], b[0]) > bb[2] + e || Math.max(a[1], b[1]) < bb[1] - e || Math.min(a[1], b[1]) > bb[3] + e) continue;
    if (shapeGap(makeShape([a, b], 0), o.shape) <= 0.01) return true;
  }
  return false;
}

export function buildConnectivity(board: Board): Conn {
  const items: CuItem[] = [];
  const padItem = new Map<Component, number[]>();
  const traceItem = new Map<Trace, number>();
  const viaItem = new Map<Via, number>();
  const blobItem = new Map<Blob, number>();
  const tracedNets = new Set<string>();
  const hiddenNets = new Set(board.hiddenCopperNets ?? []);
  const estimated = !!board.estimatedPads;

  for (const c of board.components) {
    const idx: number[] = [];
    c.pads.forEach((p, pi) => {
      idx.push(items.length);
      items.push({ kind: 'pad', layers: padMask(p), shape: padShape(c, p), comp: c, pi, net: p.net });
    });
    padItem.set(c, idx);
  }
  for (const t of board.traces) {
    if (t.net) tracedNets.add(t.net);
    traceItem.set(t, items.length);
    items.push({ kind: 'trace', layers: sideMask(t.layer), shape: makeShape([t.a, t.b], t.w / 2), trace: t, net: t.net });
  }
  for (const v of board.vias) {
    viaItem.set(v, items.length);
    items.push({ kind: 'via', layers: v.side ? sideMask(v.side) : 3, shape: makeShape([v.at], v.d / 2), via: v, net: v.net });
  }
  for (const b of board.blobs) {
    blobItem.set(b, items.length);
    items.push({ kind: 'blob', layers: sideMask(b.layer), shape: makeShape([b.at], b.r), blob: b });
  }
  const jStart = items.length;
  for (const j of board.jumpers) {
    // a hook-up wire's end only conducts once it is soldered to its terminal
    items.push({ kind: 'jend', layers: endOpen(j, 0) ? 0 : sideMask(j.la), shape: makeShape([j.a], 0.35), jumper: j, end: 0 });
    items.push({ kind: 'jend', layers: endOpen(j, 1) ? 0 : sideMask(j.lb), shape: makeShape([j.b], 0.35), jumper: j, end: 1 });
  }
  for (const z of board.zones) {
    if (z.poly.length < 3) continue;
    if (z.net) tracedNets.add(z.net);
    items.push({ kind: 'zone', layers: sideMask(z.layer), shape: { pts: z.poly, r: 0, bb: polyBB(z.poly) }, zone: z, net: z.net });
  }

  const n = items.length;
  const bb: BB = [-5, -5, board.w + 5, board.h + 5];
  for (const it of items) {
    bb[0] = Math.min(bb[0], it.shape.bb[0]); bb[1] = Math.min(bb[1], it.shape.bb[1]);
    bb[2] = Math.max(bb[2], it.shape.bb[2]); bb[3] = Math.max(bb[3], it.shape.bb[3]);
  }
  const area = (bb[2] - bb[0]) * (bb[3] - bb[1]);
  const grid = new Grid(bb, Math.max(1.5, Math.sqrt(area / Math.max(1, n)) * 1.5), n);
  items.forEach((it, i) => grid.insert(i, it.shape.bb));

  const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const cand: number[] = [];
  for (let i = 0; i < n; i++) {
    const A = items[i];
    grid.query([A.shape.bb[0] - 1e-6, A.shape.bb[1] - 1e-6, A.shape.bb[2] + 1e-6, A.shape.bb[3] + 1e-6], cand);
    for (const j of cand) {
      if (j <= i) continue;
      const B = items[j];
      if (!(A.layers & B.layers)) continue;
      // Touching copper is one conductor whatever its labels say: a +5V track drawn over a GND
      // track is a short, and the bench must show it. Only pours keep to their own net, because
      // an unfilled zone is stored as its outline and would swallow every track inside it.
      if (A.net && B.net && A.net !== B.net && (A.kind === 'zone' || B.kind === 'zone')) continue;
      // estimated pad shapes (boardviews): overlapping pads of different nets are an artefact
      if (estimated && A.net && B.net && A.net !== B.net && (A.kind === 'pad' || A.kind === 'via') && (B.kind === 'pad' || B.kind === 'via')) continue;
      if (A.kind === 'pad' && B.kind === 'pad' && A.comp === B.comp) continue; // same footprint, handled below
      let hit: boolean;
      if (A.kind === 'zone' && B.kind === 'zone') hit = false;
      else if (A.kind === 'zone') hit = zoneTouches(A, B);
      else if (B.kind === 'zone') hit = zoneTouches(B, A);
      else {
        const a = A.shape.bb, b = B.shape.bb;
        // same 1e-6 slack as the gap test: abutting copper's boxes can miss by a rounding error
        if (a[0] > b[2] + 1e-6 || b[0] > a[2] + 1e-6 || a[1] > b[3] + 1e-6 || b[1] > a[3] + 1e-6) continue;
        hit = shapeGap(A.shape, B.shape) <= 1e-6;
      }
      if (hit) union(parent, i, j);
    }
  }
  // Jumper wire ends are joined by the wire itself.
  for (let i = jStart; i < jStart + board.jumpers.length * 2; i += 2) union(parent, i, i + 1);
  // Pads sharing a name in one populated part are internally connected (e.g. tactile switch legs).
  for (const c of board.components) {
    if (!c.state.populated) continue;
    const idx = padItem.get(c)!;
    const first = new Map<string, number>();
    c.pads.forEach((p, pi) => {
      if (c.state.cold.includes(pi)) return;
      const f = first.get(p.name);
      if (f === undefined) first.set(p.name, idx[pi]);
      else union(parent, f, idx[pi]);
    });
    // Pads of one footprint drawn touching on the same net are one piece of copper (a USB-C
    // footprint draws its combined A4/B9 VBUS contact as two abutting 0.3 mm pads). Same net
    // only: touching pads of different nets inside a footprint stay a footprint matter.
    for (let a = 0; a < c.pads.length; a++) {
      const na = c.pads[a].net;
      if (!na || c.state.cold.includes(a)) continue;
      for (let b = a + 1; b < c.pads.length; b++) {
        if (c.pads[b].net !== na || c.pads[b].name === c.pads[a].name || c.state.cold.includes(b)) continue;
        const A = items[idx[a]], B = items[idx[b]];
        if (!(A.layers & B.layers)) continue;
        const p = A.shape.bb, q = B.shape.bb;
        if (p[0] > q[2] + 1e-6 || q[0] > p[2] + 1e-6 || p[1] > q[3] + 1e-6 || q[1] > p[3] + 1e-6) continue;
        if (shapeGap(A.shape, B.shape) <= 1e-6) union(parent, idx[a], idx[b]);
      }
    }
  }
  // Connect un-traced multi-layer planes (GND / mega power nets with no traces) across non-cold pads and vias.
  // Nets with broken copper (state.netBreak) connect along their spanning tree minus the broken links.
  const broken = new Map<string, number[]>(); // net name → item indices of pads with a break
  for (const c of board.components) {
    for (const pi of c.state.netBreak ?? []) {
      const nm = c.pads[pi]?.net, idx = padItem.get(c)?.[pi];
      if (!nm || idx === undefined) continue;
      (broken.get(nm) ?? broken.set(nm, []).get(nm)!).push(idx);
    }
  }
  const firstByNet = new Map<string, number>();
  const brokenMembers = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const it = items[i];
    if ((it.kind !== 'pad' && it.kind !== 'via') || !it.net) continue;
    // drawn copper connects by geometry — except through a hidden inner plane: there the
    // net's vias and through-hole pads (which reach every layer) are joined by design
    if (tracedNets.has(it.net) && !(hiddenNets.has(it.net) && (it.kind === 'via' || it.layers === 3))) continue;
    if (it.kind === 'pad' && it.comp!.state.cold.includes(it.pi!)) continue;
    if (broken.has(it.net)) { (brokenMembers.get(it.net) ?? brokenMembers.set(it.net, []).get(it.net)!).push(i); continue; }
    const prev = firstByNet.get(it.net);
    if (prev === undefined) firstByNet.set(it.net, i);
    else union(parent, prev, i);
  }
  for (const [nm, members] of brokenMembers) {
    for (const [a, b] of brokenTree(items, members, broken.get(nm)!)) union(parent, a, b);
  }

  const net = new Int32Array(n);
  const rootToNet = new Map<number, number>();
  const netItems: number[][] = [];
  for (let i = 0; i < n; i++) {
    const r = find(parent, i);
    let k = rootToNet.get(r);
    if (k === undefined) { k = netItems.length; rootToNet.set(r, k); netItems.push([]); }
    net[i] = k;
    netItems[k].push(i);
  }
  const netNames: string[] = netItems.map((list, k) => {
    for (const i of list) if (items[i].net) return items[i].net!;
    for (const i of list) {
      const it = items[i];
      if (it.kind === 'pad') return `Net-(${it.comp!.ref}-${it.comp!.pads[it.pi!].name})`;
    }
    return `Net-${k}`;
  });

  return { items, net, netCount: netItems.length, netNames, netItems, grid, padItem, traceItem, viaItem, blobItem };
}

/** How a board's conductors line up with the design's named nets (pad and via labels). */
export interface NetReport {
  /** Distinct net names on pads and vias. */
  named: number;
  /** Conductors carrying two or more names: shorts (real, or an importer's geometry error). */
  merged: { nets: string[]; pads: string[] }[];
  /** Names spread over two or more conductors: opens (unrouted, or copper the importer missed). */
  split: { net: string; parts: number; pads: string[] }[];
}

/** Checks that every named net is exactly one conductor and no conductor carries two names. */
export function netReport(conn: Conn): NetReport {
  const label = (i: number) => {
    const it = conn.items[i];
    return it.kind === 'pad' ? `${it.comp!.ref}.${it.comp!.pads[it.pi!].name}` : `${it.kind}@${it.shape.pts[0].map((v) => v.toFixed(2)).join(',')}`;
  };
  const namesOf = new Map<number, Map<string, number>>(); // conductor → name → first item
  const condOf = new Map<string, Map<number, number>>(); // name → conductor → first item
  conn.items.forEach((it, i) => {
    if ((it.kind !== 'pad' && it.kind !== 'via') || !it.net) return;
    if (it.kind === 'pad' && (!it.comp!.state.populated || it.comp!.state.cold.includes(it.pi!))) return;
    const k = conn.net[i];
    const byName = namesOf.get(k) ?? namesOf.set(k, new Map()).get(k)!;
    if (!byName.has(it.net)) byName.set(it.net, i);
    const byCond = condOf.get(it.net) ?? condOf.set(it.net, new Map()).get(it.net)!;
    if (!byCond.has(k)) byCond.set(k, i);
  });
  // KiCad names each no-connect pin's net `unconnected-(…)`: copper touching those is harmless,
  // so a conductor counts as a short only when it joins two or more real nets
  const nc = (n: string) => /^unconnected-/i.test(n);
  const merged = [...namesOf.values()].filter((m) => [...m.keys()].filter((n) => !nc(n)).length > 1).map((m) => ({ nets: [...m.keys()].sort(), pads: [...m.values()].map(label) }));
  const split = [...condOf].filter(([, m]) => m.size > 1).map(([net, m]) => ({ net, parts: m.size, pads: [...m.values()].map(label) }));
  return { named: condOf.size, merged, split };
}

/** Readable import warnings from a report (English: technical detail, like mod errors). */
export function netWarnings(r: NetReport): string[] {
  const out: string[] = [];
  const list = <T>(xs: T[], f: (x: T) => string) => xs.slice(0, 5).map(f).join('; ') + (xs.length > 5 ? `; … ${xs.length - 5} more` : '');
  if (r.merged.length) out.push(`${r.merged.length} conductor(s) join different nets (a short in the file, or misread copper): ${list(r.merged, (m) => `${m.nets.join(' + ')} at ${m.pads.join(', ')}`)}`);
  if (r.split.length) out.push(`${r.split.length} net(s) fall apart into separate pieces (unrouted, or copper not imported): ${list(r.split, (s) => `${s.net} ×${s.parts} (${s.pads.join(', ')})`)}`);
  return out;
}

/**
 * Links of a name-connected net with broken copper. Without routing data the net is taken to
 * run along its minimum spanning tree (the airwires); a break at a pad removes, of that pad's
 * links, the one toward the larger rest of the net — its local branch is cut off.
 */
function brokenTree(items: CuItem[], members: number[], breaks: number[]): [number, number][] {
  const m = members.length;
  if (m < 2) return [];
  const pos = members.map((i) => { const b = items[i].shape.bb; return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; });
  const inTree = new Uint8Array(m), best = new Float64Array(m).fill(Infinity), par = new Int32Array(m).fill(-1);
  best[0] = 0;
  const edges: [number, number][] = [];
  for (let k = 0; k < m; k++) {
    let u = -1;
    for (let j = 0; j < m; j++) if (!inTree[j] && (u < 0 || best[j] < best[u])) u = j;
    inTree[u] = 1;
    if (par[u] >= 0) edges.push([par[u], u]);
    for (let j = 0; j < m; j++) {
      if (inTree[j]) continue;
      const d = Math.hypot(pos[j][0] - pos[u][0], pos[j][1] - pos[u][1]);
      if (d < best[j]) { best[j] = d; par[j] = u; }
    }
  }
  const alive = edges.map(() => true);
  const local = new Map(members.map((it, k) => [it, k]));
  const reach = (from: number, skip: number) => {
    const seen = new Set([from]);
    const stack = [from];
    while (stack.length) {
      const u = stack.pop()!;
      edges.forEach(([a, b], e) => {
        if (!alive[e] || e === skip) return;
        const v = a === u ? b : b === u ? a : -1;
        if (v >= 0 && !seen.has(v)) { seen.add(v); stack.push(v); }
      });
    }
    return seen.size;
  };
  for (const it of breaks) {
    const p = local.get(it);
    if (p === undefined) continue;
    let cut = -1, far = -1;
    edges.forEach(([a, b], e) => {
      if (!alive[e] || (a !== p && b !== p)) return;
      const size = reach(a === p ? b : a, e);
      if (size > far) { far = size; cut = e; }
    });
    if (cut >= 0) alive[cut] = false;
  }
  return edges.filter((_, e) => alive[e]).map(([a, b]) => [members[a], members[b]]);
}

/** Net that a component's electrical role is attached to, or -1 if floating (empty, cold joint). */
export function pinNet(conn: Conn, c: Component, role: string): number {
  if (!c.state.populated) return -1;
  const name = rolePadName(c, role);
  if (name === undefined) return -1;
  const idx = conn.padItem.get(c);
  if (!idx) return -1;
  for (let pi = 0; pi < c.pads.length; pi++)
    if (c.pads[pi].name === name && !c.state.cold.includes(pi)) return conn.net[idx[pi]];
  return -1;
}

export function padNet(conn: Conn, c: Component, padName: string): number {
  const idx = conn.padItem.get(c);
  const pi = c.pads.findIndex((p) => p.name === padName);
  return idx && pi >= 0 ? conn.net[idx[pi]] : -1;
}

/** Edge-to-edge gap from a copper pour to an item (0 when the item is on it). */
function zoneGap(z: CuItem, o: CuItem, within: number): number {
  const poly = z.zone!.poly;
  if (o.shape.pts.some((p) => pointInPolygon(p, poly))) return 0;
  const bb = o.shape.bb;
  let m = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (Math.max(a[0], b[0]) < bb[0] - within || Math.min(a[0], b[0]) > bb[2] + within || Math.max(a[1], b[1]) < bb[1] - within || Math.min(a[1], b[1]) > bb[3] + within) continue;
    m = Math.min(m, shapeGap(makeShape([a, b], 0), o.shape));
  }
  return m;
}

/**
 * Nets whose copper (pads, traces, vias, pours) comes within `mm` of a part's pads on the same
 * layer, nearest first: for each, the edge-to-edge gap and the part's pad it is nearest to. Each
 * pad's own net is left out, the part's other pins are not (a bridge between two pins counts).
 * What a solder bridge, a whisker or residue at this part could reach.
 */
export function netsNear(conn: Conn, comp: Component, mm: number): { net: number; mm: number; pad: string }[] {
  const mine = conn.padItem.get(comp) ?? [];
  const best = new Map<number, { mm: number; pad: string }>();
  const found: number[] = [];
  mine.forEach((pi, k) => {
    const p = conn.items[pi], bb = p.shape.bb, self = conn.net[pi];
    conn.grid.query([bb[0] - mm, bb[1] - mm, bb[2] + mm, bb[3] + mm], found);
    for (const j of found) {
      const o = conn.items[j], net = conn.net[j];
      if (net === self || !(o.layers & p.layers)) continue;
      const gap = Math.max(0, o.kind === 'zone' ? zoneGap(o, p, mm) : shapeGap(o.shape, p.shape));
      if (gap <= mm && gap < (best.get(net)?.mm ?? Infinity)) best.set(net, { mm: gap, pad: comp.pads[k].name });
    }
  });
  return [...best].map(([net, b]) => ({ net, ...b })).sort((a, b) => a.mm - b.mm || a.net - b.net);
}
