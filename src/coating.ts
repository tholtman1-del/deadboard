// Conformal coating (NEETS Module 14 pp. 3-2 – 3-7, Table 3-1 "Conformal Coating Removal
// Techniques"). A coated board must have its coating removed from the lead and pad area of a part
// before any rework there; after the repair the same type of coating goes back on. Universal: any
// board can carry a coating (`Board.coating`), each part remembers what happened to it.
import { tk } from './i18n';
import type { Board, Component } from './types';

export type CoatingType = 'parylene' | 'epoxy' | 'acrylic' | 'polyurethane' | 'varnish' | 'rtv';
export type CoatMethod = 'solvent' | 'brush' | 'grit' | 'hotair' | 'parting' | 'ballmill' | 'peel';

/** In the table's order: listed in descending order of hardness. */
export const COATINGS: { id: CoatingType; name: string }[] = [
  { id: 'parylene', name: tk('Parylene') },
  { id: 'epoxy', name: tk('Epoxy') },
  { id: 'acrylic', name: tk('Acrylic lacquer') },
  { id: 'polyurethane', name: tk('Polyurethane') },
  { id: 'varnish', name: tk('Varnish') },
  { id: 'rtv', name: tk('Silicone (RTV)') },
];
/** The table's columns. */
export const METHODS: { id: CoatMethod; name: string }[] = [
  { id: 'solvent', name: tk('Solvent') },
  { id: 'brush', name: tk('Rotary bristle brush') },
  { id: 'grit', name: tk('Grit-impregnated rubber wheels and discs') },
  { id: 'hotair', name: tk('Hot air jet and orangewood stick') },
  { id: 'parting', name: tk('Thermal parting tool') },
  { id: 'ballmill', name: tk('Ball mills') },
  { id: 'peel', name: tk('Cutting and peeling') },
];

/**
 * One cell of Table 3-1: `rank` is the preferred order for that coating (1 = least damaging, try
 * first); `ids`: the method positively identifies the coating (*); `thin` / `thick`: for thin
 * coatings only (C) / for thick coatings only, 0.025 in and thicker (B); `some`: specific coating
 * compositions only (A); `noGrind`: do not grind to the board surface (D).
 */
export interface Cell { rank: number; ids?: true; thin?: true; thick?: true; some?: true; noGrind?: true; /** E: organic solvents are best */ organic?: true; /** F: modified drill bit for the tip, ≈500° at the tip */ drillTip?: true }

export const TABLE_3_1: Record<CoatingType, Partial<Record<CoatMethod, Cell>>> = {
  parylene: { grit: { rank: 2 }, parting: { rank: 1, drillTip: true }, ballmill: { rank: 3 } },
  epoxy: { brush: { rank: 3, thin: true }, grit: { rank: 4, thin: true }, hotair: { rank: 1, ids: true, thin: true }, parting: { rank: 2, ids: true }, ballmill: { rank: 5, thick: true, noGrind: true } },
  acrylic: { solvent: { rank: 1, ids: true, organic: true }, brush: { rank: 3 }, grit: { rank: 4, thin: true }, hotair: { rank: 2 } },
  polyurethane: { solvent: { rank: 5, some: true, thin: true }, brush: { rank: 3, thin: true }, grit: { rank: 4, thin: true }, hotair: { rank: 1, ids: true }, parting: { rank: 2, ids: true } },
  varnish: { solvent: { rank: 1, some: true, thin: true }, brush: { rank: 3 }, grit: { rank: 4 }, hotair: { rank: 2, ids: true } },
  rtv: { brush: { rank: 2, thin: true }, peel: { rank: 1, ids: true } },
};

export const coatingName = (id: CoatingType) => COATINGS.find((c) => c.id === id)!.name;
export const methodName = (id: CoatMethod) => METHODS.find((m) => m.id === id)!.name;

/** The joints of this part can be worked on (no coating, or it was removed here). */
export function workable(board: Board, c: Component): boolean {
  return !board.coating || c.state.coating === 'removed';
}

export type RemoveResult =
  | { ok: true; rank: number; best: number; identifies: boolean }
  | { ok: false; why: 'not-listed' | 'thin-only' | 'thick-only' | 'already' };

/** Removes the coating around a part with one method, as Table 3-1 allows (`dry`: only says whether it would). */
export function removeCoating(board: Board, c: Component, method: CoatMethod, dry = false): RemoveResult {
  const coat = board.coating;
  if (!coat || c.state.coating === 'removed') return { ok: false, why: 'already' };
  const cell = TABLE_3_1[coat.type][method];
  if (!cell) return { ok: false, why: 'not-listed' };
  if (cell.thin && coat.thick) return { ok: false, why: 'thin-only' };
  if (cell.thick && !coat.thick) return { ok: false, why: 'thick-only' };
  // "specific coating compositions only" (A): the board says whether its coating is one of them
  if (cell.some && !coat.solventSoluble) return { ok: false, why: 'not-listed' };
  const best = Math.min(...Object.values(TABLE_3_1[coat.type]).filter((x): x is Cell => !!x && !(x.thin && coat.thick) && !(x.thick && !coat.thick) && !(x.some && !coat.solventSoluble)).map((x) => x.rank));
  if (dry) return { ok: true, rank: cell.rank, best, identifies: !!cell.ids };
  c.state.coating = 'removed';
  c.state.coatMethodRank = cell.rank;
  c.state.coatBestRank = best;
  return { ok: true, rank: cell.rank, best, identifies: !!cell.ids };
}

/** Puts coating back on a part whose coating was removed. */
export function applyCoating(board: Board, c: Component, type: CoatingType): boolean {
  if (!board.coating || c.state.coating !== 'removed') return false;
  c.state.coating = type;
  return true;
}
