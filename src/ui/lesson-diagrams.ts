// Diagrams for the soldering-course lessons, drawn as inline SVG in the app's colours (they follow
// the theme through CSS classes). Each one illustrates the lesson's own numbers; values are the
// sources' (T.O. 00-25-259, NEETS 14) unless marked as a simplification.
import { t } from '../i18n';
import { lamPreviewSvg } from './laminate-ui';

export type LessonDiagram = 'phase' | 'fillets' | 'shotgun' | 'patch';

/**
 * The tin-lead phase diagram, simplified: the liquidus (all molten above it) from the textbook
 * Sn-Pb diagram, the eutectic line at 183 °C, the alloys the course uses, and two references:
 * SAC305 (lead-free) and the 316 °C tip. Liquidus points are rounded textbook values.
 */
function phaseSvg(): string {
  const W = 440, H = 230, x0 = 48, x1 = W - 16, y0 = 18, y1 = H - 34;
  const tMin = 150, tMax = 340;
  const X = (sn: number) => x0 + (sn / 100) * (x1 - x0);
  const Y = (c: number) => y1 - ((c - tMin) / (tMax - tMin)) * (y1 - y0);
  const liquidus: [number, number][] = [[0, 327], [10, 302], [20, 277], [30, 255], [40, 238], [50, 214], [60, 191], [61.9, 183], [70, 193], [80, 205], [90, 216], [100, 232]];
  const path = liquidus.map(([sn, c], i) => `${i ? 'L' : 'M'}${X(sn).toFixed(1)} ${Y(c).toFixed(1)}`).join(' ');
  const yTicks = [150, 183, 200, 250, 300].map((c) => `<line x1="${x0 - 4}" x2="${x0}" y1="${Y(c)}" y2="${Y(c)}" class="dg-axis"/><text x="${x0 - 7}" y="${Y(c) + 3.5}" class="dg-lbl" text-anchor="end">${c}</text>`).join('');
  const xTicks = [0, 20, 40, 60, 80, 100].map((sn) => `<line x1="${X(sn)}" x2="${X(sn)}" y1="${y1}" y2="${y1 + 4}" class="dg-axis"/><text x="${X(sn)}" y="${y1 + 15}" class="dg-lbl" text-anchor="middle">${sn}</text>`).join('');
  // an alloy's plastic range as a bar on its composition, labelled beside it (left or right of the bar)
  const range = (sn: number, hi: number, label: string, side: -1 | 1) =>
    `<line x1="${X(sn)}" x2="${X(sn)}" y1="${Y(183)}" y2="${Y(hi)}" class="dg-range"/><text x="${X(sn) + side * 7}" y="${Y(188) + 3}" class="dg-lbl dg-strong" text-anchor="${side < 0 ? 'end' : 'start'}">${label}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="dg-svg" role="img" aria-label="${t('Tin-lead phase diagram')}">
    <line x1="${x0}" x2="${x1}" y1="${Y(220)}" y2="${Y(220)}" class="dg-ref"/>
    <text x="${x0 + 6}" y="${Y(220) - 4}" class="dg-lbl">SAC305 217–220 °C</text>
    <line x1="${x0}" x2="${x1}" y1="${Y(316)}" y2="${Y(316)}" class="dg-ref"/>
    <text x="${x1}" y="${Y(316) - 4}" class="dg-lbl" text-anchor="end">${t('tip 316 °C (600 °F)')}</text>
    <line x1="${X(19)}" x2="${X(97.5)}" y1="${Y(183)}" y2="${Y(183)}" class="dg-line"/>
    <path d="${path}" class="dg-line" fill="none"/>
    <text x="${X(34)}" y="${Y(285)}" class="dg-lbl">${t('liquid')}</text>
    <text x="${X(20)}" y="${Y(194)}" class="dg-lbl">${t('plastic range')}</text>
    <text x="${X(84)}" y="${Y(168)}" class="dg-lbl" text-anchor="middle">${t('solid')}</text>
    <circle cx="${X(63)}" cy="${Y(183)}" r="4" class="dg-dot"/>
    <text x="${X(63)}" y="${Y(183) + 16}" class="dg-lbl dg-strong" text-anchor="middle">63/37 · 183 °C</text>
    ${range(60, 191, '60/40', -1)}${range(70, 193, '70/30', 1)}
    <line x1="${x0}" x2="${x0}" y1="${y0}" y2="${y1}" class="dg-axis"/><line x1="${x0}" x2="${x1}" y1="${y1}" y2="${y1}" class="dg-axis"/>
    ${yTicks}${xTicks}
    <text x="${(x0 + x1) / 2}" y="${H - 4}" class="dg-lbl" text-anchor="middle">${t('% tin (the rest lead)')}</text>
    <text x="12" y="${y0 + 4}" class="dg-lbl">°C</text>
  </svg>
  <p class="muted dg-note">${t('Simplified from the tin-lead phase diagram: above the line all is liquid; 63/37 goes from solid to liquid at one temperature, other alloys pass through a plastic range where a moved joint is damaged. Dashed: the tip, and where lead-free SAC305 melts.')}</p>`;
}

/** Five through-hole joints in cross-section: the target fillet and the defects the inspector names. */
function filletsSvg(): string {
  const W = 470, H = 150, w = 86;
  const cell = (i: number, label: string, cls: string, solder: string) => {
    const ox = 8 + i * (w + 7), top = 58, bot = 86, cx = ox + w / 2;
    return `<g>
      <rect x="${ox}" y="${top}" width="${w}" height="${bot - top}" class="dg-board"/>
      <rect x="${cx - 7}" y="${top}" width="14" height="${bot - top}" class="dg-hole"/>
      <rect x="${cx - 16}" y="${top - 2}" width="32" height="2" class="dg-cu"/><rect x="${cx - 16}" y="${bot}" width="32" height="2" class="dg-cu"/>
      <rect x="${cx - 2}" y="${top - 46}" width="4" height="${bot - top + 66}" class="dg-lead"/>
      ${solder.replace(/CX/g, String(cx)).replace(/TOP/g, String(top)).replace(/BOT/g, String(bot))}
      <text x="${cx}" y="${H - 10}" class="dg-lbl ${cls}" text-anchor="middle">${label}</text>
    </g>`;
  };
  // solder shapes, written with CX / TOP / BOT placeholders; "a+b" and "a-b" are resolved below.
  // The target fillet is concave and thin round the lead, so the lead still shows through it.
  const fill = '<rect x="CX-7" y="TOP" width="14" height="28" class="dg-solder"/>';
  const target = '<path d="MCX-16 TOP Q CX-4 TOP-2 CX-2 TOP-12 L CX-2 TOP L CX+2 TOP L CX+2 TOP-12 Q CX+4 TOP-2 CX+16 TOP Z" class="dg-solder"/>';
  const resolve = (svg: string) => svg.replace(/(\d+(?:\.\d+)?)([+-])(\d+(?:\.\d+)?)/g, (_, a, op, b) => String(op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)));
  const cells = [
    cell(0, t('Target'), 'dg-ok', fill + target),
    cell(1, t('Too little'), 'dg-bad', '<rect x="CX-7" y="TOP+14" width="14" height="14" class="dg-solder"/><path d="MCX-9 TOP Q CX TOP+3 CX+9 TOP Z" class="dg-solder"/>'),
    cell(2, t('Too much'), 'dg-bad', fill + '<path d="MCX-17 TOP C CX-20 TOP-26 CX+20 TOP-26 CX+17 TOP Z" class="dg-solder"/>'),
    cell(3, t('Icicle'), 'dg-bad', fill + target + '<path d="MCX-3 BOT+2 L CX BOT+18 L CX+3 BOT+2 Z" class="dg-solder"/>'),
    cell(4, t('Not wetted'), 'dg-bad', '<rect x="CX-7" y="TOP+4" width="14" height="24" class="dg-dull"/><path d="MCX-10 TOP+1 Q CX-6 TOP-8 CX-2 TOP-6 L CX+2 TOP-6 Q CX+6 TOP-8 CX+10 TOP+1 Z" class="dg-dull"/>'),
  ].map(resolve).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="dg-svg" role="img" aria-label="${t('Solder joints in cross-section')}">${cells}</svg>
  <p class="muted dg-note">${t('Target: the hole full, a concave fillet covering the pad, the lead\'s outline still visible (T.O. 07-6.20). The inspector rejects too little, too much, an icicle and an unwetted joint (05-4.2).')}</p>`;
}

/** A DIP-16 seen from the top: pin numbers counterclockwise from pin 1, and a skipping (shotgun) order. */
function shotgunSvg(): string {
  const W = 440, H = 170, x0 = 70, pitch = 38, yB = 128, yT = 42;
  const order = [1, 3, 5, 7, 2, 4, 6, 8, 9, 11, 13, 15, 10, 12, 14, 16];
  const step = (pin: number) => order.indexOf(pin) + 1;
  const pad = (pin: number) => {
    const i = pin <= 8 ? pin - 1 : 16 - pin, x = x0 + i * pitch, y = pin <= 8 ? yB : yT;
    return `<g><rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="${pin === 1 ? 2 : 11}" class="dg-pad"/>
      <text x="${x}" y="${y + 4}" class="dg-lbl dg-strong" text-anchor="middle">${step(pin)}</text>
      <text x="${x}" y="${pin <= 8 ? y + 26 : y - 16}" class="dg-lbl" text-anchor="middle">${pin}</text></g>`;
  };
  const bodyX = x0 - 26, bodyW = 7 * pitch + 52;
  return `<svg viewBox="0 0 ${W} ${H}" class="dg-svg" role="img" aria-label="${t('Skipping pattern on a 16-pin DIP')}">
    <rect x="${bodyX}" y="${yT + 18}" width="${bodyW}" height="${yB - yT - 36}" rx="3" class="dg-body"/>
    <path d="M${bodyX} ${(yT + yB) / 2 - 9} a9 9 0 0 1 0 18 Z" class="dg-notch"/>
    ${Array.from({ length: 16 }, (_, i) => pad(i + 1)).join('')}
  </svg>
  <p class="muted dg-note">${t('Heating order in the pads, pin numbers beside them. Top view, notch on the left: pin 1 is the first pin counterclockwise from the notch, and the pins count on counterclockwise (NEETS 14, p. 1-27). The order never heats two neighbouring pins one after the other.')}</p>`;
}

/** The surface patch to T.O. 11-5.2, drawn by the bench's own laminate model: excavated, then filled. */
function patchSvg(): string {
  const burn = { id: 'x', at: [0, 0] as [number, number], r: 2, depth: 0.4 };
  const ex = { depth: 0.75, dia: 5, straight: true, undercut: 0.5, bevel: 1 };
  return `<div class="dg-pair">
      <figure class="dg-fig">${lamPreviewSvg(burn, 1.6, ex, null)}<figcaption>${t('Excavated: 75 % deep, straight walls, a 50 % undercut centred in the wall, a bevel one laminate thickness wide.')}</figcaption></figure>
      <figure class="dg-fig">${lamPreviewSvg(burn, 1.6, ex, { bubbleFree: true, overfill: 0.05, cured: true, leveled: false, buttercoat: false })}<figcaption>${t('Filled with bubble-free epoxy, about 5 % over the surface; then cured, levelled and buttercoated.')}</figcaption></figure>
    </div>`;
}

export function lessonDiagramHtml(d: LessonDiagram): string {
  const body = d === 'phase' ? phaseSvg() : d === 'fillets' ? filletsSvg() : d === 'shotgun' ? shotgunSvg() : patchSvg();
  return `<div class="lesson-diagram">${body}</div>`;
}
