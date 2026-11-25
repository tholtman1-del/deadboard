/**
 * Gamepad mod (by sergioSHKLR): on-screen parts. The controller cursor, the control-hint overlay
 * and the stick calibration screen. Plain DOM, English only (the mod is not translated yet).
 */
import { buttonName, controlHints, deadzonesFromRest, type GamepadMapper, type PadFrame, type PadSnapshot } from './gamepad';

const CSS = `
.gp-cursor{position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;pointer-events:none;z-index:60;display:none}
.gp-cursor svg{width:100%;height:100%;overflow:visible}
.gp-cursor .ring{fill:none;stroke:#7ee2a8;stroke-width:2}
.gp-cursor.fine .ring{stroke:#6cb8ff;stroke-dasharray:3 3}
.gp-cursor.hot .ring{stroke:#ff8a1f;stroke-width:3}
.gp-cursor .tick{stroke:#fff;stroke-width:1.5}
.gp-cursor .lbl{position:absolute;left:24px;top:22px;white-space:nowrap;font:600 11px/1.2 system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.7);padding:2px 6px;border-radius:6px}
.gp-cursor .lbl:empty{display:none}
.gp-panel{position:fixed;z-index:70;background:rgba(18,20,22,.94);color:#e8e8e8;border:1px solid #3a3d41;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.45);font:13px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
.gp-hint{left:12px;bottom:40px;padding:10px 12px;max-width:min(420px,calc(100vw - 24px))}
.gp-hint h4,.gp-cal h4{margin:0 0 6px;font:700 12px/1.2 system-ui,sans-serif;letter-spacing:.06em;color:#7ee2a8;text-transform:uppercase}
.gp-hint table{border-collapse:collapse}
.gp-hint td{padding:2px 8px 2px 0;vertical-align:top}
.gp-hint td:first-child{font-weight:700;color:#fff;white-space:nowrap}
.gp-hint .gp-foot{margin-top:6px;color:#9aa0a6;font-size:12px}
.gp-hint button,.gp-cal button{font:inherit;color:#fff;background:#2b2e32;border:1px solid #4a4e53;border-radius:8px;padding:4px 10px;margin:6px 6px 0 0;cursor:pointer}
.gp-cal{z-index:90;left:50%;top:50%;transform:translate(-50%,-50%);padding:14px 16px;width:min(460px,calc(100vw - 24px))}
.gp-cal .sticks{display:flex;gap:18px;justify-content:center;margin:8px 0}
.gp-cal svg{width:120px;height:120px}
.gp-cal .row{display:flex;justify-content:space-between;gap:10px;margin:3px 0}
.gp-cal .val{font-family:ui-monospace,monospace;color:#fff}
.gp-cal .msg{min-height:1.4em;color:#ffd27a;margin-top:6px}
`;

function stickSvg(id: string): string {
  return `<svg viewBox="-60 -60 120 120" aria-label="${id} stick"><circle r="56" fill="#1d1f21" stroke="#4a4e53" stroke-width="2"/>
  <circle class="dz" r="7" fill="rgba(255,210,122,.18)" stroke="#ffd27a" stroke-width="1"/>
  <line x1="-56" y1="0" x2="56" y2="0" stroke="#33363a"/><line x1="0" y1="-56" x2="0" y2="56" stroke="#33363a"/>
  <circle class="dot" r="6" fill="#7ee2a8"/></svg>`;
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
    this.hintEl.innerHTML = `<h4>Controller</h4><table>${controlHints(this.mapper.settings).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
      <div class="gp-foot">Realistic heat: Bench → Rework → Iron 350 °C (or set a default heat mode in Settings → Controller). In instant mode the iron trigger does the classic click.</div>
      <button type="button" data-gp="settings">Controller settings</button><button type="button" data-gp="cal">Calibrate sticks</button><button type="button" data-gp="close">Close</button>`;
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
    el.innerHTML = `<h4>Calibrate controller</h4>
      <div>Let go of both sticks and press <b>${n(k.act)}</b> to measure their resting drift (2 s). The yellow ring is the dead zone.</div>
      <div class="sticks">${stickSvg('left')}${stickSvg('right')}</div>
      <div class="row"><span>Dead zone (${n(k.panLeft)} / ${n(k.panRight)})</span><span class="val" data-v="dz"></span></div>
      <div class="row"><span>Cursor speed (${n(k.zoomIn)} / ${n(k.zoomOut)})</span><span class="val" data-v="sp"></span></div>
      <div class="row"><span>Triggers LT / RT</span><span class="val" data-v="tr"></span></div>
      <div class="msg"></div>
      <button type="button" data-c="measure">Measure rest (${n(k.act)})</button><button type="button" data-c="rumble">Test rumble (${n(k.toolPrev)})</button><button type="button" data-c="done">Done (${n(k.cancel)})</button>`;
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
    return ch === 'pad' ? 'Rumble sent to the controller.' : ch === 'device' ? 'No controller rumble here; the device vibrated instead.' : 'No rumble available in this browser / connection (common over Bluetooth on Android). Visual and sound cues still work.';
  }

  private msg(s: string) { const m = this.calEl?.querySelector('.msg'); if (m) m.textContent = s; }

  private startMeasure() { this.measuring = { left: 2, samples: [] }; this.msg('Measuring… hands off the sticks.'); }

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
        this.msg(`Done: dead zones set to L ${s.deadzone.toFixed(2)} / R ${s.rightDeadzone.toFixed(2)} from ${this.measuring.samples.length} samples.`);
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
