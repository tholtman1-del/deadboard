// Wires on terminals (T.O. 00-25-259 WP 008 00 and WP 009 00; NEETS Module 14 fig. 3-8).
// A terminal is a through-hole part whose body is a turret, hook, pierced tab or solder cup; a
// hook-up wire is a jumper (`kind: 'wire'`) whose two ends record how each was prepared, formed and
// soldered. The checks below are the T.O.'s workmanship standards (target / acceptable / defect),
// so an inspector's verdict comes from the same numbers the manual uses. Universal: any board can
// carry terminals and wires.
import { t, tk } from './i18n';
import type { Board, Component, Jumper } from './types';

export type TerminalType = 'turret' | 'hook' | 'tab' | 'cup';
export const TERMINAL_TYPES: TerminalType[] = ['turret', 'hook', 'tab', 'cup'];

export function terminalType(c: Component): TerminalType | null {
  const s = c.body.shape as string;
  return (TERMINAL_TYPES as string[]).includes(s) ? (s as TerminalType) : null;
}

export const terminalName = (type: TerminalType) => ({ turret: tk('Turret terminal'), hook: tk('Hook terminal'), tab: tk('Pierced tab terminal'), cup: tk('Solder cup') })[type];

/**
 * The hook-up wire of the lessons: M22759/16-22, ETFE insulated, 19 strands of AWG 34, tin-plated.
 * Conductor .029–.031 in, finished diameter .052 ± .002 in (Glenair's M22759/16 table).
 */
export const WIRE = { name: 'M22759/16-22', awg: 22, strands: 19, cond: 0.76, od: 1.32 } as const;

/**
 * Terminal geometry (mm), estimates for small board terminals: the diameter the wire wraps round
 * (turret groove, hook stock, tab thickness at the eye) and a solder cup's depth.
 */
export const TERM_GEOM = { turretPost: 1.6, hookStock: 1.0, tabThick: 0.5, cupDepth: 2.5 } as const;

/** What the technician chose when preparing and forming one wire end. */
export interface WirePrep {
  /** Thermal strippers (preferred) or mechanical (not on AWG 22 or smaller: T.O. 08-5.3). */
  stripper: 'thermal' | 'mechanical';
  /** Insulation stripped off the end (mm). */
  strip: number;
  /** Tinned with anti-wicking tweezers (T.O. 08-5.4). */
  tinned: boolean;
  /** Bare wire kept between the insulation and the terminal when forming (mm). */
  gap: number;
  /** Wire bent round the terminal (degrees; not used on a solder cup). */
  wrap: number;
  /** The end cut off flush with flush-cutting pliers after forming. */
  flush: boolean;
  /** Hook: where on the hook the wire sits. */
  hook?: 'arc' | 'base' | 'tip';
  /** Pierced tab: through the eye (or bent over the edge). */
  eye?: boolean;
  /** Which way the wire is bent round the terminal (default clockwise, seen from above). */
  dir?: 'cw' | 'ccw';
  /**
   * Where a wire sits when the terminal already carries one (default `close`): against the wire
   * installed before it, as close to the base as its insulation allows; higher up with a gap; or
   * across it.
   */
  seat?: 'close' | 'apart' | 'over';
}

/** One end of a hook-up wire on a terminal. */
export interface WireEnd extends WirePrep {
  /** The terminal: component id and its pad. */
  comp: string;
  pad: number;
  type: TerminalType;
  /** Soldered with fresh solder ('ok'), or only with what the tinning and the terminal carried ('starved'). */
  soldered?: 'ok' | 'starved';
}

export const isWire = (j: Jumper): j is Jumper & { kind: 'wire'; ends: [WireEnd, WireEnd] } => j.kind === 'wire' && !!j.ends;
/** An end that does not conduct yet: wrapped or inserted, not soldered. */
export const endOpen = (j: Jumper, end: 0 | 1) => j.kind === 'wire' && !!j.ends && !j.ends[end].soldered;

/** How the formed end measures: insulation clearance, wire-to-terminal contact, cut end beyond the terminal (mm, degrees). */
export interface Formed { gap: number; contact: number; tail: number; /** cup: wire bottomed in the cup */ full?: boolean }

const wrapRadius = (type: TerminalType) => ((type === 'turret' ? TERM_GEOM.turretPost : type === 'hook' ? TERM_GEOM.hookStock : TERM_GEOM.tabThick) + WIRE.cond) / 2;

export function form(p: WirePrep, type: TerminalType): Formed {
  if (type === 'cup') {
    // the stripped end goes to the bottom of the cup; what is left above the rim is the clearance
    if (p.strip >= TERM_GEOM.cupDepth) return { gap: p.strip - TERM_GEOM.cupDepth, contact: 0, tail: 0, full: true };
    return { gap: 0, contact: 0, tail: 0, full: false };
  }
  const gap = Math.max(0, p.gap);
  const r = wrapRadius(type);
  const avail = Math.max(0, p.strip - gap);
  const need = (p.wrap * Math.PI / 180) * r;
  if (avail < need) return { gap, contact: (avail / r) * 180 / Math.PI, tail: 0 };
  return { gap, contact: p.wrap, tail: p.flush ? 0 : avail - need };
}

/** Bare wire needed for a target end: clearance of one diameter, 180° round the terminal, no tail (mm). */
export function targetStrip(type: TerminalType): number {
  if (type === 'cup') return TERM_GEOM.cupDepth + WIRE.od;
  return WIRE.od + Math.PI * wrapRadius(type);
}

export type Verdict = 'target' | 'acceptable' | 'defect';
export type CheckArea = 'strip' | 'tinning' | 'clearance' | 'forming' | 'solder';
export interface Check { area: CheckArea; verdict: Verdict; what: string; value: string; /** T.O. 00-25-259 paragraph */ para: string }

const dia = (x: number, d: number) => t('{n} D', { n: (x / d).toFixed(1) });

/**
 * Every workmanship check of one end, in the T.O.'s terms. `before`: the ends installed on the same
 * terminal before this one (multiple-wire rules, 08-6.5 – 08-6.7).
 */
export function judge(e: WireEnd, before: WireEnd[] = []): Check[] {
  const f = form(e, e.type), out: Check[] = [];
  const cup = e.type === 'cup';
  out.push(e.stripper === 'mechanical'
    ? { area: 'strip', verdict: 'defect', what: t('Mechanical strippers on AWG 22: the pull can stretch the wire'), value: t('mechanical'), para: '08-5.3' }
    : { area: 'strip', verdict: 'target', what: t('Thermal strippers'), value: t('thermal'), para: '08-5.3' });
  out.push(e.tinned
    ? { area: 'tinning', verdict: 'target', what: t('Stranded wire tinned'), value: t('tinned'), para: '08-6.3' }
    : { area: 'tinning', verdict: 'defect', what: t('Stranded wire not tinned where it meets the solder'), value: t('bare strands'), para: '08-6.3' });
  // insulation clearance: one wire diameter (with insulation) is the target, up to two is acceptable
  const g = f.gap, D = WIRE.od;
  const gv: Verdict = g < 0.05 || g > 2 * D ? 'defect' : Math.abs(g - D) <= 0.25 * D ? 'target' : 'acceptable';
  out.push({
    area: 'clearance', verdict: gv, para: cup ? '09-6.1' : '08-6.4', value: `${g.toFixed(2)} mm · ${dia(g, D)}`,
    what: g < 0.05 ? (cup ? t('The insulation touches the solder fillet') : t('The insulation touches the terminal'))
      : g > 2 * D ? t('Insulation clearance over two wire diameters') : gv === 'target' ? t('Insulation clearance of one wire diameter') : t('Insulation clearance within two wire diameters'),
  });
  if (cup) {
    out.push(f.full
      ? { area: 'forming', verdict: 'target', what: t('Wire inserted for the full depth of the cup'), value: t('full depth'), para: '09-6.1' }
      : { area: 'forming', verdict: 'defect', what: t('Wire not inserted for the full depth of the cup'), value: t('{s} mm stripped, cup {d} mm deep', { s: e.strip.toFixed(1), d: TERM_GEOM.cupDepth }), para: '09-6.1' });
  } else {
    const tab = e.type === 'tab', min = tab ? 90 : 180, para = tab ? '08-6.7' : e.type === 'hook' ? '08-6.6' : '08-6.5';
    const c = f.contact;
    const cv: Verdict = c >= 360 || c < min - 1 ? 'defect' : Math.abs(c - 180) <= 1 ? 'target' : 'acceptable';
    out.push({
      area: 'forming', verdict: cv, para, value: `${Math.round(c)}°`,
      what: c >= 360 ? t('The wire overlaps itself on the terminal')
        : c < min - 1 ? (tab ? t('Wire-to-terminal contact under 90°') : t('Wire contacts the terminal for less than 180°'))
        : cv === 'target' ? t('Wire contacts the terminal for 180°') : t('Wire contact over 180°, not overlapping'),
    });
    const tv: Verdict = f.tail < 0.05 ? 'target' : f.tail <= WIRE.cond ? 'acceptable' : 'defect';
    out.push({ area: 'forming', verdict: tv, para, value: f.tail < 0.05 ? t('cut flush') : t('end {n} mm out', { n: f.tail.toFixed(1) }), what: tv === 'defect' ? t('The cut end extends over one wire diameter beyond the terminal') : tv === 'target' ? t('The cut end contacts the terminal') : t('The cut end extends one wire diameter or less') });
    if (e.type === 'hook') {
      const h = e.hook ?? 'arc';
      out.push(h === 'arc'
        ? { area: 'forming', verdict: 'target', what: t('Wire attached within the 180° arc of the hook'), value: t('in the arc'), para }
        : { area: 'forming', verdict: 'defect', what: h === 'base' ? t('Wire attached less than two wire diameters from the base of the hook') : t('Wire attached less than one wire diameter from the end of the hook'), value: h === 'base' ? t('at the base') : t('at the tip'), para });
    }
    if (before.length) {
      const seat = e.seat ?? 'close';
      out.push(seat === 'over'
        ? { area: 'forming', verdict: 'defect', what: t('Multiple wires cross over or overlap each other on the terminal'), value: t('across the other wire'), para }
        : e.type !== 'turret'
          ? { area: 'forming', verdict: 'target', what: t('Multiple wires do not overlap'), value: t('beside the other wire'), para }
          : seat === 'close'
            ? { area: 'forming', verdict: 'target', what: t('Next wire mounted as close to the base as the insulation allows'), value: t('against the other wire'), para }
            : { area: 'forming', verdict: 'acceptable', what: t('Next wire not in contact with the wire installed before it'), value: t('gap to the other wire'), para });
      if (e.type !== 'turret') {
        const alt = (e.dir ?? 'cw') !== (before[before.length - 1].dir ?? 'cw');
        out.push(alt
          ? { area: 'forming', verdict: 'target', what: t('Multiple wires attached in alternating directions'), value: t('alternating'), para }
          : { area: 'forming', verdict: 'acceptable', what: t('Multiple wires not attached in alternating directions'), value: t('same direction'), para });
      }
    }
    if (tab) {
      out.push(e.eye !== false
        ? { area: 'forming', verdict: 'target', what: t('Wire passes through the eye of the terminal'), value: t('through the eye'), para }
        : { area: 'forming', verdict: 'defect', what: t('Wire does not pass through the eye of the terminal'), value: t('over the edge'), para });
    }
  }
  out.push(!e.soldered
    ? { area: 'solder', verdict: 'defect', what: t('Not soldered'), value: '—', para: cup ? '09-6.1' : '08-6.12' }
    : e.soldered === 'starved'
      ? { area: 'solder', verdict: 'defect', what: cup ? t('Solder fill under 75 % of the cup: no solder was added') : t('Fillet does not cover 100 % of the wire-to-terminal contact: no solder was added'), value: cup ? t('under 75 %') : t('starved'), para: cup ? '09-6.1' : '08-6.12' }
      : { area: 'solder', verdict: 'target', what: cup ? t('Cup filled, wire wetted to the cup') : t('Fillet covers the whole contact, wire contour visible'), value: cup ? '100 %' : t('full fillet'), para: cup ? '09-6.1' : '08-6.12' });
  return out;
}

/** The wire ends sitting on one terminal joint. */
export function endsAt(board: Board, c: Component, pi: number): { j: Jumper; end: 0 | 1 }[] {
  const out: { j: Jumper; end: 0 | 1 }[] = [];
  for (const j of board.jumpers) {
    if (!isWire(j)) continue;
    j.ends.forEach((e, i) => { if (e.comp === c.id && e.pad === pi) out.push({ j, end: i as 0 | 1 }); });
  }
  return out;
}

/**
 * A known-good end for authoring a reference board: the target in every respect (stripped long, then
 * cut flush). `nth`: how many wires the terminal already carries (the next one alternates direction).
 */
export function targetEnd(c: Component, type: TerminalType, nth = 0): WireEnd {
  return { comp: c.id, pad: 0, type, stripper: 'thermal', strip: type === 'cup' ? Math.round(targetStrip(type) * 2) / 2 : Math.ceil(targetStrip(type)) + 1, tinned: true, gap: type === 'cup' ? 0 : WIRE.od, wrap: 180, flush: true, hook: 'arc', eye: true, dir: nth % 2 ? 'ccw' : 'cw', seat: 'close', soldered: 'ok' };
}

/** Puts a hook-up wire between two terminals, each end prepared and formed as `pa` / `pb`, not yet soldered. */
export function addWire(board: Board, a: Component, pa: WirePrep, b: Component, pb: WirePrep): Jumper {
  const at = (c: Component): [number, number] => {
    const p = c.pads[0].at, r = (c.rot * Math.PI) / 180;
    return [c.at[0] + p[0] * Math.cos(r) - p[1] * Math.sin(r), c.at[1] + p[0] * Math.sin(r) + p[1] * Math.cos(r)];
  };
  const end = (c: Component, p: WirePrep): WireEnd => {
    const { stripper, strip, tinned, gap, wrap, flush, hook, eye, dir, seat } = p; // only the prep: a new end is not soldered
    return { stripper, strip, tinned, gap, wrap, flush, hook, eye, dir, seat, comp: c.id, pad: 0, type: terminalType(c)! };
  };
  const j: Jumper = { id: 'j' + (board.nextId++).toString(36), a: at(a), b: at(b), la: 'F', lb: 'F', kind: 'wire', ends: [end(a, pa), end(b, pb)] };
  board.jumpers.push(j);
  return j;
}
