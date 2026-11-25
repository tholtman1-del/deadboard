/**
 * Gamepad support (Xbox layout, W3C "standard" mapping): pure input logic, no DOM, so the mapping
 * is unit-tested (test/gamepad.test.ts). The bench (app.ts) polls `navigator.getGamepads()` once
 * per animation frame, feeds the snapshot to `GamepadMapper.update` and acts on the result.
 *
 * Gamepad mod by sergioSHKLR. Single cursor: DEADBOARD uses one tool at a time, so the left stick
 * drives the tool cursor and the right stick pans the board (see CONTROL_HINTS below).
 */

/** W3C standard-mapping button indices (Xbox names). */
export const BTN = {
  A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7,
  VIEW: 8, MENU: 9, L3: 10, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, GUIDE: 16,
} as const;

export interface PadButton { pressed: boolean; value: number }
export interface PadSnapshot {
  id?: string;
  mapping?: string;
  axes: readonly number[];
  buttons: readonly PadButton[];
}

/** Remappable button actions (each bound to one standard-mapping button index). */
export type BindAction =
  | 'fineToggle' | 'fineHold' | 'heat' | 'feed' | 'act' | 'blackProbe' | 'cancel' | 'toolPrev' | 'toolNext'
  | 'flip' | 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight' | 'menu' | 'help' | 'calibrate' | 'settings';
export type Keymap = Record<BindAction, number>;

export const DEFAULT_KEYMAP: Readonly<Keymap> = {
  fineToggle: BTN.L3, fineHold: BTN.LB, heat: BTN.RT, feed: BTN.LT, act: BTN.A, blackProbe: BTN.B, cancel: BTN.B,
  toolPrev: BTN.X, toolNext: BTN.Y, flip: BTN.RB, zoomIn: BTN.UP, zoomOut: BTN.DOWN,
  panLeft: BTN.LEFT, panRight: BTN.RIGHT, menu: BTN.MENU, help: BTN.VIEW, calibrate: BTN.VIEW, settings: BTN.R3,
};

/** Keymap rows in display order: [action, label, how it's used]. */
export const KEYMAP_ROWS: readonly [BindAction, string, string][] = [
  ['fineToggle', 'Fine cursor (toggle)', 'press'],
  ['fineHold', 'Fine cursor (hold)', 'hold'],
  ['heat', 'Iron on the joint', 'hold'],
  ['feed', 'Feed solder (iron)', 'press'],
  ['act', 'Use tool / select · red probe (meter)', 'press'],
  ['blackProbe', 'Black probe (meter)', 'press'],
  ['cancel', 'Cancel / lift / close', 'press'],
  ['toolPrev', 'Previous tool', 'press'],
  ['toolNext', 'Next tool', 'press'],
  ['flip', 'Flip board', 'press'],
  ['zoomIn', 'Zoom in', 'hold'],
  ['zoomOut', 'Zoom out', 'hold'],
  ['panLeft', 'Pan left', 'hold'],
  ['panRight', 'Pan right', 'hold'],
  ['menu', 'Boards menu', 'press'],
  ['help', 'Controls help', 'tap'],
  ['calibrate', 'Calibrate sticks', 'hold 0.8 s'],
  ['settings', 'Controller settings', 'press'],
];

/** Xbox names for the standard-mapping button indices. */
export const BUTTON_NAMES: readonly string[] = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'L3', 'R3', 'D-pad ↑', 'D-pad ↓', 'D-pad ←', 'D-pad →', 'Guide'];
export const buttonName = (i: number) => BUTTON_NAMES[i] ?? `Button ${i}`;

/**
 * Buttons bound to more than one action. Help (tap) and calibrate (hold) may share a button, and so
 * may black probe and cancel: with the meter selected a tap places the black probe and a 0.6 s hold
 * cancels; with any other tool the button is plain cancel.
 */
export function keymapConflicts(km: Keymap): { button: number; actions: BindAction[] }[] {
  const by = new Map<number, BindAction[]>();
  for (const [a] of KEYMAP_ROWS) { const b = km[a]; by.set(b, [...(by.get(b) ?? []), a]); }
  const out: { button: number; actions: BindAction[] }[] = [];
  for (const [button, actions] of by) {
    if (actions.length < 2) continue;
    if (actions.length === 2 && actions.includes('help') && actions.includes('calibrate')) continue;
    if (actions.length === 2 && actions.includes('blackProbe') && actions.includes('cancel')) continue;
    out.push({ button, actions });
  }
  return out;
}

export type HeatMode = 'keep' | 'instant' | 'r350f' | 'r350' | 'r400f';
export const HEAT_MODES: readonly [HeatMode, string][] = [
  ['keep', 'Keep the bench setting'], ['instant', 'Instant (puzzle click)'], ['r350f', 'Realistic: iron 350 °C + flux'],
  ['r350', 'Realistic: iron 350 °C, dry'], ['r400f', 'Realistic: iron 400 °C + flux'],
];

export interface GamepadSettings {
  /** Left stick radial dead zone (0..1 of full tilt). */
  deadzone: number;
  /** Right stick radial dead zone. */
  rightDeadzone: number;
  /** Trigger dead zone at the released end (0..1). */
  triggerDeadzone: number;
  /** Cursor speed at full tilt, coarse mode (CSS px/s). */
  cursorSpeed: number;
  /** Fine mode speed as a fraction of coarse. */
  fineFactor: number;
  /** Pan speed at full tilt (CSS px/s). */
  panSpeed: number;
  /** Response curve exponent applied after the dead zone (1 = linear). */
  curve: number;
  /** Trigger level that counts as pressed (heat on / feed). */
  triggerOn: number;
  /** Which stick moves the cursor (the other pans). */
  cursorStick: 'left' | 'right';
  invertLeftY: boolean;
  invertRightY: boolean;
  /** Iron contact at the lightest / full trigger pull (fraction of the bench's conductance). */
  heatMin: number;
  heatMax: number;
  /** Trigger-to-contact curve exponent (<1 soft: contact comes early; >1 firm). */
  heatCurve: number;
  rumble: boolean;
  rumbleIntensity: number;
  /** Vibrate the phone / tablet when the pad has no rumble motor. */
  deviceVibrate: boolean;
  /** Show the controls help for a few seconds when a controller connects. */
  hintOnConnect: boolean;
  /** Rework mode to switch to when a controller connects. */
  heatMode: HeatMode;
  keymap: Keymap;
}

export const DEFAULT_SETTINGS: GamepadSettings = {
  deadzone: 0.12, rightDeadzone: 0.12, triggerDeadzone: 0.05, cursorSpeed: 520, fineFactor: 0.18, panSpeed: 700, curve: 1.8, triggerOn: 0.15,
  cursorStick: 'left', invertLeftY: false, invertRightY: false,
  heatMin: 0.35, heatMax: 1, heatCurve: 1,
  rumble: true, rumbleIntensity: 1, deviceVibrate: true, hintOnConnect: true, heatMode: 'keep',
  keymap: { ...DEFAULT_KEYMAP },
};

/** A fresh copy of the defaults (keymap included). */
export const defaultSettings = (): GamepadSettings => ({ ...DEFAULT_SETTINGS, keymap: { ...DEFAULT_KEYMAP } });

/** Iron contact (fraction of the bench conductance) for a trigger pull of 0..1. */
export function heatScale(pull: number, s: Pick<GamepadSettings, 'heatMin' | 'heatMax' | 'heatCurve'>): number {
  const p = Math.min(1, Math.max(0, pull));
  return s.heatMin + (s.heatMax - s.heatMin) * Math.pow(p, s.heatCurve);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Radial dead zone with rescaling and a response curve: inside `dz` the stick reads 0; outside,
 * magnitude is rescaled from 0 at the dead-zone edge to 1 at full tilt, then raised to `curve`,
 * keeping the direction. Radial (not per-axis) so diagonals do not stick.
 */
export function stick(x: number, y: number, dz: number, curve = 1): [number, number] {
  const m = Math.hypot(x, y);
  if (!(m > dz) || m === 0) return [0, 0];
  const r = Math.pow(clamp((m - dz) / (1 - dz), 0, 1), curve);
  return [(x / m) * r, (y / m) * r];
}

/** Analog trigger with a released-end dead zone, rescaled to 0..1 (snaps to 1 near full pull). */
export function trigger(b: PadButton | undefined, dz: number): number {
  if (!b) return 0;
  const v = Number.isFinite(b.value) ? b.value : b.pressed ? 1 : 0;
  const raw = v === 0 && b.pressed ? 1 : v; // digital-only triggers
  if (raw <= dz) return 0;
  if (raw >= 0.97) return 1;
  return clamp((raw - dz) / (0.97 - dz), 0, 1);
}

export type PadAction =
  | 'act' | 'cancel' | 'toolPrev' | 'toolNext' | 'menu' | 'help' | 'calibrate'
  | 'toggleFine' | 'flip' | 'up' | 'down' | 'left' | 'right'
  | 'heatStart' | 'heatEnd' | 'feed' | 'settings' | 'blackProbe';

export interface PadFrame {
  /** Cursor movement this frame (CSS px). */
  cursor: [number, number];
  /** Board pan this frame (CSS px, like a mouse drag). */
  pan: [number, number];
  /** D-pad held directions this frame (for continuous zoom / pan). */
  held: { up: boolean; down: boolean; left: boolean; right: boolean };
  /** Right trigger 0..1: iron contact pressure. */
  heat: number;
  /** Left trigger 0..1: solder feed / grip. */
  feed: number;
  fine: boolean;
  actions: PadAction[];
  /** Any stick, trigger or button input this frame (above the dead zones). */
  active: boolean;
}

/** The calibrate button (View by default) held this long (s) opens calibration instead of toggling help. */
export const VIEW_HOLD_S = 0.8;
/** With the meter selected and black probe sharing the cancel button (B), holding it this long (s) cancels. */
export const CANCEL_HOLD_S = 0.6;

export class GamepadMapper {
  settings: GamepadSettings;
  private prev: boolean[] = [];
  private fineLatched = false;
  private heatOn = false;
  private feedOn = false;
  private viewHeld = 0;
  private viewFired = false;
  private bHeld = 0;
  private bFired = false;
  /** Set by the app each frame: the multimeter is the selected tool (B = black probe). */
  meterContext = false;

  constructor(settings: Partial<GamepadSettings> = {}) {
    this.settings = { ...defaultSettings(), ...settings, keymap: { ...DEFAULT_KEYMAP, ...(settings.keymap ?? {}) } };
  }

  get fine(): boolean { return this.fineLatched; }

  /** Forget held state (pad disconnected or app lost focus). */
  reset() { this.prev = []; this.heatOn = false; this.feedOn = false; this.viewHeld = 0; this.viewFired = false; this.bHeld = 0; this.bFired = false; }

  update(p: PadSnapshot, dt: number): PadFrame {
    const s = this.settings;
    const km = s.keymap;
    const down = (i: number) => !!p.buttons[i]?.pressed;
    const edge = (i: number) => down(i) && !this.prev[i];
    const actions: PadAction[] = [];

    if (edge(km.fineToggle)) { this.fineLatched = !this.fineLatched; actions.push('toggleFine'); }
    const fine = this.fineLatched !== down(km.fineHold); // hold = momentary fine (or coarse while latched)

    const [lx, ly] = stick(p.axes[0] ?? 0, (p.axes[1] ?? 0) * (s.invertLeftY ? -1 : 1), s.deadzone, s.curve);
    const [rx, ry] = stick(p.axes[2] ?? 0, (p.axes[3] ?? 0) * (s.invertRightY ? -1 : 1), s.rightDeadzone, s.curve);
    const [cx, cy, px, py] = s.cursorStick === 'right' ? [rx, ry, lx, ly] : [lx, ly, rx, ry];
    const sp = s.cursorSpeed * (fine ? s.fineFactor : 1) * dt;
    const cursor: [number, number] = [cx * sp, cy * sp];
    const pan: [number, number] = [-px * s.panSpeed * dt, -py * s.panSpeed * dt];

    const heat = trigger(p.buttons[km.heat], s.triggerDeadzone);
    const feed = trigger(p.buttons[km.feed], s.triggerDeadzone);
    if (!this.heatOn && heat >= s.triggerOn) { this.heatOn = true; actions.push('heatStart'); }
    else if (this.heatOn && heat < s.triggerOn * 0.6) { this.heatOn = false; actions.push('heatEnd'); }
    if (!this.feedOn && feed >= s.triggerOn) { this.feedOn = true; actions.push('feed'); }
    else if (this.feedOn && feed < s.triggerOn * 0.6) this.feedOn = false;

    const pressMap: [BindAction, PadAction][] = [
      ['act', 'act'], ['toolPrev', 'toolPrev'], ['toolNext', 'toolNext'], ['flip', 'flip'],
      ['menu', 'menu'], ['zoomIn', 'up'], ['zoomOut', 'down'], ['panLeft', 'left'], ['panRight', 'right'], ['settings', 'settings'],
    ];
    for (const [b, a] of pressMap) if (edge(km[b])) actions.push(a);

    // Cancel and black probe. Sharing one button (default B): with the meter selected a tap places
    // the black probe and a CANCEL_HOLD_S hold cancels; with any other tool it is plain cancel.
    const bShared = km.blackProbe === km.cancel;
    if (bShared && this.meterContext) {
      if (down(km.cancel)) {
        if (!this.prev[km.cancel]) { this.bHeld = 0; this.bFired = false; }
        this.bHeld += dt;
        if (!this.bFired && this.bHeld >= CANCEL_HOLD_S) { this.bFired = true; actions.push('cancel'); }
      } else if (this.prev[km.cancel] && !this.bFired && this.bHeld > 0) actions.push('blackProbe');
    } else {
      if (edge(km.cancel)) actions.push('cancel');
      if (!bShared && this.meterContext && edge(km.blackProbe)) actions.push('blackProbe');
    }
    if (!down(km.cancel)) { this.bHeld = 0; this.bFired = false; }

    // help: a tap; calibrate: a 0.8 s hold. Sharing one button (the default, View): tap vs hold.
    const shared = km.help === km.calibrate;
    if (down(km.calibrate)) {
      this.viewHeld += dt;
      if (!this.viewFired && this.viewHeld >= VIEW_HOLD_S) { this.viewFired = true; actions.push('calibrate'); }
    } else {
      if (shared && this.prev[km.calibrate] && !this.viewFired) actions.push('help');
      this.viewHeld = 0; this.viewFired = false;
    }
    if (!shared && edge(km.help)) actions.push('help');

    const held = { up: down(km.zoomIn), down: down(km.zoomOut), left: down(km.panLeft), right: down(km.panRight) };
    const active = lx !== 0 || ly !== 0 || rx !== 0 || ry !== 0 || heat > 0 || feed > 0 || p.buttons.some((b, i) => i !== BTN.GUIDE && b?.pressed);
    this.prev = p.buttons.map((b) => !!b?.pressed);
    return { cursor, pan, held, heat, feed, fine, actions, active };
  }
}

/**
 * Dead zone from resting-stick samples (hands off): just above the largest resting deflection
 * of either stick, clamped to a sane range.
 */
export function deadzoneFromRest(samples: readonly (readonly number[])[]): number {
  let m = 0;
  for (const a of samples) m = Math.max(m, Math.hypot(a[0] ?? 0, a[1] ?? 0), Math.hypot(a[2] ?? 0, a[3] ?? 0));
  return clamp(Math.round((m * 1.25 + 0.03) * 100) / 100, 0.05, 0.35);
}

/** Per-stick dead zones [left, right] from resting samples. */
export function deadzonesFromRest(samples: readonly (readonly number[])[]): [number, number] {
  return [deadzoneFromRest(samples.map((a) => [a[0] ?? 0, a[1] ?? 0, 0, 0])), deadzoneFromRest(samples.map((a) => [a[2] ?? 0, a[3] ?? 0, 0, 0]))];
}

export interface Haptics {
  /** Gamepad body rumble (Chrome: dual-rumble), when the browser exposes an actuator. */
  playEffect?: (type: 'dual-rumble', p: { startDelay: number; duration: number; weakMagnitude: number; strongMagnitude: number }) => Promise<unknown>;
  effects?: readonly string[];
}

/**
 * One haptic pulse: the pad's rumble motors when present, otherwise the phone/tablet's own
 * vibration (Android). Returns the channel used, or 'none'.
 */
export function hapticPulse(
  actuator: Haptics | null | undefined,
  vibrate: ((ms: number) => boolean) | undefined,
  strong: number, weak: number, ms: number,
): 'pad' | 'device' | 'none' {
  if (actuator?.playEffect && (!actuator.effects || actuator.effects.includes('dual-rumble'))) {
    actuator.playEffect('dual-rumble', { startDelay: 0, duration: ms, weakMagnitude: clamp(weak, 0, 1), strongMagnitude: clamp(strong, 0, 1) }).catch(() => undefined);
    return 'pad';
  }
  if (vibrate && (strong > 0 || weak > 0)) {
    try { if (vibrate(ms)) return 'device'; } catch { /* not allowed yet */ }
  }
  return 'none';
}

/** The control mapping shown in the on-screen hint overlay (English; the mod is not translated). */
export function controlHints(s: GamepadSettings = DEFAULT_SETTINGS): [string, string][] {
  const k = s.keymap, n = buttonName;
  const cur = s.cursorStick === 'right' ? 'Right stick' : 'Left stick', pan = s.cursorStick === 'right' ? 'Left stick' : 'Right stick';
  const help = k.help === k.calibrate ? [[n(k.help), 'This help · hold: calibrate sticks']] : [[n(k.help), 'This help'], [`Hold ${n(k.calibrate)}`, 'Calibrate sticks']];
  const pair = (a: number, b: number) => n(a).startsWith('D-pad ') && n(b).startsWith('D-pad ') ? `D-pad ${n(a).slice(6)} ${n(b).slice(6)}` : `${n(a)} / ${n(b)}`;
  return [
    [cur, 'Move the tool cursor'],
    [`${n(k.fineToggle)} / hold ${n(k.fineHold)}`, 'Fine cursor (toggle / hold)'],
    [pan, 'Pan the board'],
    [`${n(k.heat)} (hold)`, 'Iron on the joint: heat while held, pressure = contact'],
    [n(k.feed), 'Feed solder (iron) · use tool'],
    [n(k.act), 'Use tool / select · red probe (meter)'],
    ...(k.blackProbe === k.cancel
      ? [[n(k.cancel), 'Cancel · lift · close · meter: black probe (hold: cancel)']]
      : [[n(k.blackProbe), 'Black probe (meter)'], [n(k.cancel), 'Cancel · lift · close']]) as [string, string][],
    [pair(k.toolPrev, k.toolNext), 'Previous / next tool'],
    [n(k.flip), 'Flip board (top / bottom)'],
    [pair(k.zoomIn, k.zoomOut), 'Zoom in / out (menus: move)'],
    [pair(k.panLeft, k.panRight), 'Pan (menus: move)'],
    [n(k.menu), 'Boards menu (open / close)'],
    ...(help as [string, string][]),
    [n(k.settings), 'Controller settings'],
  ];
}
export const CONTROL_HINTS: readonly [string, string][] = controlHints();

export const GAMEPAD_STORAGE_KEY = 'deadboard_gamepad';
export const EXPORT_FORMAT = 'deadboard-gamepad-settings';

const NUM: [keyof GamepadSettings, number, number][] = [
  ['deadzone', 0.02, 0.5], ['rightDeadzone', 0.02, 0.5], ['triggerDeadzone', 0, 0.4], ['cursorSpeed', 100, 2000],
  ['fineFactor', 0.05, 0.6], ['panSpeed', 100, 2500], ['curve', 0.5, 3], ['triggerOn', 0.05, 0.9],
  ['heatMin', 0.05, 1], ['heatMax', 0.1, 1], ['heatCurve', 0.3, 3], ['rumbleIntensity', 0, 1],
];
const BOOL: (keyof GamepadSettings)[] = ['invertLeftY', 'invertRightY', 'rumble', 'deviceVibrate', 'hintOnConnect'];

/** Keep only known, in-range values (storage or an imported file); everything else is dropped. */
export function sanitizeSettings(v: unknown): Partial<GamepadSettings> {
  const out: Record<string, unknown> = {};
  if (!v || typeof v !== 'object') return {};
  const o = v as Record<string, unknown>;
  for (const [k, lo, hi] of NUM) { const x = o[k]; if (typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi) out[k] = x; }
  for (const k of BOOL) if (typeof o[k] === 'boolean') out[k] = o[k];
  if (o.cursorStick === 'left' || o.cursorStick === 'right') out.cursorStick = o.cursorStick;
  if (HEAT_MODES.some(([m]) => m === o.heatMode)) out.heatMode = o.heatMode;
  if (typeof out.heatMin === 'number' && typeof out.heatMax === 'number' && out.heatMin > out.heatMax) { delete out.heatMin; delete out.heatMax; }
  if (o.keymap && typeof o.keymap === 'object') {
    const km: Partial<Keymap> = {};
    for (const [a] of KEYMAP_ROWS) { const b = (o.keymap as Record<string, unknown>)[a]; if (Number.isInteger(b) && (b as number) >= 0 && (b as number) <= 15) km[a] = b as number; }
    // keymaps saved before blackProbe existed: put it on their cancel button (meter tap = black, hold = cancel)
    if (km.blackProbe === undefined && km.cancel !== undefined) km.blackProbe = km.cancel;
    if (Object.keys(km).length) out.keymap = km;
  }
  return out as Partial<GamepadSettings>;
}

/** Replaces live settings with the defaults plus sanitized values (used by import and reset). */
export function applySettings(target: GamepadSettings, v: Partial<GamepadSettings>) {
  Object.assign(target, defaultSettings(), v, { keymap: { ...DEFAULT_KEYMAP, ...(v.keymap ?? {}) } });
}

export function loadGamepadSettings(store: Pick<Storage, 'getItem'> | null): Partial<GamepadSettings> {
  try {
    const raw = store?.getItem(GAMEPAD_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeSettings(JSON.parse(raw));
  } catch { return {}; }
}

export function saveGamepadSettings(store: Pick<Storage, 'setItem'> | null, s: GamepadSettings) {
  try { store?.setItem(GAMEPAD_STORAGE_KEY, JSON.stringify(s)); } catch { /* storage off */ }
}

/** JSON for the export file. */
export function exportSettings(s: GamepadSettings): string {
  return JSON.stringify({ format: EXPORT_FORMAT, version: 2, settings: s }, null, 2);
}

/** Parses an export file (or a bare settings object). Throws with a readable message when unusable. */
export function importSettings(text: string): Partial<GamepadSettings> {
  let v: unknown;
  try { v = JSON.parse(text); } catch { throw new Error('That file is not valid JSON.'); }
  const o = v as { format?: unknown; settings?: unknown };
  const body = o && typeof o === 'object' && o.format === EXPORT_FORMAT ? o.settings : v;
  const out = sanitizeSettings(body);
  if (!Object.keys(out).length) throw new Error('No controller settings found in that file.');
  return out;
}

/**
 * Press-to-rebind: waits until every button is up (so the press that started listening does not
 * bind itself), then returns the first button pressed. Guide is ignored (the OS owns it).
 */
export class RebindListener {
  private armed = false;
  private left: number;
  constructor(readonly action: BindAction, timeoutS = 6) { this.left = timeoutS; }
  /** Returns a button index once captured, 'timeout' when time runs out, else null. */
  feed(pressed: readonly boolean[], dt: number): number | 'timeout' | null {
    this.left -= dt;
    if (this.left <= 0) return 'timeout';
    const any = pressed.some((p, i) => p && i !== BTN.GUIDE);
    if (!this.armed) { if (!any) this.armed = true; return null; }
    const i = pressed.findIndex((p, j) => p && j !== BTN.GUIDE && j <= 15);
    return i >= 0 ? i : null;
  }
}

/** Menu navigation with key repeat: a press steps once, holding repeats after a delay. */
export class NavRepeat {
  private held = new Map<string, number>();
  constructor(private readonly delay = 0.4, private readonly rate = 0.11) {}
  /** Steps for one direction this frame (0 or 1). */
  step(dir: string, down: boolean, dt: number): number {
    if (!down) { this.held.delete(dir); return 0; }
    const t = this.held.get(dir);
    if (t === undefined) { this.held.set(dir, 0); return 1; }
    const n = t + dt;
    this.held.set(dir, n);
    if (n >= this.delay) { this.held.set(dir, this.delay - this.rate); return 1; }
    return 0;
  }
}

/**
 * Hold-to-exit for the controller test: a quick press of the button still shows as a normal
 * press; only holding it for `holdS` exits. Returns progress 0..1 and whether to exit.
 */
export class HoldToExit {
  private t = 0;
  private armed = false;
  constructor(readonly button: number = BTN.B, readonly holdS = 1) {}
  /** `pressed` is the pad's button state this frame. Waits for a release first (the press that opened the view does not count). */
  feed(pressed: readonly boolean[], dt: number): { progress: number; exit: boolean } {
    const down = !!pressed[this.button];
    if (!this.armed) { if (!down) this.armed = true; return { progress: 0, exit: false }; }
    this.t = down ? this.t + dt : 0;
    return { progress: Math.min(1, this.t / this.holdS), exit: this.t >= this.holdS };
  }
}
