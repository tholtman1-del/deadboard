# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The same static build also feeds a desktop (Electron) app and an iOS app. These wrap the website
and do not change its design language. Both apps are on hold.

## Users

**Primary: learners and schools.** Students, hobbyists and classrooms learning board-level
electronics repair from zero. Many play on low-end phones, in short sessions, and most of them are
novices. They work up a learning path (levels 0.0–10.0) from hand-made concept boards to real
open-hardware mainboards.

**Secondary: professionals.** Repair technicians and training centres. They are the credibility
audience: what a technician would recognise as real has to hold up, and the open-hardware boards
are where learners end up.

**Also:** challenge authors and modders, who build, share and mod repair puzzles (CTF-style
flags, `.pcbfix.json`, `deadboard-mod/1` packs).

## Product Purpose

DEADBOARD puts a broken board on a simulated bench and gives the player the tools a repair
technician uses. The player probes, reasons, reworks and proves the fix. The point is that someone
who has never held a multimeter can learn real diagnostic reasoning safely, for free, in a
browser.

Success means a learner who returns by choice and moves up the path, and who could apply the same
reasoning to a real board. Raw time on site is not the goal, and no dark patterns are used to get
it.

## Positioning

- **Real simulation.** A SPICE-style solver runs the circuit, so the meter reads what the circuit
  really does, not a scripted answer. Numbers are honest: every model value has a source, and
  estimated or synthesized values are labelled as such.
- **Free, open, private.** Apache-2.0, free everywhere, no ads, no paid tiers, no accounts.
  Analytics are anonymous (no IDs, cookies or IPs) and exist only to improve learning. Funding comes
  from grants, donations and sponsors.

## Operating Context

- **Surfaces:** the bench (`app.html`), the homepage (`index.html`), the learn pages and
  curriculum (`learn*.html`), the boardview & KiCad viewer (`boardview.html`), the mod docs pages
  (rendered from `docs/`), the public stats page (`stats.html`), privacy, and the Russian landing
  page (`ru.html`).
- **Core loop:** pick a board (Today: up next / daily repair / your path, or the Library sorted by
  level), diagnose with the instruments, rework, then pass the test-bench objectives with the
  circuit back to its reference design.
- **Bench vocabulary:** parts and nets by designator and name (`R7788`, `PP3V3_S5`), readings with
  their units (`317 mA`). Instrument colours keep their bench meaning (probe red, scope yellow,
  supply volts green, supply amps amber, thermal ramp) and are not brand colours.
- **Adaptive difficulty is hidden.** No visible rating and no jump messages. The Library still
  shows every puzzle with its level, and any puzzle can be picked directly.
- **Teaching:** players learn by playing. Reading and video are the last resort, and coach help is
  reviewed, pre-made data, not a live LLM.

## Capabilities and Constraints

- **Instruments:** multimeter (V, Ω, diode, capacitance, current in series), bench supply with a
  current limit, oscilloscope, thermal camera, freeze spray, IPA, rosin.
- **Rework:** iron, hot air, wick, trace cutter, jumper wire, fitting new parts. Joints can be cold,
  pads can lift, and bridges happen.
- **Boards:** hand-made training and concept boards. KiCad, boardview (`.brd`, `.tvw`) and
  `.pcbfix.json` import. MNT Reform 2 and Antmicro Jetson baseboard as open-hardware demos.
- **Challenges:** encrypted flags unlock from the repaired board's topology. There is an Author tab,
  a problem generator with endless practice, and a daily repair (the same seeded puzzle for
  everyone, worldwide).
- **Mods:** data mods (never run code) and sandboxed, experimental code mods, with a community
  catalogue and mod.io.
- **Rendering:** WebGPU with a WebGL2 fallback. It has to run on low-end phones with touch.
- **Stack constraints:** TypeScript and Vite, no framework, no backend. A static site on GitHub
  Pages (deadboard.org).
- **Languages:** English and Russian. All UI text goes through `t()`, and Russian must stay
  complete.
- **Phones:** text is shortened or folded on phones, never just shrunk.
- **No new analytics events** without the maintainer's OK and a `docs/PRIVACY.md` update.

## Brand Commitments

Name, logo, colour tokens, type and voice are set in `docs/BRAND.md`. They are binding unless a
redesign replaces them on purpose:

- **Name:** DEADBOARD. **Tagline:** *Bring dead boards back.* **Descriptor:** board-level repair
  trainer.
- **Logo:** the mark (a board outline with a flatlined trace that spikes back to life, ending in a
  via) and the wordmark with a phosphor-green block cursor.
- **Voice:** precise like a technician, terse like a terminal, with the occasional dry joke. Lead
  with the fact and its unit, say what to do next, and never fake certainty. Humour goes in
  successes and empty states, never in error details.
- **Kept for compatibility:** `pcbfix/1`, `.pcbfix.json`, `pcbfix_*` storage keys and `PCB{…}`
  flags.

Note: BRAND.md's audience line ("professional core … playful challenge edge") predates the
learners-and-schools decision recorded above. This file takes precedence on audience.

## Evidence on Hand

- **Showcase:** `docs/media/deadboard-showcase.gif` and a 1-minute MP4 on GitHub releases.
- **Walkthrough videos:** "how to approach" and spoiler-gated solution videos for each premade
  scene, recorded from the real app.
- **Public stats page:** anonymous attempt data with a fitted level per puzzle.
- **Usage:** about 500 daily players (2026-11-21).
- **Open-hardware demos:** licences and credits in `NOTICE` and `public/demos/NOTICE.txt`.
- **Coach knowledge-pack RFC:** by Biga73; credit them on work that comes from it.
- **Absent, so never fabricate:** testimonials, school or training-centre adoptions, press,
  partner logos, endorsements (MNT, NVIDIA and Espressif are trademarks, and no endorsement is
  implied), learning-outcome claims, and user counts beyond the measured stats.

## Product Principles

1. **Real or labelled.** Nothing on screen claims more certainty than the simulation has.
2. **Teach by doing.** Every surface moves the learner toward a probe on a board. Explanation comes
   second.
3. **The cheapest phone is the target device.** Performance, touch and text that fits are product
   requirements, not polish.
4. **Free and private by construction.** No accounts, ads, paywalls or data harvesting, and no
   pattern that leans toward any of them.
5. **Universal, not board-specific.** Features and models work for any board. Quirks belong to a
   scenario's data.

## Accessibility & Inclusion

- **Target: WCAG 2.2 AA** for the UI chrome (text contrast, focus visibility, keyboard operation,
  target size, labels). The board render and instrument colours keep their bench meaning. Where
  colour carries the information, add a second cue (a label, a value, a shape).
- **Reduced motion** is honoured, and the wordmark cursor goes static.
- **Bilingual UI** (EN/RU). Layouts must survive longer Russian strings.
- **Low-end phones and touch** are first-class: small screens, slow GPUs, coarse pointers.
