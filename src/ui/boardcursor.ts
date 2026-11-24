/**
 * Keyboard board cursor: where it can land, how the arrow keys move it, and what it says.
 *
 * Fairness rule (docs/DESIGN.md → Board cursor): the cursor names only what the renderer draws.
 * Blobs, jumpers, empty footprints and dull (cold) joints are drawn, so they may be said; a
 * cracked trace or a drifted part is not drawn, so it is never named and must be measured.
 * Universal: no board-specific code.
 */
import type { Board, Side, V2 } from '../types';
import { KIND_NAMES, marking, padMask, padWorld } from '../model';
import { sideMask, type Conn } from '../connectivity';
import { netAt, pickAt } from '../pick';
import { t } from '../i18n';

/** Spacing of the landing points along a trace (mm): close enough to cut anywhere useful. */
const TRACE_STEP = 2.5;

/** Every place on `side` the arrow keys can jump to: pads, vias, part bodies, blobs, jumper ends, points along traces. */
export function cursorStops(board: Board, side: Side): V2[] {
  const m = sideMask(side);
  const out: V2[] = [];
  for (const c of board.components) {
    if (c.side === side && c.body.shape !== 'none') out.push(c.at);
    for (const p of c.pads) if (padMask(p) & m) out.push(padWorld(c, p).at);
  }
  for (const v of board.vias) if (!v.side || v.side === side) out.push(v.at);
  for (const b of board.blobs) if (b.layer === side) out.push(b.at);
  for (const j of board.jumpers) {
    if (j.la === side) out.push(j.a);
    if (j.lb === side) out.push(j.b);
  }
  for (const tr of board.traces) {
    if (tr.layer !== side) continue;
    const len = Math.hypot(tr.b[0] - tr.a[0], tr.b[1] - tr.a[1]);
    const n = Math.max(1, Math.floor(len / TRACE_STEP));
    for (let i = 1; i < n; i++) out.push([tr.a[0] + ((tr.b[0] - tr.a[0]) * i) / n, tr.a[1] + ((tr.b[1] - tr.a[1]) * i) / n]);
  }
  return out;
}

/**
 * The stop to jump to from screen point `from` in screen direction `dir` (unit vector, y down):
 * within ±60° of the direction, nearest first, with a penalty for being off-axis.
 */
export function stepToward<T>(stops: { item: T; sx: number; sy: number }[], from: { sx: number; sy: number }, dir: [number, number]): T | null {
  let best: T | null = null;
  let bestScore = Infinity;
  for (const s of stops) {
    const dx = s.sx - from.sx, dy = s.sy - from.sy;
    const d = Math.hypot(dx, dy);
    if (d < 3) continue; // the spot the cursor is on
    const cos = (dx * dir[0] + dy * dir[1]) / d;
    if (cos < 0.5) continue;
    const score = d * (1 + 2.5 * (1 - cos));
    if (score < bestScore) { bestScore = score; best = s.item; }
  }
  return best;
}

/** What the cursor is on, in words: only what the board shows. */
export function describeAt(board: Board, conn: Conn, pt: V2, side: Side): string {
  const hit = pickAt(board, pt, side);
  const where = side === 'F' ? t('top') : t('bottom');
  if (!hit) return t('Bare board, {side}', { side: where });
  switch (hit.kind) {
    case 'pad': {
      const c = hit.comp;
      const n = netAt(board, conn, pt, side);
      const pad = c.pads[hit.padIndex];
      const net = n && n.net >= 0 ? conn.netNames[n.net] : t('no copper');
      const dull = c.state.populated && c.state.cold.includes(hit.padIndex) ? `, ${t('dull, grainy joint')}` : '';
      return t('{ref} pad {pad}, net {net}{extra}, {side}', { ref: c.ref, pad: pad?.name ?? String(hit.padIndex + 1), net, extra: dull, side: where });
    }
    case 'comp': {
      const c = hit.comp;
      const what = c.state.populated ? `${t(KIND_NAMES[c.kind])} ${marking(c)}` : t('empty footprint for a {kind}', { kind: t(KIND_NAMES[c.kind]).toLowerCase() });
      return t('{ref}, {what}, {side}', { ref: c.ref, what, side: where });
    }
    case 'blob': return t('Solder blob, {side}', { side: where });
    case 'jumper': return t('Jumper wire, {side}', { side: where });
    case 'via': {
      const n = netAt(board, conn, pt, side);
      return t('Via, net {net}', { net: n && n.net >= 0 ? conn.netNames[n.net] : t('no copper') });
    }
    case 'trace': {
      const n = netAt(board, conn, pt, side);
      return t('Trace, net {net}, {side}', { net: n && n.net >= 0 ? conn.netNames[n.net] : t('no copper'), side: where });
    }
  }
}
