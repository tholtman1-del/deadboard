// Conformal coating (NEETS Module 14 pp. 3-2 – 3-7, Table 3-1 "Conformal Coating Removal
// Techniques"). A coated board must have its coating removed from the lead and pad area of a part
// before any rework there; after the repair the same type of coating goes back on. Universal: any
// board can carry a coating (`Board.coating`), each part remembers what happened to it.
import { tk } from './i18n';
import type { Board, Component } from './types';

export type CoatingType = 'parylene' | 'epoxy' | 'acrylic' | 'polyurethane' | 'varnish' | 'rtv';
export type CoatMethod = 'solvent' | 'brush' | 'grit' | 'hotair' | 'parting' | 'ballmill' | 'peel' | 'manual';
/** Which removal table grades the choice: NEETS 14 Table 3-1 (1998) or the 2M manual's Table 06-3 (2013, current). */
export type CoatTable = '3-1' | '06-3';

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
  { id: 'manual', name: tk('Manual dental tools / ball mill in a pin vise') },
];

/**
 * One cell of Table 3-1: `rank` is the preferred order for that coating (1 = least damaging, try
 * first); `ids`: the method positively identifies the coating (*); `thin` / `thick`: for thin
 * coatings only (C) / for thick coatings only, 0.025 in and thicker (B); `some`: specific coating
 * compositions only (A); `noGrind`: do not grind to the board surface (D).
 */
export interface Cell { rank: number; ids?: true; thin?: true; thick?: true; some?: true; noGrind?: true; /** E: organic solvents are best */ organic?: true; /** F: modified drill bit for the tip, about 500 °F (260 °C) at the tip */ drillTip?: true }

export const TABLE_3_1: Record<CoatingType, Partial<Record<CoatMethod, Cell>>> = {
  parylene: { grit: { rank: 2 }, parting: { rank: 1, drillTip: true }, ballmill: { rank: 3 } },
  epoxy: { brush: { rank: 3, thin: true }, grit: { rank: 4, thin: true }, hotair: { rank: 1, ids: true, thin: true }, parting: { rank: 2, ids: true }, ballmill: { rank: 5, thick: true, noGrind: true } },
  acrylic: { solvent: { rank: 1, ids: true, organic: true }, brush: { rank: 3 }, grit: { rank: 4, thin: true }, hotair: { rank: 2 } },
  polyurethane: { solvent: { rank: 5, some: true, thin: true }, brush: { rank: 3, thin: true }, grit: { rank: 4, thin: true }, hotair: { rank: 1, ids: true }, parting: { rank: 2, ids: true } },
  varnish: { solvent: { rank: 1, some: true, thin: true }, brush: { rank: 3 }, grit: { rank: 4 }, hotair: { rank: 2, ids: true } },
  rtv: { brush: { rank: 2, thin: true }, peel: { rank: 1, ids: true } },
};

/**
 * T.O. 00-25-259 Table 06-3 "Conformal Coating Removal Methods" (Rev 4, 2013), the current 2M
 * standard (06-5.4): isopropyl alcohol is the only solvent for coating tests and removal (06-5.2;
 * also the only cleaning solvent, 05-5.4), parylene comes off mechanically only.
 * Its notes: * identifies the type; a: thick coatings only (0.025 in and thicker); b: thin coatings
 * only; c: do not attempt to remove to the CCA surface. The manual lists no varnish: a varnish
 * coating keeps its Table 3-1 row.
 */
export const TABLE_06_3: Record<CoatingType, Partial<Record<CoatMethod, Cell>>> = {
  acrylic: { solvent: { rank: 1, ids: true }, hotair: { rank: 2 }, manual: { rank: 3, thin: true }, brush: { rank: 4, thick: true, noGrind: true } },
  epoxy: { hotair: { rank: 1, ids: true }, parting: { rank: 2, ids: true }, manual: { rank: 3, thin: true }, ballmill: { rank: 4, thick: true, noGrind: true } },
  rtv: { peel: { rank: 1, ids: true }, manual: { rank: 2, thin: true }, brush: { rank: 3, noGrind: true } },
  polyurethane: { hotair: { rank: 1, ids: true }, parting: { rank: 2, ids: true }, manual: { rank: 3, thin: true }, ballmill: { rank: 4, thick: true, noGrind: true } },
  parylene: { manual: { rank: 1 }, peel: { rank: 2 } },
  varnish: TABLE_3_1.varnish,
};

export const tableFor = (t: CoatTable) => (t === '3-1' ? TABLE_3_1 : TABLE_06_3);
/** The columns of a table, in its order. */
export const methodsFor = (t: CoatTable): CoatMethod[] => (t === '3-1' ? ['solvent', 'brush', 'grit', 'hotair', 'parting', 'ballmill', 'peel'] : ['solvent', 'hotair', 'parting', 'peel', 'manual', 'ballmill', 'brush']);

export const coatingName = (id: CoatingType) => COATINGS.find((c) => c.id === id)!.name;
export const methodName = (id: CoatMethod) => METHODS.find((m) => m.id === id)!.name;

/** The joints of this part can be worked on (no coating, or it was removed here). */
export function workable(board: Board, c: Component): boolean {
  return !board.coating || c.state.coating === 'removed';
}

export type RemoveResult =
  | { ok: true; rank: number; best: number; identifies: boolean }
  | { ok: false; why: 'not-listed' | 'composition' | 'thin-only' | 'thick-only' | 'already' };

/**
 * Removes the coating around a part with one method, as the removal table allows (`dry`: only says
 * whether it would). `table`: the current 2M manual's Table 06-3 unless a lesson teaches NEETS 3-1.
 */
export function removeCoating(board: Board, c: Component, method: CoatMethod, dry = false, table: CoatTable = '06-3'): RemoveResult {
  const coat = board.coating;
  if (!coat || c.state.coating === 'removed') return { ok: false, why: 'already' };
  const rows = tableFor(table);
  const cell = rows[coat.type][method];
  if (!cell) return { ok: false, why: 'not-listed' };
  if (cell.thin && coat.thick) return { ok: false, why: 'thin-only' };
  if (cell.thick && !coat.thick) return { ok: false, why: 'thick-only' };
  // "specific coating compositions only" (A): the board says whether its coating is one of them
  if (cell.some && !coat.solventSoluble) return { ok: false, why: 'composition' };
  const best = Math.min(...Object.values(rows[coat.type]).filter((x): x is Cell => !!x && !(x.thin && coat.thick) && !(x.thick && !coat.thick) && !(x.some && !coat.solventSoluble)).map((x) => x.rank));
  if (dry) return { ok: true, rank: cell.rank, best, identifies: !!cell.ids };
  c.state.coating = 'removed';
  if (!board.coatingId) c.state.coatRemovedBlind = true;
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

// ---- Identification (T.O. 00-25-259 06-4.1, 06-4.2, 06-5.2 and Figure 06-1) ----

/** The five primary coatings of the 2M manual: AR, ER, SR, UR, XY (06-4.2). */
export const ID_TYPES: { id: CoatingType; code: string }[] = [
  { id: 'acrylic', code: 'AR' }, { id: 'epoxy', code: 'ER' }, { id: 'rtv', code: 'SR' }, { id: 'polyurethane', code: 'UR' }, { id: 'parylene', code: 'XY' },
];
export type CoatTest = 'press' | 'alcohol' | 'heat';
export const COAT_TESTS: { id: CoatTest; name: string }[] = [
  { id: 'press', name: tk('Press with an orangewood stick (hardness)') },
  { id: 'alcohol', name: tk('A drop of isopropyl alcohol (solubility)') },
  { id: 'heat', name: tk('Controlled heat at or below 361 °F (thermal)') },
];

/**
 * What a test shows on each coating, from the manual's descriptions (06-4.2.1 – 06-4.2.5).
 * Polyurethane ranges from very hard to relatively soft: the board says which (`soft`).
 */
export function observe(coat: NonNullable<Board['coating']>, test: CoatTest): string {
  const ur = coat.soft ? tk('Relatively soft: it dents and stretches under the stick rather than cracking.') : tk('Hard, but the surface dents or scratches under light pressure; it tears or stretches rather than cracking.');
  const table: Record<CoatTest, Partial<Record<CoatingType, string>>> = {
    press: {
      acrylic: tk('Moderately hard and smooth; it yields to scraping and chips or flakes.'),
      varnish: tk('Hard and tough when new, brittle when old; it peels, cracks and flakes.'),
      epoxy: tk('Hard; it does not chip, peel or crack under the stick.'),
      rtv: tk('Soft, rubbery and pliable: it bends very easily.'),
      polyurethane: ur,
      parylene: tk('Thin and tough, strongly bonded; once the bond breaks it bends and peels easily.'),
    },
    alcohol: {
      acrylic: tk('It dissolves and blots away easily.'),
      varnish: tk('It dissolves, leaving a gummy residue as the alcohol evaporates.'),
      epoxy: tk('No reaction.'),
      rtv: tk('No effect, though the surface may feel slick or greasy.'),
      polyurethane: tk('No effect.'),
      parylene: tk('No reaction.'),
    },
    heat: {
      acrylic: tk('It softens into a gummy residue.'),
      varnish: tk('It liquefies, with a strong smell of linseed oil.'),
      epoxy: tk('It overcures into a white powder.'),
      rtv: tk('No effect.'),
      polyurethane: tk('It softens: pliable, with a putty-like consistency.'),
      parylene: tk('No reaction at this temperature.'),
    },
  };
  return table[test][coat.type] ?? tk('No reaction.');
}
