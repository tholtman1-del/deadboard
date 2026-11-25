/**
 * Gamepad mod (by sergioSHKLR): a generic gamepad outline, drawn here as plain SVG (not a
 * manufacturer asset), with callouts for the bound actions. Shared by Settings → Controller
 * (button map) and the controller test view (live presses).
 */
import { BTN, KEYMAP_ROWS, buttonName, type BindAction, type GamepadSettings, type PadSnapshot } from './gamepad';

/** Short action names for the callouts. */
export const SHORT: Record<BindAction, string> = {
  fineToggle: 'Fine (toggle)', fineHold: 'Fine (hold)', heat: 'Iron (hold)', feed: 'Feed solder', act: 'Use / red probe', blackProbe: 'Black probe (meter tap)',
  cancel: 'Cancel (meter: hold)', toolPrev: 'Prev tool', toolNext: 'Next tool', flip: 'Flip board', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
  panLeft: 'Pan left', panRight: 'Pan right', menu: 'Boards menu', help: 'Help (tap)', calibrate: 'Calibrate (hold)', settings: 'Controller settings',
};

/** Callout columns, top to bottom, roughly in the order the buttons sit on the pad. */
export const LEFT_CALLOUTS = [BTN.LT, BTN.LB, BTN.L3, BTN.VIEW, BTN.UP, BTN.LEFT, BTN.RIGHT, BTN.DOWN] as const;
export const RIGHT_CALLOUTS = [BTN.RT, BTN.RB, BTN.Y, BTN.MENU, BTN.B, BTN.X, BTN.A, BTN.R3] as const;

/** Actions bound to a button, in keymap order. */
export function actionsOn(km: Record<BindAction, number>, button: number): BindAction[] {
  return KEYMAP_ROWS.map(([a]) => a).filter((a) => km[a] === button);
}

const DPAD = (x: number, y: number, w: number, h: number, i: number) => `<rect class="b" data-btn="${i}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`;
const FACE = (x: number, y: number, i: number, l: string) => `<g><circle class="b" data-btn="${i}" cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y + 4}">${l}</text></g>`;

/** The outline. Every bindable control carries data-btn (its standard-mapping index). */
export function outlineSvg(): string {
  return `<svg class="gpo-svg" viewBox="0 0 400 260" role="img" aria-label="Gamepad outline">
  <rect class="b trig" data-btn="${BTN.LT}" x="88" y="10" width="54" height="24" rx="9"/><rect class="tfill" data-tf="${BTN.LT}" x="88" y="10" width="54" height="0" rx="9"/>
  <rect class="b trig" data-btn="${BTN.RT}" x="258" y="10" width="54" height="24" rx="9"/><rect class="tfill" data-tf="${BTN.RT}" x="258" y="10" width="54" height="0" rx="9"/>
  <text class="lbl" x="115" y="26">LT</text><text class="lbl" x="285" y="26">RT</text>
  <path class="b" data-btn="${BTN.LB}" d="M72,52 C84,38 120,32 156,36 L158,46 C124,44 96,48 80,58 Z"/>
  <path class="b" data-btn="${BTN.RB}" d="M328,52 C316,38 280,32 244,36 L242,46 C276,44 304,48 320,58 Z"/>
  <path class="body" d="M110,52 C150,42 250,42 290,52 C330,60 352,82 362,122 C375,172 388,226 352,241 C322,253 302,222 284,197 C270,179 250,174 200,174 C150,174 130,179 116,197 C98,222 78,253 48,241 C12,226 25,172 38,122 C48,82 70,60 110,52 Z"/>
  <g class="stick" data-stick="l"><circle class="b ring" data-btn="${BTN.L3}" cx="118" cy="104" r="24"/><circle class="dot" cx="118" cy="104" r="11"/></g>
  <g class="stick" data-stick="r"><circle class="b ring" data-btn="${BTN.R3}" cx="248" cy="150" r="24"/><circle class="dot" cx="248" cy="150" r="11"/></g>
  <g class="dpad">${DPAD(145, 124, 16, 19, BTN.UP)}${DPAD(145, 159, 16, 19, BTN.DOWN)}${DPAD(126, 143, 19, 16, BTN.LEFT)}${DPAD(161, 143, 19, 16, BTN.RIGHT)}<rect class="hub" x="145" y="143" width="16" height="16"/></g>
  <rect class="b" data-btn="${BTN.VIEW}" x="170" y="94" width="18" height="12" rx="5"/><rect class="b" data-btn="${BTN.MENU}" x="212" y="94" width="18" height="12" rx="5"/>
  <circle class="guide" data-btn="${BTN.GUIDE}" cx="200" cy="70" r="12"/>
  ${FACE(290, 82, BTN.Y, 'Y')}${FACE(266, 104, BTN.X, 'X')}${FACE(314, 104, BTN.B, 'B')}${FACE(290, 126, BTN.A, 'A')}
  </svg>`;
}

export const OUTLINE_CSS = `
.gpo-svg{width:100%;height:auto;display:block;overflow:visible}
.gpo-svg .body{fill:#23262a;stroke:#5a5f66;stroke-width:2}
.gpo-svg .b{fill:#2e3237;stroke:#6b7078;stroke-width:1.5;transition:fill .05s}
.gpo-svg .b.on{fill:#4be38a;stroke:#c9f5da}
.gpo-svg .b.bad{stroke:#e08a00;stroke-width:2.5}
.gpo-svg .b.seen{stroke:#4be38a;stroke-width:2.5}
.gpo-svg .b.focus{stroke:#ffd27a;stroke-width:3}
.gpo-svg .tfill{fill:#4be38a;opacity:.75;pointer-events:none}
.gpo-svg .hub{fill:#2e3237}
.gpo-svg .guide{fill:#1b1e21;stroke:#4a4e53;stroke-width:1.5}
.gpo-svg .dot{fill:#7ee2a8;pointer-events:none}
.gpo-svg text{fill:#d8d8d8;font:700 11px system-ui,sans-serif;text-anchor:middle;pointer-events:none}
.gpo-svg .lbl{font-size:10px;fill:#9aa0a6}
`;

/** Paint a pad snapshot onto an outline inside `root`: pressed buttons, stick dots, trigger fill. */
export function paintPad(root: ParentNode, p: PadSnapshot | null, seen?: Set<number>) {
  root.querySelectorAll<SVGElement>('.gpo-svg [data-btn]').forEach((el) => {
    const i = Number(el.getAttribute('data-btn'));
    const b = p?.buttons[i];
    const on = !!b?.pressed || (b?.value ?? 0) > 0.5;
    el.classList.toggle('on', on);
    if (seen) el.classList.toggle('seen', seen.has(i));
  });
  root.querySelectorAll<SVGElement>('.gpo-svg [data-stick]').forEach((g) => {
    const i = g.getAttribute('data-stick') === 'r' ? 2 : 0;
    const ring = g.querySelector('.ring')!;
    const cx = Number(ring.getAttribute('cx')), cy = Number(ring.getAttribute('cy'));
    const dot = g.querySelector('.dot')!;
    dot.setAttribute('cx', String(cx + (p?.axes[i] ?? 0) * 14));
    dot.setAttribute('cy', String(cy + (p?.axes[i + 1] ?? 0) * 14));
  });
  root.querySelectorAll<SVGElement>('.gpo-svg [data-tf]').forEach((r) => {
    const v = Math.min(1, Math.max(0, p?.buttons[Number(r.getAttribute('data-tf'))]?.value ?? 0));
    r.setAttribute('height', String(24 * v));
  });
}

/** Settings → Controller: outline plus callouts (one per button) whose action chips start a rebind. */
export function mapOutlineHtml(s: GamepadSettings, listening: BindAction | null, bad: Set<BindAction>): string {
  const km = s.keymap;
  const stickNote = (i: number) => i === BTN.L3 ? (s.cursorStick === 'left' ? 'moves the cursor' : 'pans the board') : i === BTN.R3 ? (s.cursorStick === 'right' ? 'moves the cursor' : 'pans the board') : '';
  const callout = (i: number, side: 'l' | 'r') => {
    const acts = actionsOn(km, i);
    const isBad = acts.some((a) => bad.has(a));
    const note = stickNote(i);
    const name = i === BTN.L3 ? 'Left stick · L3' : i === BTN.R3 ? 'Right stick · R3' : buttonName(i);
    return `<div class="gpo-co${isBad ? ' bad' : ''}" data-co="${i}" data-side="${side}"><div class="gpo-bn">${name}${note ? ` <span class="gpo-note">· ${note}</span>` : ''}</div><div class="gpo-acts">${acts.length ? acts.map((a) => `<button type="button" class="gpo-chip${bad.has(a) ? ' bad' : ''}${listening === a ? ' listen' : ''}" data-bind="${a}" title="Rebind: ${SHORT[a]}">${listening === a ? 'Press a button…' : SHORT[a]}</button>`).join('') : '<span class="gpo-none">not used</span>'}</div></div>`;
  };
  return `<div class="gpo-col l">${LEFT_CALLOUTS.map((i) => callout(i, 'l')).join('')}</div>
    <div class="gpo-pad">${outlineSvg()}</div>
    <div class="gpo-col r">${RIGHT_CALLOUTS.map((i) => callout(i, 'r')).join('')}</div>
    <svg class="gpo-lines" aria-hidden="true"></svg>`;
}

/** Leader lines from each callout to its button (hidden when the callouts stack). */
export function layoutLines(wrap: HTMLElement) {
  const lines = wrap.querySelector<SVGSVGElement>('.gpo-lines');
  if (!lines) return;
  const W = wrap.getBoundingClientRect();
  const stacked = getComputedStyle(wrap).getPropertyValue('--stacked').trim() === '1';
  if (stacked || W.width < 2) { lines.innerHTML = ''; return; }
  lines.setAttribute('width', String(W.width));
  lines.setAttribute('height', String(W.height));
  let out = '';
  wrap.querySelectorAll<HTMLElement>('.gpo-co').forEach((co) => {
    const i = co.dataset.co;
    const btn = wrap.querySelector(`.gpo-svg [data-btn="${i}"]`);
    if (!btn) return;
    const c = co.getBoundingClientRect(), b = btn.getBoundingClientRect();
    const left = co.dataset.side === 'l';
    const x1 = (left ? c.right : c.left) - W.left, y1 = c.top + Math.min(14, c.height / 2) - W.top;
    const x2 = b.left + b.width / 2 - W.left, y2 = b.top + b.height / 2 - W.top;
    const cls = co.classList.contains('bad') ? 'bad' : '';
    out += `<path class="${cls}" data-line="${i}" d="M${x1.toFixed(1)},${y1.toFixed(1)} L${(x1 + (left ? 10 : -10)).toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}"/><circle class="${cls}" cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="2.5"/>`;
  });
  lines.innerHTML = out;
}

export const MAP_CSS = `
.gpo-wrap{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,1.7fr) minmax(0,1fr);gap:6px 10px;align-items:center;--stacked:0}
.gpo-pad{grid-column:2;grid-row:1;padding:4px}
.gpo-col{display:flex;flex-direction:column;gap:3px;min-width:0;grid-row:1}
.gpo-col.l{grid-column:1}.gpo-col.r{grid-column:3}
.gpo-col.l .gpo-co{text-align:right}.gpo-col.l .gpo-acts{justify-content:flex-end}
.gpo-co{border:1px solid #2c2f33;border-radius:8px;padding:3px 6px;background:#1f2225;min-width:0;display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px}
.gpo-col.l .gpo-co{flex-direction:row-reverse}
.gpo-co.bad{border-color:#e08a00;background:#2a2410}
.gpo-co.on{border-color:#4be38a;background:#16301f}
.gpo-bn{font-size:12px;font-weight:700;color:#fff;line-height:1.3}
.gpo-note{font-weight:400;color:#9aa0a6}
.gpo-acts{display:flex;flex-wrap:wrap;gap:3px}
.gps .gpo-chip{min-height:32px;padding:2px 8px;font-size:12px;border-radius:6px;background:#2b2e32}
.gps .gpo-chip.bad{border-color:#e08a00;color:#ffd27a}
.gps .gpo-chip.listen{background:#4be38a;color:#111;border-color:#4be38a}
.gpo-none{font-size:12px;color:#6b7078;padding:4px 0}
.gpo-lines{position:absolute;left:0;top:0;pointer-events:none;overflow:visible}
.gpo-lines path{fill:none;stroke:#5a5f66;stroke-width:1}
.gpo-lines circle{fill:#9aa0a6}
.gpo-lines .bad{stroke:#e08a00}.gpo-lines circle.bad{fill:#e08a00}
@media (max-width:720px){
  .gpo-wrap{grid-template-columns:1fr 1fr;--stacked:1}
  .gpo-pad{grid-column:1/-1;grid-row:1;max-width:420px;margin:0 auto;width:100%}
  .gpo-col{grid-row:2}.gpo-col.l{grid-column:1}.gpo-col.r{grid-column:2}
  .gpo-col.l .gpo-co{text-align:left;flex-direction:row}.gpo-col.l .gpo-acts{justify-content:flex-start}
}
@media (max-width:480px){
  .gpo-wrap{grid-template-columns:1fr}
  .gpo-col.l,.gpo-col.r{grid-column:1}.gpo-col.r{grid-row:3}
}
`;
