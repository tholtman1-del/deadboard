---
name: DEADBOARD
description: Board-level repair trainer. Bring dead boards back.
colors:
  bench-black: "#090c0a"
  surface: "#0f1311"
  surface-2: "#141916"
  surface-3: "#1a201c"
  float: "rgba(15, 19, 17, 0.96)"
  terminal-well: "#050806"
  hairline: "#222a25"
  hairline-strong: "#2e3832"
  control-edge: "#5f6c64"
  text: "#e3eae5"
  text-2: "#aeb9b1"
  muted: "#7d8a82"
  phosphor-green: "#4be38a"
  phosphor-hover: "#6cf0a3"
  phosphor-ink: "#04140a"
  phosphor-weak: "rgba(75, 227, 138, 0.12)"
  phosphor-line: "rgba(75, 227, 138, 0.45)"
  terminal-text: "#b9f5cf"
  ok: "#34c77b"
  ok-weak: "rgba(52, 199, 123, 0.12)"
  ok-line: "rgba(52, 199, 123, 0.35)"
  warn: "#f2b33d"
  warn-weak: "rgba(242, 179, 61, 0.12)"
  warn-line: "rgba(242, 179, 61, 0.38)"
  danger: "#ff5f57"
  danger-text: "#ff8a84"
  danger-weak: "rgba(255, 95, 87, 0.12)"
  danger-line: "rgba(255, 95, 87, 0.38)"
  level-high: "#ff8a3d"
  probe-black: "#d4d6db"
  scope-yellow: "#f5d547"
  supply-volts: "#7ee787"
  supply-amber: "#ffa657"
typography:
  display:
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace"
    fontSize: "clamp(40px, 6.4vw, 72px)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace"
    fontSize: "clamp(28px, 3.6vw, 40px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  wordmark:
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.14em"
  readout:
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "'tnum'"
  title:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  body-page:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  data:
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.06em"
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  frame: "12px"
  pill: "999px"
spacing:
  2xs: "2px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
components:
  button:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "28px"
  button-hover:
    backgroundColor: "{colors.surface-3}"
  button-primary:
    backgroundColor: "{colors.phosphor-green}"
    textColor: "{colors.phosphor-ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "28px"
  button-primary-hover:
    backgroundColor: "{colors.phosphor-hover}"
  button-active:
    backgroundColor: "{colors.phosphor-weak}"
    textColor: "{colors.text}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
  button-lg:
    padding: "0 20px"
    height: "40px"
  button-page-primary:
    backgroundColor: "{colors.phosphor-green}"
    textColor: "{colors.phosphor-ink}"
    rounded: "{rounded.lg}"
    padding: "0 18px"
    height: "44px"
  tool-button:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    size: "34px"
  tool-button-active:
    backgroundColor: "{colors.phosphor-weak}"
    textColor: "{colors.phosphor-green}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "0 10px"
    height: "40px"
  tab-active:
    textColor: "{colors.text}"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "28px"
  badge:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.sm}"
    padding: "0 7px"
    height: "20px"
  badge-pass:
    backgroundColor: "{colors.ok-weak}"
    textColor: "{colors.phosphor-green}"
  badge-fail:
    backgroundColor: "{colors.danger-weak}"
    textColor: "{colors.danger-text}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  chip-on:
    backgroundColor: "{colors.phosphor-weak}"
    textColor: "{colors.phosphor-green}"
  instrument-window:
    backgroundColor: "{colors.float}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
  modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
  terminal:
    backgroundColor: "{colors.terminal-well}"
    textColor: "{colors.terminal-text}"
    rounded: "{rounded.xl}"
    padding: "22px 24px"
---

# Design System: DEADBOARD

## Overview

**Creative North Star: "The Calibrated Instrument"**

DEADBOARD looks like a piece of test equipment that tells the truth. Every surface is a
readout or a control: labelled, ruled, exact, with nothing decorative. The board on the bench
is the brightest object on screen. Around it the chrome sits in four green-tinted near-blacks
separated by 1px hairlines, the way a front panel is divided by engraved lines rather than
raised boxes. Values come in monospace with their unit, labels in small uppercase, and
explanations in plain Inter.

Density stays high on every screen size. Controls are compact (28px), text is small but
high-contrast, and the side panel reads like a spec sheet: titled sections, key/value lists,
ruled objective rows. The bench is an operating surface, so the only colour that means "brand"
is Phosphor Green. The ok/warn/danger status colours and the instrument signal colours (probe
red, scope yellow, supply volts green, supply amber, the thermal ramp) mean what they mean on a
real bench and are never decoration. The public pages (homepage, learn pages, docs) share the
same tokens at reading scale: larger mono headlines, 16px body, a faint 32px PCB grid behind the
page.

The personality comes from precision and a few earned details, not ornament: the blinking block
cursor after the wordmark, tabular-figure readouts, a terminal well that prints real output,
level numbers banded like CVSS scores. DEADBOARD must never drift toward gamer RGB and neon
glows, toward cartoon kids' education (mascots, bubbly shapes, confetti), or toward Hollywood
hacker theatre (matrix rain, glitch effects, fake terminals that don't show real data).

**Key Characteristics:**
- Dark and green-tinted, with four tonal steps from back to front and 1px hairlines for structure.
- One brand accent, Phosphor Green, used for active state, primary action, focus and the brand signal only.
- Two families: JetBrains Mono for the brand, readings, values and headlines; Inter for interface and explanation.
- Compact everywhere: 28px controls, 11–13px interface text, instrument density on phones too.
- Flat by default; a shadow means the element floats over the board.
- Every number carries its unit; estimated values are labelled as estimates.

## Colors

A near-black bench tinted toward green, one phosphor accent, and a separate set of instrument
and status colours that keep their bench meaning.

### Primary
- **Phosphor Green** (`phosphor-green`): the one brand accent. It is used for the wordmark cursor
  and the mark's trace, the primary action (Run tests, Fix your first board), the active tool, the
  selected chip, focus outlines, eyebrows and links on reading pages. As a fill it always carries
  **Phosphor Ink** (`phosphor-ink`) text, never white. **Phosphor Hover** (`phosphor-hover`) is
  its hover step. **Phosphor Weak** (`phosphor-weak`) and **Phosphor Line** (`phosphor-line`) are
  its tinted fill and border for active and selected states.

### Neutral
- **Bench Black** (`bench-black`): the page and the board viewport background.
- **Surface** (`surface`): the top bar, the tool dock, the side panel, the status bar, modals.
- **Surface 2** (`surface-2`): inset content (buttons, inputs, objective rows, hint items,
  picker cards).
- **Surface 3** (`surface-3`): hover states, tooltips, menus, the selected segment of a segmented
  control.
- **Float** (`float`): bench windows that sit over the board (tutorial card, meter, supply),
  nearly opaque so the board never shows through text.
- **Terminal Well** (`terminal-well`): deeper than the page, used only for terminal output and
  code blocks, with **Terminal Text** (`terminal-text`) as its pale phosphor ink.
- **Hairline** (`hairline`) and **Hairline Strong** (`hairline-strong`): 1px dividers and
  borders; the strong step for floating windows, tooltips and chips.
- **Control Edge** (`control-edge`): the border of text fields and the search box, the one
  place where a hairline is the only thing showing where a control is. It is 3:1 against every
  surface (WCAG 1.4.11).
- **Text** (`text`), **Text 2** (`text-2`) and **Muted** (`muted`): primary, secondary and
  tertiary text. All three pass AA on every surface (Muted is the tightest at 4.6:1 on
  Surface 3).

### Status
- **OK** (`ok`), **Warn** (`warn`), **Danger** (`danger`): passed checks, cautions, failures and
  the low / medium / critical level bands. Each has a `-weak` fill and a `-line` border for badges
  and rows. **Danger Text** (`danger-text`) is the lighter red for failure text inside a danger
  badge.
- **Level High** (`level-high`): the orange "High" level band between Warn and Danger. It is
  currently hard-coded in the board picker.

### Instrument signals
- **Probe Red** (the Danger value), **Probe Black** (`probe-black`), **Scope Yellow**
  (`scope-yellow`), **Supply Volts** (`supply-volts`), **Supply Amber** (`supply-amber`) and the
  thermal ramp mean the same things they mean on a real bench. They mark probes, traces and
  supply readings, and are not brand colours.

### Named Rules
**The One Voice Rule.** Phosphor Green is the only brand colour. Use it where something is
active, primary, focused or alive. If two things on a screen are green, one of them is probably
wrong.

**The Bench Meaning Rule.** Instrument and status colours mean what they mean on a real bench.
Never use Scope Yellow for emphasis, Danger for a brand moment or Supply Amber as a warning. When
colour carries information, add a second cue: a label, a value or a shape.

## Typography

**Display Font:** JetBrains Mono Variable (with ui-monospace, Menlo, Consolas)
**Body Font:** Inter Variable (with -apple-system, Segoe UI, Roboto)
**Label/Mono Font:** JetBrains Mono for values, readings, net and part names, keys and code

**Character:** Mono is the instrument's voice: the wordmark, the readouts and the big headlines.
Inter is the technician explaining what to do next. Both are bundled, with no third-party font
requests.

### Hierarchy
- **Display** (700, `clamp(40px, 6.4vw, 72px)`, line height 1.04, letter spacing −0.035em, mono):
  the homepage hero line only.
- **Headline** (700, `clamp(28px, 3.6vw, 40px)`, line height 1.15, mono): section headings on the
  homepage; docs h1 and h2 use the same face at `clamp(32px, 4.6vw, 48px)` and
  `clamp(22px, 2.6vw, 28px)`.
- **Wordmark** (700, 13px in the bench and 15px on pages, +0.14em tracking, uppercase, mono),
  followed by the block cursor.
- **Readout** (500, 26px, line height 1.1, tabular figures, mono): the multimeter value and
  supply readings. The number is always followed by its unit.
- **Title** (600, 14–15px, Inter): side-panel board name, modal titles, picker card titles. The
  picker hero goes up to 24px.
- **Body** (400, 13px, line height 1.4, Inter): bench interface text. Explanatory text in panels
  uses 12–12.5px at line height 1.5–1.55 in Text 2.
- **Body Page** (400, 16px, line height 1.6, Inter): homepage and learn pages. Ledes go up to
  19px. Docs prose uses line height 1.7, with a 780px measure.
- **Data** (400, 11.5–12px, mono): key/value values, net names, status-bar values, the probe
  tags.
- **Label** (600, 11px, +0.06em, UPPERCASE, Inter): section titles (OBJECTIVES, WALKTHROUGH),
  window headers (BENCH SUPPLY), tutorial step labels.

### Named Rules
**The Unit Rule.** A value is never shown without its unit, and values are always set in mono
with tabular figures so readings don't jitter as they change.

**The Fold Rule.** On phones, text is shortened or folded (a short lede, a collapsible card),
never just shrunk. 11px is the floor for any text that has to be read.

## Layout

The bench is a fixed application grid: a 44px top bar, a 48px tool dock on the left, the board
viewport, a resizable side panel (340px by default, collapsible) and a 26px status bar. Bench
windows (tutorial card, meter, supply) float over the viewport and can be dragged.

On touch devices the layout becomes a portrait stack: a 48px top bar, the board, a 62px tool
strip at the bottom and the panel as a bottom sheet. In landscape the strip moves left and the
panel becomes a right-hand drawer. Safe-area insets are respected. The density stays the same as
on desktop, and only the key actions and floating view buttons get 44px targets.

Spacing runs on a tight 2px-step scale: 4, 6, 8, 10 and 12px gaps inside components, 16px
section padding in panels, and 24px between large blocks. The public pages centre content in a
1160px column with 16px minimum gutters, 88px between sections, and switch from one to two
columns at 720px and 980px. On phones (under 640px) the navigation collapses to the language
switch and the primary button, and the lede switches to its short version.

**The Spec Sheet Rule.** Lists of things (instruments, objectives, properties) are ruled rows
with a hairline between them, not floating cards. A card is used only when it is something you
pick.

## Elevation & Depth

The interface is flat at rest. Structure comes from the four tonal steps (Bench Black → Surface →
Surface 2 → Surface 3) and 1px hairlines. Shadows are reserved for objects that float over the
board or the page: bench windows, toasts, menus, tooltips, modals and the homepage's screenshot
frame. They are dark and soft, never coloured.

### Shadow Vocabulary
- **Window** (`box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35)`): the multimeter and toasts.
- **Coach** (`box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45)`): the tutorial card and similar bench
  windows.
- **Menu** (`box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5)`): dropdown menus and popovers.
- **Modal** (`box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55)`): dialogs over the 60% black backdrop.
- **Inset ring** (`box-shadow: inset 0 0 0 1px var(--border-strong)`): the selected segment in a
  segmented control, without adding height.

### Named Rules
**The Floats-Only Rule.** A shadow means "this sits over the board". Panels, rows and cards that
live in the layout get no shadow; they use a tonal step and a hairline instead.

## Shapes

Corners are small and consistent, like machined panels. **6px** (`md`) is the default for
buttons, inputs, rows, toasts and tooltips. **4px** (`sm`) is for badges, keycaps and the inner
segments of segmented controls. **8px** (`lg`) is for floating bench windows and menus. **10px**
(`xl`) is for modals, picker cards and the 44px touch buttons. **12px** (`frame`) is reserved for
the homepage's large framed screenshot and callouts. Pills (`999px`) are only for filter chips and
tags, and dots are only for status. Level numbers sit in 4px square-cornered boxes tinted with
their band colour. Borders are always 1px; a 2px line marks only the active tab underline and
progress bars.

## Components

### Buttons
Compact, labelled and quiet until they matter.
- **Shape:** gently squared (6px), 28px tall, 10px horizontal padding, 12px/500 Inter, icon gap
  6px. There is a 26px small size, a 40px large size for the picker's main action, and a 44px
  page size (8px radius, 15px/600) on the homepage.
- **Default:** Surface 2 fill, Hairline border, Text label. Hover steps up to Surface 3 with a
  Hairline Strong border.
- **Primary:** Phosphor Green fill, Phosphor Ink label, weight 600. Hover moves to Phosphor
  Hover. At most one per view region.
- **Active (toggled):** Phosphor Weak fill, Phosphor Green border.
- **Ghost:** transparent, Text 2 label; for secondary toolbar actions.
- **Warn / Danger:** the weak fill with its line border and a Text label, never a solid red
  button.
- **Disabled:** 45% opacity with a not-allowed cursor.
- **Focus:** a 2px Phosphor Green outline, offset 2px, on every interactive element.

### Tool dock
The bench's signature rail. Icon buttons are 34px square with a 6px radius. At rest they are
transparent with a Muted icon; on hover they go to Surface 3 and Text. The active tool gets a
Phosphor Weak fill, a Phosphor Line border and a Phosphor Green icon. A tiny mono keycap digit
sits in the corner, the tooltip appears to the right in Surface 3, and a 7px green dot marks a
newly unlocked tool.

### Tabs and segmented controls
- **Panel tabs:** 40px tall, 12.5px/500, Muted at rest. The active tab gets Text plus a 2px Text
  underline.
- **Segmented control:** a Bench Black track with a hairline border and 2px padding. The selected
  segment is Surface 3 with an inset Hairline Strong ring.

### Chips and badges
- **Badge:** 20px tall, 4px radius, 11px/500, Surface 3 with a hairline. The pass, fail and warn
  variants use the weak fill, the line border and the status text colour. The info variant is
  mono.
- **Chip:** a pill with a Hairline Strong border and Text 2 at 12px. Selected or new chips switch
  to Phosphor Weak, Phosphor Line and Phosphor Green.
- **Level badge:** a mono 700 number in a 4px box, tinted 16% with its band colour and given a
  45% ring (OK for low, Warn for medium, Level High, Danger for critical). It is followed by the
  band name in the same colour, so the colour is never the only cue.

### Cards / Containers
- **Panel sections:** not cards. 16px padding, a hairline underneath and an uppercase Label
  title.
- **Rows** (objectives, hint items, list buttons): Surface 2, a 1px hairline, a 6px radius and
  8×10px padding. A pass or fail row changes only its border to OK Line or Danger Line.
- **Picker cards:** Surface 2, a 10px radius and a 10px pad, with a 16:10 board picture in a 6px
  frame. On hover they step to Surface 3 with Hairline Strong and the picture scales 1.03. The
  "Today" hero card carries a Phosphor Line border.
- **Callouts** (coach notes, "honest numbers"): a full 1px Phosphor Line border on a Phosphor Weak
  fill. Never a coloured side stripe.

### Inputs / Fields
- **Style:** 28px tall, Surface 2, a 1px hairline, a 6px radius, 8px padding, a Phosphor Green
  caret. On touch the search field grows to 44px with 16px text, so iOS doesn't zoom.
- **Edge:** text fields and the search box use Control Edge (3:1 on every surface); hover
  steps up to Muted. Selects keep the Hairline, because their text and chevron already identify
  them.
- **Focus:** the border turns Phosphor Green; keyboard focus adds the 2px outline at offset 0.

### Navigation
- **Bench top bar:** 44px on Surface with a bottom hairline. The mark sits in the 48px column
  above the dock, then the wordmark, the board switcher, view segmented controls, then status,
  the primary action and icon buttons; secondary settings sit in the ⚙ menu.
- **Page nav:** sticky, Bench Black at 86% with an 8px backdrop blur and a bottom hairline. Links
  are 14px Text 2 and turn Text on hover; the current page is in Phosphor Green. There is a
  language segmented switch (EN/RU) and a small primary button. On phones only the switch and the
  primary button remain.
- **Status bar:** 26px, 11.5px Muted labels with mono Text 2 values, a 6px status dot, and keycaps
  for shortcuts.

### Instrument windows
The multimeter, the bench supply and the tutorial card float over the board on the Float
surface with a Hairline Strong border, an 8px radius and a Window or Coach shadow. The header is
an uppercase Label strip that doubles as the drag handle. The body holds the Readout in mono with
its unit and a Muted caption beneath. The meter's footer splits into probe tags: a 6px dot in
Probe Red or Probe Black next to the mono net name.

### Board cursor
The keyboard's way onto the board. The board view is one Tab stop (a "Skip to the board" link is
the bench's first Tab stop) with a 2px Phosphor Green outline inside the viewport edge while
focused. The cursor is a ring of ten pale phosphor dashes on a dark halo, lifted above any part
body under it and sized with the zoom, so it reads on green, red or black boards. It is steady:
no pulse, no motion. Arrow keys jump between pads, vias, parts, blobs, jumper ends and points
along traces in the direction they point on screen; Shift+arrows move 0.5 mm; Enter uses the tool
as a click would. A polite live region says what is under it.

**The Drawn-Only Rule.** The cursor names only what the renderer draws (blobs, jumpers, empty
footprints, dull joints). A fault the board does not show is never named; it is found by measuring.

### Board picker Library
On desktop the Library is a ruled list, not a card grid: picture (96px) · level badge · name over
symptom (the line people scan) · what is new for this player · solved check. Each level band has a
sticky heading; within a band with more than one board type, uppercase Label subheads (Tutorial,
Hand-made, …) group the rows. The selected row takes Phosphor Weak. Phones keep the compact
rows. In the details drawer, "You'll use" is a line of text ("New for you:" in Phosphor Green, then
the rest in Text 2), not a wall of chips.

### Pads list
In the Inspector, each component lists its pads as ruled rows: the pad name in mono Text, its
net in mono Text 2, and two small buttons, **Red** and **Black**, each led by a 7px dot in Probe
Red or Probe Black. A pressed button takes the Active style. This is the meter without a pointer
(keyboard and screen reader), and on a phone a sure hit on pads too small to tap.

### Terminal well
On the homepage and in docs code blocks: Terminal Well background, a Hairline Strong border, a
10px radius, mono 14px at line height 1.75 in Terminal Text. Commands are in Text, OK results in
Phosphor Green bold, dim lines in Muted, and a blinking █ ends a finished log. It only ever shows
output the app really produces.

### Toasts
A 320px stack at the top right of the viewport. Surface, a 6px radius and the Window shadow,
12px text, with a 0.16s fade-and-drop entrance. The kind (info, OK, Warn, Danger) shows as a
7px status dot on the first line and a full border in that kind's line colour. The stack is a
polite live region, so screen readers read each toast.

## Do's and Don'ts

### Do:
- **Do** keep Phosphor Green for active, primary, focused or alive states, and put Phosphor Ink
  text on it (`#04140a` on `#4be38a`, 11.4:1).
- **Do** separate layout regions with a tonal step plus a 1px hairline; save shadows for
  elements that float over the board.
- **Do** set every value in JetBrains Mono with tabular figures, followed by its unit (`3.00 V`,
  `317 mA`), and name parts and nets exactly (`R7788`, `PP3V3_S5`).
- **Do** keep controls compact (28px default, 26px small) on every screen size, give key actions
  and floating view buttons 44px on touch, and never go below 24px for anything tappable.
- **Do** pair colour-coded information with a second cue: the level number with its band name,
  a pass badge with its label, a probe dot with its net.
- **Do** show focus with the 2px Phosphor Green outline on every interactive element, and give
  every icon-only control a name and every toggle its pressed or selected state.
- **Do** stop the cursor blink, the smooth scroll and decorative transitions under
  `prefers-reduced-motion`.
- **Do** change tokens only in `src/ui/tokens.css`, which both the bench and the website import,
  and keep `docs/BRAND.md` in step with it.

### Don't:
- **Don't** add glows, neon gradients, RGB lighting or "cyber" HUD chrome. The brand guide
  already bans glows and gradients on the mark, and the same goes for the interface.
- **Don't** use mascots, bubbly shapes, confetti or primary-colour gamification. Successes are
  short dry lines ("All checks green. The board is alive."), not celebrations.
- **Don't** fake hacker theatre: no matrix rain, no glitch effects, no terminals printing output
  the app didn't produce.
- **Don't** put white text on Phosphor Green, or recolour the mark's trace.
- **Don't** use instrument colours (Scope Yellow, Supply Amber, Probe Red) as decoration or as
  general emphasis.
- **Don't** use a coloured side stripe as an accent on cards, callouts or rows; use a full 1px
  border with a tinted fill instead.
- **Don't** shrink text to make it fit on phones; shorten it or fold it. On the phone tool strip,
  a tool is as wide as its label and the strip fades at the edge where more tools scroll in.
- **Don't** bind a board shortcut to Tab or Space on a focused control; Tab moves focus, and
  single-key shortcuts must stay switchable off (Settings → Key shortcuts).
- **Don't** wrap ruled lists (instruments, objectives, properties) in floating cards.
