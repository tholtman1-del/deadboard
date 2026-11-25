/**
 * Gamepad support (by Sergio, sergioSHKLR): Settings → Controller panel. Button map with press-to-rebind,
 * sticks, fine speed, iron trigger range, rumble, heat mode, calibration, a live controller test,
 * and JSON import / export. Works with mouse, touch, keyboard and the controller itself
 * (D-pad or left stick moves, ← → change a value, A selects, B closes; fixed so a bad map can't lock you out).
 * Plain DOM; colours and type from tokens.css.
 */
import { t, tk } from '../i18n';
import {
  BTN, BUTTON_NAMES, HEAT_MODES, HoldToExit, KEYMAP_ROWS, NavRepeat, RebindListener, applySettings, buttonName, defaultSettings,
  exportSettings, importSettings, keymapConflicts, type BindAction, type GamepadMapper, type GamepadSettings, type HeatMode, type PadSnapshot,
} from './gamepad';
import { MAP_CSS, OUTLINE_CSS, layoutLines, mapOutlineHtml, outlineSvg, paintPad } from './gamepad-outline';

const CSS = `
.gp-status{font-size:11px;color:var(--text-2)}
.gps-bg{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 8px 8px}
.gps:focus{outline:none}.gps{width:min(900px,100%);max-height:100%;display:flex;flex-direction:column;background:var(--surface);color:var(--text);border:1px solid var(--border-strong);border-radius:var(--radius);box-shadow:0 12px 40px rgba(0,0,0,.5);font:14px/1.4 var(--sans);overflow:hidden}
.gps *{box-sizing:border-box}
.gps-head,.gps-foot{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--surface-2);flex:none}
.gps-head{border-bottom:1px solid var(--border)}.gps-foot{border-top:1px solid var(--border);flex-wrap:wrap}
.gps-head h3{margin:0;font-size:15px;font-weight:600;flex:1}
.gps-body{overflow:auto;overscroll-behavior:contain;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}
.gps-sec{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;min-width:0}
.gps-sec.wide{grid-column:1/-1}
.gps-sec h4{margin:0 0 8px;font:700 11px/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.gps-f{display:grid;grid-template-columns:minmax(0,1fr) minmax(90px,150px) 54px;align-items:center;gap:8px;min-height:36px}
.gps-f.ck{grid-template-columns:minmax(0,1fr) auto}
.gps-f label{min-width:0}
.gps-f output{text-align:right;font:12px var(--mono);color:var(--text)}
.gps-f select{grid-column:2/4}
.gps input[type=range]{width:100%;accent-color:var(--accent);height:28px}
.gps input[type=checkbox]{width:22px;height:22px;accent-color:var(--accent)}
.gps select{font:13px var(--sans);color:var(--text);background:var(--surface-3);border:1px solid var(--border-control);border-radius:var(--radius);min-height:32px;padding:4px 8px}
.gps .gp-focus{outline:2px solid var(--accent);outline-offset:2px}
.gps-warn{color:var(--warn);font-size:13px;min-height:1.2em;margin:6px 0}
.gps-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px}
.gps-note{color:var(--text-2);font-size:12px;margin:4px 0 0}
.gps-msg{flex:1;min-width:140px;color:var(--warn);font-size:13px}
.gps-pad{font-weight:600;color:var(--text);overflow-wrap:anywhere}
@media (max-width:720px){.gps-body{grid-template-columns:1fr}.gps-foot .gps-note{display:none}}
@media (max-height:500px){.gps-head,.gps-foot{padding:6px 10px}.gps-body{padding:8px;gap:8px}.gps-foot .gps-note{display:none}}
`;

type Num = { k: keyof GamepadSettings; label: string; min: number; max: number; step: number; scale: number; unit: string; dp?: number };
const STICKS: Num[] = [
  { k: 'deadzone', label: tk('Left stick dead zone'), min: 2, max: 50, step: 1, scale: 100, unit: '%' },
  { k: 'rightDeadzone', label: tk('Right stick dead zone'), min: 2, max: 50, step: 1, scale: 100, unit: '%' },
  { k: 'cursorSpeed', label: tk('Cursor sensitivity (speed)'), min: 100, max: 2000, step: 20, scale: 1, unit: '' },
  { k: 'panSpeed', label: tk('Pan sensitivity (speed)'), min: 100, max: 2500, step: 50, scale: 1, unit: '' },
  { k: 'curve', label: tk('Stick response curve'), min: 0.5, max: 3, step: 0.1, scale: 1, unit: '', dp: 1 },
  { k: 'fineFactor', label: tk('Fine-mode speed'), min: 5, max: 60, step: 1, scale: 100, unit: '%' },
];
const IRON: Num[] = [
  { k: 'heatMin', label: tk('Contact at a light pull'), min: 5, max: 95, step: 5, scale: 100, unit: '%' },
  { k: 'heatMax', label: tk('Contact at full pull'), min: 10, max: 100, step: 5, scale: 100, unit: '%' },
  { k: 'triggerOn', label: tk('Trigger point (iron on)'), min: 5, max: 90, step: 5, scale: 100, unit: '%' },
];
const RUMBLE: Num[] = [{ k: 'rumbleIntensity', label: tk('Rumble intensity'), min: 0, max: 100, step: 5, scale: 100, unit: '%' }];
const CURVES: [string, string][] = [['0.6', tk('Soft (contact comes early)')], ['1', tk('Linear')], ['1.6', tk('Firm (needs a deep pull)')]];

export interface SettingsHooks {
  save(): void;
  /** Settings changed (rebuild hints etc.). */
  changed(): void;
  rumbleTest(): string;
  openCalibration(): void;
  applyHeatMode(m: HeatMode): void;
  download(name: string, text: string): void;
  /** The panel closed (the bench ignores the pad until it's released). */
  closed?(): void;
}

export class GamepadSettingsPanel {
  private bg: HTMLDivElement | null = null;
  private listener: RebindListener | null = null;
  private nav = new NavRepeat();
  private prev: boolean[] = [];
  private padKey = '';
  private msgTimer: ReturnType<typeof setTimeout> | null = null;
  readonly test: ControllerTestView;

  constructor(private readonly mapper: GamepadMapper, private readonly hooks: SettingsHooks) {
    this.test = new ControllerTestView(() => { this.refresh(); this.focusAt(this.focusables().findIndex((el) => el.dataset.a === 'test')); });
    if (!document.getElementById('gps-style')) {
      const st = document.createElement('style');
      st.id = 'gps-style';
      st.textContent = CSS + OUTLINE_CSS + MAP_CSS;
      document.head.appendChild(st);
    }
    window.addEventListener('resize', () => { const m = this.q('[data-t="map"]'); if (m) layoutLines(m); });
  }

  get isOpen(): boolean { return !!this.bg; }
  private get s(): GamepadSettings { return this.mapper.settings; }

  open(focusFirst = false) {
    if (this.bg) return;
    const bg = document.createElement('div');
    bg.className = 'gps-bg';
    bg.innerHTML = this.html();
    bg.addEventListener('pointerdown', (e) => { if (e.target === bg) this.close(); });
    bg.addEventListener('click', (e) => this.onClick(e));
    bg.addEventListener('input', (e) => this.onInput(e.target as HTMLElement));
    bg.addEventListener('change', (e) => this.onInput(e.target as HTMLElement));
    bg.addEventListener('keydown', (e) => {
      e.stopPropagation(); // the bench's keyboard shortcuts stay off while the panel is open
      if (e.key === 'Escape') { if (this.listener) this.stopListen(t('Rebind cancelled.')); else this.close(); }
    });
    document.body.appendChild(bg);
    this.bg = bg;
    lockPage(true);
    this.prev = new Array<boolean>(17).fill(true); // the press that opened the panel does not click inside it
    this.padKey = '';
    this.renderKeymap();
    this.syncValues();
    if (focusFirst) this.focusAt(0);
    else bg.querySelector<HTMLElement>('.gps')?.focus({ preventScroll: true });
  }

  close() {
    if (!this.bg) return;
    this.test.close();
    this.listener = null;
    this.bg.remove();
    this.bg = null;
    lockPage(false);
    this.hooks.save();
    this.hooks.closed?.();
  }

  /** Values changed elsewhere (calibration, import): redraw. */
  refresh() {
    if (!this.bg) return;
    this.prev = new Array<boolean>(17).fill(true); // e.g. the B that closed calibration must not also close this
    this.renderKeymap();
    this.syncValues();
  }

  private q<T extends HTMLElement>(sel: string): T | null { return this.bg?.querySelector<T>(sel) ?? null; }

  private numHtml(f: Num) {
    return `<div class="gps-f"><label for="gps-${f.k}">${t(f.label)}</label><input type="range" id="gps-${f.k}" data-k="${f.k}" min="${f.min}" max="${f.max}" step="${f.step}"><output data-o="${f.k}"></output></div>`;
  }
  private ckHtml(k: keyof GamepadSettings, label: string) {
    return `<div class="gps-f ck"><label for="gps-${k}">${label}</label><input type="checkbox" id="gps-${k}" data-k="${k}"></div>`;
  }
  private selHtml(k: string, label: string, opts: readonly (readonly [string, string])[]) {
    return `<div class="gps-f"><label for="gps-${k}">${label}</label><select id="gps-${k}" data-k="${k}">${opts.map(([v, l]) => `<option value="${v}">${t(l)}</option>`).join('')}</select></div>`;
  }

  private html(): string {
    const noDevice = t('No controller detected. Connect one and press any button.');
    return `<div class="gps" role="dialog" aria-modal="true" aria-label="${t('Controller settings')}" tabindex="-1">
      <div class="gps-head"><h3>${t('Controller settings')}</h3><button type="button" class="btn ghost icon" data-a="close" data-nonav title="${t('Close (B / Esc)')}" aria-label="${t('Close')}">✕</button></div>
      <div class="gps-body">
        <section class="gps-sec wide" data-sec="test"><h4>${t('Controller')}</h4>
          <div class="gps-row" style="margin-top:0"><span class="gps-pad" data-t="name" style="flex:1;min-width:180px">${noDevice}</span><button type="button" class="btn primary" data-a="test">${t('Test controller…')}</button></div>
          <div class="gps-note" data-t="info"></div>
        </section>
        <section class="gps-sec wide" data-sec="map"><h4>${t('Button map')}</h4>
          <div class="gps-note">${t('Each callout shows what a button does. Select an action (click, tap, or A on the pad), then press the controller button you want for it. Amber means two actions share a button; Help (tap) and Calibrate (hold) may share one.')}</div>
          <div class="gpo-wrap" data-t="map"></div>
          <div class="gps-warn" data-t="warn" role="status"></div>
          <div class="gps-row"><button type="button" class="btn" data-a="resetMap">${t('Reset buttons to defaults')}</button></div>
        </section>
        <section class="gps-sec" data-sec="sticks"><h4>${t('Sticks')}</h4>
          ${this.selHtml('cursorStick', t('Cursor stick'), [['left', tk('Left stick moves the cursor')], ['right', tk('Right stick moves the cursor')]])}
          ${STICKS.map((f) => this.numHtml(f)).join('')}
          ${this.ckHtml('invertLeftY', t('Invert left stick Y'))}
          ${this.ckHtml('invertRightY', t('Invert right stick Y'))}
          <div class="gps-row"><button type="button" class="btn" data-a="calibrate">${t('Calibrate sticks…')}</button></div>
          <p class="gps-note">${t('Calibration measures resting drift to set the dead zones. Shortcut: hold {btn} for 0.8 s.', { btn: buttonName(this.s.keymap.calibrate) })}</p>
        </section>
        <section class="gps-sec" data-sec="iron"><h4>${t('Iron trigger')}</h4>
          ${IRON.map((f) => this.numHtml(f)).join('')}
          ${this.selHtml('heatCurve', t('Heat curve'), CURVES)}
          <p class="gps-note">${t('How firmly the iron touches the joint for a given pull (default 35–100 %). An estimate: it scales the tip-to-joint heat transfer.')}</p>
          ${this.selHtml('heatMode', t('Rework mode when a controller connects'), HEAT_MODES)}
          <p class="gps-note">${t('Held heat counts only in the realistic modes; Instant does the one-click action.')}</p>
        </section>
        <section class="gps-sec" data-sec="rumble"><h4>${t('Rumble')}</h4>
          ${this.ckHtml('rumble', t('Rumble on'))}
          ${RUMBLE.map((f) => this.numHtml(f)).join('')}
          ${this.ckHtml('deviceVibrate', t('Vibrate the phone or tablet when the pad has no rumble'))}
          <div class="gps-row"><button type="button" class="btn" data-a="rumbleTest">${t('Test rumble')}</button></div>
          <p class="gps-note">${t('USB-C gives rumble on ChromeOS and Android; Bluetooth Xbox pads on Android have none.')}</p>
        </section>
        <section class="gps-sec" data-sec="other"><h4>${t('Other')}</h4>
          ${this.ckHtml('hintOnConnect', t('Show the controls help when a controller connects'))}
          <div class="gps-row"><button type="button" class="btn" data-a="export">${t('Export JSON')}</button><button type="button" class="btn" data-a="import">${t('Import JSON…')}</button><input type="file" accept="application/json,.json" data-t="file" hidden></div>
          <div class="gps-row"><button type="button" class="btn" data-a="resetAll">${t('Reset all controller settings')}</button></div>
          <p class="gps-note">${t('Settings are saved on this device as you change them.')}</p>
        </section>
      </div>
      <div class="gps-foot"><span class="gps-msg" data-t="msg" role="status"></span><span class="gps-note">${t('D-pad / stick: move · ← →: change · A: select · B: close')}</span><button type="button" class="btn primary" data-a="close">${t('Done')}</button></div>
    </div>`;
  }

  private renderKeymap() {
    const box = this.q('[data-t="map"]');
    if (!box) return;
    const km = this.s.keymap;
    const bad = new Set(keymapConflicts(km).flatMap((c) => c.actions));
    box.innerHTML = mapOutlineHtml(this.s, this.listener?.action ?? null, bad);
    for (const a of bad) box.querySelectorAll(`.gpo-svg [data-btn="${km[a]}"]`).forEach((el) => el.classList.add('bad'));
    layoutLines(box);
    requestAnimationFrame(() => layoutLines(box));
    const warn = this.q('[data-t="warn"]');
    const lab = (a: BindAction) => t(KEYMAP_ROWS.find((r) => r[0] === a)?.[1] ?? a);
    if (warn) warn.textContent = keymapConflicts(km).map((c) => t('⚠ {btn} does more than one thing: {actions}.', { btn: buttonName(c.button), actions: c.actions.map(lab).join(' · ') })).join(' ');
  }

  private syncValues() {
    const s = this.s as unknown as Record<string, unknown>;
    this.bg?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-k]').forEach((el) => {
      const k = el.dataset.k!;
      const f = [...STICKS, ...IRON, ...RUMBLE].find((x) => x.k === k);
      if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = !!s[k];
      else if (f) el.value = String(Math.round((s[k] as number) * f.scale * 1000) / 1000);
      else el.value = String(s[k]);
      if (f) this.showOut(f);
    });
  }

  private showOut(f: Num) {
    const o = this.q(`[data-o="${f.k}"]`);
    const v = (this.s[f.k] as number) * f.scale;
    if (o) o.textContent = `${v.toFixed(f.dp ?? 0)}${f.unit}`;
  }

  private onInput(el: HTMLElement) {
    const k = (el as HTMLInputElement).dataset?.k as keyof GamepadSettings | undefined;
    if (!k) return;
    const s = this.s as unknown as Record<string, unknown>;
    const f = [...STICKS, ...IRON, ...RUMBLE].find((x) => x.k === k);
    if (el instanceof HTMLInputElement && el.type === 'checkbox') s[k] = el.checked;
    else if (f) {
      s[k] = Number((el as HTMLInputElement).value) / f.scale;
      // keep the light-pull contact below the full-pull contact
      if (k === 'heatMin' && this.s.heatMin > this.s.heatMax - 0.05) this.s.heatMax = Math.min(1, this.s.heatMin + 0.05);
      if (k === 'heatMax' && this.s.heatMax < this.s.heatMin + 0.05) this.s.heatMin = Math.max(0.05, this.s.heatMax - 0.05);
      for (const g of IRON) this.showOut(g);
      this.showOut(f);
      if (k === 'heatMin' || k === 'heatMax') this.syncValues();
    } else if (k === 'heatCurve') s[k] = Number((el as HTMLSelectElement).value);
    else s[k] = (el as HTMLSelectElement).value;
    if (k === 'heatMode') this.hooks.applyHeatMode(this.s.heatMode);
    this.hooks.save();
    this.hooks.changed();
  }

  private say(text: string) {
    const m = this.q('[data-t="msg"]');
    if (!m) return;
    m.textContent = text;
    if (this.msgTimer) clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => { if (m.textContent === text) m.textContent = ''; }, 6000);
  }

  private onClick(e: Event) {
    const el = e.target as HTMLElement;
    const bind = el.closest<HTMLElement>('[data-bind]')?.dataset.bind as BindAction | undefined;
    if (bind) { if (this.listener?.action === bind) this.stopListen(t('Rebind cancelled.')); else this.startListen(bind); return; }
    const a = el.closest<HTMLElement>('[data-a]')?.dataset.a;
    if (!a) return;
    if (a === 'close') this.close();
    else if (a === 'resetMap') { this.s.keymap = defaultSettings().keymap; this.afterChange(t('Buttons reset to the defaults.')); }
    else if (a === 'resetAll') { applySettings(this.s, {}); this.afterChange(t('All controller settings reset to the defaults.')); }
    else if (a === 'calibrate') this.hooks.openCalibration();
    else if (a === 'test') this.test.open();
    else if (a === 'rumbleTest') this.say(this.hooks.rumbleTest());
    else if (a === 'export') { this.hooks.download('deadboard-controller.json', exportSettings(this.s)); this.say(t('Saved {file}.', { file: 'deadboard-controller.json' })); }
    else if (a === 'import') {
      const inp = this.q<HTMLInputElement>('[data-t="file"]');
      if (!inp) return;
      inp.value = '';
      inp.onchange = async () => {
        const file = inp.files?.[0];
        if (!file) return;
        try { this.importText(await file.text()); } catch (err) { this.say((err as Error).message); }
      };
      inp.click();
    }
  }

  /** Applies an exported JSON text (throws a readable error when unusable). */
  importText(text: string) {
    applySettings(this.s, importSettings(text));
    this.afterChange(t('Controller settings imported.'));
    this.hooks.applyHeatMode(this.s.heatMode);
  }

  private afterChange(msg: string) {
    this.listener = null;
    this.hooks.save();
    this.hooks.changed();
    this.renderKeymap();
    this.syncValues();
    this.say(msg);
  }

  private startListen(a: BindAction) {
    this.listener = new RebindListener(a);
    this.renderKeymap();
    this.q<HTMLElement>(`[data-bind="${a}"]`)?.focus({ preventScroll: true });
    this.say(t('Press a controller button for "{action}" (6 s; Esc cancels).', { action: t(KEYMAP_ROWS.find((r) => r[0] === a)?.[1] ?? a) }));
  }

  private stopListen(msg: string) {
    const a = this.listener?.action;
    this.listener = null;
    this.renderKeymap();
    if (a) this.q<HTMLElement>(`[data-bind="${a}"]`)?.focus({ preventScroll: true });
    this.say(msg);
  }

  private focusables(): HTMLElement[] {
    if (!this.bg) return [];
    return Array.from(this.bg.querySelectorAll<HTMLElement>('button:not([data-nonav]), input:not([type=file]), select')).filter((el) => !(el as HTMLButtonElement).disabled && el.offsetParent !== null);
  }

  private focusAt(i: number) {
    const items = this.focusables();
    if (!items.length) return;
    const el = items[(i + items.length) % items.length];
    this.bg?.querySelectorAll('.gp-focus').forEach((x) => x.classList.remove('gp-focus'));
    el.classList.add('gp-focus');
    this.bg?.querySelectorAll('.gpo-svg .focus').forEach((x) => x.classList.remove('focus'));
    const co = el.closest<HTMLElement>('.gpo-co');
    if (co) this.bg?.querySelector(`.gpo-svg [data-btn="${co.dataset.co}"]`)?.classList.add('focus');
    el.focus({ preventScroll: true });
    // scroll only the panel's own body (never the page): the "nearest" scroll, done by hand
    const box = this.q('.gps-body');
    if (box && box.contains(el)) {
      const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
      if (r.top < b.top + 6) box.scrollTop -= b.top + 6 - r.top;
      else if (r.bottom > b.bottom - 6) box.scrollTop += r.bottom - (b.bottom - 6);
    }
  }

  private adjust(el: HTMLElement, d: number): boolean {
    if (el instanceof HTMLInputElement && el.type === 'range') {
      if (d > 0) el.stepUp(); else el.stepDown();
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    if (el instanceof HTMLSelectElement) {
      const n = el.selectedIndex + d;
      if (n >= 0 && n < el.options.length) { el.selectedIndex = n; el.dispatchEvent(new Event('change', { bubbles: true })); }
      return true;
    }
    return false;
  }

  /** Per frame while open: live readout, press-to-rebind, controller navigation. */
  frame(p: PadSnapshot | null, dt: number) {
    if (!this.bg) return;
    if (this.test.isOpen) { this.test.frame(p, dt); this.prev = new Array<boolean>(17).fill(true); return; }
    this.readout(p);
    if (!p) return;
    const pressed = p.buttons.map((b) => !!b?.pressed);
    if (this.listener) {
      const r = this.listener.feed(pressed, dt);
      if (r === 'timeout') this.stopListen(t('No button pressed; the binding is unchanged.'));
      else if (r !== null) {
        const a = this.listener.action;
        this.s.keymap[a] = r;
        this.listener = null;
        this.hooks.save();
        this.hooks.changed();
        this.renderKeymap();
        this.q<HTMLElement>(`[data-bind="${a}"]`)?.focus({ preventScroll: true });
        const c = keymapConflicts(this.s.keymap).find((x) => x.actions.includes(a));
        this.say(c ? t('Bound to {btn}, but another action uses it too (see the warning).', { btn: buttonName(r) }) : t('Bound to {btn}.', { btn: buttonName(r) }));
      }
      this.prev = pressed.map(() => true); // nothing fires until released
      return;
    }
    const edge = (i: number) => pressed[i] && !this.prev[i];
    const ax = (i: number) => p.axes[i] ?? 0;
    const up = this.nav.step('u', !!pressed[BTN.UP] || ax(1) < -0.6, dt);
    const down = this.nav.step('d', !!pressed[BTN.DOWN] || ax(1) > 0.6, dt);
    const left = this.nav.step('l', !!pressed[BTN.LEFT] || ax(0) < -0.6, dt);
    const right = this.nav.step('r', !!pressed[BTN.RIGHT] || ax(0) > 0.6, dt);
    const items = this.focusables();
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (up || down) this.focusAt(at < 0 ? 0 : at + (down ? 1 : -1));
    else if (left || right) {
      const el = items[at];
      if (!el || !this.adjust(el, right ? 1 : -1)) this.focusAt(at < 0 ? 0 : at + (right ? 1 : -1));
    }
    if (edge(BTN.A)) {
      const el = items[at];
      if (!el) this.focusAt(0);
      else if (el instanceof HTMLSelectElement) this.adjust(el, el.selectedIndex + 1 < el.options.length ? 1 : -el.selectedIndex);
      else if (!(el instanceof HTMLInputElement && el.type === 'range')) el.click();
    } else if (edge(BTN.B)) this.close();
    this.prev = pressed;
  }

  private readout(p: PadSnapshot | null) {
    if (this.bg) {
      paintPad(this.bg, p);
      this.bg.querySelectorAll<HTMLElement>('.gpo-co').forEach((c) => { const b = p?.buttons[Number(c.dataset.co)]; c.classList.toggle('on', !!b?.pressed); });
    }
    const name = this.q('[data-t="name"]'), info = this.q('[data-t="info"]');
    const key = p ? `${p.id}|${p.mapping}` : '';
    if (key === this.padKey || !name || !info) return;
    this.padKey = key;
    name.textContent = p ? (p.id || t('Unnamed controller')) : t('No controller detected. Connect one and press any button.');
    info.textContent = p ? padInfo(p) : '';
  }
}

function padInfo(p: PadSnapshot): string {
  const rumble = (p as { vibrationActuator?: unknown }).vibrationActuator ? t('rumble motor found') : t('no rumble motor reported');
  return `${p.mapping === 'standard' ? t('Standard (Xbox-style) mapping') : t('Non-standard mapping: buttons may not match the names')} · ${t('{n} button|{n} buttons', { n: p.buttons.length })} · ${t('{n} axis|{n} axes', { n: p.axes.length })} · ${rumble}`;
}

/** Page scroll lock (counted, so the panel and the test view can both hold it). */
let locks = 0;
let saved: string[] = [];
function lockPage(on: boolean) {
  const h = document.documentElement, b = document.body;
  if (on) {
    if (locks++ === 0) {
      saved = [h.style.overflow, h.style.overscrollBehavior, b.style.overflow, b.style.overscrollBehavior];
      h.style.overflow = 'hidden'; h.style.overscrollBehavior = 'none';
      b.style.overflow = 'hidden'; b.style.overscrollBehavior = 'none';
    }
  } else if (locks > 0 && --locks === 0) {
    [h.style.overflow, h.style.overscrollBehavior, b.style.overflow, b.style.overscrollBehavior] = saved;
  }
}

const TCSS = `
.gpt{position:fixed;inset:0;z-index:95;background:var(--bg);color:var(--text);display:flex;flex-direction:column;overflow:hidden;overscroll-behavior:none;touch-action:none;user-select:none;font:14px/1.4 var(--sans)}
.gpt *{box-sizing:border-box}
.gpt-head{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface-2);border-bottom:1px solid var(--border);flex:none}
.gpt-head h3{margin:0;font-size:15px;font-weight:600;flex:1}
.gpt-hint{display:flex;align-items:center;gap:12px;padding:8px 14px;background:var(--warn-weak);color:var(--warn);flex:none;font-size:14px}
.gpt-hint .hold{flex:none;width:120px;height:10px;background:var(--surface-3);border-radius:5px;overflow:hidden}
.gpt-hint .hold i{display:block;height:100%;width:0;background:var(--warn)}
.gpt-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:14px;padding:14px;overflow:hidden}
.gpt-card{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;min-width:0;min-height:0}
.gpt-card h4{margin:0 0 8px;font:700 11px/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.gpt-name{font-weight:600;color:var(--text);overflow-wrap:anywhere}.gpt-info{color:var(--text-2);font-size:12px;margin:2px 0 8px}
.gpt-sticks{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.gpt-stick{text-align:center;font-size:12px;color:var(--text-2)}
.gpt-stick [data-sv]{font-family:var(--mono)}
.gpt-stick svg{width:clamp(90px,16vh,150px);height:clamp(90px,16vh,150px);display:block;margin:0 auto 4px}
.gpt-stick.pressed svg circle.ring{stroke:var(--accent);stroke-width:4}
.gpt-trig{display:grid;grid-template-columns:auto 1fr 44px;gap:6px 8px;align-items:center;margin-top:10px;font:13px var(--mono)}
.gpt-bar{height:12px;background:var(--surface-3);border-radius:6px;overflow:hidden}.gpt-bar i{display:block;height:100%;width:0;background:var(--accent)}
.gpt-chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px}
.gpt-chip{text-align:center;padding:8px 4px;border-radius:var(--radius);background:var(--surface-3);color:var(--text-2);border:1px solid var(--border-strong);font:12px var(--mono)}
.gpt-chip.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:700}
.gpt-chip.seen{border-color:var(--accent)}
.gpt-btns{display:flex;flex-direction:column}.gpt-outline{flex:1;min-height:0;display:flex;justify-content:center;margin-bottom:8px}.gpt-outline .gpo-svg{max-height:100%;width:auto;max-width:100%}
.gpt-last{margin-top:8px;color:var(--text-2);font-size:12px;min-height:1.3em}
@media (max-width:760px),(max-height:520px){.gpt-body{grid-template-columns:1fr 1fr;gap:8px;padding:8px}.gpt-head{padding:6px 10px}.gpt-hint{padding:6px 10px;font-size:13px}}
@media (max-width:560px){.gpt-body{grid-template-columns:1fr;overflow:auto}.gpt-chips{grid-template-columns:repeat(auto-fill,minmax(54px,1fr))}}
`;

function testStick(n: string) {
  return `<div class="gpt-stick" data-st="${n}"><svg viewBox="-60 -60 120 120" aria-hidden="true"><circle class="ring" r="56" fill="var(--surface-3)" stroke="var(--border-strong)" stroke-width="2"/><line x1="-56" y1="0" x2="56" y2="0" stroke="var(--border-strong)"/><line x1="0" y1="-56" x2="0" y2="56" stroke="var(--border-strong)"/><circle class="dot" r="7" fill="var(--accent)"/></svg>${n === 'l' ? t('Left stick') : t('Right stick')} <span data-sv="${n}">0.00, 0.00</span></div>`;
}

/**
 * Full-screen controller test: every button, stick and trigger shows here and does nothing else.
 * While open it captures all input: the page can't scroll, keys and wheel are swallowed, the bench
 * and the settings panel get no controller actions. Exit: hold B for 1 s, or the Close button.
 */
export class ControllerTestView {
  private el: HTMLDivElement | null = null;
  private hold = new HoldToExit(BTN.B, 1);
  private seen = new Set<number>();
  private padKey = '~';
  private readonly block = (e: Event) => {
    if (e.type === 'keydown' || e.type === 'keyup' || e.type === 'keypress') { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (e.type === 'wheel' || e.type === 'touchmove') { e.preventDefault(); e.stopPropagation(); }
  };

  constructor(private readonly onClose: () => void) {
    if (!document.getElementById('gpt-style')) {
      const st = document.createElement('style');
      st.id = 'gpt-style';
      st.textContent = TCSS + OUTLINE_CSS;
      document.head.appendChild(st);
    }
  }

  get isOpen(): boolean { return !!this.el; }

  open() {
    if (this.el) return;
    const el = document.createElement('div');
    el.className = 'gpt';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', t('Controller test'));
    el.innerHTML = `<div class="gpt-head"><h3>${t('Controller test')}</h3><button type="button" class="btn primary" data-x="close">${t('Close')}</button></div>
      <div class="gpt-hint" role="status"><span style="flex:1">${t('Everything you press shows here and nothing else moves. <b>Hold B for 1 second to exit</b> (a quick B press is just tested), or tap Close.')}</span><span class="hold"><i></i></span></div>
      <div class="gpt-body">
        <div class="gpt-card"><h4>${t('Sticks and triggers')}</h4><div class="gpt-name" data-t="name">${t('No controller detected. Connect one and press any button.')}</div><div class="gpt-info" data-t="info"></div>
          <div class="gpt-sticks">${testStick('l')}${testStick('r')}</div>
          <div class="gpt-trig"><span>LT</span><div class="gpt-bar"><i data-tb="6"></i></div><span data-tv="6">0.00</span><span>RT</span><div class="gpt-bar"><i data-tb="7"></i></div><span data-tv="7">0.00</span></div></div>
        <div class="gpt-card gpt-btns"><h4>${t('Buttons')}</h4><div class="gpt-outline">${outlineSvg()}</div><div class="gpt-chips">${BUTTON_NAMES.map((_, i) => `<span class="gpt-chip" data-b="${i}">${buttonName(i)}</span>`).join('')}</div>
          <div class="gpt-last" data-t="seen">${t('Press each button: it lights while held and keeps a green outline once tested.')}</div></div>
      </div>`;
    el.querySelector('[data-x="close"]')!.addEventListener('click', () => this.close());
    document.body.appendChild(el);
    this.el = el;
    this.hold = new HoldToExit(BTN.B, 1);
    this.seen.clear();
    this.padKey = '~';
    lockPage(true);
    for (const t of ['keydown', 'keyup', 'keypress']) window.addEventListener(t, this.block, true);
    window.addEventListener('wheel', this.block, { capture: true, passive: false });
    window.addEventListener('touchmove', this.block, { capture: true, passive: false });
    (document.activeElement as HTMLElement | null)?.blur?.();
  }

  close() {
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    lockPage(false);
    for (const t of ['keydown', 'keyup', 'keypress']) window.removeEventListener(t, this.block, true);
    window.removeEventListener('wheel', this.block, true);
    window.removeEventListener('touchmove', this.block, true);
    this.onClose();
  }

  /** Per frame: draw the pad; the only thing it acts on is a 1 s B hold. */
  frame(p: PadSnapshot | null, dt: number) {
    const el = this.el;
    if (!el) return;
    const key = p ? `${p.id}|${p.mapping}` : '';
    if (key !== this.padKey) {
      this.padKey = key;
      el.querySelector('[data-t="name"]')!.textContent = p ? (p.id || t('Unnamed controller')) : t('No controller detected. Connect one and press any button.');
      el.querySelector('[data-t="info"]')!.textContent = p ? padInfo(p) : '';
    }
    const ax = (i: number) => p?.axes[i] ?? 0;
    const btn = (i: number) => p?.buttons[i];
    for (const [n, i, b] of [['l', 0, BTN.L3], ['r', 2, BTN.R3]] as const) {
      const dot = el.querySelector(`[data-st="${n}"] .dot`);
      dot?.setAttribute('cx', String(ax(i) * 56)); dot?.setAttribute('cy', String(ax(i + 1) * 56));
      el.querySelector(`[data-st="${n}"]`)?.classList.toggle('pressed', !!btn(b)?.pressed);
      const v = el.querySelector(`[data-sv="${n}"]`); if (v) v.textContent = `${ax(i).toFixed(2)}, ${ax(i + 1).toFixed(2)}`;
    }
    for (const i of [6, 7]) {
      const v = btn(i)?.value ?? 0;
      (el.querySelector(`[data-tb="${i}"]`) as HTMLElement).style.width = `${Math.min(100, Math.max(0, v) * 100)}%`;
      el.querySelector(`[data-tv="${i}"]`)!.textContent = v.toFixed(2);
    }
    const pressed = p ? p.buttons.map((b) => !!b?.pressed || (b?.value ?? 0) > 0.5) : [];
    el.querySelectorAll<HTMLElement>('[data-b]').forEach((c) => {
      const i = Number(c.dataset.b);
      if (pressed[i]) this.seen.add(i);
      c.classList.toggle('on', !!pressed[i]);
      c.classList.toggle('seen', this.seen.has(i));
    });
    if (this.seen.size) el.querySelector('[data-t="seen"]')!.textContent = t('Tested {count} of {total} buttons.', { count: this.seen.size, total: BUTTON_NAMES.length });
    paintPad(el, p, this.seen);
    const h = this.hold.feed(pressed, dt);
    (el.querySelector('.gpt-hint .hold i') as HTMLElement).style.width = `${h.progress * 100}%`;
    if (h.exit) this.close();
  }
}
