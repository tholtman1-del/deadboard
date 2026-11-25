// The hook-up wire's prep dialog: how one end is stripped, tinned and formed on its terminal, with a
// to-scale drawing of the result and what a scale would measure (no verdict: that is the
// inspector's job after the work). Values come from src/terminals.ts.
import { t } from '../i18n';
import { icon } from './icons';
import { TERM_GEOM, WIRE, form, terminalName, type TerminalType, type WirePrep } from '../terminals';

type Esc = (s: string) => string;

/** The first prep the bench offers: a starting point, not the answer. */
export const START_PREP: WirePrep = { stripper: 'thermal', strip: 4, tinned: false, gap: 0.5, wrap: 90, flush: false, hook: 'arc', eye: true, dir: 'cw', seat: 'apart' };

const S = 26; // px per mm

/** Top view of the end on a round terminal (or a tab seen edge-on), or a cut-away of a solder cup. */
export function wirePreviewSvg(type: TerminalType, p: WirePrep): string {
  const f = form(p, type);
  const tinned = p.tinned ? '#c9ccd2' : '#c8783c', ins = '#e9e6dc', cond = WIRE.cond * S, od = WIRE.od * S;
  if (type === 'cup') {
    const W = 320, H = 260, cx = 160, rim = 150, depth = TERM_GEOM.cupDepth * S, cupW = 1.5 * S;
    const inserted = Math.min(p.strip, TERM_GEOM.cupDepth) * S;
    const bottom = rim + depth, tip = rim + inserted;
    const insEnd = tip - p.strip * S;
    const ticks = [1, 2].map((n) => `<line x1="${cx + 24}" x2="${cx + 44}" y1="${rim - n * WIRE.od * S}" y2="${rim - n * WIRE.od * S}" class="wp-tick"/><text x="${cx + 48}" y="${rim - n * WIRE.od * S + 4}" class="wp-lbl">${n}D</text>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="wp-svg" role="img" aria-label="${t('Drawing of the wire end')}">
      <path d="M${cx - cupW / 2 - 4} ${rim} V${bottom + 4} H${cx + cupW / 2 + 4} V${rim - 10}" class="wp-metal" fill="none" stroke-width="8"/>
      <line x1="${cx - 60}" x2="${cx + 50}" y1="${rim}" y2="${rim}" class="wp-ref"/>
      <text x="${cx - 60}" y="${rim - 4}" class="wp-lbl">${t('rim')}</text>
      <line x1="${cx}" x2="${cx}" y1="${insEnd}" y2="${tip}" stroke="${tinned}" stroke-width="${cond}" stroke-linecap="butt"/>
      <line x1="${cx}" x2="${cx}" y1="6" y2="${insEnd}" stroke="${ins}" stroke-width="${od}"/>
      ${ticks}
    </svg>`;
  }
  const W = 320, H = 200, cx = 240, cy = 112;
  const post = type === 'turret' ? TERM_GEOM.turretPost : type === 'hook' ? TERM_GEOM.hookStock : TERM_GEOM.tabThick;
  const R = post / 2 * S, r = (post + WIRE.cond) / 2 * S;
  const edge = cx - R; // the terminal's outside edge, where clearance is measured to
  const insEnd = edge - f.gap * S;
  const y = cy - r;
  const a = Math.min(f.contact, 359.5) * Math.PI / 180;
  // the arc from the top of the post, clockwise round it
  const ex = cx + r * Math.sin(a), ey = cy - r * Math.cos(a);
  const tx = ex + Math.cos(a) * f.tail * S, ty = ey + Math.sin(a) * f.tail * S;
  const arc = f.contact > 0.5 ? `<path d="M${cx} ${y} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${ex.toFixed(1)} ${ey.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)}" fill="none" stroke="${tinned}" stroke-width="${cond}"/>` : '';
  const body = type === 'tab'
    ? `<rect x="${cx - R}" y="${cy - 2.2 * S}" width="${2 * R}" height="${4.4 * S}" class="wp-metalfill"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${R}" class="wp-metalfill"/>`;
  const ticks = [1, 2].map((n) => `<line x1="${edge - n * WIRE.od * S}" x2="${edge - n * WIRE.od * S}" y1="${y + od / 2 + 6}" y2="${y + od / 2 + 22}" class="wp-tick"/><text x="${edge - n * WIRE.od * S - 7}" y="${y + od / 2 + 34}" class="wp-lbl">${n}D</text>`).join('');
  // counter-clockwise: the wire comes in along the other side of the post (the drawing mirrored)
  const wire = `<line x1="6" x2="${insEnd}" y1="${y}" y2="${y}" stroke="${ins}" stroke-width="${od}"/>
    <line x1="${insEnd}" x2="${cx}" y1="${y}" y2="${y}" stroke="${tinned}" stroke-width="${cond}"/>
    ${arc}`;
  return `<svg viewBox="0 0 ${W} ${H}" class="wp-svg" role="img" aria-label="${t('Drawing of the wire end')}">
    ${body}
    <line x1="${edge}" x2="${edge}" y1="${y - od}" y2="${y + od / 2 + 22}" class="wp-ref"/>
    ${p.dir === 'ccw' && type !== 'turret' ? `<g transform="matrix(1 0 0 -1 0 ${2 * cy})">${wire}</g>` : wire}
    ${ticks}
  </svg>`;
}

/** What a scale shows on the formed end. */
export function wireMeasureHtml(type: TerminalType, p: WirePrep): string {
  const f = form(p, type);
  const row = (k: string, v: string) => `<div><span class="muted">${k}</span> <b class="mono">${v}</b></div>`;
  if (type === 'cup') return row(t('Above the rim'), `${f.gap.toFixed(1)} mm`) + row(t('In the cup'), `${Math.min(p.strip, TERM_GEOM.cupDepth).toFixed(1)} / ${TERM_GEOM.cupDepth} mm`);
  return row(t('Clearance'), `${f.gap.toFixed(1)} mm`) + row(t('Contact'), `${Math.round(f.contact)}°`) + row(t('Cut end'), `${f.tail.toFixed(1)} mm`);
}

/**
 * The dialog body: controls on one side, the drawing and the scale on the other. `already`: wires
 * the terminal carries before this one (their placement and direction then matter).
 */
export function wirePrepHtml(ref: string, type: TerminalType, p: WirePrep, second: boolean, esc: Esc, already = 0): string {
  const cup = type === 'cup';
  const opt = (v: string | number, cur: string | number, label: string) => `<option value="${v}"${v === cur ? ' selected' : ''}>${label}</option>`;
  return `
    <div class="modal-backdrop" id="wp-close-bg">
      <div class="modal wire-prep" role="dialog" aria-modal="true" aria-labelledby="wp-title">
        <div class="modal-head">
          <h2 id="wp-title">${t('Wire end at {ref}', { ref: esc(ref) })} <span class="muted">${esc(t(terminalName(type)))}</span></h2>
          <button class="btn ghost icon sm" id="wp-cancel" title="${t('Cancel')}">${icon('x', 14)}</button>
        </div>
        <div class="wp-body">
        <p class="muted wp-wire">${t('{name}: {od} mm over the insulation, {c} mm conductor, {n} strands.', { name: WIRE.name, od: WIRE.od, c: WIRE.cond, n: WIRE.strands })}</p>
        <div class="wp-grid">
          <div class="wp-controls">
            <label>${t('Stripper')}<select id="wp-stripper">${opt('thermal', p.stripper, t('Thermal strippers'))}${opt('mechanical', p.stripper, t('Mechanical strippers'))}</select></label>
            <label>${t('Strip length')} <b class="mono" id="wp-strip-v">${p.strip.toFixed(1)} mm</b><input type="range" id="wp-strip" min="1" max="12" step="0.5" value="${p.strip}"></label>
            <label class="wp-check"><input type="checkbox" id="wp-tinned"${p.tinned ? ' checked' : ''}> ${t('Tin the stripped end (anti-wicking tweezers)')}</label>
            ${cup ? '' : `
            <label>${t('Clearance kept when forming')} <b class="mono" id="wp-gap-v">${p.gap.toFixed(2)} mm</b><input type="range" id="wp-gap" min="0" max="4" step="0.25" value="${p.gap}"></label>
            <label>${t('Bend round the terminal')}<select id="wp-wrap">${[90, 180, 270, 360].map((d) => opt(d, p.wrap, `${d}°`)).join('')}</select></label>
            <label class="wp-check"><input type="checkbox" id="wp-flush"${p.flush ? ' checked' : ''}> ${t('Cut the end flush (flush-cutting pliers)')}</label>`}
            ${type === 'hook' ? `<label>${t('Where on the hook')}<select id="wp-hook">${opt('arc', p.hook ?? 'arc', t('In the arc'))}${opt('base', p.hook ?? 'arc', t('Near the base'))}${opt('tip', p.hook ?? 'arc', t('Near the tip'))}</select></label>` : ''}
            ${type === 'tab' ? `<label class="wp-check"><input type="checkbox" id="wp-eye"${p.eye !== false ? ' checked' : ''}> ${t('Through the eye')}</label>` : ''}
            ${type === 'hook' || type === 'tab' ? `<label>${t('Bend direction')}<select id="wp-dir">${opt('cw', p.dir ?? 'cw', t('Clockwise'))}${opt('ccw', p.dir ?? 'cw', t('Counter-clockwise'))}</select></label>` : ''}
            ${already && !cup ? `<label>${t('Next to the wire already on {ref}', { ref: esc(ref) })}<select id="wp-seat">${type === 'turret'
              ? opt('close', p.seat ?? 'close', t('Against it, down at the base')) + opt('apart', p.seat ?? 'close', t('Higher up, with a gap')) + opt('over', p.seat ?? 'close', t('Across it'))
              : opt('close', p.seat === 'over' ? 'over' : 'close', t('Beside it')) + opt('over', p.seat === 'over' ? 'over' : 'close', t('Across it'))}</select></label>` : ''}
          </div>
          <div class="wp-view">
            <div id="wp-svg">${wirePreviewSvg(type, p)}</div>
            <div class="wp-measure" id="wp-measure">${wireMeasureHtml(type, p)}</div>
          </div>
        </div>
        <div class="row wp-actions">
          <button class="btn primary" id="wp-place">${second ? t('Place the wire') : t('Place this end')}</button>
          <button class="btn ghost" id="wp-cancel2">${t('Cancel')}</button>
        </div>
        </div>
      </div>
    </div>`;
}
