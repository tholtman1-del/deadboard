// Burned laminate and the surface patch repair (T.O. 00-25-259 WP 011 00: 11-5.2, 11-6.1 – 11-6.4;
// NEETS Module 14 pp. 3-36 – 3-37). A burn chars the laminate to some depth; charred epoxy
// conducts, so a burn can leak between the pads of the part above it. The repair excavates all of
// the damage (at least 75 % of the thickness for a surface patch), straight-walls, undercuts and
// bevels it, fills it with epoxy, levels it and buttercoats it. Universal: any board can carry
// burns (`Board.burns`); the leak is the part's own `state.leak`, so the solvers need nothing new.
import { t } from './i18n';
import type { Board, Component } from './types';

/** How the excavation was cut. */
export interface Excavation {
  /** Depth, share of the laminate thickness (1 = through the board). */
  depth: number;
  /** Diameter of the excavated area (mm). */
  dia: number;
  /** Inner walls cut perpendicular to the surface. */
  straight: boolean;
  /** Undercut depth and width, share of the laminate thickness (0 = none). */
  undercut: number;
  /** Bevel width on the top edge, in laminate thicknesses (0 = none). */
  bevel: number;
}
/** How the excavation was filled and finished. */
export interface Fill {
  /** The undercut filled first, the epoxy bubble-free. */
  bubbleFree: boolean;
  /** Overfill above the surface, share of the laminate thickness. */
  overfill: number;
  /** Cured as the manufacturer directs. */
  cured: boolean;
  /** Abraded back to the original laminate level. */
  leveled: boolean;
  /** A thin buttercoat of epoxy over the exposed fiber weave, cured. */
  buttercoat: boolean;
}
/**
 * A burned area of laminate: centre, radius (mm), depth of the charring (share of the thickness),
 * the part it sits under and whose pads it leaks between, and what has been done to it.
 */
export interface Burn { id: string; at: [number, number]; r: number; depth: number; comp?: string; leakOhms?: number; ex?: Excavation; fill?: Fill }

export const isRepaired = (b: Burn) => !!b.ex && !!b.fill;
/** All the charred material is gone: deep and wide enough. */
export const charRemoved = (b: Burn) => !!b.ex && b.ex.depth >= b.depth && b.ex.dia >= 2 * b.r;

/** The parts whose body or pads sit over a burn: they have to come out first (11-5.2 step 5). */
export function partsOver(board: Board, burn: Burn): Component[] {
  return board.components.filter((c) => c.state.populated && (c.pads.some((p) => {
    const a = (c.rot * Math.PI) / 180, x = c.at[0] + p.at[0] * Math.cos(a) - p.at[1] * Math.sin(a), y = c.at[1] + p.at[0] * Math.sin(a) + p.at[1] * Math.cos(a);
    return Math.hypot(x - burn.at[0], y - burn.at[1]) < burn.r + Math.max(p.size[0], p.size[1]) / 2;
  }) || Math.hypot(c.at[0] - burn.at[0], c.at[1] - burn.at[1]) < burn.r));
}

/** Excavates a burn. Removing all the char also removes its leak from the part over it. */
export function excavate(board: Board, burn: Burn, ex: Excavation) {
  burn.ex = { ...ex };
  burn.fill = undefined;
  if (charRemoved(burn)) clearLeak(board, burn);
}
export function fillBurn(burn: Burn, f: Fill) { if (burn.ex) burn.fill = { ...f }; }

/** Puts the charred laminate's leak on the part over the burn (authoring, and a part refitted over a burn). */
export function applyLeak(board: Board, burn: Burn) {
  if (!burn.comp || !burn.leakOhms || charRemoved(burn)) return;
  const c = board.components.find((x) => x.id === burn.comp);
  if (c && c.state.populated && c.pads.length >= 2) c.state.leak = { ohms: burn.leakOhms, a: c.pads[0].name, b: c.pads[1].name };
}
function clearLeak(board: Board, burn: Burn) {
  const c = board.components.find((x) => x.id === burn.comp);
  if (c?.state.leak && burn.leakOhms && c.state.leak.ohms === burn.leakOhms) c.state.leak = undefined;
}

export type Verdict = 'target' | 'acceptable' | 'defect';
export type LamArea = 'burn' | 'excavation' | 'fill' | 'buttercoat';
export interface LamCheck { area: LamArea; verdict: Verdict; what: string; para: string }

/** The T.O.'s checks of one burn and its repair. */
export function judgeBurn(burn: Burn): LamCheck[] {
  const out: LamCheck[] = [];
  const ex = burn.ex, f = burn.fill;
  if (!ex) {
    out.push({ area: 'burn', verdict: 'defect', what: t('Burned laminate not repaired: the burn damages the surface'), para: '11-6.1' });
    return out;
  }
  const v = (area: LamArea, ok: Verdict, what: string, para = '11-6.2') => out.push({ area, verdict: ok, what, para });
  v('excavation', charRemoved(burn) ? 'target' : 'defect', charRemoved(burn) ? t('All burnt laminate removed') : t('Burnt laminate left in the excavation'));
  if (ex.depth >= 1) v('excavation', 'defect', t('Excavated through the board: that needs a through-the-board patch, not a surface patch'));
  else v('excavation', ex.depth >= 0.75 - 1e-9 ? 'target' : 'defect', ex.depth >= 0.75 - 1e-9 ? t('Excavated to 75 % of the laminate thickness') : t('Excavation shallower than 75 % of the laminate thickness'));
  v('excavation', ex.straight ? 'target' : 'acceptable', ex.straight ? t('Walls straight and perpendicular to the surface') : t('Walls not straight or not perpendicular'));
  v('excavation', Math.abs(ex.undercut - 0.5) < 0.01 ? 'target' : 'defect', ex.undercut === 0 ? t('No undercut') : Math.abs(ex.undercut - 0.5) < 0.01 ? t('Undercut about 50 % of the thickness') : t('Undercut not about 50 % of the thickness'));
  v('excavation', Math.abs(ex.bevel - 1) < 0.01 ? 'target' : ex.bevel > 1 ? 'acceptable' : 'defect', ex.bevel < 1 ? t('Bevel narrower than one laminate thickness') : Math.abs(ex.bevel - 1) < 0.01 ? t('Bevel one laminate thickness wide') : t('Bevel wider than one laminate thickness'));
  if (!f) {
    out.push({ area: 'fill', verdict: 'defect', what: t('Excavation left open: not filled'), para: '11-6.3' });
    return out;
  }
  out.push(f.cured ? { area: 'fill', verdict: 'target', what: t('Epoxy cured'), para: '11-6.3' } : { area: 'fill', verdict: 'defect', what: t('Uncured epoxy in the fill'), para: '11-6.3' });
  out.push(f.bubbleFree ? { area: 'fill', verdict: 'target', what: t('Undercut filled first, bubble-free'), para: '11-6.3' } : { area: 'fill', verdict: 'defect', what: t('Voids or bubbles in the fill (the undercut traps air)'), para: '11-6.3' });
  const level = f.leveled && f.overfill > 0;
  out.push(level ? { area: 'fill', verdict: 'target', what: t('Fill restored to the original laminate level'), para: '11-6.3' }
    : { area: 'fill', verdict: 'defect', what: f.overfill <= 0 ? t('Fill below the laminate level (no overfill to level back)') : t('Fill not leveled to the original laminate'), para: '11-6.3' });
  out.push(f.buttercoat && f.cured ? { area: 'buttercoat', verdict: 'target', what: t('Buttercoat covers the exposed fiber weave'), para: '11-6.4' }
    : { area: 'buttercoat', verdict: 'defect', what: f.buttercoat ? t('Uncured buttercoat') : t('No buttercoat over the exposed fiber weave'), para: '11-6.4' });
  return out;
}
