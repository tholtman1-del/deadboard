/**
 * Gamepad support (by Sergio, sergioSHKLR): on-screen parts. The controller cursor, the control-hint
 * overlay and the stick calibration screen. Plain DOM; colours and type from tokens.css.
 */
import { t } from '../i18n';
import { buttonName, controlHints, deadzonesFromRest, type GamepadMapper, type PadFrame, type PadSnapshot } from './gamepad';

const CSS = `
.gp-cursor{position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;pointer-events:none;z-index:60;display:none}
.gp-cursor svg{width:100%;height:100%;overflow:visible}
.gp-cursor .ring{fill:none;stroke:var(--accent);stroke-width:2}
.gp-cursor.fine .ring{stroke:var(--text-2);stroke-dasharray:3 3}
.gp-cursor.hot .ring{stroke:var(--level-high);stroke-width:3}
.gp-cursor .tick{stroke:var(--text);stroke-width:1.5}
.gp-cursor .lbl{position:absolute;left:24px;top:22px;white-space:nowrap;font:600 11px/1.2 var(--sans);color:var(--text);background:var(--float);border:1px solid var(--border-strong);padding:2px 6px;border-radius:var(--radius)}
.gp-cursor .lbl:empty{display:none}
.gp-panel{position:fixed;z-index:70;background:var(--float);color:var(--text);border:1px solid var(--border-strong);border-radius:var(--radius);box-shadow:0 8px 30px rgba(0,0,0,.45);font:13px/1.4 var(--sans)}
.gp-hint{left:12px;bottom:40px;padding:10px 12px;max-width:min(420px,calc(100vw - 24px));max-height:calc(100vh - 60px);overflow:auto}
.gp-hint h4,.gp-cal h4{margin:0 0 6px;font:700 11px/1.2 var(--mono);letter-spacing:.08em;color:var(--accent);text-transform:uppercase}
.gp-hint table{border-collapse:collapse}
.gp-hint td{padding:2px 8px 2px 0;vertical-align:top}
.gp-hint td:first-child{font:600 12px/1.4 var(--mono);color:var(--text);white-space:nowrap}
.gp-hint .gp-foot{margin-top:6px;color:var(--text-2);font-size:12px}
.gp-hint .btn,.gp-cal .btn{margin:6px 6px 0 0}
.gp-cal{z-index:90;left:50%;top:50%;transform:translate(-50%,-50%);padding:14px 16px;width:min(460px,calc(100vw - 24px))}
.gp-cal .sticks{display:flex;gap:18px;justify-content:center;margin:8px 0}
.gp-cal svg{width:120px;height:120px}
.gp-cal .row{display:flex;justify-content:space-between;gap:10px;margin:3px 0}
.gp-cal .val{font-family:var(--mono);color:var(--text)}
.gp-cal .msg{min-height:1.4em;color:var(--warn);margin-top:6px}
`;

function stickSvg(left: boolean): string {
  return `<svg viewBox="-60 -60 120 120" role="img" aria-label="${left ? t('Left stick') : t('Right stick')}"><circle r="56" fill="var(--surface-3)" stroke="var(--border-strong)" stroke-width="2"/>
  <circle class="dz" r="7" fill="var(--warn-weak)" stroke="var(--warn)" stroke-width="1"/>
  <line x1="-56" y1="0" x2="56" y2="0" stroke="var(--border-strong)"/><line x1="0" y1="-56" x2="0" y2="56" stroke="var(--border-strong)"/>
  <circle class="dot" r="6" fill="var(--accent)"/></svg>`;
}

export class GamepadOverlay {
  private cursorEl: HTMLDivElement;
  private labelEl: HTMLDivElement;
  private hintEl: HTMLDivElement;
  private calEl: HTMLDivElement | null = null;
  private labelUntil = 0;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  private measuring: { left: number; samples: number[][] } | null = null;
  calOpen = false;

  constructor(private readonly mapper: GamepadMapper, private readonly hooks: { save: () => void; rumbleTest: () => string; openSettings?: () => void; calClosed?: () => void }) {
    if (!document.getElementById('gp-style')) {
      const st = document.createElement('style');
      st.id = 'gp-style';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'gp-cursor';
    this.cursorEl.innerHTML = `<svg viewBox="-17 -17 34 34"><circle class="ring" r="11"/><line class="tick" x1="-16" y1="0" x2="-6" y2="0"/><line class="tick" x1="6" y1="0" x2="16" y2="0"/><line class="tick" x1="0" y1="-16" x2="0" y2="-6"/><line class="tick" x1="0" y1="6" x2="0" y2="16"/></svg><div class="lbl"></div>`;
    this.labelEl = this.cursorEl.querySelector('.lbl') as HTMLDivElement;
    document.body.appendChild(this.cursorEl);

    this.hintEl = document.createElement('div');
    this.hintEl.className = 'gp-panel gp-hint';
    this.hintEl.hidden = true;
    this.renderHints();
    this.hintEl.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-gp]');
      if (b?.dataset.gp === 'cal') { this.toggleHint(false); this.openCalibration(); }
      if (b?.dataset.gp === 'settings') { this.toggleHint(false); this.hooks.openSettings?.(); }
      if (b?.dataset.gp === 'close') this.toggleHint(false);
    });
    document.body.appendChild(this.hintEl);
  }

  get hintVisible(): boolean { return !this.hintEl.hidden; }

  /** Rebuilds the help overlay from the current button map. */
  renderHints() {
    this.hintEl.innerHTML = `<h4>${t('Controller')}</h4><table>${controlHints(this.mapper.settings).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
      <div class="gp-foot">${t('Held heat needs a realistic rework mode (Bench → Rework, or a default in Settings → Controller). In instant mode the iron trigger does the classic click.')}</div>
      <button type="button" class="btn sm" data-gp="settings">${t('Controller settings')}</button><button type="button" class="btn sm" data-gp="cal">${t('Calibrate sticks')}</button><button type="button" class="btn sm" data-gp="close">${t('Close')}</button>`;
  }

  showCursor(x: number, y: number, hot: boolean, fine: boolean) {
    const el = this.cursorEl;
    el.style.display = 'block';
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    el.classList.toggle('hot', hot);
    el.classList.toggle('fine', fine);
    if (this.labelUntil && performance.now() > this.labelUntil) { this.labelEl.textContent = ''; this.labelUntil = 0; }
  }

  hideCursor() { this.cursorEl.style.display = 'none'; }

  /** A short label next to the cursor (tool name, FINE/COARSE). */
  flash(text: string, ms = 1200) { this.labelEl.textContent = text; this.labelUntil = performance.now() + ms; }

  toggleHint(force?: boolean, autoHideMs = 0) {
    const show = force ?? this.hintEl.hidden;
    this.hintEl.hidden = !show;
    if (this.hintTimer) { clearTimeout(this.hintTimer); this.hintTimer = null; }
    if (show && autoHideMs) this.hintTimer = setTimeout(() => { this.hintEl.hidden = true; }, autoHideMs);
  }

  openCalibration() {
    if (this.calEl) this.calEl.remove();
    const el = document.createElement('div');
    el.className = 'gp-panel gp-cal';
    el.setAttribute('role', 'dialog');
    const k = this.mapper.settings.keymap, n = buttonName;
    el.setAttribute('aria-label', t('Calibrate controller'));
    el.innerHTML = `<h4>${t('Calibrate controller')}</h4>
      <div>${t('Let go of both sticks and press <b>{btn}</b> to measure their resting drift (2 s). The amber ring is the dead zone.', { btn: n(k.act) })}</div>
      <div class="sticks">${stickSvg(true)}${stickSvg(false)}</div>
      <div class="row"><span>${t('Dead zone ({a} / {b})', { a: n(k.panLeft), b: n(k.panRight) })}</span><span class="val" data-v="dz"></span></div>
      <div class="row"><span>${t('Cursor speed ({a} / {b})', { a: n(k.zoomIn), b: n(k.zoomOut) })}</span><span class="val" data-v="sp"></span></div>
      <div class="row"><span>${t('Triggers')} LT / RT</span><span class="val" data-v="tr"></span></div>
      <div class="msg" role="status"></div>
      <button type="button" class="btn sm" data-c="measure">${t('Measure rest ({btn})', { btn: n(k.act) })}</button><button type="button" class="btn sm" data-c="rumble">${t('Test rumble ({btn})', { btn: n(k.toolPrev) })}</button><button type="button" class="btn sm" data-c="done">${t('Done ({btn})', { btn: n(k.cancel) })}</button>`;
    el.addEventListener('click', (e) => {
      const c = (e.target as HTMLElement).closest<HTMLElement>('[data-c]')?.dataset.c;
      if (c === 'measure') this.startMeasure();
      if (c === 'rumble') this.msg(this.rumbleText(this.hooks.rumbleTest()));
      if (c === 'done') this.closeCalibration();
    });
    document.body.appendChild(el);
    this.calEl = el;
    this.calOpen = true;
    this.renderValues();
  }

  closeCalibration() {
    this.calEl?.remove();
    this.calEl = null;
    this.calOpen = false;
    this.measuring = null;
    this.hooks.save();
    this.hooks.calClosed?.();
  }

  private rumbleText(ch: string) {
    return ch === 'pad' ? t('Rumble sent to the controller.') : ch === 'device' ? t('No controller rumble here; the device vibrated instead.') : ch === 'off' ? t('Rumble is off.') : t('No rumble available in this browser or connection (common over Bluetooth on Android). Visual and sound cues still work.');
  }

  private msg(s: string) { const m = this.calEl?.querySelector('.msg'); if (m) m.textContent = s; }

  private startMeasure() { this.measuring = { left: 2, samples: [] }; this.msg(t('Measuring… hands off the sticks.')); }

  private renderValues(lastTrig?: [number, number]) {
    const el = this.calEl;
    if (!el) return;
    const s = this.mapper.settings;
    (el.querySelector('[data-v="dz"]') as HTMLElement).textContent = s.deadzone === s.rightDeadzone ? s.deadzone.toFixed(2) : `L ${s.deadzone.toFixed(2)} · R ${s.rightDeadzone.toFixed(2)}`;
    (el.querySelector('[data-v="sp"]') as HTMLElement).textContent = `${Math.round(s.cursorSpeed)} px/s`;
    if (lastTrig) (el.querySelector('[data-v="tr"]') as HTMLElement).textContent = `${lastTrig[0].toFixed(2)} / ${lastTrig[1].toFixed(2)}`;
    el.querySelectorAll<SVGCircleElement>('.dz').forEach((c, i) => c.setAttribute('r', String(Math.max(1, (i ? s.rightDeadzone : s.deadzone) * 56))));
  }

  /** Per-frame while calibration is open: live sticks, measuring, gamepad controls. */
  calFrame(p: PadSnapshot, f: PadFrame, dt: number) {
    const el = this.calEl;
    if (!el) return;
    const dots = el.querySelectorAll<SVGCircleElement>('.dot');
    const ax = (i: number) => p.axes[i] ?? 0;
    dots[0]?.setAttribute('cx', String(ax(0) * 56)); dots[0]?.setAttribute('cy', String(ax(1) * 56));
    dots[1]?.setAttribute('cx', String(ax(2) * 56)); dots[1]?.setAttribute('cy', String(ax(3) * 56));
    const s = this.mapper.settings;
    if (this.measuring) {
      this.measuring.samples.push([ax(0), ax(1), ax(2), ax(3)]);
      this.measuring.left -= dt;
      if (this.measuring.left <= 0) {
        [s.deadzone, s.rightDeadzone] = deadzonesFromRest(this.measuring.samples);
        this.msg(t('Done: dead zones set to L {l} / R {r} from {count} samples.', { l: s.deadzone.toFixed(2), r: s.rightDeadzone.toFixed(2), count: this.measuring.samples.length }));
        this.measuring = null;
        this.hooks.save();
      }
    }
    for (const a of f.actions) {
      if (a === 'act') this.startMeasure();
      else if (a === 'cancel' || a === 'menu') { this.closeCalibration(); return; }
      else if (a === 'toolPrev') this.msg(this.rumbleText(this.hooks.rumbleTest()));
      else if (a === 'left' || a === 'right') {
        const d = a === 'left' ? -0.01 : 0.01;
        s.deadzone = Math.min(0.5, Math.max(0.02, Math.round((s.deadzone + d) * 100) / 100));
        s.rightDeadzone = Math.min(0.5, Math.max(0.02, Math.round((s.rightDeadzone + d) * 100) / 100));
      }
      else if (a === 'up') s.cursorSpeed = Math.min(2000, s.cursorSpeed + 40);
      else if (a === 'down') s.cursorSpeed = Math.max(100, s.cursorSpeed - 40);
    }
    this.renderValues([f.feed, f.heat]);
  }
}
