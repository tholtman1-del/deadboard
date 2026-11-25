// The laminate repair dialog (T.O. 00-25-259 11-5.2): excavation first, then fill and finish, each
// with a to-scale cross-section of the board at the burn. No verdict: the inspection gives that.
import { t } from '../i18n';
import { icon } from './icons';
import type { Burn, Excavation, Fill } from '../laminate';


export const START_EX: Excavation = { depth: 0.5, dia: 3, straight: false, undercut: 0, bevel: 0 };
export const START_FILL: Fill = { bubbleFree: false, overfill: 0, cured: false, leveled: false, buttercoat: false };

/** Cross-section through the burn, to scale across, height × 2 (board thickness `th` mm). */
export function lamPreviewSvg(burn: Burn, th: number, ex: Excavation | null, fill: Fill | null): string {
  const W = 420, H = 170, S = 36, SY = 2 * S, cx = W / 2 - 20, top = 40, bot = top + th * SY;
  const half = (W - 60) / 2;
  const char = `<path d="M${cx - burn.r * S} ${top} Q${cx} ${top + burn.depth * th * SY * 2} ${cx + burn.r * S} ${top} Z" class="lp-char"/>`;
  let cut = '', epoxy = '';
  if (ex) {
    const r = (ex.dia / 2) * S, d = Math.min(1, ex.depth) * th * SY, bvW = ex.bevel * th * S, bvH = Math.min(ex.bevel * th * S * 0.5, d * 0.25);
    const ucD = ex.undercut * th * S;
    const wall = ex.straight ? 0 : d * 0.35; // a sloped wall when not straight-walled
    // the undercut sits centred in the wall below the bevel (height kept inside the wall so the outline never crosses itself)
    const wallTop = top + bvH + 3, wallBot = top + d - 3;
    const ucH = Math.min(ex.undercut * th * SY, Math.max(0, wallBot - wallTop));
    const ucY = Math.max(wallTop, (wallTop + wallBot) / 2 - ucH / 2);
    const side = (s: number) => [
      [cx + s * (r + bvW), top], [cx + s * r, top + bvH],
      ...(ucD > 0 ? [[cx + s * r, ucY], [cx + s * (r + ucD), ucY], [cx + s * (r + ucD), ucY + ucH], [cx + s * (r - wall * 0.5), ucY + ucH]] : []),
      [cx + s * (r - wall), top + d],
    ];
    const L = side(-1), R = side(1).reverse();
    const pts = [...L, ...R].map((p) => p.join(',')).join(' ');
    cut = `<polygon points="${pts}" class="${fill ? 'lp-epoxy' : 'lp-hole'}"/>`;
    if (fill) {
      const over = fill.leveled ? 0 : fill.overfill * th * SY;
      if (over > 0) epoxy = `<rect x="${cx - r - bvW}" y="${top - over}" width="${2 * (r + bvW)}" height="${over}" class="lp-epoxy"/>`;
      if (fill.buttercoat) epoxy += `<rect x="${cx - r - bvW - 6}" y="${top - over - 3}" width="${2 * (r + bvW) + 12}" height="3" class="lp-butter"/>`;
    }
  }
  const tick = (y: number, label: string, dy: number) => `<line x1="${W - 50}" x2="${W - 40}" y1="${y}" y2="${y}" class="lp-tick"/><text x="${W - 37}" y="${y + dy}" class="lp-lbl">${label}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="wp-svg" role="img" aria-label="${t('Cross-section of the board at the burn')}">
    <rect x="${cx - half}" y="${top}" width="${2 * half}" height="${th * SY}" class="lp-board"/>
    <line x1="${cx - half}" x2="${cx + half}" y1="${top}" y2="${top}" class="lp-mask"/>
    ${ex && (ex.depth >= 0.999 || (ex.dia / 2 >= burn.r && ex.depth >= burn.depth)) ? '' : char}
    ${cut}${epoxy}
    ${tick(top + 0.75 * th * SY, '75%', -2)}${tick(bot, '100%', 12)}
    <text x="${cx - half}" y="${H - 8}" class="lp-lbl">${t('height × 2')}</text>
  </svg>`;
}

/** The dialog: excavation when the burn is untouched, fill and finish once it is excavated. */
export function lamDialogHtml(burn: Burn, th: number, ex: Excavation, fill: Fill): string {
  const stage = burn.ex ? 'fill' : 'excavate';
  const opt = (v: number | string, cur: number | string, label: string) => `<option value="${v}"${v === cur ? ' selected' : ''}>${label}</option>`;
  const pct = (x: number) => `${Math.round(x * 100)} %`;
  const controls = stage === 'excavate' ? `
    <label>${t('Excavation depth')}<select id="lp-depth">${[0.25, 0.5, 0.75, 1].map((x) => opt(x, ex.depth, x === 1 ? t('Through the board') : t('{p} of the thickness', { p: pct(x) }))).join('')}</select></label>
    <label>${t('Excavation diameter')} <b class="mono" id="lp-dia-v">${ex.dia.toFixed(1)} mm</b><input type="range" id="lp-dia" min="1" max="8" step="0.5" value="${ex.dia}"></label>
    <label class="wp-check"><input type="checkbox" id="lp-straight"${ex.straight ? ' checked' : ''}> ${t('Straight-wall the sides (inverted cone)')}</label>
    <label>${t('Undercut (slotting saw)')}<select id="lp-undercut">${[0, 0.25, 0.5, 0.75].map((x) => opt(x, ex.undercut, x === 0 ? t('None') : t('{p} of the thickness', { p: pct(x) }))).join('')}</select></label>
    <label>${t('Bevel on the top edge')}<select id="lp-bevel">${[0, 0.5, 1, 1.5].map((x) => opt(x, ex.bevel, x === 0 ? t('None') : t('{n} × the laminate thickness', { n: x }))).join('')}</select></label>`
    : `
    <label class="wp-check"><input type="checkbox" id="lp-bubble"${fill.bubbleFree ? ' checked' : ''}> ${t('Fill the undercut first with bubble-free epoxy')}</label>
    <label>${t('Overfill')}<select id="lp-over">${[0, 0.05, 0.15].map((x) => opt(x, fill.overfill, x === 0 ? t('Flush with the surface') : t('{p} of the thickness above it', { p: pct(x) }))).join('')}</select></label>
    <label class="wp-check"><input type="checkbox" id="lp-cured"${fill.cured ? ' checked' : ''}> ${t('Cure as the manufacturer directs')}</label>
    <label class="wp-check"><input type="checkbox" id="lp-level"${fill.leveled ? ' checked' : ''}> ${t('Abrade back to the original laminate level')}</label>
    <label class="wp-check"><input type="checkbox" id="lp-butter"${fill.buttercoat ? ' checked' : ''}> ${t('Buttercoat over the exposed fiber weave, cured')}</label>`;
  return `
    <div class="modal-backdrop" id="lp-close-bg">
      <div class="modal wire-prep" role="dialog" aria-modal="true" aria-labelledby="lp-title">
        <div class="modal-head">
          <h2 id="lp-title">${stage === 'excavate' ? t('Laminate repair: excavation') : t('Laminate repair: fill and finish')}</h2>
          <button class="btn ghost icon sm" id="lp-cancel" title="${t('Cancel')}">${icon('x', 14)}</button>
        </div>
        <div class="wp-body">
          <p class="muted wp-wire">${t('Burn about {d} mm across; laminate {th} mm thick ({p} charred deep).', { d: (2 * burn.r).toFixed(1), th: th.toFixed(1), p: pct(burn.depth) })}</p>
          <div class="wp-grid">
            <div class="wp-controls">${controls}</div>
            <div class="wp-view"><div id="lp-svg">${lamPreviewSvg(burn, th, stage === 'excavate' ? ex : burn.ex!, stage === 'excavate' ? null : fill)}</div></div>
          </div>
          <div class="row wp-actions">
            <button class="btn primary" id="lp-go">${stage === 'excavate' ? t('Excavate') : t('Fill and finish')}</button>
            <button class="btn ghost" id="lp-cancel2">${t('Cancel')}</button>
          </div>
        </div>
      </div>
    </div>`;
}
