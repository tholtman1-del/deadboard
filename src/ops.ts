// Board mutations shared by the player tools, the author sabotage tools and the scenario builder.
import type { Blob, Board, Component, Jumper, LedColor, Side, Trace, V2 } from './types';
import { dist, segParam } from './geom';

export const nid = (b: Board, p: string) => p + (b.nextId++).toString(36);

/** Cuts a gap into a trace at the point nearest `pt`. */
export function cutTrace(b: Board, tr: Trace, pt: V2, gap = 0.6): boolean {
  const L = dist(tr.a, tr.b);
  const i = b.traces.indexOf(tr);
  if (L < 1e-6 || i < 0) return false;
  const t = segParam(pt, tr.a, tr.b);
  const d: V2 = [(tr.b[0] - tr.a[0]) / L, (tr.b[1] - tr.a[1]) / L];
  const c: V2 = [tr.a[0] + d[0] * t * L, tr.a[1] + d[1] * t * L];
  const g = Math.max(gap, tr.w * 1.1) / 2;
  const pieces: Trace[] = [];
  if (t * L - g > 0.05) pieces.push({ ...tr, id: nid(b, 't'), b: [c[0] - d[0] * g, c[1] - d[1] * g] });
  if ((1 - t) * L - g > 0.05) pieces.push({ ...tr, id: nid(b, 't'), a: [c[0] + d[0] * g, c[1] + d[1] * g] });
  b.traces.splice(i, 1, ...pieces);
  return true;
}

export function addBlob(b: Board, at: V2, layer: Side, r = 0.6): Blob {
  const blob: Blob = { id: nid(b, 's'), at: [at[0], at[1]], r, layer };
  b.blobs.push(blob);
  return blob;
}

export function removeBlob(b: Board, blob: Blob) {
  b.blobs = b.blobs.filter((x) => x !== blob);
}

export function addJumper(b: Board, a: V2, la: Side, p: V2, lb: Side): Jumper {
  const j: Jumper = { id: nid(b, 'j'), a: [a[0], a[1]], b: [p[0], p[1]], la, lb };
  b.jumpers.push(j);
  return j;
}

export function removeJumper(b: Board, j: Jumper) {
  b.jumpers = b.jumpers.filter((x) => x !== j);
}

export interface InstallOpts { value?: number; color?: LedColor; reversed?: boolean }

/** Solders in a fresh part (clears burn, cold joints, sets orientation). */
export function installPart(c: Component, o: InstallOpts = {}) {
  if (o.value !== undefined) { c.value = o.value; c.valueGuessed = undefined; }
  if (o.color) c.color = o.color;
  // a fresh part has no internal failure (leak/drift) and fresh joints
  // lifted pads are board damage: a new part cannot bond to them
  c.state = { ...c.state, populated: true, burnt: false, cold: [...(c.state.lifted ?? [])], reversed: !!o.reversed, leak: undefined, drift: undefined, coldOhms: undefined, intermittent: undefined, holes: undefined, shunts: undefined };
}

export function removePart(c: Component) {
  c.state = { ...c.state, populated: false, burnt: false, cold: [], reversed: false, leak: undefined, drift: undefined, coldOhms: undefined, intermittent: undefined, holes: undefined, shunts: undefined };
}

export function toggleCold(c: Component, pi: number) {
  if (c.state.lifted?.includes(pi)) return; // a lifted pad cannot be reflowed back
  const s = new Set(c.state.cold);
  if (s.has(pi)) {
    s.delete(pi); // reflowed: the joint is good again
    if (c.state.coldOhms) { const { [pi]: _gone, ...rest } = c.state.coldOhms; void _gone; c.state.coldOhms = Object.keys(rest).length ? rest : undefined; }
  } else if (c.state.intermittent?.some((f) => f.pad === pi && f.kind !== 'thermal-leak')) {
    // reflowing a cracked joint that currently happens to conduct also repairs it
  } else s.add(pi);
  // a reflowed joint is a good joint: drop intermittent faults on this pad
  if (c.state.intermittent) {
    c.state.intermittent = c.state.intermittent.filter((f) => f.pad !== pi || f.kind === 'thermal-leak');
    if (!c.state.intermittent.length) c.state.intermittent = undefined;
  }
  c.state.cold = [...s].sort((a, b) => a - b);
}
