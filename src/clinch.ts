// Clinched leads (T.O. 00-25-259 WP 007 00; NEETS Module 14 pp. 3-9, 3-17, 3-22): a through-hole
// lead bent over its pad on the solder side, fully (90°) or semi (45°), cut to a length counted in
// pad diameters. A clinched lead holds the part while it is soldered; to take the part out, the
// surface solder is wicked off, the sweat joint broken by turning the lead 15° and the lead
// straightened (07-5.4), and only then is the hole cleared. Universal: any through-hole lead.
import { t } from './i18n';
import type { Board, Component, V2 } from './types';

export type ClinchStyle = 'semi' | 'full';
/** One clinched lead: style, length after cutting (pad diameters), formed along the pad's conductor. */
export interface Clinch { style: ClinchStyle; len: number; along: boolean }
/** How a lead is terminated when a part is fitted (the bench's choice). */
export type Termination = 'straight' | ClinchStyle;

/** The side the leads terminate on: opposite the part's body. */
export const leadSide = (c: Component) => (c.side === 'F' ? 'B' : 'F');

function padWorld(c: Component, pi: number): V2 {
  const p = c.pads[pi].at, r = (c.rot * Math.PI) / 180;
  return [c.at[0] + p[0] * Math.cos(r) - p[1] * Math.sin(r), c.at[1] + p[0] * Math.sin(r) + p[1] * Math.cos(r)];
}
const padDia = (c: Component, pi: number) => Math.max(c.pads[pi].size[0], c.pads[pi].size[1]);

/**
 * The conductor leaving a pad on the lead side, as a unit direction (null: an isolated pad, no
 * conductor there). The clinch is formed along it.
 */
export function conductorDir(board: Board, c: Component, pi: number): V2 | null {
  const at = padWorld(c, pi), side = leadSide(c), r = padDia(c, pi) / 2 + 0.05;
  for (const tr of board.traces) {
    if (tr.layer !== side) continue;
    for (const [p, q] of [[tr.a, tr.b], [tr.b, tr.a]] as const) {
      if (Math.hypot(p[0] - at[0], p[1] - at[1]) <= r) {
        const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
        if (L > 1e-6) return [dx / L, dy / L];
      }
    }
  }
  return null;
}

/** Where a clinched lead points (unit vector), for drawing: along its conductor, or across it. */
export function clinchDir(board: Board, c: Component, pi: number, k: Clinch): V2 {
  const d = conductorDir(board, c, pi);
  if (d) return k.along ? d : [-d[1], d[0]];
  // an isolated pad: away from the part's body
  const at = padWorld(c, pi), dx = at[0] - c.at[0], dy = at[1] - c.at[1], L = Math.hypot(dx, dy) || 1;
  return [dx / L, dy / L];
}

/** Clinches every lead of a freshly fitted part the way the bench says (straight-through: none). */
export function clinchFitted(c: Component, term: Termination, len: number, along: boolean) {
  if (term === 'straight') { c.state.clinch = undefined; return; }
  c.state.clinch = Object.fromEntries(c.pads.map((_, pi) => [pi, { style: term, len, along }]));
}

export type Verdict = 'target' | 'acceptable' | 'defect';
export interface ClinchCheck { pad: number; verdict: Verdict; what: string; para: string }

/** The T.O.'s checks of one clinched lead (07-6.17 semi-clinch, 07-6.18 full clinch). */
export function judgeClinch(board: Board, c: Component, pi: number): ClinchCheck[] {
  const k = c.state.clinch?.[pi];
  if (!k) return [];
  const para = k.style === 'full' ? '07-6.18' : '07-6.17', out: ClinchCheck[] = [];
  const iso = !conductorDir(board, c, pi);
  const lv: Verdict = k.len < 0.5 || k.len > 2 ? 'defect' : Math.abs(k.len - 1) < 0.01 ? 'target' : 'acceptable';
  out.push({ pad: pi, verdict: lv, para, what: lv === 'defect' ? (k.len < 0.5 ? t('Lead cut shorter than one pad radius') : t('Lead longer than two pad diameters')) : lv === 'target' ? t('Lead cut to one pad diameter') : t('Lead length within one pad radius to two pad diameters') });
  if (k.style === 'full' && iso) out.push({ pad: pi, verdict: 'defect', para, what: t('A lead on an isolated pad is fully clinched (use a semi-clinch)') });
  else if (!iso && !k.along) {
    // across the conductor: the lead runs off the pad once it is longer than the pad's radius
    out.push(k.style === 'full' && k.len > 0.5
      ? { pad: pi, verdict: 'defect', para, what: t('The clinched lead extends beyond the edge of the pad, not along its conductor') }
      : { pad: pi, verdict: 'acceptable', para, what: t('Not clinched in the direction of the conductor') });
  } else out.push({ pad: pi, verdict: 'target', para, what: iso ? t('Semi-clinched on an isolated pad') : t('Clinched in the direction of the conductor') });
  return out;
}

/** The style of a part's termination: the first clinched lead's style, or straight-through. */
export const terminationOf = (c: Component): Termination => Object.values(c.state.clinch ?? {})[0]?.style ?? 'straight';

/**
 * Duckbill pliers turn the clinched lead 15° to break its sweat joint, then a non-metallic tool
 * straightens it (07-5.4 steps 8–9). Done before the surface solder is off, the lead tears the pad
 * off the board instead ('tore').
 */
export function straighten(c: Component, pi: number): 'freed' | 'tore' | 'straight' {
  if (!c.state.clinch?.[pi]) return 'straight';
  const { [pi]: _gone, ...rest } = c.state.clinch; void _gone;
  c.state.clinch = Object.keys(rest).length ? rest : undefined;
  const wicked = !!c.state.surfaceWicked?.includes(pi);
  const left = (c.state.surfaceWicked ?? []).filter((x) => x !== pi);
  c.state.surfaceWicked = left.length ? left : undefined;
  if (wicked) return 'freed';
  if (!c.state.lifted?.includes(pi)) c.state.lifted = [...(c.state.lifted ?? []), pi].sort((a, b) => a - b);
  if (!c.state.cold.includes(pi)) c.state.cold = [...c.state.cold, pi].sort((a, b) => a - b);
  return 'tore';
}

export const terminationName = (x: Termination) => ({ straight: t('straight-through'), semi: t('semi-clinch (45°)'), full: t('full clinch (90°)') })[x];
