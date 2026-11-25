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
    // the barrel only part filled: one concave meniscus sunk inside the hole, no fillet on the pad
    cell(1, t('Too little'), 'dg-bad', '<path d="MCX-7 BOT L CX-7 TOP+11 Q CX TOP+19 CX+7 TOP+11 L CX+7 BOT Z" class="dg-solder"/>'),
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

/** Six common packages and how to read pin 1 or polarity on each (NEETS 14 pp. 1-27 – 1-28, T.O. 07-6.10). */
export function polaritySvg(): string {
  const W = 470, H = 224;
  const box = (x: number, y: number, title: string, sub: string, inner: string) =>
    `<g transform="translate(${x},${y})">
      <rect x="0" y="0" width="148" height="104" rx="5" class="dg-card"/>
      <text x="74" y="15" class="dg-lbl dg-strong" text-anchor="middle">${title}</text>
      ${inner}
      <text x="74" y="96" class="dg-lbl" text-anchor="middle">${sub}</text>
    </g>`;
  // 1. DIP (top view): notch on left, pin 1 bottom-left, counting counterclockwise
  const dipPins = [1, 2, 3, 4].map((n, i) => {
    const px = 42 + i * 21;
    return `<rect x="${px - 5}" y="62" width="10" height="7" rx="${n === 1 ? 1 : 3}" class="dg-pad"/>
      <text x="${px}" y="79" class="dg-lbl ${n === 1 ? 'dg-ok' : ''}" text-anchor="middle">${n}</text>
      <rect x="${px - 5}" y="27" width="10" height="7" rx="3" class="dg-pad"/>
      <text x="${px}" y="24" class="dg-lbl" text-anchor="middle">${9 - n}</text>`;
  }).join('');
  const dip = `<rect x="30" y="34" width="88" height="28" rx="2" class="dg-body"/>
    <path d="M30 43 a5 5 0 0 1 0 10 Z" class="dg-notch"/>
    <circle cx="42" cy="55" r="2.5" class="dg-dot"/>${dipPins}`;

  // 2. Flat pack (top view): dot index bottom-left, gull-wing leads, counterclockwise
  const fpPins = [1, 2, 3, 4].map((n, i) => {
    const px = 44 + i * 20;
    return `<rect x="${px - 2.5}" y="60" width="5" height="11" class="dg-lead"/>
      <text x="${px}" y="81" class="dg-lbl ${n === 1 ? 'dg-ok' : ''}" text-anchor="middle">${n}</text>
      <rect x="${px - 2.5}" y="25" width="5" height="11" class="dg-lead"/>`;
  }).join('');
  const fp = `<rect x="34" y="36" width="80" height="24" rx="2" class="dg-body"/>
    <circle cx="44" cy="53" r="2.8" class="dg-dot"/>${fpPins}`;

  // 3. TO-39 / TO-5 (bottom view): tab at 7:30, 45° from E; pins 1 (E), 2 (B), 3 (C) clockwise from it
  const to39 = `<g transform="translate(74,52)">
    <rect x="-5" y="-3.5" width="10" height="7" transform="translate(-18.4,18.4) rotate(45)" class="dg-lead"/>
    <circle cx="0" cy="0" r="24" class="dg-solder"/>
    <circle cx="0" cy="0" r="19" class="dg-board"/>
    <circle cx="-13" cy="0" r="3" class="dg-cu"/><text x="-28" y="4" class="dg-lbl dg-ok" text-anchor="end">1 E</text>
    <circle cx="0" cy="-13" r="3" class="dg-cu"/><text x="0" y="-28" class="dg-lbl" text-anchor="middle">2 B</text>
    <circle cx="13" cy="0" r="3" class="dg-cu"/><text x="28" y="4" class="dg-lbl" text-anchor="start">3 C</text>
    <text x="0" y="12" class="dg-lbl" text-anchor="middle">${t('CW')}</text>
  </g>`;

  // 4. TO-92 (flat face toward you, leads down): 1, 2, 3 left to right
  const to92 = `<rect x="52" y="26" width="44" height="24" rx="3" class="dg-body"/>
    <text x="74" y="42" class="dg-lbl" text-anchor="middle">${t('flat')}</text>
    <rect x="58" y="50" width="3" height="22" class="dg-lead"/><text x="59.5" y="83" class="dg-lbl dg-ok" text-anchor="middle">1</text>
    <rect x="72.5" y="50" width="3" height="22" class="dg-lead"/><text x="74" y="83" class="dg-lbl" text-anchor="middle">2</text>
    <rect x="87" y="50" width="3" height="22" class="dg-lead"/><text x="88.5" y="83" class="dg-lbl" text-anchor="middle">3</text>`;

  // 5. Diode & LED: cathode band on diode, flat edge + short lead on LED
  const diodeLed = `
    <line x1="16" y1="36" x2="72" y2="36" class="dg-line"/>
    <rect x="28" y="29" width="32" height="14" rx="2" class="dg-body"/>
    <rect x="51" y="29" width="5" height="14" class="dg-solder"/>
    <text x="20" y="32" class="dg-lbl">A</text><text x="64" y="32" class="dg-lbl dg-ok">K</text>
    <path d="M104 28 A12 12 0 1 0 116 48 L116 28 Z" class="dg-pad"/>
    <rect x="103" y="48" width="2.5" height="26" class="dg-lead"/><text x="100" y="81" class="dg-lbl" text-anchor="end">+</text>
    <rect x="111" y="48" width="2.5" height="18" class="dg-lead"/><text x="116" y="75" class="dg-lbl dg-ok" text-anchor="start">K −</text>
    <text x="108" y="25" class="dg-lbl" text-anchor="middle">${t('flat = K')}</text>`;

  // 6. Electrolytic (− stripe) vs Tantalum (+ stripe): classic polarity trap
  const caps = `
    <rect x="22" y="28" width="42" height="30" rx="4" class="dg-body"/>
    <rect x="52" y="28" width="10" height="30" class="dg-solder"/>
    <text x="57" y="47" class="dg-lbl dg-bad" text-anchor="middle">−</text>
    <text x="43" y="72" class="dg-lbl" text-anchor="middle">${t('Al elec.')}</text>
    <rect x="84" y="32" width="42" height="22" rx="3" class="dg-cu"/>
    <rect x="84" y="32" width="10" height="22" class="dg-solder"/>
    <text x="89" y="47" class="dg-lbl dg-ok" text-anchor="middle">+</text>
    <text x="105" y="72" class="dg-lbl" text-anchor="middle">${t('Tantalum')}</text>`;

  return `<div class="lesson-diagram">
    <svg viewBox="0 0 ${W} ${H}" class="dg-svg dg-wide" role="img" aria-label="${t('Component pin 1 and polarity markings')}">
      ${box(4, 4, t('DIP (top view)'), t('pin 1 left of notch, CCW'), dip)}
      ${box(161, 4, t('Flat pack (top view)'), t('pin 1 CCW from dot'), fp)}
      ${box(318, 4, t('TO-39 / TO-5 (bottom)'), t('CW from tab · can = C'), to39)}
      ${box(4, 114, t('TO-92 (flat face)'), t('1–2–3 L→R (check sheet)'), to92)}
      ${box(161, 114, t('Diode & LED'), t('band / flat + short = K'), diodeLed)}
      ${box(318, 114, t('Polarised caps'), t('stripe: − Al, + tantalum'), caps)}
    </svg>
  </div>`;
}

export type DrillDiagram =
  | 'fillet-target' | 'fillet-excess' | 'fillet-icicle' | 'fillet-under'
  | 'wire-acc' | 'wire-touch' | 'fp-target' | 'fp-overhang'
  | 'clinch-iso' | 'clinch-semi';

/** Focused cross-section or top-view drawing for one visual inspection drill card (no answer shown). */
export function drillSvg(id: DrillDiagram): string {
  const W = 220, H = 112;
  const wrap = (inner: string, label: string) =>
    `<svg viewBox="0 0 ${W} ${H}" class="dg-svg dg-drill" role="img" aria-label="${label}">${inner}</svg>`;

  // Through-hole solder fillets (T.O. 07-6.20, 05-4.2.10, 05-4.2.12)
  if (id.startsWith('fillet-')) {
    const cx = 110, top = 46, bot = 74;
    const base = `
      <rect x="28" y="${top}" width="164" height="${bot - top}" class="dg-board"/>
      <rect x="${cx - 9}" y="${top}" width="18" height="${bot - top}" class="dg-hole"/>
      <rect x="${cx - 24}" y="${top - 3}" width="48" height="3" class="dg-cu"/>
      <rect x="${cx - 24}" y="${bot}" width="48" height="3" class="dg-cu"/>
      <rect x="${cx - 3}" y="12" width="6" height="86" class="dg-lead"/>`;
    const full = `<rect x="${cx - 9}" y="${top}" width="18" height="${bot - top}" class="dg-solder"/>`;
    const concave = `<path d="M${cx - 24} ${top - 3} Q ${cx - 6} ${top - 5} ${cx - 3} ${top - 18} L ${cx - 3} ${top} L ${cx + 3} ${top} L ${cx + 3} ${top - 18} Q ${cx + 6} ${top - 5} ${cx + 24} ${top - 3} Z" class="dg-solder"/>`;
    const solder = id === 'fillet-target' ? full + concave
      : id === 'fillet-excess' ? full + `<path d="M${cx - 26} ${top - 3} C ${cx - 30} ${top - 38} ${cx + 30} ${top - 38} ${cx + 26} ${top - 3} Z" class="dg-solder"/>`
      : id === 'fillet-icicle' ? full + concave + `<path d="M${cx + 4} ${bot + 3} L ${cx + 24} ${bot + 26} L ${cx + 12} ${bot + 3} Z" class="dg-solder"/>`
      : `<path d="M${cx - 9} ${bot} L ${cx - 9} ${top + 12} Q ${cx} ${top + 20} ${cx + 9} ${top + 12} L ${cx + 9} ${bot} Z" class="dg-solder"/>`;
    return wrap(base + solder, t('Through-hole solder joint cross-section'));
  }

  // Turret terminal wire clearance (T.O. 08-6.4): post on right, insulation + 1D / 2D ticks
  if (id === 'wire-acc' || id === 'wire-touch') {
    const cx = 158, cy = 54, R = 16, r = 21, D = 26, edge = cx - R;
    const gap = id === 'wire-acc' ? 1.6 * D : 0;
    const insEnd = edge - gap;
    const ticks = [1, 2].map((n) => `<line x1="${edge - n * D}" x2="${edge - n * D}" y1="48" y2="66" class="dg-axis"/><text x="${edge - n * D}" y="78" class="dg-lbl" text-anchor="middle">${n}D</text>`).join('');
    return wrap(`
      <circle cx="${cx}" cy="${cy}" r="${R}" class="dg-solder"/>
      <line x1="${edge}" x2="${edge}" y1="18" y2="66" class="dg-ref"/>
      <line x1="16" x2="${insEnd}" y1="${cy - r}" y2="${cy - r}" stroke="var(--text-2)" stroke-width="14"/>
      <line x1="${insEnd}" x2="${cx}" y1="${cy - r}" y2="${cy - r}" stroke="#c9ccd2" stroke-width="7"/>
      <path d="M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r}" fill="none" stroke="#c9ccd2" stroke-width="7"/>
      ${ticks}
      <text x="16" y="98" class="dg-lbl">${id === 'wire-acc' ? t('clearance: 1.6 D') : t('clearance: 0 D (touching)')}</text>`, t('Turret terminal wire clearance'));
  }

  // Flat-pack lead on land (T.O. 18-6.6)
  if (id === 'fp-target' || id === 'fp-overhang') {
    const toe = id === 'fp-target' ? 148 : 186;
    return wrap(`
      <rect x="20" y="72" width="180" height="22" class="dg-board"/>
      <rect x="92" y="68" width="84" height="4" class="dg-cu"/>
      <rect x="20" y="28" width="44" height="34" rx="2" class="dg-body"/>
      <path d="M64 44 L78 44 Q84 44 88 52 L92 62 Q95 66 102 66 L${toe} 66" fill="none" stroke="#c9ccd2" stroke-width="5" stroke-linecap="butt"/>
      <path d="M92 68 Q96 66 100 63 L${Math.min(toe, 174)} 63 L${Math.min(toe + 6, 176)} 68 Z" class="dg-solder"/>
      <line x1="176" x2="176" y1="54" y2="86" class="dg-ref"/>
      <text x="176" y="49" class="dg-lbl" text-anchor="middle">${t('land end')}</text>
      <text x="22" y="106" class="dg-lbl">${id === 'fp-target' ? t('lead on land: 65 %') : t('toe overhangs land')}</text>`, t('Flat pack lead on its land'));
  }

  // Clinched lead on an isolated pad (T.O. 07-6.17, 07-6.18): no connecting conductor
  const cx = 110, top = 56, bot = 84;
  const lead = id === 'clinch-iso'
    ? `<path d="M${cx} 96 L${cx} ${top - 6} Q${cx} ${top - 10} ${cx - 8} ${top - 10} L${cx - 32} ${top - 10}" fill="none" stroke="#c9ccd2" stroke-width="6"/>`
    : `<path d="M${cx} 96 L${cx} ${top - 6} Q${cx} ${top - 12} ${cx - 6} ${top - 18} L${cx - 20} ${top - 32}" fill="none" stroke="#c9ccd2" stroke-width="6"/>`;
  return wrap(`
    <rect x="28" y="${top}" width="164" height="${bot - top}" class="dg-board"/>
    <rect x="${cx - 8}" y="${top}" width="16" height="${bot - top}" class="dg-hole"/>
    <rect x="${cx - 24}" y="${top - 3}" width="48" height="3" class="dg-cu"/>
    <rect x="${cx - 24}" y="${bot}" width="48" height="3" class="dg-cu"/>
    ${lead}
    <text x="${cx}" y="22" class="dg-lbl" text-anchor="middle">${t('isolated pad (no run)')}</text>
    <text x="28" y="106" class="dg-lbl">${id === 'clinch-iso' ? t('90° full clinch') : t('45° semi-clinch · 1 pad dia')}</text>`, t('Clinched lead on an isolated pad'));
}
