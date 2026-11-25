import type { Blob, Board, Component, Jumper, Side, Trace, V2, Via } from './types';
import { t } from './i18n';
import { dist, pointSegDist, shapePointDist } from './geom';
import { padShape, padWorld } from './model';
import { sideMask, type Conn } from './connectivity';

export type PickHit =
  | { kind: 'pad'; comp: Component; padIndex: number; pos: V2; dist: number }
  | { kind: 'blob'; blob: Blob; pos: V2; dist: number }
  | { kind: 'jumper'; jumper: Jumper; end?: 0 | 1; pos: V2; dist: number }
  | { kind: 'via'; via: Via; pos: V2; dist: number }
  | { kind: 'trace'; trace: Trace; pos: V2; dist: number }
  | { kind: 'comp'; comp: Component; pos: V2; dist: number };

function compBodyHit(c: Component, pt: V2): boolean {
  if (c.body.shape === 'none') return false; // no body to click (a fiducial, the bench supply's clips)
  const hw = Math.max(1.2, c.body.w * 0.5 + 0.4);
  const hh = Math.max(1.2, c.body.h * 0.5 + 0.4);
  const dx = pt[0] - c.at[0], dy = pt[1] - c.at[1];
  if (c.rot === 0 && !c.body.off) {
    return Math.abs(dx) <= hw && Math.abs(dy) <= hh;
  }
  const offMag = c.body.off ? Math.abs(c.body.off[0]) + Math.abs(c.body.off[1]) : 0;
  const bound = (c.body.w > c.body.h ? c.body.w : c.body.h) * 0.72 + offMag + 1.5;
  if (Math.abs(dx) > bound || Math.abs(dy) > bound) return false;
  const a = (-c.rot * Math.PI) / 180;
  const ca = Math.cos(a), sa = Math.sin(a);
  const lx = dx * ca - dy * sa - (c.body.off?.[0] ?? 0);
  const ly = dx * sa + dy * ca - (c.body.off?.[1] ?? 0);
  return Math.abs(lx) <= hw && Math.abs(ly) <= hh;
}

/** Picks the highest-priority PCB element near `pt` on `side` (or either side if `xray`). */
export function pickAt(board: Board, pt: V2, side: Side, xray = false): PickHit | null {
  const mask = xray ? 3 : sideMask(side);

  // 1. Solder blobs on active layer (easy to wick)
  let bestBlob: { blob: Blob; d: number } | null = null;
  for (const blob of board.blobs) {
    if (!(sideMask(blob.layer) & mask)) continue;
    const d = dist(pt, blob.at);
    if (d <= Math.max(blob.r + 0.7, 1.3) && (!bestBlob || d < bestBlob.d)) bestBlob = { blob, d };
  }
  if (bestBlob) return { kind: 'blob', blob: bestBlob.blob, pos: bestBlob.blob.at, dist: bestBlob.d };

  // 2. Jumper endpoints or wires
  let bestJumper: { jumper: Jumper; end?: 0 | 1; pos: V2; d: number } | null = null;
  for (const j of board.jumpers) {
    if (j.kind === 'wire') {
      // a hook-up wire: its ends sit on terminals (clicks there go to the terminal's joint); the wire is picked along its run
      if (((sideMask(j.la) & mask) || (sideMask(j.lb) & mask)) && dist(pt, j.a) > 2 && dist(pt, j.b) > 2) {
        const d = pointSegDist(pt, j.a, j.b);
        if (d <= 0.9 && (!bestJumper || d < bestJumper.d)) bestJumper = { jumper: j, pos: pt, d };
      }
      continue;
    }
    if (sideMask(j.la) & mask) {
      const d = dist(pt, j.a);
      if (d <= 1.3 && (!bestJumper || d < bestJumper.d)) bestJumper = { jumper: j, end: 0, pos: j.a, d };
    }
    if (sideMask(j.lb) & mask) {
      const d = dist(pt, j.b);
      if (d <= 1.3 && (!bestJumper || d < bestJumper.d)) bestJumper = { jumper: j, end: 1, pos: j.b, d };
    }
    if ((sideMask(j.la) & mask) || (sideMask(j.lb) & mask)) {
      const d = pointSegDist(pt, j.a, j.b);
      if (d <= 0.9 && (!bestJumper || d < bestJumper.d)) bestJumper = { jumper: j, pos: pt, d };
    }
  }
  if (bestJumper) return { kind: 'jumper', ...bestJumper, dist: bestJumper.d };

  // 3. Component pads (THT pads are FB so accessible from both sides!)
  let bestPad: { comp: Component; padIndex: number; pos: V2; d: number } | null = null;
  for (const comp of board.components) {
    const padMargin = (comp.body.shape === 'box' || comp.body.shape === 'chip') ? 1.4 : 3.2;
    const offMag = comp.body.off ? Math.abs(comp.body.off[0]) + Math.abs(comp.body.off[1]) : 0;
    const bound = (comp.body.w > comp.body.h ? comp.body.w : comp.body.h) * (comp.rot === 0 ? 0.52 : 0.72) + offMag + padMargin;
    if (Math.abs(pt[0] - comp.at[0]) > bound || Math.abs(pt[1] - comp.at[1]) > bound) continue;
    for (let pi = 0; pi < comp.pads.length; pi++) {
      const p = comp.pads[pi];
      const pm = p.layers === 'FB' ? 3 : p.layers === 'F' ? 1 : 2;
      if (!(pm & mask)) continue;
      if (comp.rot === 0 && (
        Math.abs(pt[0] - (comp.at[0] + p.at[0])) > p.size[0] * 0.5 + 0.8 ||
        Math.abs(pt[1] - (comp.at[1] + p.at[1])) > p.size[1] * 0.5 + 0.8
      )) continue;
      const sh = padShape(comp, p);
      const sd = shapePointDist(sh, pt);
      if (sd <= 0.75 && (!bestPad || sd < bestPad.d)) {
        bestPad = { comp, padIndex: pi, pos: padWorld(comp, p).at, d: sd };
      }
    }
  }
  if (bestPad) return { kind: 'pad', ...bestPad, dist: bestPad.d };

  // 4. Vias & surface test nails
  let bestVia: { via: Via; d: number } | null = null;
  for (const via of board.vias) {
    if (via.side && !(sideMask(via.side) & mask)) continue;
    const r = via.d * 0.5 + 0.6 > 1.1 ? via.d * 0.5 + 0.6 : 1.1;
    if (Math.abs(pt[0] - via.at[0]) > r || Math.abs(pt[1] - via.at[1]) > r) continue;
    const d = dist(pt, via.at);
    if (d <= r && (!bestVia || d < bestVia.d)) bestVia = { via, d };
  }
  if (bestVia) return { kind: 'via', via: bestVia.via, pos: bestVia.via.at, dist: bestVia.d };

  // 5. Component bodies (prefer active side, or any THT part if xray)
  for (const comp of board.components) {
    if (!compBodyHit(comp, pt)) continue;
    const isTht = comp.pads.some((p) => p.layers === 'FB');
    const visible = xray || comp.side === side || (isTht && comp.body.shape === 'tactile');
    if (!visible && comp.side !== side) continue;
    return { kind: 'comp', comp, pos: comp.at, dist: dist(pt, comp.at) };
  }

  // 6. Copper traces
  let bestTrace: { trace: Trace; d: number } | null = null;
  for (const trace of board.traces) {
    if (!(sideMask(trace.layer) & mask)) continue;
    const margin = trace.w * 0.5 + 0.85;
    const minX = trace.a[0] < trace.b[0] ? trace.a[0] : trace.b[0];
    const maxX = trace.a[0] > trace.b[0] ? trace.a[0] : trace.b[0];
    if (pt[0] < minX - margin || pt[0] > maxX + margin) continue;
    const minY = trace.a[1] < trace.b[1] ? trace.a[1] : trace.b[1];
    const maxY = trace.a[1] > trace.b[1] ? trace.a[1] : trace.b[1];
    if (pt[1] < minY - margin || pt[1] > maxY + margin) continue;
    const d = pointSegDist(pt, trace.a, trace.b) - trace.w / 2;
    if (d <= 0.8 && (!bestTrace || d < bestTrace.d)) bestTrace = { trace, d };
  }
  if (bestTrace) return { kind: 'trace', trace: bestTrace.trace, pos: pt, dist: bestTrace.d };

  // 7. Fallback: THT component body from back side
  for (const comp of board.components) {
    if (comp.side !== side && compBodyHit(comp, pt)) return { kind: 'comp', comp, pos: comp.at, dist: dist(pt, comp.at) };
  }

  return null;
}

/** Finds the copper net index and snap position at `pt` on `side`. */
export function netAt(board: Board, conn: Conn, pt: V2, side: Side, xray = false): {
  net: number;
  label: string;
  snap: V2;
} | null {
  const hit = pickAt(board, pt, side, xray);
  if (!hit) return null;

  if (hit.kind === 'pad') {
    const idx = conn.padItem.get(hit.comp)?.[hit.padIndex];
    if (idx === undefined) return null;
    const net = conn.net[idx];
    const pName = hit.comp.pads[hit.padIndex].name;
    return { net, label: `${hit.comp.ref}.${pName} (${conn.netNames[net]})`, snap: hit.pos };
  }
  if (hit.kind === 'trace') {
    const idx = conn.traceItem.get(hit.trace);
    if (idx === undefined) return null;
    const net = conn.net[idx];
    return { net, label: conn.netNames[net], snap: pt };
  }
  if (hit.kind === 'via') {
    const idx = conn.viaItem.get(hit.via);
    if (idx === undefined) return null;
    const net = conn.net[idx];
    return { net, label: `${t('Via')} (${conn.netNames[net]})`, snap: hit.via.at };
  }
  if (hit.kind === 'blob') {
    const idx = conn.blobItem.get(hit.blob);
    if (idx === undefined) return null;
    const net = conn.net[idx];
    return { net, label: conn.netNames[net], snap: hit.blob.at };
  }
  if (hit.kind === 'jumper') {
    const idx = conn.items.findIndex((it) => it.jumper === hit.jumper);
    if (idx < 0) return null;
    const net = conn.net[idx];
    return { net, label: `${t('Jumper')} (${conn.netNames[net]})`, snap: hit.pos };
  }
  return null;
}
