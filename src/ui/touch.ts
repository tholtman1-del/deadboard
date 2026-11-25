/**
 * Touch / mobile support: layout choice, the touch gesture recogniser for the board canvas,
 * and touch wording for copy written for mouse and keyboard.
 * Pure logic (no DOM) apart from `wantsMobileLayout`, so the gestures are unit-tested.
 */

/**
 * Mobile layout for touch-only devices (phones, tablets without a trackpad). Desktops, laptops
 * with a touch screen and the desktop app keep the desktop layout. A phone-sized screen whose
 * main pointer is touch gets the mobile layout even when it also reports a fine pointer: many
 * Android phones do (stylus or mouse support), and Umami showed 28 of 60 Android phone visits
 * getting the desktop layout. `?mobile=1` / `?mobile=0` force it either way (testing on a
 * desktop browser).
 */
export function wantsMobileLayout(search = typeof location !== 'undefined' ? location.search : '', mq?: (q: string) => boolean): boolean {
  const force = new URLSearchParams(search).get('mobile');
  if (force === '1') return true;
  if (force === '0') return false;
  const match = mq ?? ((q: string) => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
  if (!match('(pointer: coarse)')) return false;
  return !match('(any-pointer: fine)') || match('(max-width: 600px), (max-height: 600px)');
}

export interface GestureSink {
  /** A short touch that did not move: use the active tool at this point (client px). */
  tap(x: number, y: number): void;
  /** Drag by (dx, dy) client px: one finger (when `oneFinger` says pan) or two fingers. */
  pan(dx: number, dy: number): void;
  /** One-finger drag in a view that orbits (3D). */
  orbit(dx: number, dy: number): void;
  /** Pinch: scale the view by `factor` (< 1 = zoom in) about (cx, cy) client px. */
  zoom(factor: number, cx: number, cy: number): void;
}

interface Finger { x: number; y: number; sx: number; sy: number }

/**
 * Recognises tap / one-finger drag / two-finger pinch-and-pan from raw pointer events.
 * A gesture that ever had two fingers never ends in a tap, and a leftover finger after a
 * pinch does nothing until every finger is up (no jump when one finger lifts first).
 */
export class TouchGestures {
  private fingers = new Map<number, Finger>();
  private moved = false;
  private multi = false;
  private pinch: { d: number; mx: number; my: number } | null = null;

  constructor(
    private sink: GestureSink,
    /** What a one-finger drag does right now. */
    private oneFinger: () => 'pan' | 'orbit',
    /** Movement (client px) before a touch counts as a drag instead of a tap. */
    private slop = 10,
  ) {}

  has(id: number): boolean { return this.fingers.has(id); }
  get active(): boolean { return this.fingers.size > 0; }

  down(id: number, x: number, y: number) {
    if (this.fingers.size === 0) { this.moved = false; this.multi = false; this.pinch = null; }
    this.fingers.set(id, { x, y, sx: x, sy: y });
    if (this.fingers.size >= 2) { this.multi = true; this.pinch = this.pinchState(); }
  }

  move(id: number, x: number, y: number) {
    const f = this.fingers.get(id);
    if (!f) return;
    const dx = x - f.x, dy = y - f.y;
    f.x = x; f.y = y;
    if (this.fingers.size >= 2) {
      const p = this.pinchState();
      if (this.pinch && p) {
        if (p.d > 0 && this.pinch.d > 0) this.sink.zoom(this.pinch.d / p.d, p.mx, p.my);
        this.sink.pan(p.mx - this.pinch.mx, p.my - this.pinch.my);
      }
      this.pinch = p;
      return;
    }
    if (this.multi) return; // leftover finger after a pinch
    if (!this.moved && Math.hypot(x - f.sx, y - f.sy) > this.slop) this.moved = true;
    if (!this.moved) return;
    if (this.oneFinger() === 'orbit') this.sink.orbit(dx, dy);
    else this.sink.pan(dx, dy);
  }

  up(id: number, x?: number, y?: number) {
    const f = this.fingers.get(id);
    if (!f) return;
    this.fingers.delete(id);
    if (this.fingers.size >= 2) { this.pinch = this.pinchState(); return; }
    if (this.fingers.size === 1) { this.pinch = null; return; }
    if (!this.moved && !this.multi) this.sink.tap(x ?? f.x, y ?? f.y);
  }

  /** The browser took the touch over (or the pointer was lost): end it without a tap. */
  cancel(id: number) {
    if (!this.fingers.delete(id)) return;
    this.moved = true;
    if (this.fingers.size < 2) this.pinch = null;
  }

  private pinchState(): { d: number; mx: number; my: number } | null {
    const it = this.fingers.values();
    const a = it.next().value, b = it.next().value;
    if (!a || !b) return null;
    return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  }
}

/**
 * Touch wording for text written for mouse and keyboard (tutorial steps, tool tips, toasts):
 * clicks become taps, right-click becomes the meter's Black probe, keyboard shortcuts go.
 */
export function touchCopy(s: string): string {
  return s
    .replace(/Switch to 3D in the top bar \(or press Tab\)/g, 'Switch to 3D with the view buttons (top right)')
    .replace(/\s*\(or press Tab\)/g, '')
    .replace(/\(press F or click Bottom in the top bar\)/g, '(tap the Top / Bottom view button, top right)')
    .replace(/\(press F or click Bottom\)/g, '(tap the Top / Bottom view button, top right)')
    .replace(/\s*\(<code>F<\/code> key\)/g, '')
    .replace(/right-click or Shift\+click (\S+) \(Black probe\)/g, 'tap $1 with the Black probe (tap the black tag on the meter to switch)')
    .replace(/\((?:left-click|Red probe)\)/g, '(Red probe)')
    .replace(/\(right-click\)/g, '(Black probe)')
    .replace(/[Ll]eft-click places red probe, right-click or Shift\+click places black probe/g, 'Tap places the highlighted probe; tap a probe tag on the meter to switch red / black')
    .replace(/right-click/g, 'Black-probe tap')
    .replace(/left-(click|tap)/g, 'tap')
    .replace(/Left-(click|tap)/g, 'Tap')
    // shortcut keys after a name ("Select (1)", "Power off (P)"), not list numbers ("— (1) Inspect")
    .replace(/(?<=[A-Za-z°])\s\((?:[0-9]|[PFHROBC]|Tab|⌘Z|⇧⌘Z)\)/g, '')
    .replace(/ in the left dock/g, ' in the tool bar')
    .replace(/right-hand Inspector/g, 'Inspector')
    .replace(/Drag and drop/g, 'Import (More menu ⋯)')
    .replace(/\bclick(ed|ing|s)?\b/g, (_m, sfx: string | undefined) => 'tap' + (sfx === 'ed' ? 'ped' : sfx === 'ing' ? 'ping' : sfx ?? ''))
    .replace(/\bClick(ed|ing|s)?\b/g, (_m, sfx: string | undefined) => 'Tap' + (sfx === 'ed' ? 'ped' : sfx === 'ing' ? 'ping' : sfx ?? ''));
}

/** Short labels under the tool icons in the mobile tool strip (English keys, translated where shown). */
export const TOOL_SHORT: Record<string, string> = {
  inspect: 'Select', dmm: 'Meter', iron: 'Iron', wick: 'Wick', flip180: 'Rotate', jumper: 'Jumper',
  knife: 'Cutter', replace: 'Parts', freeze: 'Freeze', ipa: 'IPA', hotair: 'Hot air', rosin: 'Rosin',
  scope: 'Scope', press: 'Press', extract: 'Extract', shunt: 'Shunt', staple: 'Staple', decoat: 'Uncoat', coat: 'Coat', padfix: 'New pad',
};

/** What each tool does, in one short line for the phone (the desktop shows `TOOLS[].tip` on hover). */
export const TOOL_TIP_PHONE: Record<string, string> = {
  dmm: 'Tap pads to probe. Tap a probe tag on the meter to switch red / black.',
  iron: 'Tap a joint to reflow it, or a gap to bridge it.',
  wick: 'Tap a solder bridge, jumper or part to remove it.',
  flip180: 'Tap a part to turn it round.',
  jumper: 'Tap the start, then the end (works across sides).',
  knife: 'Tap a copper trace to cut it.',
  replace: 'Tap a part to swap or fit one in the Inspector.',
  freeze: 'Tap to frost an area: the hot part defrosts first.',
  ipa: 'Tap to wet an area: the hottest part dries first. Cleans residue.',
  hotair: 'Tap for 3 s of 400 °C hot air.',
  rosin: 'Tap to coat with rosin: it melts first on a hot part.',
  scope: 'Tap a net to clip the scope probe on.',
  press: 'Tap to press the board and find cracked joints.',
  extract: 'Hold on a through-hole joint to suck its solder out.',
  shunt: 'Tap a through-hole pad to clip a heat sink on its lead.',
  staple: 'Tap the conductor on one side of a break, then the other.',
  decoat: 'Tap a part to take the conformal coating off its leads.',
  coat: 'Tap a part to put conformal coating back on.',
  padfix: 'Tap a lifted pad to replace it with a new pad and eyelet.',
};

/**
 * First sentence of a message and the rest (phone toasts show the lead, "More" shows the rest).
 * Only messages over ~90 characters, and only at a sentence end followed by a capital / digit, after at least 24 characters, so
 * "3.3 V", "e.g. x" and short openers ("Done.") stay whole.
 */
export function splitLead(msg: string): { lead: string; rest: string } {
  if (msg.length <= 90) return { lead: msg, rest: '' }; // about two lines on a phone: show it all
  const m = /^(.{24,}?[.!?])\s+(?=[\p{Lu}0-9"“«(])([\s\S]+)$/u.exec(msg);
  return m ? { lead: m[1], rest: m[2] } : { lead: msg, rest: '' };
}
