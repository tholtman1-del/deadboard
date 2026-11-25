# DEADBOARD — handoff (updated end of 2026-11-24: design pass live — PRODUCT.md / DESIGN.md, keyboard + screen-reader bench, picker list, lesson pointer, learner homepage; next: read the data from 11-27)

Goal: make DEADBOARD (formerly PCB//FIX) a realistic board-repair trainer, as close to a real bench as possible,
**universal** (any board, not just the MacBook), with honest provenance for every value.
No reference hardware is available, so realism is validated against *design intent*
(schematic/BOM values, rail names, datasheets) and physics checks — not measurements.

## Status (start here)

- **High-reliability soldering track: Phase 1 pushed (`8fb70ba`, live); Phase 2 (`fd53b00`) and
  lessons 6–16 (`4d036fd` … ) committed locally, NOT pushed (the auto-mode
  permission check refused `git push`; the user pushes, or allows it).** A separate learning path after NEETS Module 14 (NAVEDTRA 14186, Navy 2M
  soldering; Distribution A, public domain). Research and the 3-phase plan: `ideas/navy-2m-soldering.md`
  (local only). User's choices: lesson card + original text before, workmanship debrief + the module's
  review questions after, realism applies to every board in realistic rework (track forces it), phases.
  - **Physics (universal):** `src/thermal.ts` — through-hole joints are their own nodes (pad copper,
    barrel, solder, lead stub; iron heats the joint, body warms only through the lead,
    `THT` constants), pads in a same-net pour conduct into it (`pourConductance`), and in-plane
    conductivity is per cell from the copper actually there (`copperThickness`: pours, traces, pads,
    inner layers; pins-only boardviews keep the old uniform 35 W/mK). The plane-sink heuristic
    (GND-named nets) now applies only to pins-only boards; drawn boards use `hiddenCopperNets`.
    `src/rework.ts` — alloys with solidus/liquidus (`SN63` 183, `SN60` 183–188, `SAC305` 217–220:
    **the old 217 °C liquidus was the solidus**; lead-free plane pads in realistic rework now take
    ~5.7 s at 350 °C), `limitsFor(alloy)`, joint episodes (molten time, peak, flux) + event log kept
    across undo (`ReworkHistory`), rosin flux residue (`state.fluxResidue`, cleaned by IPA,
    `src/residue.ts`), `wetted` event, flux reaches parts by pad position (it used to need the part
    origin within 2 mm: THT resistor joints never got the station's flux).
  - **Inspection:** `src/workmanship.ts` — rules quoted from NEETS with page (lifted pad, overheated /
    cracked part, dull joint, flux residue, loose solder, long heating > 3 s = note, wire repair = note).
  - **Lessons:** `src/lessons/neets14.ts` (points, numbers °F + °C, figure, verbatim original paragraphs
    in English, task, station, graded rules, review questions with the module's answers);
    figures `public/lessons/neets14/` (3-16 thermal shunt for Phase 2, 3-17 preferred joint).
    UI `src/ui/lesson-ui.ts`; app: lesson dialog on load, inspection dialog after a fix, Overview card,
    Today strip "High-reliability soldering", Library type "Soldering track". Progress =
    `pcbfix_track_accepted` (works + passes inspection), separate from solved.
  - **Hold-to-solder** in realistic rework (mouse, touch, Enter): the tip stays while held, readout
    "R1.2 · 1.4 s · molten"; rosin tool also fluxes joints in realistic mode.
  - **Boards** `src/scenarios/soldering.ts`: `hr-solder-flux`, `hr-heat-time` (GND pour), `hr-clean-inspect`
    (63/37, 330 Ω, THT). Board-notes example mod 1.6.0 has their packs; thumbs rendered.
  - Checked end-to-end in Chrome (lessons 1 and 3: brief → hold iron → inspection Rejected for flux →
    IPA → Accepted; picker strip; phone brief). `test/soldering.test.ts` new; all suites pass (solve's
    pickAt timing still flaky). App chunk +14.5 KB gz (lesson text).
  - **Known limits / estimates:** THT joints reach liquidus almost at once (small joint mass); a pour
    shows as a lower peak, not a slower melt. Not calibrated to measurements.
  - **Phase 2 (desoldering + thermal shunt):** `state.holes` per THT pad ('clear' = empty hole, lead
    loose → also cold; 'sweat' = sweat joint, conducts, still holds); `ReworkMonitor.extract(c, pad,
    'wick' | 'plunger' | 'vacuum')` per NEETS 3-15..3-18 (wick: plated hole stays full; plunger: sweat
    joint + 15 % pad lift, estimate; continuous vacuum: clear after 0.6 s molten, estimate);
    `feedSolder` (station "+ flux" = flux-cored solder) fills an empty hole; a THT part comes out only
    with every hole clear (heat-and-pull refused), a new one goes in with leads unsoldered — also via
    the Inspector buttons in realistic rework (`benchAllows`, `leadsUnsoldered`). Pad overheat timer
    now resets per heating (was cumulative: a desolder + resolder lifted pads). Thermal shunt
    (`state.shunts`, `SHUNT` clip mass at lead midpoint): Q1 body 112 → 45 °C for a 3 s joint.
    Tools: Solder extractor (X; Bench → Extractor: continuous vacuum / manual plunger, vacuum is a
    hold), Thermal shunt (S). Rules `no-shunt`, `skip-pattern` (procedural: shown/graded only where a
    lesson teaches them); inspection shows the part-body peak. Boards `hr-desoldering` (burnt R2),
    `hr-thermal-shunt` (Q1 cold base + collector, transistor switch with TP1/TP2). «Where to look?» is
    hidden on lesson boards and they are left out of its recall tests (resistive joints at J1 / Q1
    ranked 4th there; an engine limit, not fixed). Played end to end in Chrome (both Accepted).
  - **Lessons 6–8 (2026-11-25):** 6 Skipping Pattern — `hr-skipping-pattern`, a DIP-16 resistor
    network (devicelib gained `res` units + Bourns 4116R-2-331, unverified; `Builder.dip`), pins 1–4
    cold; the `skip-pattern` rule fails 1,2,3,4 and passes 2,4,1,3. 7 Conductor Repair —
    `hr-conductor-repair`, cut track + 50 % nick (`Board.nicks`); Clinched staple tool (K) =
    `Jumper.kind 'staple'`, drawn per fig. 3-24; solder bridge / wire work but fail, staples pass;
    `nick` rule (> 1/10 of the width). 8 Conformal Coating — `hr-conformal-coating`, thin
    polyurethane (`Board.coating`); `src/coating.ts` = NEETS Table 3-1 as data (ranks, * identifies,
    footnotes A–F), rebuilt as a table in the lesson card; tools Coating removal (U, method in Bench)
    and Conformal coating (J, type in Bench); iron on coating chars it (`coatCharred`); rules
    charred / missing / mismatch / gentlest-method. Lesson grading is now simply "graded = fails".
  - **Lesson 9 ESD (2026-11-25):** `src/esd.ts` = Table 3-2 as data (bench worker 6,000 V dry /
    100 V humid), thresholds MOS 35 V / bipolar + diodes 3,000 V; fitting a sensitive part ungrounded
    (`afterFit`, every Inspector install) ruptures a MOS gate (G–S leak 100 Ω, estimate) or marks a
    bipolar part degraded (latent); Bench: ESD protection (strap) + Humidity, a lesson can preset them
    (`Lesson.bench`). Rules `esd-damage`, `esd-handling` (procedural). Board `hr-esd` (2N7000 switch,
    Q1 missing; devicelib gained 2N7000, unverified). Table 3-2 rebuilt in the lesson card.
  - **Lessons 10–11 (2026-11-25):** 10 Pad Repair — `hr-pad-repair` (R2 pad 2 lifted); Pad repair
    tool (E): new pad + eyelet (`state.padRepaired`, drawn as the eyelet flange), the lead then needs
    soldering; the inspection now flags any lifted pad left on the board (state, not only events).
    11 Final Practical — `hr-final-practical`: the transistor switch (`transistorSwitchBoard`, shared
    with lesson 5) under thin acrylic, Q1 burnt, a 40 % nick on the collector run, dry air, strap
    off; every rule graded. Episodes heating a burnt part (`dead`) need no shunt. A test plays the
    whole practical through on the model.
  - **Lesson data split:** `src/lessons/track.ts` (`LESSON_META`, `lessonMeta`: board, title,
    station, bench, grades: what the bench needs at once) and `src/lessons/neets14.ts` (the text,
    its own 15 KB-gz chunk loaded with the first lesson dialog). App chunk 249 KB gz (was 226 before
    the track, 263 with the text inline).
  - **2M manuals read (2026-11-25):** the user saved both to `ideas/manuals/` (git-excluded); both
    are **Distribution A**. Certification manual Appendix C = the miniature recertification
    practical (coating ID 4 of 5 + removal, wires on pierced tab / turret-hook / solder cup, surface
    patch laminate, full-clinch axial part, pad + flat-set eyelet, 14/16-pin DIP; all graded to the
    T.O. incl. 05-6.1 solder acceptability and 05-6.2 cleanliness). Applied: SN60 liquidus 188 →
    191 °C (T.O. 05-7.1.1); every rule can cite the T.O. too (`Rule.also`, shown as "NEETS 14, p. …
    · T.O. 00-25-259, …"); nick limit 10 % → 20 % (T.O. 12-6.1, NEETS said 1/10); new rules
    `overheated-joint` (reject: molten ≥ 6 s or a 3rd reflow of the same solder → `state.oxidized`,
    dull fillet; cleared only by extracting and fresh solder; thresholds are estimates, the T.O.
    05-4.2.5/6 gives none) and `slow-melt` (procedural: no melt in 3 s, T.O. 03-5.4); station option
    316 °C (600 °F, the T.O.'s starting point for tin-lead).
  - **Coating identification + final practical per Appendix C (2026-11-25):** 9 Coating
    Identification — `hr-coating-id` (thin epoxy, not named; R1 pad 1 cold). `src/coating.ts`
    gained the T.O.'s five types (`ID_TYPES` AR/ER/SR/UR/XY) and the three tests (`COAT_TESTS`
    press / alcohol / heat ≤ 361 °F, `observe()` = the manual's descriptions 06-4.2.1–5); Coating
    test tool (Q, test in Bench), Bench "Identified as" sets `board.coatingId` (undoable); removing
    before identifying marks `coatRemovedBlind`. Rules `coating-id` (wrong type) and
    `coating-id-order` (procedural: removed before identifying); Figure 06-1 rebuilt as a flowchart
    in the card. The track is now 12 lessons. 12 Final Practical rebuilt after the 2M performance
    test: `dipNetworkBoard` (shared with lesson 6) under unidentified hard polyurethane, RN1 (DIP-16)
    burnt with pin 1's pad lifted + cold, a 40 % nick on the +5V run; station 316 °C, dry air, strap
    off. Identify → remove → extract 16 joints in a skipping pattern → pad repair → new DIP → nick
    staple → clean → recoat. Burn scorch now follows the part outline (renderer). Lesson text quotes
    the certification manual (`CERT_SOURCE`, NAVSEA TE000-AA-MAN-010/2M).
  - **Wires on terminals (2026-11-25), lessons 12–14 before the final practical (track: 15):**
    `src/terminals.ts` (universal): terminals are THT parts with body shape `turret` / `hook` / `tab`
    / `cup` (`Builder.terminal`, refs E1…); a hook-up wire is `Jumper.kind 'wire'` with `ends`
    (stripper, strip length, tinned, clearance kept when forming, wrap, flush cut, hook position,
    through the eye; `soldered` 'ok' | 'starved'). An end conducts only once soldered
    (connectivity). The rework monitor solders the ends on a terminal joint when it melts: fresh
    solder fed → 'ok', none → 'starved' (event `wire-starved`). `form()` measures the end
    (clearance, contact °, cut end; cup: depth 2.5 mm, estimate), `judge()` = the T.O.'s
    target / acceptable / defect for 08-5.3, 08-6.3, 08-6.4, 08-6.5–6.7, 08-6.12, 09-6.1. Wire
    M22759/16-22 (19×34, 0.76 / 1.32 mm, Glenair table); post sizes are estimates. Rules
    `wire-strip` (procedural), `wire-tinning`, `wire-clearance`, `wire-forming`, `wire-solder`;
    the debrief has a wire-end table. Tool Hook-up wire (W) opens a prep dialog per end with a
    to-scale drawing and what a scale reads (src/ui/wire-ui.ts). Boards `hr-turret` (E2 two-wire),
    `hr-hook-tab` (two-wire hook), `hr-solder-cup`; lesson text from the T.O., NEETS 14 fig. 3-8
    and Q6/Q8, NEETS **Module 4** (NAVEDTRA 14176, Distribution A) Q1/Q22/Q23/Q33 (`module: 4`).
    **Model change, all boards:** oxidation ("long") and the long-heating note now count the tip's
    *dwell* on a molten joint (`JointEpisode.dwell`), not the whole molten time: a brass terminal
    stays molten ~6–10 s after a correct 1.6 s touch, which is cooling, not overheating.
    Test: `test/terminals.test.ts` (checks + the three boards played through, starved and sloppy fail).
  - **Final practical wired (2026-11-25):** +5V from J1 lands on turret E1; the DIP's supply run is
    split (VBUS1 from hook E2 for pins 16/15, VBUS2 from pierced tab E3 for pins 14/13); the
    practical starts without the two wires: a double wire on the turret and a single wire on a
    pierced tab, as Appendix C lists them. Wire rules graded; label moved to the top edge
    (`dipNetworkBoard(label, wired)`; lesson 6 unchanged). board-notes 1.16.0.
  - **Clinched leads (2026-11-25), lesson 15 `hr-clinched-leads` (track: 16):** `src/clinch.ts`
    (universal): `ComponentState.clinch` per pad (style semi / full, length in pad diameters,
    along the lead-side conductor or not), `surfaceWicked`. The extractor refuses a clinched lead
    (event `clinched`; the vacuum tip is refused before heating); the wick takes its surface solder
    (→ `surfaceWicked`); Lead pliers (L) `straighten()`: freed after wicking, else the pad tears off
    (lifted). Bench → Lead termination / Clinched length / Clinch direction set how a fitted part's
    leads end (`afterFit` → `clinchFitted`; default straight-through, so other boards are
    unchanged). Rules `clinch` (07-6.17 / 07-6.18, NEETS p. 3-22: length ½–2 pad diameters,
    along the conductor, no full clinch on an isolated pad) and `termination-style` (07-5.5: like
    the original, compared with the reference). Board: `ledRows(…, resBottom)` routes the
    resistor runs on B (via from the bus); R1/R2 full-clinched, R2 burnt. NEETS fig. 3-5 (the scan
    labels both views "(A)", said in the caption), Q7 + Q18. Test `test/clinch.test.ts`.
    Not modelled: the 1/16 in clearance of a semi-clinch to neighbours, clinch angle (always 45/90).
  - **Burned laminate (2026-11-25), lesson 16 `hr-laminate` (track: 17):** `src/laminate.ts`
    (universal): `Board.burns` (centre, radius, char depth as a share of the thickness, the part
    above, `leakOhms`). The char leaks across that part's first two pads (its own `state.leak`, so
    SPICE models it and the flag's topology token `R!L` locks the flag until the char is gone);
    `applyLeak` puts it back when a part is fitted over an unrepaired burn (`afterFit`).
    Laminate repair tool (A) → dialog in two stages with a to-scale cross-section (height ×2):
    excavation (depth 25/50/75/100 %, diameter, straight wall, undercut %, bevel × thickness),
    then fill and finish (bubble-free, overfill, cure, level, buttercoat); refused while a part
    sits over the burn (11-5.2 step 5). `judgeBurn` = 11-6.1 – 11-6.4; rules `laminate-burn`,
    `laminate-excavation`, `epoxy-fill`, `buttercoat`. Board: R2 burned open over a 4 mm burn,
    40 % deep, 4.7 kΩ (estimate: charred FR-4 varies widely; chosen so D2 stays under the 2 mA
    lit threshold with R2 open), SPICE solver. NEETS fig. 3-29, Q32 + Q33. `io/format.ts` now
    keeps burns and clinch state. Test `test/laminate.test.ts`.
    Every Appendix C (miniature) project now has a lesson.
  - **Final practical complete (2026-11-25):** the wired DIP board also carries a power indicator:
    R5 (330 Ω, full-clinched along bottom runs from a via on VBUS2) and green D5. On the practical
    R5 is burned open over a 4 mm burn (4.7 kΩ char): coating off, free the clinched leads, patch the
    laminate, refit clinched, recoat. Every Appendix C miniature project is now on the card; par 52.
  - **Solder volume on new joints (2026-11-25, all boards):** `rework.ts` `FEED_RATE` (1 ideal fill
    per second of feeding into a molten joint with the tip on it; estimate) and `FILL_LIMITS`
    (pad 0.75, plated hole 1, excess 2). Only joints made in an empty hole are graded
    (`state.solderFill`, set when the hole fills, grows while fed; cleared by extraction, new
    parts, removal); reflowed factory joints keep theirs. Rules `solder-insufficient` (07-6.20,
    NEETS p. 3-24) and `solder-excess` (05-4.2.10, 05-6.1), graded in every lesson; the iron's
    readout shows "fill … %", the renderer sizes the fillet (thin / full / convex ball). Desoldering
    lesson gained the point. Wire terminals keep their own ok / starved model.
  - **Next from the manuals:** icicles (05-4.2.12: lifting the iron before the solder, or reflowing
    without flux), pinholes / blowholes; two-wire rules (overlap, alternating directions on a hook) are not modelled (the tool stacks
    wires); bifurcated terminals (08-6.8); resistive tweezers for cups; remaining 05-6.1 defects
    need a solder-volume model (convex fillet, icicles, solder balls).
  - **Follow-ups:** flat packs (3-29)
    and TO-5 cans (3-27) need new footprints; read the 2M certification manual + T.O. 00-25-259
    (the user downloads them) and compare the practical's grading with ours.

- **NEXT SESSION — START HERE (written end of 2026-11-24).** All code up to `c789ba5` is pushed and
  live; the local `.claude/` folder (skills, settings) is untracked on purpose, never commit it.
  - **What happened on 11-24 (design pass with the Impeccable skill, in this order):**
    1. `PRODUCT.md` (product truth, user's answers): primary users = **learners and schools**
       (technicians / training centres secondary; this supersedes BRAND.md's older audience line);
       positioning = **real simulation + free / open / private**; target **WCAG 2.2 AA**.
    2. `DESIGN.md` + `.impeccable/design.json`: "The Calibrated Instrument" (user's pick); never
       gamer-RGB, kids-edu or Hollywood-hacker; flat, shadows only for things floating over the board;
       controls compact everywhere. Tokens now live in **`src/ui/tokens.css`** (bench + site import it).
       Named rules: One Voice, Bench Meaning, Unit, Fold, Spec Sheet, Floats-Only, Drawn-Only.
    3. Audit 14/20 → fixes → 18/20 (reports are local only in `.impeccable/audit/`, git-ignored).
    4. Commits: `f9fa133` docs records · `0b5d92b` keyboard + screen-reader bench, tokens, picker list
       (live 14:34 UTC) · `2b57c87` lesson pointer + simpler First Light step 1 · `c789ba5` learner
       homepage (live **15:57 UTC** — use this as the cut-off when comparing data).
  - **Behaviour players notice now:** 2D/3D is **V** (Tab moves focus); ⚙ Settings → Key shortcuts
    on/off (`pcbfix_key_shortcuts`, local only); "Skip to the board" link; the board view is a Tab
    stop with a **board cursor** (`src/ui/boardcursor.ts`; arrows jump between pads/traces/parts/
    blobs, Shift+arrows 0.5 mm, Enter = the tool, Shift+Enter = black probe, Esc cancels a jumper; it
    names **only what the renderer draws** — user's fairness rule); Inspector → component → **Pads**
    with Red/Black probe buttons; dialogs get focus and trap Tab; toasts, readings and "Board fixed"
    are announced; desktop **Library is a ruled list** (grouped by type within level bands); lesson
    steps get a **green label pinned over their target** on the board until done; homepage hero =
    the **playable flashlight teaser on every screen** (3D MNT hero and `src/home/board3d.ts` removed),
    sections `hero · path · bench · faults · boards ("Make your own") · final`.
  - **Data read 11-24 (baseline, before the 15:57 UTC changes):** homepage (`home left`, 11-23
    10:30 → 11-24 14:40, 410 visits): away 33 % (phones 35 %, laptops 32 %), to bench 50 %, to a
    page 10 %, laptops 74 % never left the hero. Bench (`bench left early`, 2 days): 311 of 768 bench
    loads left within a minute without a tool (phones 141/301, desktop 170/467; 266 had the bench up;
    176 on step 1). Collector (D1, 2 days): First Light fixed 35 % desktop / 20 % phone, left 40 % /
    66 %; first visit desktop tool 59 % → tests 48 % → fixed 35 %, phone 56 % → 34 % → 20 %. HARD
    (fixed < 30 %): ESP32 DevKit-LiPo 19 %, ESP32-C3 DevKit 15 %, ESP32-C3 Rust 25 %, MNT 5 %.
    Cloudflare collector healthy (1,571 records 11-23; cap 15,000/day; summary rebuilt every 6 h).
  - **Next session, first:** read the data from **11-27** (cleaner than 11-26; the changes went live
    11-24 15:57 UTC): `npm run umami -- home --days 2` (note `seen` value `path` replaces `bootlog`;
    if the first call errors with "Uncaught", run it again once the Umami Chrome window is up),
    `npm run umami -- values "bench left early" reached --days 2` (and `step`, `layout`),
    `npm run attempts-report -- --days 2 --by layout`. Compare with the baseline above. No A/B (user).
  - **Then, depending on the numbers:**
    - First minute still leaking (step 1 exits not down): next candidates, not built — a calmer
      first screen on the very first visit (side panel folded until step 2), or the teaser press on
      the homepage carrying over so step 1 is already done.
    - The HARD open-hardware puzzles (ESP32 boards, MNT) need a look (help ladder, level, notes).
  - **Open items / decisions on record:** "For teachers" homepage section = **not yet** (user, until
    real classroom use); grid/list toggle in the Library = **no** (list only); board cursor does not
    reach X-ray inner layers and has no one-key board summary (open, not asked for yet); touch
    gestures were only emulated, never tried on a real phone; main app chunk 186 KB gz (splitting
    measured and declined: importers are needed by the mod loader at boot).
  - `test/solve.test.ts` "100x pickAt" (25 ms budget, needs `test/private`) is flaky on this machine
    on HEAD too (25.4–30 ms in some runs); not caused by the design pass. Run it alone to confirm.
  - **Working with the skill next time:** `/impeccable` commands read `PRODUCT.md` + `DESIGN.md`;
    run `/impeccable audit` to re-score, `/impeccable critique <target>` for a design review. Its
    detector also runs as a hook after UI edits (one recorded ignore: `side-tab` in
    `src/ui/styles.css`, the landscape drawer's hairline edge).

- **Earlier — end of 2026-11-23 (the session before the design pass).** Session of 2026-11-23 is fully pushed and live
  (last code commit `ef0bf0c`, deployed ~16:55 UTC). It was an analytics + engagement day, plus a
  board-drawing fix round in the afternoon and a renderer crash fix (next bullets); nothing of the earlier learning-journey
  work (below) changed. **First job: read the data, change nothing until then**
  (user: "gather analytics first").
  - **Afternoon 11-23: real boards drawn right (pushed `a57d0aa`, `353d527`; live).** Found while
    making the one-week Reddit video (user: Tadpole buttons "stretched", "pins not aligned",
    Olimex "multiple things overlaying").
    - **Importer (kicad.ts `inferBody`):** through-hole bodies sit over their pins (`body.off` = pad
      centre; KiCad puts the origin on pin 1: Tadpole buttons were 2 mm off, MNT J24 14 mm). One-row
      switches (microswitches) are long and cover every pin. `Fiducial*` footprints get body
      `'none'`; `TESTPAD` footprints are test points. J_BENCH (benchSupply.ts) has body `'none'`;
      pick.ts, rework.ts and the renderer skip `'none'` bodies; thermal `partsIn` honours `body.off`.
    - **Connectivity:** abutting pads of one footprint on the same net join (USB-C A4/B9 VBUS on the
      Tadpole V2 split once pads had their real size); bbox checks and the grid query have 1e-6 slack
      (exactly-touching copper was skipped by rounding).
    - **Renderer:** `dense` = > 150 parts **or > 0.5 parts/cm²** (ESP32 boards 3–5, Tadpole V2 0.8,
      teaching boards ≤ 0.3), so small real boards get names inside bodies with collision culling.
      Layer heights: tracks top +0.055 < silkscreen `SILK_Z` 0.05 (0.04–0.06) < SMD pads top +0.065.
      Reversed bodies turn in place over their pads (TO-92 keeps its swing). Long switches: small
      rectangular plunger, dark name on the plate beside it. Header pins show above the housing only
      when every pad is drilled (or no drill data, boardviews).
    - **Demos rebuilt** (`npx tsx scripts/build-demos.ts --fetch`); this also brought the real pad
      sizes of `c17f6c8` into the shipped files. Every demo: faulted fails, repaired passes + flag;
      conductor / named-net counts unchanged. `test/modphase6.test.ts`: MNT U9 netsNear at 0.3 mm
      (real 0.25 mm gap). Thumbs re-rendered. Full `npm test` + build green.
    - **Left as is:** Olimex silk "www.olimex.comn" is in Olimex's own file; in 2D a header's pads
      cross its name (BAT1) and a switch body covers its pins; boardview importers (brd.ts / tvw) not
      checked for the same pin-1-origin offset.
  - **Evening 11-23: "GPUBufferUsage is not defined" fixed (pushed `ef0bf0c`; live, checked in the
    served `renderer-CxRaaMxt.js`).** Players' console showed `Uncaught ReferenceError:
    GPUBufferUsage is not defined` from `renderer-*.js`. Cause: `gpu-webgpu.ts` read
    `GPUBufferUsage` at module top level; `renderer.ts` imports it statically, so every browser
    without WebGPU (Firefox, older Safari, WebGPU blocked) crashed on load and never reached the
    WebGL2 fallback of `52de4b3` (likely a blank board). Now `vertexUsage()` reads it at buffer
    creation. Guard: end of `test/camera.test.ts` imports `gpu-webgpu`, `gpu-webgl2`, `gpuprobe` in
    Node (no GPU globals); it fails without the fix. **Next:** in the analytics, look for a jump in
    first-board loads on Firefox / Safari after 11-23 17:00 UTC, and whether error-screen / leave
    events drop. Since the WebGL2 path was effectively unreachable for these players until now, watch
    feedback for WebGL2-only rendering bugs. Flaky: `solve.test.ts:475` (100× pickAt < 25 ms) failed
    once in the full run, passed alone.
  - **11-24: design pass with the impeccable skill (commit `985c3d4`).** Bench: primary-button
    hover was blue (pre-rebrand leftover), now green; the top bar collapses in steps so every
    control fits down to 900 px (EN + RU; it overflowed from 1100 px); the first desktop fit used the
    camera's default aspect and cropped the board; `clearView` now runs on desktop too (tutorial
    card + readouts, a readout only if the board keeps 60 %, cut chosen for the biggest board) and
    the fit follows overlays while the camera is untouched (`camSig` vs `autoFrameCam`). Palette
    tokens for focus rings, selection, scrollbars, floating cards. Site: no "> label" eyebrows over
    headings, instrument cards → ruled spec list, tinted full borders instead of side stripes.
    **Watch:** whether the smaller first-board framing at ~1024 px reads well; analytics on
    tutorial step 1 completion before/after.
  - **Launch, 11-23 (local only, `launch/`, git-excluded):** one-week Reddit post = "Post 4" in
    `launch/reddit-posts.md` (short, human tone, highlights only; user: "don't need to state
    everything"). Video `launch/deadboard-week1.mp4` (39 s, 1080p, no audio; hook "1 week · 132
    commits" from frame 1; scenes: new boards, picker, probe, phone + Russian, mods → Community →
    mod.io, outro). Re-record: `npx vite --port 5199`, then `npx tsx launch/week1-video.ts`
    (`--shots` rehearses). Not posted yet as far as this session knows.
  - **Live since 11-23, where it lives:**
    | What | Where |
    | --- | --- |
    | Own anonymous puzzle stats: one record per attempt, website only, no IDs / IPs, EU D1 | `src/attempts/` (record, client, difficulty, summary), `collector/` (Cloudflare Worker `deadboard-stats` at https://stats.deadboard.org, D1 `deadboard-attempts`, README with deploy + reads) |
    | Public stats page, summary rebuilt every 6 h (groups < 10 hidden, fitted "Real" level) | https://deadboard.org/stats.html, `src/home/stats.ts`, `GET /v1/summary` |
    | Hidden difficulty system: private level estimate on the device picks Today / Next repair (≈ 70 % success) | `src/scenarios/adaptive.ts`, `todayPicks(…, skill)` in catalog.ts, app.ts `beginRated` / `rateAttempt` |
    | Fitted levels shipped to the game daily (Pages build + cron 04:30 UTC) and **shown to players** once known | `scripts/fetch-levels.ts` → `public/fitted-levels.json`, `shownLevel` / `levelFromPlayers` (catalog.ts); `boardLevel` stays hand-set (records carry it) |
    | Bench UX: lesson tool dock + "More tools", task-first lessons ("Why?"), solution video after real work, "Board fixed" banner, "Next repair" card, Author tab after the lessons | app.ts `updateToolDock`, `celebrate`, `nextRepairHtml`, `triedEnough`, `authorShown`; `LESSON_TOOLS` / `lessonDock` in tutorial.ts |
    | Homepage: beginner hero, playable phone teaser, rich `home left` (see the homepage entry below) | `index.html`, `src/home/main.ts` |
    | Umami: free plan only. Keeps page views, `home left`, `bench ready` / `failed` / `error`, `bench left early`, `mod installed`, active 1 / 5 / 15 / 60 min. Removed (collector has them): tutorial step / closed / finished, first tool, tests run, board fixed, problem generated, `/board/<id>` views | `src/analytics.ts`, docs/PRIVACY.md |
  - **Reads, in this order:**
    1. `npm run umami -- home` → homepage exits by device (`exit` = to · deepest section · touched),
       compare with the baseline in the homepage entry below.
    2. deadboard.org/stats.html first-visit funnel + `npm run attempts-report -- --by layout` →
       effect of the bench UX rounds; flags per puzzle.
    3. `npm run attempts-difficulty` → checkpoint 2 (needs ≈ 60 engaged attempts; a puzzle needs 20
       for a "Real" level and the scale needs 3 such puzzles).
    4. `npm run umami -- events --days 30` → Umami budget (estimate ≈ 70k/month, cap 100k).
  - **Needs on this machine:** Cloudflare login for wrangler (done 11-23; `npx wrangler login` again
    if it expired); Umami login kept in `~/.deadboard/umami-profile` (`npm run umami` opens Chrome on
    port 9333 and waits for a login if needed). The old scratchpad profiles are temporary.
  - **Decided by the user 11-23:** no player input anywhere (stuck / too hard are inferred); Umami
    only on its free plan; players see fitted levels; DEADBOARD-only analytics (no generic product
    yet); website collects, apps stay "Data Not Collected" (opt-in via Apple's Product Improvement
    exception only if ever needed); homepage is its own workstream; **no A/B test for now.**
  - **Watch out:** D1 Free fails queries above 100k rows written/day until midnight UTC (one record ≈ 5
    rows; Worker `DAILY_CAP` 15000); Worker CPU limit 10 ms (summary fits on puzzle × band totals);
    GitHub pauses the daily scheduled Pages build after 60 days without repo activity;
    `attempts-compare` only covers the morning of 11-23 (Umami lost the puzzle events after that).
  - **Possible next work after the reads:** whatever the numbers point at (e.g. a puzzle flagged HARD,
    phones dropping after the first tool, homepage exits at the hero); later: richer adaptive picks
    (generated follow-ups at the right level), the part card / debrief / pick-by-spec from E.
  - **Issues + feedback check (end of 11-23, pushed `a48002f`):** no open GitHub issues left.
    - **#5 closed:** Biga73's **local-coach 1.6.1** taken exactly as sent (zip = Mods → Submit
      `.feedback/20261122133548-24c789`, identical; code read: network only localhost +
      `https://openrouter.ai`, key in memory only). Zip + Community list rebuilt; the only other
      change is the permission line in `test/modphase6.test.ts`. Comment posted: in, but **not a
      default** (local-first, low-end phones, no board data sent by default; opt-in example code
      mod). **User: "no further implementation".** Deliberately NOT taken: their `CODE_MODS.md`
      "Connecting a local model" patch (issue comment; applies cleanly) and the app-side fix they
      describe: `renderModPanelsTab` keeps `panelInputs` drafts after submit, so a submitted input
      (e.g. a pasted key) is drawn back into the field (a real bug, a few lines in `act`, app.ts
      ~1291). `CODE_MODS.md` still describes the coach as 1.0.0 (local only). Pick up only if asked.
    - **Feedback form:** 72 reports, nothing new after 11-22. The one not yet in this file
      (`7a1ca1`, 11-21): *"more challenges that are not real boards … real boards are too
      intimidating for a beginner"*, which backs the planned **1–2 in-between boards** (see the 11-21
      feedback entry) / concept boards of the learning-journey plan.
    - Watch out: when a `npm test` suite fails inside the coach block, its fake server stays open and
      the chain hangs; kill the `tsx test/modphase6` process.

- **Homepage round (2026-11-23, its own workstream).** Baseline before it (Umami `home left`,
  11-21 10:00 → 11-23): 638 homepage exits, 54 % to the bench, 41 % away; phones 54 % away
  (147/275) vs laptops 32 %; 40 % of exits < 5 s; 74 % without scrolling; Google 64 % to bench.
  Shipped: beginner-first hero copy ("Find the fault … first repair takes two minutes", "Fix your
  first board", "Free · no sign-up · runs in your browser · beginners welcome"), secondary button
  → learn.html; phones (≤ 820 px) get a playable SVG teaser instead of the 3D board picture (tap
  SW1 → LED stays dark, 0.0 mA → hero button becomes "Find the fault →"); ≤ 640 px the hero is
  ordered headline → line → teaser → button; a live "N boards fixed … last 30 days" line from the
  public summary once ≥ 100. `home left` gained seen (deepest section), touched (first input),
  via (data-cta: hero / nav / final / footer / guide), shown (LCP range), teaser (none / pressed /
  went), lang, exit (to · seen · touched), and is not sent from automated browsers.
  **Read it with `npm run umami -- home`** after ~2–3 days and compare with the baseline above.

- **Analytics direction (decided by the user, 2026-11-23).** Build our own small **attempt-record
  collector for DEADBOARD only**, optimised for this game; no generic platform for now (keep the
  record schema clean so it could be split out later). Rules: no IDs (not even a random install
  ID), no cookies, IP never stored or logged, a fixed public field list in `docs/PRIVACY.md`, no
  free text, coarse values (ranges / bands), no country or device in attempt records, raw rows
  expire (e.g. 90 days), reports hide groups < ~10, collector open source. **Website only**; the
  iOS / desktop apps stay silent ("Data Not Collected"; Umami must never run there). If app data is
  ever needed: opt-in under Apple's *Product Improvement Programs* exception (two clear buttons,
  no feature impact, setting to change, not linked to the device), or a user-sent "Share my stats"
  via the share sheet. Umami stays for website traffic for now. Goal = good engagement (flow ≈
  target solve rate, return by choice, skills learned, "felt right"), not raw time; no streak
  pressure or dark patterns. Checkpoints: (1) collector + weekly puzzle health report flags
  puzzles Umami couldn't, (2) fitted difficulty predicts solve rate better than hand-set levels,
  (3) adaptive picker beats track order in an A/B (puzzles per session / return). Stop early if
  1 or 2 don't pay off. Needs from the user: server / host choice (EU, not Hetzner) and approval
  of the field list. 11-23 Umami read: see memory / the analytics note (onboarding fixes helped:
  tutorial step 1→2 39%→52%, bench→first tool 48%→58%; bounce drop after 11-21 is an artefact of
  `home left`; ~4.6k events/day ≈ 140k/month, over the Hobby cap in December).
  **Hosting decided (user, 11-23): Cloudflare Workers + D1 (free plan) for the collector; Umami
  Cloud stays for website traffic.** **Run both in parallel first (user, 11-23):** Umami stays
  complete until the collector's numbers are checked against it (e.g. fixes per board, the First
  Light funnel); only then cut from Umami what the collector covers (`tutorial step`, `tests run`
  per board, `board fixed` per board, `first tool`, `tutorial closed`, `problem generated`, the
  `/board/<id>` virtual page views, the denser active milestones). A trim was written and tested
  on 11-23, then reverted at the user's request. Risk: ~4.6k events/day ≈ 140k/month runs over
  the Hobby cap (100k) in December; if it gets close, re-apply the trim or pay for one month.
  Read the D1 free-tier enforcement changelog (2026-09-01) before relying on the free limits.
  **deadboard.org is registered on Cloudflare (user, 11-23)**, so the zone is already there: the
  collector can run as a Worker custom domain (e.g. `stats.deadboard.org`; Cloudflare adds the DNS
  record and certificate). Don't change the GitHub Pages records. Deploy via `npx wrangler login`
  (the user clicks Allow).
  **Built and committed 11-23 (aa5407c); collector DEPLOYED 11-23** (Worker `deadboard-stats` at
  https://stats.deadboard.org/v1/attempt, D1 `deadboard-attempts` with `--jurisdiction=eu`, region EEUR;
  DAILY_CAP 15000 because one record writes ~5 rows and D1 Free fails queries above 100k writes/day
  until midnight UTC). Live checks: preflight 204, other origin 403, junk 400, GET 405. **Live since
  2026-11-23 08:10 UTC** (repo variable `ATTEMPTS_URL` set; first 5 real records after ~8 min, all
  valid). Tools (collector/README.md → Reading it): `attempts-report` (`--by`, first-visit funnel),
  `attempts-difficulty` (Rasch fit, `src/attempts/difficulty.ts`, cross-validated against the
  shown levels; needs ~60 engaged attempts), `attempts-compare` (parallel run vs Umami),
  `umami` (the Umami recipe, now in the repo; browser profile `~/.deadboard/umami-profile`).
  **Automatic public report (user, 11-23: no player input anywhere, no commands to run):**
  the collector rebuilds a public summary every 6 h (cron `47 */6 * * *`, plus the 03:17 upkeep)
  into D1 table `summary`; `GET https://stats.deadboard.org/v1/summary` (CORS *, cached 15 min,
  built on first request); `src/attempts/summary.ts` (`buildSummary`, groups < 10 → null, fitted
  levels via `fitRaschCells` on puzzle × band totals: inside the free plan's 10 ms CPU); page
  `deadboard.org/stats.html` (`src/home/stats.ts`, styles "Puzzle stats page" in home.css; phones
  fold Attempts / phone / notes / time, keep Level + Real + Fixed). Players are never asked
  anything: stuck / too hard / too easy are inferred from the record (notes, look, failed tests,
  time, fix rate). **D, first slice built 11-23:** `src/scenarios/adaptive.ts` (hidden estimate r ± u on
  the 0–10 scale, Elo/Glicko-style step, target 70 % success, help < fail: clean 1 · notes 0.6–0.85 ·
  solution video 0.4 · gave up 0; lessons weigh 0.5; stored in `pcbfix_skill`, never shown or
  sent), `todayPicks(..., skill)` (new players follow the path; unsolved lessons first while
  r < 2; else the unsolved path board nearest the target level), app.ts `beginRated` /
  `rateAttempt` (fix = always counts; giving up = another board opened after ≥ 60 s active with
  tests or moves; leaving the page = nothing). Fitted levels: `scripts/fetch-levels.ts` writes
  `public/fitted-levels.json` before every Pages build; Pages also builds daily (cron 04:30 UTC);
  the shown level is NOT changed (user decision pending: show fitted levels to players?).
  `test/adaptive.test.ts`.
  **UX round 11-23 (from a first-time walkthrough + Umami + research):** after a fix, a "Next repair"
  card is the first thing in the Overview panel (the hidden system's pick, one tap; `nextRepairHtml`);
  help ladder: "How to approach" is no longer the green primary button and "Show solution" appears
  only after real work (tests after ≥ 60 s active, or ≥ 180 s) or once solved (`triedEnough`);
  desktop lesson card shows the task first, the explanation behind "Why?" (as on phones).
  **Built 11-23 (second UX round):** tools appear as needed: on a beginner lesson, until all lessons
  are solved, the dock shows Select + `LESSON_TOOLS` up to that lesson (new ones dotted) and a "More
  tools" button (`pcbfix_all_tools`); other boards get the full dock; shortcuts always work
  (`lessonDock` in tutorial.ts, `updateToolDock` in app.ts; test in catalog.test.ts that every tool a
  lesson names is on its dock). Fix moment: `celebrate()` banner over the board ("Board fixed", time,
  moves, flag) for ~3 s, replaces the flag / "all green" toasts and clears stale hints. The phone
  homepage already opens First Light with its lesson: unchanged. **The homepage is its own
  workstream (user, 11-23): don't change it as part of bench UX work.**
  Calmer first screen: the Author tab (board editor) appears once the lessons are all solved or
  any other board is solved; always on imported / mod / blank / generated boards (`authorShown`).
  Lessons reference the Inspector, Voltage map, Top/Both/Bottom and the bench supply, so those stay.
  **Next:** measure the UX rounds with the collector (first-visit funnel on stats.html) ~11-26.
  **Next:** after ~3 days run `attempts-compare` (steady per-board ratio → cut the Umami events
  listed above) and `attempts-difficulty` (checkpoint 2). Was: record format `src/attempts/record.ts` (fields +
  `checkRecord`, shared by game and collector), tracker `src/attempts/client.ts` (one record per
  attempt: begins on `loadScenario`, ends fixed / switched / left; provisional "left" on tab hide,
  replaced via a per-attempt random token; skipped when < 10 s active and nothing done), hooks in
  `app.ts` (`startAttempts`, `puzzleInfo`, `beginAttempt`, tools / probes / moves / tests / notes /
  look / video / tutorial step), ⚙ "Puzzle stats" switch (desktop + phone sheet, RU done), collector
  `collector/` (core.ts logic, worker.ts entry — a Worker module may export only handlers;
  schema.sql; wrangler.toml with custom domain stats.deadboard.org, cron 03:17 UTC, observability
  off, DAILY_CAP 20000; README with deploy steps), `npm run attempts-report` (puzzle health,
  groups < 10 hidden), `test/attempts.test.ts` (rules, tracker, requests, real SQL on node:sqlite),
  PRIVACY.md section, Pages workflow passes `vars.ATTEMPTS_URL` as `VITE_ATTEMPTS_URL` (unset =
  nothing sent). Verified: wrangler dev + local D1 (upsert, 403 other origin, 400 junk), and the
  built game served as https://deadboard.org in headless Chrome (records on switch / hide, nothing
  after the switch is off, no page errors). **Waiting on the user:** approve the field list, then
  commit; deploy = `wrangler login` + README steps + repo variable `ATTEMPTS_URL`.
- **Earlier — 2026-11-22: workstreams A and B (since committed and live: `b444e0f`, `1b3e2ad`).** The board
  picker is now **Today + Library** (`renderBoardsModal` in `src/ui/app.ts`, styles under
  "Board picker" in `styles.css`). Data in `src/scenarios/catalog.ts`: level estimates 0.0–10.0
  per shipped board (CVSS-style bands Low / Medium / High / Critical), a symptom line for the
  hand-made boards, `teaches` tags (tools / parts / fault kinds; fault kinds of challenge boards
  stay hidden), `todayPicks()` (path order: open board or next unsolved, the one after, a
  skip-ahead ≥ 1.5 levels up). Board pictures: `public/thumbs/*.webp` from `npm run thumbs`.
  `test/catalog.test.ts` keeps catalogue, pictures and shipped boards in sync. The side panel's
  track and the Overview tab show the new level number instead of the 1–5 bars. Russian complete.
  Mockups (private artifact): https://claude.ai/artifact/QEArppfAfBi4JEqvoCxrYY.
  **Defaults taken for the user's open questions (ask again):** CVSS band words; Low stays green;
  challenge boards show only new tools/parts; no daily repair slot yet (workstream B), so no
  streak; first visit still starts First Light (the picker opens on Today when opened);
  pictures pre-rendered.
  **B. Daily repair** (`src/scenarios/daily.ts`, strip on Today, `playDaily()` in app.ts): the
  UTC date picks a board from `DAILY_POOL` (the 5 hand-made challenge boards, stepping 2 so all 5
  come up in 5 days and never twice in a row), 1–2 faults and a seed; `generateProblem` on the
  board's known-good reference with the Fast DC solver and a 120 s budget (never reached: 4 ms on
  a laptop), so every player gets the same puzzle without a server. Solved = `pcbfix_solved` has
  the daily's id. No streak, no new analytics event (it counts as "generated"). Known limit: a
  check right on a pass/fail edge could flip between JS engines (float solves); none seen.
  `test/daily.test.ts`: 20 days, rotation, determinism, fails the bench, speed.
  Also: the top-bar board badge and the board select show the level number, not L1–5.
  **E, first concept board (branch `bike-light`, on top of `learning-journey`; both local only):
  Transistor Switch** (`builtin-transistor-switch`, level 2.0, first on the challenge track): 2×AA,
  SW1 → R1 1 kΩ → Q1 2N3904 (TO-92) switching two red LEDs (68 Ω each, ≈10.6 mA; forced gain 10).
  Fault: Q1 fitted backwards (gain ≈1, LEDs glow at ≈1.2 mA). Runs on SPICE (`solver: 'spice'`; the
  fast solver has no transistor). New, universal: `Builder.to92()` (kind `generic` + device-library
  label), body shape `to92` with a footprint-fixed "D" on the silkscreen, `inlineReversal()` (a
  reversed in-line three-lead part swaps its outer leads: netlist, roles, flag topology), devicelib
  `2N3904` (unverified: numbers from MMBT3904LP, datasheet not read). «Where to look?»: `generic`
  in high-open / low-load, new `high-leak` rule, physics filters (a pull-down must lead lower, a feed
  must carry current, no `low` below 0.3 V): recall 139/139. Board notes 1.5.0 (19 packs).
  Not done yet from E's slice: part card, "What happened" debrief, pick-by-spec, teaches/needs drills.
  Next: user review, then merge `learning-journey` + `bike-light`; then the rest of E's slice, or C.
- **Earlier — late evening of 2026-11-21.** Everything is pushed. Last code
  commit `ca478ec` (issue #4: the multimeter's clear-probes button was clipped outside the
  280 px card; card now 336 px, title ellipsizes, **Esc clears probes**; no open issues left).
  The rest of the session was a **discussion with the user about the learning journey; nothing
  of it is built yet.** Ask the user which workstream to start; the suggested default is **A**.
  **iOS and desktop apps are on hold.**
  - **Decided by the user:**
    - Analytics start **without any ID or login**. Path context goes into each event instead
      (attempt # in this session, puzzles solved as a range, days since first visit as a range).
      **~500 daily players** (user, 11-21).
    - A **daily repair** (one seeded puzzle per day, the same for everyone) is wanted.
    - The **board picker is "chaotic" and needs a redesign** before the path / daily repair can
      live in it.
    - Self-hosting Umami: the user is interested (Cloud Hobby cap is 100k events/month, launch
      pace was ~130k). Not decided yet.
    - **Answered later the same evening (these override the workstreams below where they
      differ):**
      - **Levels are numbers 0.0–10.0 with colour bands, like CVSS scores** in the security
        community (e.g. 0.1–3.9 / 4.0–6.9 / 7.0–8.9 / 9.0–10.0; colours from `docs/BRAND.md`).
      - **The adaptive system stays invisible**, like Resident Evil 4's hidden difficulty: no
        player rating on screen, no "you jumped" messages, no placement tests. It quietly picks
        deeper or shallower faults, more or fewer of them, and how soon help is offered. Puzzles
        show their own level number; the player's rating is never shown. (So workstream A's
        "Your path" shows skills learned, not "Level 2 → 3".)
      - **The board view / "marketplace" always lists every puzzle with its rating**, and the
        player can open any of them directly, outside the adaptive system. The adaptive system
        only drives the recommended flow (Continue, generated follow-ups). A puzzle picked from
        the list is exactly as listed (same faults, same level number for everyone); it only
        feeds the hidden rating in the background.
      - **Teach by playing, not by watching.** Reading a note or watching a video is the last
        resort. Ideas to try: tools unlock one by one and a new one appears exactly when the
        puzzle needs it (fewer tools early); the first puzzle with a new tool is built so that
        tool is the obvious next move; tools answer at once (sound, frost, smoke, a beep) so the
        player learns from the response; wrong moves fail safely and visibly. Help ladder, in
        order: the board's design → a subtle nudge on the bench (a glow, a beep) → a one-line
        hint → the full note → a video.
      - **Abstract boards for now** (many puzzles, tuning quantity and quality); a story mode
        (a repair-shop job) maybe later. Boards named after their circuit, not a device.
      - **The agent builds most boards** from a list of circuits. The open-hardware boards are
        the **end game**; most players are expected to be novices (check with analytics), so most
        new content goes to levels ~1–5.
      - **Still 1:1 with real life**, so players can use what they learn on a real bench: real
        circuits (datasheet reference designs / app notes), real part values and packages, real
        failure modes, real meter readings (devicelib parts, honest provenance).
      - **Not Hetzner** for self-hosted Umami. Options to put to the user: another EU VPS
        (Scaleway, OVHcloud, UpCloud, netcup), DigitalOcean in an EU region, a managed platform
        (app + managed PostgreSQL), or a paid Umami Cloud plan (no server work). Check current
        prices before quoting.
    - **Still open:** a schematic view for hand-made boards; when to self-host Umami, and where.
  - **Workstreams, in the suggested order:**
    - **A. Board picker redesign** (`renderBoardsModal`, `phoneCatalogSection` in `src/ui/app.ts`).
      Today it is grouped by source (Tutorials / Challenges / Real Hardware / Mods), has no "what
      next" (the track `CHALLENGE_TRACK_IDS` lives in the side panel), mixes expert chips
      (SPICE + PWR, licences, Par, part counts) into beginner cards, and the L1–5 bars disagree
      with the track order. Plan: **Home ("Today")** = Continue (2–3 recommended puzzles; at
      first the track order + current difficulty), Daily repair slot, Your path (level, tools and
      parts learned, next to learn); **Library** = everything, filters by level / skill / device /
      source, technical chips moved into details. Phones: one column, swipeable Continue row,
      Library as filter + list; shorten text, never shrink it. **First step: a clickable mockup
      (desktop + phone, real boards) for the user to judge** before coding. Measure before/after:
      time to first board, share starting a recommended puzzle, first-session depth, day-1 return.
    - **B. Daily repair:** `src/scenarios/generate.ts` with the date as the seed; pick a board
      pool small enough to generate fast on phones (or pregenerate and ship as data).
    - **C. Attempt record + analytics** (`src/analytics.ts`; needs the user's go-ahead per event
      and a `docs/PRIVACY.md` update **in the same commit**). One record per attempt, sent on solve
      or leave: puzzle id **+ version**, difficulty estimate, player level band, outcome, active
      time range, measurements, wrong repairs, notes revealed, tools used, drills shown/skipped,
      longest pause → next action, path context (above). Saved locally too: it feeds the rating
      (D). Custom/imported boards stay "custom", no free text. Then: a weekly **puzzle health
      report** script (solve rate, time, quits, notes, actual vs predicted solve rate → flags), a
      one-tap "too easy / about right / too hard" after a solve, an "I'm stuck" button (opens help
      and records where). A/B: variant picked and stored on the device, sent with each event; at
      500/day only for early, high-traffic steps (~1,600 per arm for 50→55 %), elsewhere compare
      puzzle versions before/after. **Self-hosted Umami** (if chosen): small EU server, Docker
      (Umami + PostgreSQL) behind an HTTPS proxy at e.g. `stats.deadboard.org`, proxy access logs
      without IPs, nightly off-site `pg_dump`, auto security updates; keep Umami unmodified, build
      reports as SQL / our scripts; switch at a month start; the user rents the server and DNS.
      Keep honouring Do Not Track; don't try to get around blockers.
    - **D. Adaptive difficulty 1.0–10.0.** A puzzle = board × fault set × help. Computed
      difficulty (board: parts, nets, rails, sequencing, both sides; faults: count, hops from the
      failing check, visible vs measured-only, intermittent, masking; help: notes, guidance),
      marked as an **estimate**, later fitted from C. Player rating with uncertainty (Glicko-like)
      + sub-ratings per skill: strong early solves jump (2.0 → 5.0), struggling → more help first
      (timed note offer, where-hint, guided steps generated from the fault data via the tutorial
      step system), then smaller steps (2.1, 2.2) with fading help. Picker targets ~70 % success,
      weakest skill, novelty, fault-kind variety. Revealing a note must cost less rating than
      failing. Rough bands: 1–2 one-LED boards, visible fault, guided · 3–4 small boards, measured
      fault · 5–6 ESP32-class, rail faults, ≤ 2 · 7–8 controllers / carriers, intermittent,
      masking · 9–10 Reform/Jetson, deep power tree, multi-fault, no notes. Today:
      `meta.difficulty` is an integer 1–5 by hand; only `pcbfix_solved` is stored per player.
    - **E. Hand-made concept boards + teaching.** Players like the hand-made boards (easy to
      read). Grow complexity slowly (4 → 10 → 25 parts) to fill the jump from ~6-part boards to
      the 60-part ESP32s. One real circuit per board, original story devices: bike light
      (transistor switch), battery toy (reverse polarity, P-MOSFET), USB gadget (5 V → 3.3 V LDO),
      night light (light sensor + divider), USB fan (MOSFET + flyback), charger (small IC),
      blinker (timer, needs the scope). The same circuit again later in an SMD look. **The builder
      (`src/scenarios/builder.ts`) has no transistor, capacitor, regulator or IC**; the SPICE
      library (`src/spice/devicelib.ts`) has MOSFET / BJT models. Teaching: puzzles declare
      `teaches` / `needs` (tool:…, part:…, concept:…), at most one new thing per puzzle; a
      30-second first-use drill per tool (only tutorial tools are taught today; hot air, scope,
      freeze, rosin, press have a tooltip only), a tool library page; a **part card** (what it is ·
      how to recognise it · what it does here · how it fails · how to test it; lines 1/2/4/5 per
      part kind = universal, line 3 per board via knowledge packs, extended from rails to parts,
      with confidence; Biga73's coach RFC, credit them); labelled circuit **blocks**; a **"What
      happened" debrief** after each repair (builds on the generator's `fix` texts); **pick by
      spec** in the parts bin (3 candidates, wrong ones fail safely with an explanation).
      **Suggested first slice: the bike light** (builder transistor + transistor part card +
      teaches/needs + debrief + pick-by-spec), shown to players before scaling up.

- **Earlier — evening of 2026-11-21 (device themes; everything pushed and live, last commit
  `02855cf` + its handoff; Pages deploys checked on deadboard.org).**
  **iOS and desktop apps are on hold. Graphics cards are skipped for now (user).**
  - **Shipped today (challenge track after The Sagging Rail, in this order):**
    | Board | Lvl | Faults | Licence |
    | --- | --- | --- | --- |
    | `demo-olimex-esp32-devkit-lipo` | 2 | D1 cracked (USB diode), R4 (charger PROG) missing | Apache-2.0 |
    | `demo-rana-tadpole-v1` | 2 | U1 XC6206 output pin cracked | CERN-OHL-S |
    | `demo-olimex-esp32-c3-devkit-lipo` | 3 | C5 shorted hides R11 22 k for 49.9 k (3V3 → 4.48 V) | CERN-OHL-S |
    | `demo-esp32-c3-rust-board` | 4 | D4 cracked (runs backwards via Q1 body diode), residue on CHIP_PU (chip in reset, 0.3 mA) | CERN-OHL-P |
    | `demo-rana-tadpole-v2` | 4 | C5 on +1V1 shorted (chips warm, cap cool), SW2 NO joint cracked | CERN-OHL-S |
    then Antmicro, MNT (both **rebuilt** from pinned commits: capacitances were 0 in every shipped
    demo; Antmicro 369 parts, bench at the connector before F3). Board notes 1.4.0 has a pack per
    shipped board (18). Russian complete.
  - **Simulator / importer, all universal (details in the entries below):** chargers (CC/CV),
    chip loads from datasheets (ESP32-WROOM-32D, ESP32-C3-MINI-1, RP2040), regulators known by
    datasheet pins (3-pin LDOs, RP2040 core) and by LCSC code (KiCad "LCSC" field → `Component.lcsc`),
    changeover switches COM/NO/NC (`src/switchParts.ts`, Kailh CMI126603D08), engine false-convergence
    fix (diode current test + B-source test, as ngspice), converter / chip heat warms its part,
    thermal runaway on big pads fixed, real pad sizes (were ≥ 0.4 mm), keepouts / paste pads / NPTH
    / logos not copper or parts, "NA"/"DNP" values not fitted, battery sockets are connectors,
    bench supply clips at the most upstream input / connector, build-demos locks what it ships.
  - **mod.io is live** (game 14808, public listing). Verified on deadboard.org: Browse mod.io lists
    the Starter kit (only mod), Install opens it. Profile set: links (site, GitHub) and guide URL
    (the admin "Support URL" = API `instructions_url` → https://deadboard.org/modding.html). The
    modding guide links mod.io/g/deadboard, the tags and "bench check first" (`02855cf`).
  - **Candidates for next time:**
    1. **Umami re-read** (pending since 11-21 morning; recipe in the older entry below) — now also
       read how players use the new ESP32 / controller boards (`board fixed`, `tests run` by board).
    2. **Walkthrough videos for Antmicro and MNT:** readings may have moved (rebuild: capacitances,
       Antmicro bench before F3, 1V8 rails powered, heat on regulators). Check before re-recording.
    3. More controllers with simple buttons (external pull-ups), or model RP2040 / MCU GPIO pull-ups
       as an explicit, labelled firmware assumption (Tadpole V1 buttons use internal pull-ups).
    4. ESP32-POE (needs a PoE PD model, TX4138, TPS62A02A, ESP32-WROOM-32E sheet).
    5. Open: unpowered ICs don't clamp their pins; Wi-Fi TX peaks (350 mA) not in DC (brown-out
       challenge needs a transient load); Rust board +BATT floats with no battery; reference
       designators render large on small boards; publishing official mods (Board notes…) on mod.io
       would need the user's account.
  - **Adding a real board (checklist):** pinned entry in `scripts/build-demos.ts` (`--src` dir with
    `<demo id>` symlinks, `--only <id>`), `DEMO_REPAIRS`, `docs/calibration/<id>.csv`, `EXPECT` in
    `test/demoboards.test.ts` (parts / conductors / meter snapshot measured, not guessed), Russian
    for title / description (+ bench suffix) / hints, a board-notes pack (then `npm run
    example-mod`, restore the starter kit, `npm run community`), `public/demos/NOTICE.txt`,
    `NOTICE`, README licence line, `CHALLENGE_TRACK_IDS`. Check every partial-repair state, not only
    faulted / repaired. Datasheets: `npm run parts -- datasheets <MPN>` works without the user.
  - **Flaky:** `test/solve.test.ts` "100x pickAt" (25 ms) fails under machine load (load average
    50+ here); passes on a quiet machine. `npm test` stops at the first failure: run suites singly.

- **Earlier — device themes: real ESP32 boards (2026-11-21; all of it pushed with the evening
  publish: `ea3d2db`, `2d56da9`, `33b59b3`, `f93f389`, `da835b7`, `72e8016`, `f633497`, `c17f6c8`).** The user wants whole device themes (ESP32, game
  controllers, graphics cards…) at every difficulty, still 1:1 with real devices. Agreed order:
  real products that are open hardware first (KiCad + redistributable licence); for branded
  devices a self-drawn version of a unit you own; GPU = a "GPU-style" board from datasheet
  reference designs, labelled as such (proprietary files never ship). ESP32 → controller → GPU.
  - **Shipped (in the track after The Sagging Rail):** `demo-olimex-esp32-devkit-lipo` (L2: D1
    cracked joint + R4 PROG missing) and `demo-olimex-esp32-c3-devkit-lipo` (L3: C5 shorted hiding
    R11 22 k for 49.9 k → 4.48 V once the short is gone). Checked in the app (Playwright): both
    load from Real Hardware, bench reads 0.0 mA / 322.6 mA as simulated, no console errors.
    Then `demo-esp32-c3-rust-board` (L4, `da835b7`: D4 cracked → runs backwards through Q1's body
    diode, +5V 3.6–3.8 V; residue at C10 on CHIP_PU → ESP32 in reset, 0.3 mA with all rails up).
  - **`da835b7` also:** datasheet **chip loads** (ESP32-WROOM-32D 80 mA, ESP32-C3-MINI-1 82 mA; EN
    gated; replace the decoupling estimate on their rail); "not fitted" values (NA/…, DNP…) are DNP
    (the DevKit-LiPo had R7 "NA" fitted); pad-less footprints are not parts (Rust board 97 → 55);
    bench supply clips at the connector before a series diode; FB from datasheet pins; tied enables
    on named rails (Antmicro IC15 → 1V8_DBG).
  - **Simulator / importer fixes on the way (all universal):** keepouts, paste-only pads and NPTH
    were copper (merged nets into GND); KiCad `Net-(REF-PIN)` pin roles; unnamed converter inputs;
    EN-tied LDOs (always on, not driven by the power controller); diode-OR by A/K; buck-boost
    double switch nodes skipped; **chargers** (new kind, CC/CV, PROG open = off); battery sockets
    are connectors; a stated feedback divider is trusted; buck ≤ its input; UVLO from the nominal
    rail; **engine false convergence fixed** (diode current test + B-source value test, as ngspice;
    a C3 state solved to 44.9 V, ngspice and now ours 4.213 V); KiCad text keeps its font height.
    Antmicro demo: 1V8_SYS now powered (IC4 was never found; 0.43 V → 1.798 V, snapshot 57.2 mA).
  - **Parts from datasheets:** `npm run parts -- datasheets <MPN>` fetched them (jlcparts links,
    plain requests work). Added SY8089, HX6211A332, TP4054, BL4054B, IRLML6402, WPM2015, 1N5819.
  - **Controller theme started (`72e8016`):** `demo-rana-tadpole-v2` (L3, Rana Tadpole V2, CERN-OHL-S,
    RP2040): C5 on +1V1 shorted → RP2040 regulator at 100 mA, chips warm, cap cool. Alpakka is
    CC BY-NC-SA (no: the paid apps), PhobGCC (CERN-OHL-S) is mostly a Teensy + hall sensors (little
    to simulate). **Same commit fixed live-site bugs:** every shipped demo had capacitance 0
    (build rounding; MNT and Antmicro rebuilt from pinned commits → Antmicro 369 parts, bench at the
    connector before F3, board-notes VIN note updated); thermal runaway on big pads (Antmicro SP6 at
    4e114 °C); regulator / chip heat now warms its part. **Walkthrough videos for Antmicro (and MNT)
    may quote readings that moved: check before the next recording.** Parts by LCSC code; 3-pin LDOs
    by datasheet pins; bench supply prefers the most upstream input.
  - **Buttons (`f633497`):** changeover switches are modelled (COM–NO pressed, COM–NC released) when
    the switch library (src/switchParts.ts) knows the part from its drawing: Kailh CMI126603D08 (LCSC
    C400256). The Tadpole is now L4 with a cracked SW2 NO joint, checked pressed and released.
  - **Published 2026-11-21 ~17:55 (deploy of `bd39aaa`, checked):** deadboard.org serves all 7 demos;
    MNT's 188 capacitances are no longer 0. **mod.io is live** (game 14808 in the public listing): the
    in-app Browse mod.io tab lists the Starter kit and Install opens it (checked on the live site); the
    mod.io file equals the repo zip. Empty in the mod.io profile (user, admin page): instructions,
    instructions URL (https://deadboard.org/modding.html), other links (site, GitHub).
  - **Second controller (`Boards: Rana Tadpole V1`):** `demo-rana-tadpole-v1`, L2, cracked XC6206
    output pin. V1's buttons use RP2040 internal pull-ups (firmware), so no button faults there;
    OpenStick's RP2350 Duel has no licence file (can't ship).
  - **GPU theme (researched, not built; user: skip for now, 2026-11-21):** no open GPU board files exist (FuryGPU's are unpublished;
    vendor multiphase reference designs are proprietary). Best real stand-in: **Antmicro Kintex-7
    K410T devboard** (Apache-2.0, KiCad, github.com/antmicro/kintex-410t-devboard @ aeacd84): big
    FPGA (BGA-900) with a high-current core rail (MP8869S buck → 1.0 V), DDR3L (VRAM-like: +1V35,
    NCP51400 VTT), HDMI out, USB-C PD input (STUSB4500, LTC4412), two MPM54304 quad power modules
    (+5V/+3V3/+1V8/+1V2, inductors inside: the discovery can't see them), LM3880 sequencer. Imports
    clean since `c17f6c8` (pads were enlarged to 0.4 mm and merged 14 nets). **Needed before a fair
    challenge:** MPM54304 multi-channel model (pins per channel), NCP51400 VTT, LM3880 sequencing,
    a decision on the bench input (USB-C at 5 V without PD, or the 12–20 V PD contract), FPGA core
    load (Kintex-7 power estimator, not a datasheet table: mark as estimate).
  - **Flaky:** `test/solve.test.ts` "100x pickAt budget" (25 ms) fails ~half the runs on this Mac
    under load, also on the committed code (27–35 ms). Not touched.
  - **Open:** Unpowered ICs don't clamp their pins (TXD reads 5 V through R6 on the DevKit);
    reference designators of real parts still render large on small boards; Rust board +BATT floats
    with no battery (nothing defines it; left out of tests and calibration); Wi-Fi TX peaks (350 mA)
    not modelled in DC (a brown-out challenge needs a transient load); ESP32-POE Rev M2 has a
    +5V_USB track over R23 pad upstream. Next candidates: ESP32-POE (TPS2378, TX4138, TPS62A02A,
    ESP32-WROOM-32E needs its own sheet), then the controller theme.

- **Earlier — mod feedback round (end of 2026-11-21, pushed and live: `7207be5`, `d4fdd6e`;
  Pages deploy checked, `lookWorker` served on deadboard.org).** The default next thread is still
  the Umami re-read (next entry); ask the user. **iOS and desktop apps are on hold.**
  - **Done, from Biga73's test report on the mod updates** (Board notes, code mods, Local coach):
    1. **Rules engine** (`src/mods/rules-engine.ts` `rankCandidates`): the 5 recall misses were
       all cold joints at the supply (BT1, J1 ×4). Not pin count: the supply net (hop 0) already
       reads wrong, and downstream parts piled up 3–4 rules on symptoms that follow from it. Now
       when `firstBad === 0`, non-short / non-hot credit downstream counts ×0.5 (`follows`).
       Recall 120/120 (test now demands all; new test: cold joint at BT1 / J1 ranks first).
       low-source confirm names both terminals → `official-rules` 1.0.1.
    2. **«Where to look?»** runs in a worker (`src/mods/lookWorker.ts`, main-thread fallback);
       the `> 200` parts cap is gone. MNT Reform: ~6 s, longest frame gap 95 ms, both planted
       faults in the top 3. Result keyed on the `VerifyResult` (was: stale after a re-run).
       `referenceBoard()` caches the repaired demo (was re-cloned every render).
    3. **Plug-in API 1.1.0:** `api.board.netsNear(ref, mm)` (`netsNear` in
       `src/connectivity.ts`: nets whose copper is within mm of a part's pads, same layer,
       nearest first, gap + pad; a pad's own net skipped, the part's other pins kept; host caps
       mm at 5, no permission, names/gaps only) and `api.ui.highlight(net)` (needs `panel`;
       `gotoNet` in app.ts). `groupOf` deliberately not added (net = copper group; documented in
       CODE_MODS.md). mod-api package + docs regenerated; MOD_PLATFORM.md notes the review.
    4. **`.gitattributes`** `* text=auto eol=lf` (+ binaries): fixes the false "zip is stale" on
       Windows with `core.autocrlf=true` (reproduced: 78 CRs in mod.json). Renormalize = no change.
  - **Not verified / open:** `ui.highlight` never clicked in the app (code mods are off by
    default; only host tests + tsc). `netsNear` on a 204-pad SOM ≈ 130 ms (pours with many
    edges); fine on demand, watch it if a mod calls it in a loop. Antmicro board: «Where to
    look?» doesn't put its planted faults (U2, FB1) in the top 5 (J15 first). MNT: top hit C178
    shows Net-(U9-SW) at 0.10 Ω to ground vs 1.4e5 Ω working — odd for a missing cap + residue,
    worth a look in the shorts observation.
  - **Replies drafted in chat (the user sends them; not sent by us):**
    (a) to Biga73 on the 4 points above (all fixed; netsNear/highlight; `^1.1`; fresh clone for
    LF). (b) to the contributor proposing **`api.net.fetch`** (host-mediated fetch so a local
    Ollama accepts the request; sandbox sends `Origin: null`, Ollama 403s it by default; their
    table: only `http://localhost:5173` and `app://deadboard` origins pass). **User's decision:
    don't build it now, without saying no** — most players are on low-end phones, and the user
    prefers **pregenerated** help (knowledge-pack `patterns`, reviewed data, bench-checked) over
    live AI. The reply invites a PR for `patterns` (+ pack skeleton generator), offers a
    "Connecting a local model" note in CODE_MODS.md (their Origin table, credited) and a clearer
    local-coach error, and asks to keep the design in a GitHub Suggestion issue. Correction made
    before sending: the mod can't detect the 403 (a failed preflight is a plain network error),
    so the message should name both causes (server down / origin refused) with the Ollama
    `OLLAMA_ORIGINS=*` and LM Studio CORS settings. Nothing in the code had to change for the
    replies. They mention local-coach 1.1.1; the repo has 1.0.0 (their local copy).
  - **If they answer with a PR:** `patterns` = open RFC gap (field in knowledge packs feeding
    «Where to look?»); follow AGENTS.md "New item types / fields" steps; run the recall test.

- **Earlier START HERE (morning of 2026-11-21, all pushed and live: code `be47b52`,
  handoff after it).** Ask the user which thread; the default is the Umami re-read below.
  **iOS and desktop apps are on hold.**
  - **Live since 11-21 ~10:40 CET (deploy of `be47b52`):** First Light opens with "A broken
    flashlight" (7 steps), phone board framing clear of the lesson card / readouts, phone layout
    for Android phones with a fine pointer, WebGPU timeouts + boot screen + slow-start notice +
    start-error screen, phone homepage 3D hero on tap + 1400 px image, new events. Details in
    "Retention round" below.
  - **1. Re-read Umami (from ~11-23; compare only data after 11-21 10:40 CET).** Baseline
    (11-20 18:45 → 11-21 09:30, old version): First Light step 1 → 2 = 163 → 65 (40 % kept),
    step 2 → 8 = 65 → 45; bench ready → active 1 min lost 38 % (phones 46 %); `/app.html` →
    `bench ready` lost 19 %; home → bench lost 43 % (phones 56 %); Android phones on the desktop
    layout 28 / 60. Questions: (a) step 1 → 2 now, and `prev` done vs skipped per step;
    (b) `bench left early` by `reached` × `visible` × `layout` (loading + <5s = quick close);
    (c) `bench failed` reason `slow start` by `stage` (= hangs), `start error`, `bench error` by
    kind / tool / board; (d) `home left` on phones by `visible` / `scrolled` / `to` / `hero`;
    (e) `bench ready` layout by OS (Android desktop layout should be ~0). Then fix what they show.
  - **How to read Umami (scripts were in a session scratchpad, rebuild them):** launch
    `~/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for
    Testing.app/Contents/MacOS/Google Chrome for Testing --remote-debugging-port=9333
    --user-data-dir=<scratch>/umami-profile https://cloud.umami.is/login`; the user signs in
    (Google). Helper = Node script: GET `http://localhost:9333/json`, take the cloud.umami.is page,
    WebSocket `Runtime.evaluate` (awaitPromise, returnByValue) of a `fetch` to
    `https://gateway-eu.umami.is/api/websites/f87071cc-1be3-4f31-9d52-a80861fa7e40/<path>` with
    `Authorization: Bearer ` + `JSON.parse(localStorage['umami.auth'])` (never print the token).
    Endpoints: `stats`, `metrics?type=path|event|device|os|browser|referrer|country|screen`,
    `event-data/values?event=<name>&propertyName=<prop>` (+ filters `&device=mobile&os=…`),
    POST `/api/reports/funnel` {websiteId, type:'funnel', parameters:{startDate, endDate,
    window:60, steps:[{type:'path'|'event', value}]}, filters:{device:'mobile', …}},
    `sessions?startAt&endAt&pageSize=100&page=n` and `sessions/<id>/activity?startAt&endAt`
    (per-session event list; slow: ~1 s per session, run big loops in the background, print only
    aggregates, never ids / cities). Close the window and delete the profile afterwards.
  - **2. Event budget:** Umami Hobby = 100k events/month incl. page views; launch pace was
    ~130k/month. If the plan page shows it near the limit: thin `tutorial step` (546 in 15 h)
    and `tests run` (303) first, e.g. first run per board only, or drop once answered.
  - **3. Candidates, not started:** phone homepage hero (bench image only peeks in at the bottom
    of the first screen; fix without shrinking text), in-between regulator boards (plan with
    the user), coach RFC gaps (below). Measuring tools used on 11-21 (rebuild if needed):
    Playwright + Chrome for Testing with `Network.emulateNetworkConditions` (slow 4G) and
    `Emulation.setCPUThrottlingRate` 4 for load time; a `longtask` PerformanceObserver for
    freezes; a stubbed `window.umami` + `exposeBinding` to see exactly which events fire.

- **Earlier START HERE — end of 2026-11-21, before the retention round (last code commit `d15ec74`).**
  Ask the user which thread to continue. **iOS and desktop apps are on hold** (as below).
  - **Coach RFC by Biga73 (Andrej, GitHub Biga73) — credit him by name on anything from it.**
    His RFC (knowledge pack, query layer, fault-candidate engine, optional LLM explainer) was
    already built as mods on 11-20 (see `docs/MOD_PLATFORM.md` → "How the coach RFC fits").
    11-21: **board notes** = `examples/mods/board-notes` (`72f0f47`): a knowledge pack for all 13
    shipped boards; MNT/Antmicro set points `documented` from `docs/calibration`, enable chains and
    power-up order `derived`; no planted fault named. `test/modcontent.test.ts` holds every
    nominal / expected voltage and pin to the simulator. Fixed on the way: `staleEntries` read
    net names from pads only (built-in boards name traces) → now `boardNetNames()`.
    **Reply to Andrej:** the user has a final draft (points him to Mods → Community → Board notes,
    Submit, and asks for help with: per-board symptom → candidate `patterns`, packs by board
    fingerprint, the evaluation fault list; invites a GitHub Suggestion issue). Not sent by us.
    **Open RFC gaps:** `patterns` field + feeding «Where to look?»; skeleton pack generator;
    `api.queries.knowledge()` for code mods; fingerprints. (`copperGap` / `highlight`: done 11-21
    as API 1.1 `board.netsNear` + `ui.highlight`, after Biga73's test report; same report: cold
    joints at the supply now rank first (recall 120/120), «Where to look?» runs in a worker on any
    board size, `.gitattributes` keeps LF on Windows checkouts.)
  - **Community catalogue on deadboard.org (user chose our own page over mod.io), `12f95b7`,
    `f928235`, `d2fdfdd`.** Mods window → **Community** tab lists `public/community/index.json`
    (all example zips + reviewed player mods; size + SHA-256 checked on download; required
    catalogue mods installed first). **Submit** on an installed mod: bench check must pass,
    consent box, sent through FormSubmit (feedback route, no account); ≤ **40 KB** inline, else a
    link. Limit MEASURED on the live site: 40 KB delivered byte-identical, 52 KB / 256 KB refused
    with HTTP 500 (≈64 KB stored). **Review workflow:** `npm run feedback` saves
    `.feedback/<id>.mod.zip` → review → `npm run community -- --add <zip>` → commit + push.
    Run `npm run community` after `npm run example-mod` (and after restoring the starter kit).
    UI lazy-loaded (`src/ui/community-ui.ts`, 14 KB; main bundle 499.6 KB). Installing / removing a
    mod now redraws the open board (was: notes only after a reload). Test mods sent on 11-21
    (`submission-test-small`, `-40k`) sit in the user's inbox + `.feedback/`: not for the catalogue.
    mod.io stays a second channel (game still Hidden there).
  - **Feedback (pulled 11-21, 70 reports).** Since the WebGL2 fallback only ONE player was stuck
    (Chrome 157/Linux, no WebGL at all; left a contact) vs ~55 before. Fixed in `d15ec74`: the
    error screen is "3D graphics aren't available" with advice by cause/browser
    (`src/ui/gpuhelp.ts`, tested on real user agents). A player called the step from tutorials to
    real boards "inhumane": now a **"Next: repair challenges"** track (`CHALLENGE_TRACK_IDS` in
    `src/ui/tutorial.ts`: 5 challenges, then Antmicro, MNT) with «Where to look?» / Get board notes.
    **Next candidate (needs planning with the user):** 1–2 in-between boards (~15–40 parts with a
    regulator: enable, feedback divider, a couple of rails) between the challenges and the demos.
    Also still open from 11-19: demo-board schematics suggestion, repro.ts false flags, duplicate
    report sends.
  - **Retention round (later 11-21, from Umami: 268 visits since the first-board events).**
    First Light lost 60% between tutorial step 1 and 2 (163 → 65; 40 closed it there), after
    that 65 → 45 reach step 8. Android phones: 28 of 60 got the desktop layout (they report
    `any-pointer: fine`); iOS 0 of 26. Changed: First Light opens with **"A broken
    flashlight"** (press SW1, D1 stays dark) instead of "Anatomy of a PCB" (3D + flip; Cold Joint
    101 teaches the flip), 7 steps; phones fit the board, Locate and each new step into the part
    of the screen the lesson card and readouts leave free (`clearView` / `fitBoardInView` in
    `app.ts`, `Camera.frameIn`; follows the overlays until the player moves the camera);
    phone-sized touch screens get the phone layout even with a fine pointer (`touch.ts`).
    **The 19% of `/app.html` visits without `bench ready`:** not load time (slow 4G + 4× CPU:
    bench up in ~1.9 s, 304 KB) and not one browser/OS/country (all ~20%). Per-session activity:
    5 real `bench failed`, ~16 with one page view and nothing else (left in 1–2 s, or a silent
    hang). Added: 5 s timeouts on WebGPU requestAdapter/requestDevice (then WebGL2;
    `gpuprobe.ts` `withTimeout`), a boot screen inside `app.html`, a 10 s (visible time)
    slow-start notice with Reload / "Start with simpler graphics" that reports `bench failed`
    {reason: 'slow start', stage: boards|mods|ui|graphics}, and a start-error screen
    (`startFailed`, reason 'start error'). PRIVACY.md updated. Next read tells hang vs quick leave.
    **Homepage on phones:** 423 phone sessions landing on `/`: 205 never opened the bench, 93% of
    those under 1 active minute; iPhone and no-referrer (app links) worst. The live 3D hero froze
    a mid-range phone for ~3.5 s (one 2.9 s long task at 1.8 s) and cost 1.3 MB: phones now get
    a 1400 px screenshot (`public/home/bench-1400.jpg`, srcset) and load the 3D board on "Tap to
    turn it in 3D" (`src/home/main.ts`); no long tasks left. Desktop unchanged.
    **New events (user asked for them; PRIVACY.md updated):** `home left` {visible: <5s|5-15s|
    15-30s|30-60s|60s+, scrolled: 0–100% in quarters, to: bench|page|link out|away, hero:
    picture|tapped|live}, sent when the homepage is first hidden; `bench left early` {visible,
    reached: loading|failed|bench|tool|tests|fixed, step, layout}, only when the bench page is
    first hidden within its first visible minute (a tab switch and back counts too: cross-check
    with `active 5 min`); `bench error` {kind, tool, board}, once per load after the bench is up,
    never the message; `tutorial step` now has `prev`: done|skipped|none (was the step before
    done when Next was pressed). Helpers in `src/analytics.ts` (`visibleClock`, `onFirstHide`,
    buckets; Umami sends with keepalive). Verified with a stubbed `window.umami` in Playwright.
    **Event budget:** Hobby plan = 100k events/month incl. page views; 11-20→21 ran at ~2,850
    per 15 h (~130k/month at launch traffic). Biggest: `tutorial step`, `tests run`. Once the
    questions are answered, thin those first.
    Re-read after ~2 days: step 1 → 2 (+ prev done/skipped), `bench left early` by reached /
    visible / layout, `slow start` stages, `home left` on phones by visible / scrolled / to.
  - Earlier threads below are unchanged.

- **Previous START HERE — end of 2026-11-20 (last commit: the handoff after `7549c31`).**
  Ask the user which thread to continue. **iOS and desktop apps are on hold**: no work on them and
  no "rebuild the apps" reminders until the user brings them back.
  - **Mod platform thread (newest; phases 1–6 built and live, `03f013a` + docs `7549c31`).**
    Goal (the user's): *make forking pointless by making a mod the easier way to change anything*;
    the shipped content is official mods, anything can be added or changed from a marketplace.
    Design + phase table + security review: `docs/MOD_PLATFORM.md`; docs on the site:
    modding.html (guide), mod-reference.html, code-mods.html, mod-safety.html,
    mods-for-agents.html, `/llms.txt`; `AGENTS.md` for agents working on the repo.
    Built: `deadboard-mod/2` (requires/conflicts, semver, packs), on/off + loadouts (Official / My
    mods / custom) + safe mode (also automatic after a failed start); data items: patches (merge
    patch, conflicts, undo), knowledge packs (Overview tab), puzzles (built on known-good boards,
    `src/scenarios/reference.ts`), devices (overlay on `findDevice`, sent to the solve worker),
    fault types (10 primitives; official ranges patchable), meters (Bench → Meter), rules +
    **Where to look?** (official rules: planted part in top 3 for 115/120 faults; recall test);
    bench check (Mods window + `npm run bench-check`); code mods (**experimental, off by default**):
    plug-in API v1 (`src/mods/api/`, types → `packages/mod-api` via `npm run mod-api`), sandbox =
    opaque iframe + strict CSP + worker, mod loaded as a **classic script** (importScripts; never
    as an ES module: Chrome lets worker module loading bypass the CSP — two escapes found and
    closed, see the security review), solvers, importers (`read`), declarative panels (Mods tab),
    permissions `panel` / `storage` / `network:localhost` / `network:https://host`. Examples:
    `examples/mods/{night-light-extras,repair-lab,ideal-dc,local-coach}` (zips in
    `public/examples/`). Rarely used parts load on demand (main bundle 497 KB).
    **Next:** phase 7 = mod.io marketplace (tags Type/Tier/Official/Bench-checked, a bot that
    bench-checks uploads, in-app upload) — **waits on the user's approval**; the game is still
    Hidden on mod.io. Doable without mod.io: a "Make my version" (remix) button. Before code mods
    could be on by default: outside security review, the escape probe in Firefox + Safari, caps on
    message size / memory. Not built: Russian as a language mod (languages load before mods),
    built-in boards written out as data files, knowledge packs by board fingerprint.
    **Gotchas:** `npm run example-mod` re-locks the starter-kit challenge with a new salt — restore
    `examples/mods/starter-kit/boards/night-light-repair.pcbfix.json` and
    `public/examples/starter-kit.zip` from git unless that was the point. Generated artefacts
    (example zips, `packages/mod-api`, the docs' generated blocks via `npm run docs`) have
    freshness tests. Browser checks of the sandbox were Playwright scripts in a session scratchpad
    (escape probe, hang test, fake local LLM on 127.0.0.1:11434): rebuild them from the security
    review section if needed.
  - **Analytics thread (do first, once 1–2 days of data exist):** read the new first-board events
    to find where new players stop. Umami snapshot 2026-11-18 → 20: 1561 visitors, bounce 39%,
    avg visit 212 s; phones 901 visits (51% bounce, 126 s), laptops 837 (26%, 315 s). Funnel:
    homepage 814 → bench 503 (62%) → fixed any board 98 (19%; **phones 9%**, laptops 26%).
    Lessons 141 → 64 (≈10% lost per lesson), challenges 61 → 36, demos opened 62 / 40 but fixed
    8 / 6. Verdict: the bottleneck is the **first minutes on the bench** (phones first), not the
    number of puzzles; ~36 players ran out of built-in content; a middle tier below the demos is
    missing. Events live since `adb65b4` (each once per page load): `bench ready`
    {renderer, layout} / `bench failed` {reason}, `tutorial step` {step, of} (First Light, 8
    steps), `tutorial closed` {board, step}, `first tool` {tool, board}, `tests run`
    {board, result}. Read: bench ready vs app page views (graphics), tutorial step drop-off and
    closing step, first tool → tests run → board fixed, all split phone / desktop.
    **How to read Umami:** no API key. Open Chrome with `--remote-debugging-port` and a scratch
    profile at cloud.umami.is/login, the user signs in, capture the dashboard's `Authorization`
    header from its own requests, then query `https://gateway-eu.umami.is/api/websites/
    f87071cc-1be3-4f31-9d52-a80861fa7e40/…`: `stats`, `metrics?type=path|device|referrer|event`
    (type `path`, not `url`), `event-data/values?event=<name>&propertyName=<prop>`, and the funnel
    `POST /api/reports/funnel` {websiteId, type:'funnel', parameters:{startDate, endDate,
    steps:[{type:'path'|'event', value}], window:60}, filters}. Close the window and delete the
    profile + captured header afterwards.
  - **mod.io thread:** DEADBOARD is registered on production mod.io (https://mod.io/g/deadboard,
    game id 14808, API path `https://g-14808.modapi.io/v1`; key in `.env.local` and in the repo
    variables `MODIO_GAME_ID` / `MODIO_API_KEY` / `MODIO_API_URL`). The in-app **Browse mod.io**
    tab (Mods window) is live and verified end to end (list → Install → CDN download with
    CORS `*` → loader). First mod: **Starter kit** (mod 6541285, CC0 reuse permissions).
    Settings: no curation (mods go live after mod.io's virus scan), direct + unauthenticated
    downloads ON (the Install button needs them), per-platform files OFF (must stay off: the app
    sends no platform header). **Open:** the game is still **Hidden** on mod.io, so authors can't
    reach its upload page although the modding guide points there: the user clicks **Publish**
    on the game's admin page (or asks Claude to, after signing in again). mod.io form bug: link /
    support URL fields strip `https://` and then fail browser validation, so the game has no
    website / support links yet. Creating the game accepted mod.io's game agreement v30 on the
    user's account; publishing mods needs the user's own "I agree" tick + click (auto mode
    blocks Claude from publishing under the user's account). Art in `launch/modio/` (local).
    **Puzzle marketplace — partly built (mod platform, phases 2–3):** puzzles as recipes and the
    bench check exist; the mod.io bot, locked "Bench-checked" tag and player signals are phase 7.
    Original notes: split *boards* (known-good reference +
    BOM/schematic/licence) from *puzzles* = a recipe (faults from the `faults.ts` catalogue with
    in-range severities + story + objectives), so the physics always comes from the simulator;
    an automatic bench check (reference passes, each fault visible, no burn cascade, player-tool
    repair unlocks the flag, model-confidence score) in Author Studio export, a scheduled bot
    re-checking new mod.io mods and setting a **locked** "Bench-checked" tag; player signals
    (solve rate, median time, "would this happen on a real board?"). Spoilers in a recipe are
    accepted (single player). Suggested first step: optional `faults` list in `mod.json` applied
    to the reference board + the bench check in Author Studio. Keep it free until there is a
    community.
  - **Simulation thread — "Auto" mode (discussed, not started):** goal = most boards work out of
    the box at ~90% realism. Not a third solver: keep SPICE and give every gap a default (rail
    whose producer isn't found but whose name gives a voltage → ideal source marked "assumed";
    unknown IC → typical load on supply pins + generic ESD clamps; unknown value → typical,
    flagged; non-convergence → fall back to Fast DC), show "≈ estimated" on readings that touch
    assumed parts, and let the problem generator reject faults whose symptom only shows through
    assumed parts. **First step: a board survey** — 20–30 open-hardware KiCad boards from GitHub
    (local only, like `.parts-cache/`), imported automatically and scored (rails found, rails at
    their named voltage, converges, solve time). The older items below (MOSFET fit, more parts)
    still stand.
  - **Problem generator ("Next problem on this board", live, `976e1d9`):** `src/scenarios/
    generate.ts` + `test/generate.test.ts`. Base board = the player's just-fixed board; faults
    from part kinds / pads / nets / copper only; each must fail a bench check alone, none may
    overload (the app burns overloaded parts on power-up); search prefers parts near objective
    nets; Conn is keyed by object identity, so faults are applied in place with snapshot/undo.
    MNT Reform ≈ 12 s per problem (ideal regulators hide most faults). Analytics
    `problem generated`. Ideas: reject faults visible only through assumed parts (see Auto mode).

- **End of 2026-11-19 (previous START HERE; its threads are still open):**
  - **Feedback thread:** first run `npm run feedback` (then `-- --repro` for snapshots).
    At the last pull (65 reports) no "stuck: no WebGPU" report had arrived since the WebGL2
    fallback went live (~13:00; last one 12:49), but that was only about an hour of data:
    recheck. The first two reports with snapshots came in (same player, thoughtful):
    the Ghost Short bug is **fixed and live** (sliver moved after the fuse, videos re-recorded);
    their suggestion, **schematics for the demo boards** to learn what each IC does, is **not
    started** (both are open hardware: check the licences, the mod system already has a
    schematic viewer). Small cleanups: scripts/repro.ts false flags (KiCad `unconnected-(…)`
    "copper short"; "power does not balance" on power-tree boards); WebGPU error-screen text;
    duplicate report sends.
  - **Simulation thread:** first fix the **MOSFET fit** (`fitMos`: RDS(on) at 4.5–5 V is
    2.1–2.5× too high, see "Known weakness" below); the user said "we will get back to it later".
    Then more parts (PMEG60T10ELR PDF: ask the user to download it, Nexperia returned 403;
    ESD arrays; zeners / TVS), then labels → `discoverPowerTree` part numbers. (c) vendor
    SPICE models and (d) provenance UI still need the user's go-ahead.

- **Feedback / reach session (2026-11-19, all pushed and live on deadboard.org).**
  1. **Feedback reports:** `npm run feedback` (scripts/feedback.ts) pulls every report from the
     FormSubmit API (`FORMSUBMIT_API_KEY` in `.env.local`) into `.feedback/` (git-ignored: may
     hold contacts) and prints a table + Gaps tally; `-- --repro` runs scripts/repro.ts on each
     snapshot. First pull: 61 reports, **0 snapshots**, 51 players stuck on the WebGPU error
     screen (27 Chrome/Windows "no adapter"), ~22 empty/test reports. **First thing next
     session: run `npm run feedback`** and compare: did "player stuck: no WebGPU" stop since the
     WebGL2 fallback (live 2026-11-19 ~13:00)? Error-screen reports now carry a GPU line with
     each adapter try + the WebGL renderer (software flag); app reports name the backend
     ("WebGL2: …; WebGPU: <why>").
  2. **Renderer = WebGPU or WebGL2:** src/render/renderer.ts builds the scene (was webgpu.ts);
     backends gpu-webgpu.ts / gpu-webgl2.ts behind backend.ts. Order: WebGPU on hardware →
     WebGL2 on hardware → software. `?renderer=webgl2|webgpu` forces one. **Shaders exist
     twice** (shaders.ts WGSL, GLSL in gpu-webgl2.ts): change both. Verified in headless Chrome
     only (pixel diff vs WebGPU tiny); not yet on real Windows / Android / iOS < 26 / Firefox.
  3. **Homepage:** EN / RU switch (src/home/translate.ts: `data-t` / `data-t-attr` marks in
     index.html, keys in ru.ts, checked by the i18n test). Hero board is live 3D
     (src/home/board3d.ts): turn + zoom only, loads when on screen, screenshot stays as
     fallback; touch takes every gesture on the board (`touch-action: none`), user confirmed it
     works on their phone.
  4. **Player report fixed (2026-11-19 evening):** Ghost Short's copper sliver sat *before* F1
     (J1+ to GND), so a new fuse could never blow again, contradicting the description, hints and
     video ("the short sits between J1 and the fuse"). The sliver now joins the fused +5 V trace
     to a new ground trace beside it (top edge, x = 37); hints (en + ru), `test/solve.test.ts` and
     both Ghost Short videos updated (re-recorded). Same player suggested schematics for the demo
     boards (learning what each IC does): not started, ask the user. Replay noise to clean up in
     scripts/repro.ts: "copper short" on KiCad `unconnected-(…)` nets, "power does not balance"
     on boards whose loads are the power tree's estimates.
  5. **Open:** ~~the WebGPU error screen's help text is still WebGPU-specific~~ (**done 2026-11-21**:
     "3D graphics aren't available", advice by cause in src/ui/gpuhelp.ts, tested on real reports' user agents); iOS app and desktop
     builds need a rebuild to get the fallback; improve the report form once new reports show
     what is still missing (e.g. say why a snapshot failed instead of dropping it,
     src/ui/feedback.ts `.catch(() => undefined)`); duplicate sends (same report 3–5× within
     seconds) suggest the Send button needs clearer "sent" feedback.

- **Earlier (simulation thread), written end of 2026-11-19.**
  The user's direction: **1:1 realistic testing of any board people upload**. Nothing is
  redistributed, so datasheets and vendor SPICE models may be downloaded and used **locally**
  (`.parts-cache/`, git-ignored), never committed.
  1. **Digi-Key API live (2026-11-19):** keys are in `.env.local` (git-ignored, mode 600; never
     print them). Verified end to end: token, product details, keyword search (`ExactMatches` +
     `Products`), datasheet links. Digi-Key hosts many PDFs itself (mm.digikey.com: download fine);
     ROHM links redirect to a web page (open in a browser). Jetson demo now 13/13 part numbers
     found. Digi-Key does not carry SISA12DN (discontinued) or CSD58873Q3D (custom). Mouser key
     (`MOUSER_API_KEY`) not set: optional; its parser is only tested on documented shapes.
  2. **Done 2026-11-19, late (user chose (a) + (b); live, commit `3bb6965`):**
     - **The device library now runs on every board** (`boardDevices` in
       `src/spice/resolveParts.ts`, used by `boardToCircuit`, option `devices`, default on). Before
       this it was wired only into the test-only schematic path and the CLI: on an imported board a
       library part was a generic diode or simply left out. Parts are matched by their printed
       label (KiCad value, BOM, boardview text); `findDevice` now also strips `,115`, `-T1-E3`,
       `-T1-GE3` and Nexperia's reel letter (`PMV50EPEAR` → PMV50EPEA). A single two-pin diode
       becomes a plain `D` (board A/K roles, so reversal / overload / LED work); everything else a
       subcircuit whose inner power is read back (`PartMap.prefix`, thermal camera). The ideal
       ohmmeter (`diodesOpen`) leaves library junctions open.
     - **Gate bleed:** every library MOSFET has 100 MΩ G–S. Without it an undriven gate (driver
       chip not simulated: Reform's LTC6803 balancing P-FETs Q5–Q12) floated to ground through
       the node shunt and switched fully on (0.54 W in each balancing resistor). Power-path FETs
       keep the power tree's behavioral switch in parallel (not added to `simulatedRefs`): their
       gate drivers are still not simulated.
     - **Datasheet extractor:** `npm run parts -- extract <pdf|txt> [MPN]` (`src/io/datasheetTable.ts`)
       prints the table rows (Min/Typ/Max apart, SI units, parsed conditions, hot rows flagged,
       rows naming sister parts left out) and a draft entry with a review list; pins are never
       guessed, `verified: false` until checked. Handles Nexperia, Vishay and Diodes Inc. layouts;
       zener / TVS series tables are printed (header + the part's row) for mapping by hand.
     - **Lookup ranks original makers** (`rankCatalogue`, `isOriginalMaker`): jlcparts had
       returned clones (TECH PUBLIC BSS138PW, RUILON SMBJ33A); a full ordering code the catalogue
       lacks goes to Digi-Key first (`-G3-08`, `-E3/61` are Vishay).
     - **8 new verified entries** (library 25/30): BSS138PW, PMV50ENEA, PMV50EPEA, SI7850DP,
       SI7461DP, BAT46WJ, SBR0560S1, 1N4148WS (graph-read points and limit-only values called
       out in each note). Jetson 4/14 part numbers with checked data (was 2/13), Reform 9/44.
     - **Readings that changed (deliberately, `test/demoboards.test.ts`):** Jetson BOOT1 LED now
       lit in S0SW (T2 BSS138PW, gate on the pulled-up #RESET), supply 38.9 → 41.8 mA; Reform
       LPC_VCC diode mode 0.513 → 0.155 V (the buck's SBR0560S1 catch Schottky through L5, as a
       real board reads), 30V_GATE Ω OL → 385 kΩ (1 µA range through 100 kΩ and BAT46WJ D2's
       datasheet reverse leakage). New suite `test/partdata.test.ts` (synthetic layouts only).
     - **Known weakness, first thing next time (user: "we will get back to it later"):** the
       level-1 MOSFET fit (`fitMos`) matches RDS(on) at the highest VGS only; at 4.5–5 V it is
       2.1–2.5× too high on all five new FETs (PMV50EPEA 112 vs 49 mΩ; the two-point fit is
       rejected because its threshold falls outside 0.3–2.5 × the datasheet VGS(th)). Older library
       FETs likely share it. Options: a mobility-degradation term (THETA) if the engine has one,
       or fitting VT from the two RDS points; check against ngspice. Diode fits are within 7 mV.
     - **Next candidates:** PMEG60T10ELR (Reform D17–D28, Nexperia returned 403: ask the user
       for the PDF); zeners / TVS (BZT52C6V2, BZX584C3V3, SMBJ33A, P4SMA24CA: their sheets give
       no forward curve, so entries stay `verified: false`); ESD arrays (TPD4E05U06 ×3 on the
       Jetson, TPD6E05U06, SP0503BAHT: multi-unit, pinout from the drawings); passing labels as
       `partNumbers` to `discoverPowerTree` (fet-switch roles from the library); then (c) vendor
       SPICE models, (d) provenance-tier UI (both still need the user's go-ahead).
  3. Other open items: re-record 3 walkthrough videos (Backwards Day, Smoke Test, Bridge Troll:
     quoted fast-mode readings changed); add `apt-get install ngspice` to `pages.yml` (the ngspice
     suite skips in CI); bench measurements of a real board (none published for the demos).
  - **Local tools on this Mac:** ngspice 47 and poppler (`pdftotext`, `pdftoppm`; the Read tool
    renders PDF pages) via Homebrew; `7zz` (7-Zip) for the jlcparts archive (macOS `zip -s 0`
    truncates it); `sqlite3`. Datasheet PDFs the user downloads land in `~/Downloads`; copy them
    into the scratchpad / `.parts-cache/datasheets/`, never into the repo. Scripted downloads with
    a browser user-agent are refused by the permission check: use the jlcparts links / APIs or ask.
  - **Device library: 25/30 verified** (`src/spice/devicelib.ts`, every entry has `source` + note);
    unverified: CSD58873Q3D (MacBook custom part, no public datasheet; sibling CSD87333Q3D is in
    the library), the debug LED (no part number); partial: MMBT3904LP, SDZT15R6.8, ESD112.
    Regulators with datasheet data: LMR16006(YQ3), TLV62568, LM62460, LM62440, SiC477.
  - Always `npm test` **and** `npm run build` before committing (tsc covers `test/`).

- **2026-11-19: simulation accuracy (all pushed; `1e67f0b` → `f1412cd`).** Goal set by the user:
  meter / scope / thermal readings closer to a real board, every value with honest provenance.
  Plan steps 1–6 done; step 7 (provenance-tier UI) proposed, **not started: ask the user first**.
  - **Solvers agree** (`test/differential.test.ts`): the fast solver read a floating net as
    exactly +1.000 V (open switch stamped with the same 1 nS as the node shunt → divider); open
    parts are now unstamped. It also now uses the **SPICE diode curves** (PWL chords of the same
    Shockley models, < 4 mV), the **10 MΩ meter load**, a 1 pS shunt (1 nS read 2 MΩ 0.6 % low)
    and the generic DMM's diode-test source (3.0 V, OL ≥ 2.5 V; a blue LED was 3.0 V fast / OL
    SPICE). 13 boards × V, part currents (± current limit), series A, Ω, diode, F agree within the
    tolerances in the test header. By design: fast-mode Ω is an ideal meter (junctions open, no
    leads); F and A use SPICE in both modes. **Consequence: fast-mode readings quoted in three
    walkthrough videos changed** (Backwards Day 2.006 → 1.954 V, Smoke Test 0.700 → 0.654 V and
    +4.293 → ~4.27 V, Bridge Troll 2.105 → ~2.05 V, supply mA): re-record (`npm run videos`); the
    user chose "unify, re-record later".
  - **SPICE vs ngspice** (`test/ngspice.test.ts`, 20 decks, 7.5k values; skips without ngspice;
    installed here with Homebrew, **not in CI**). Fixed: MOSFETs had no bulk junctions (no body
    diode on a reverse-biased drain); `Mosfet` now has ngspice level-1 drain/source–bulk diodes
    (IS, default 1e-14). Library MOSFETs keep their datasheet body diode and set IS=0.
  - **Importers** (`test/importnets.test.ts`): stacked boardview pads of different nets could not
    be trimmed apart and shorted (the NM-D562 3,441 vs 3,442 case). Boardview boards carry
    `Board.estimatedPads`: pad/via contact across named nets does not join (blobs, jumpers,
    traces still do). `netReport` / `netWarnings` check named nets = conductors; BRD/TVW/KiCad
    imports attach `Scenario.importWarnings` (not saved) → "Import check" toast (ru added). The
    Jetson file really has LED1 with both pads on one net (routed separately).
  - **Device library** (`test/devicelib.test.ts`): 8/21 parts verified (15 after follow-ups) against manufacturer
    datasheets (`source` = document + revision, `thetaJA`); many from-memory values were maxima or
    wrong (IRF9395 Rds(on) 16 → 5.3 mΩ, SI7137DP Ciss 9 → 20 nF). 3 checked against limits only;
    10 unverified (Diodes / TI / Rohm / ST sites serve bot pages to curl, or the PDF fonts were not
    machine-readable). Datasheet text was read with a stdlib-only extractor (scratchpad; poppler
    install was refused). `fitDiode` now fits three points consistently.
  - **Regulators** (`src/spice/regulators.ts`): datasheet Vref / fixed output / current limit / Iq
    for the demos' regulators (LMR16006(YQ3), TLV62568, LM62460, LM62440, SiC477). The Reform's
    LPC_VCC (fixed-3.3 V LMR16006YQ3) was 0 V and now reads 3.300 V; the Jetson 5V0_SYS reads its
    design 4.984 V.
  - **Calibration** (`docs/calibration/<demo>.csv`): rail set points from the published designs'
    dividers × datasheet Vref (tier "matches published board values", not bench data). No diode /
    Ω / current measurements of these boards are published, so none were invented. Optional
    per-row `tol` column; `npm run calibrate -- <demo> <csv> --repair` uses the known-good board.
  - **Full-board regression** (`test/demoboards.test.ts`) on both open demos replaces the private
    MacBook coverage (structure, net invariant, power tree, faulted → thermal hot spot, repair →
    flag after save, rails, calibration rows, meter / current snapshot). Demo repairs are shared
    in `src/scenarios/demoRepairs.ts`.
  - **Parts pipeline** (`scripts/parts.ts`, `src/io/partNumbers.ts`): the user wants 1:1 realistic
    testing of any board people upload; nothing is distributed, so datasheets / vendor models may be
    downloaded and used **locally** (`.parts-cache/`, never committed). Catalogue = jlcparts
    (yaqwsx, MIT; JLCPCB/LCSC list, 4.6 M parts, datasheet links download without bot walls). Its
    attributes mix typical and maximum values (FDC638APZ: 43 mΩ / 1.5 V / 1 nF are the maxima), so
    library numbers still come from the PDFs. Fallback for parts jlcparts lacks (or has no
    datasheet link for): Digi-Key Product Information v4 then Mouser Search API
    (`src/io/distributors.ts`, keys `DIGIKEY_CLIENT_ID` / `DIGIKEY_CLIENT_SECRET` / `MOUSER_API_KEY`
    in `.env.local`, no VITE_ prefix so never bundled; the APIs only see part numbers). Jetson demo: 12/13 part numbers found, 2 with
    checked library data: the next coverage work (BSS138PW, NCP380 load switch, ESD arrays…).
  - **Lesson:** `tsc` covers the tests: run `npm run build` before every commit (the `26d3e7b`
    deploy failed on a test type error; fixed in `ad13a10`).

- **2026-11-18 evening: website analytics (live, `5afa430`).** Umami Cloud (user's pick over
  Plausible / GoatCounter / GA4): no cookies, no consent banner. `src/analytics.ts`, loaded from
  `src/main.ts` (bench) and `src/home/main.ts` (homepage, modding, privacy). Enabled only when
  **both** the build has `VITE_UMAMI_ID` (repo variable **`UMAMI_ID`** = `f87071cc-…`, passed in
  `pages.yml`) **and** the host is `deadboard.org`, so dev, forks, iOS and desktop never
  send anything. App Store answer stays "Data Not Collected"; never enable it in the apps.
  Honours Do Not Track. **Time spent:** Umami's visit duration is near 0 on a one-page app, so we send
  `active N min` events at 1, 2, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240 min of *active*
  time (tab visible + mouse/key/touch within 2 min), once each per page load; read the Events tab
  as a funnel. Test: `test/analytics.test.ts`. Privacy policy (`docs/PRIVACY.md` → privacy.html)
  now has a "Website visit statistics" section; anything new we track must be added there.
  Dashboard: cloud.umami.is (user's account, free Hobby plan, 100k events/month).
  **Not done:** `launch/reddit-posts.md` and the old draft `ios/store/PRIVACY.md` still say "no
  analytics / no tracking": fix before posting. Possible follow-ups (user hasn't asked): events
  for which board was opened / tutorial finished / board solved, to see where people drop off.

- **2026-11-18 session (all live; commits `2b5e0c0` → `4c8fbb4`, handoff `dfe5805`+).** Driven by user reports and
  GitHub issues #2 (Biga73, boardviews) and #3 (SandyTAP, Russian):
  - **Shorts are physical** (`2b5e0c0`): touching copper is one conductor whatever its net labels
    (`src/connectivity.ts`; only zones keep to their own net). Tutorial 5's original layout had J1's
    pins shorted and still lit D1; built-ins now have a no-cross-net-touch test, and KiCad pad
    rotation and oversized bench clips (`J_BENCH`, `J_PWR`) were fixed so real boards don't merge
    nets. Known leftover: the PSU panel still says "CV / Board powered" during a dead short.
  - **Boardviews** (`src/io/brd.ts`, `src/io/tvw.ts`): BRD2 `.brd` (sections, bottom flip y →
    maxY − y, through-hole when no pin is on the part's side, nails); unknown `.brd` → explicit
    error. **Tebo-ICT `.tvw`** ported from nitrocaster/eagleview (MIT, `NOTICE`,
    `licenses/eagleview-MIT.txt`) and extended from 7 real Lenovo boards: edge slot `0x0B` is an
    arc; two optional header text fields; empty drill layers (0 tools); ICT fixture objects
    (kind 4) and odd test-point tables are skipped by **resync** to the next layer that parses
    in full or to the net list (count twice + names + `0,0,4`). TVW gives real pad shapes, pin
    names and printed R/C values; `clearPads` trims misread pads so they never short. Shared
    builder `buildBoardview`. **#2 closed**: Biga73 re-tested all 7 fixed boards (counts and
    outlines match the real machines) and found no regressions on 9 others. **Pending: NM-D562**
    (not sent to us): its status-bar net count is 1 below the file's (3,441 vs 3,442), which
    means two named nets are joined, most likely two stacked pads of different nets that
    `clearPads` cannot separate (a fake short). Asked for the file; when it arrives, find the pair
    and make the importer handle coincident pads. Their files are private (scratchpad only,
    never commit).
  - **Diode/LED polarity marks** follow the K pin (`cathodeDir` in `src/render/webgpu.ts`).
  - **Bug-report snapshots** (`src/snapshot.ts`, `scripts/repro.ts`): see memory /
    `project-bug-snapshots`. Reports from the WebGPU error screen have no snapshot; that screen
    now detects social apps' in-app browsers (`src/ui/inapp.ts`: Threads = `Barcelona`, `; wv)`)
    and offers Open in Chrome / Copy link.
  - **Translations** (`src/i18n/`, `docs/TRANSLATING.md`): English text is the key (`t()`, `tk()`
    for module tables, `{n} one|other` plurals with an `n` param); Russian (`ru.ts`, ~880 entries)
    is **maintained**: `test/i18n.test.ts` fails on untranslated / stale strings, placeholder, tag
    or plural mismatches. Picker in the ⚙ settings menu, Help and the phone More sheet;
    `?lang=ru`; switching reloads and reopens the same board. Not translated: website pages,
    imported boards' generated descriptions, mod validation errors, bug-report technical details.
  - **UI declutter**: top bar 18 → 14 controls (sound / 3D orbit / language in ⚙; New board and
    Import only in the board list, drag & drop and the phone More sheet); overview without the
    duplicate board-list button and per-objective "run tests" lines; supply chart folds under its
    header except on boards with power states. Top bar fits 1280–1920 px in EN and RU.
  - **Not done / next:** iOS and desktop builds still need a rebuild for all of this (local only);
    App Store privacy answers may need the bug-report diagnostics; a native speaker should review
    the Russian; `.tvw` traces / vias / pours are not imported (nets connect by name).

- **Repo security (2026-11-17).** A user's suggestion led to a ruleset **`protect-main`** (id 27471441):
  active on the default branch, *restrict deletions* + *block force pushes*, **no bypass**.
  Normal pushes to `main` are unchanged. **A history rewrite (like the 2026-11-16 Apple-image
  purge) now needs the ruleset disabled first** (Settings → Rules → Rulesets), then re-enabled.
  Deliberately skipped: *require pull request* (solo maintainer, pushes straight to main) and
  *require status checks* (no PR CI exists; `pages.yml` runs only on push to main; add a PR
  workflow running `npm test`, then turn it on). Already in place: secret scanning + push
  protection, read-only default workflow token, Actions can't approve PRs, fork-PR approval for
  first-time contributors, `github-pages` environment limited to `main`. **Open:** Dependabot
  alerts are off (offered, not done); account 2FA unchecked; actions are pinned by tag, not SHA.
  Issue **#2** (Biga73): see the 2026-11-18 entry above.

- **Mobile / touch (2026-11-17, live; commits `01257be` + `a11a4b3`).** Goal: playable on phones in
  the browser first (this stage), App Store release later. The user said **leave the desktop
  version unchanged**: every mobile change is gated, and the desktop DOM was checked identical
  to the previous build (whitespace aside) with the meter, probes and board list in use.
  - **Switch** (`wantsMobileLayout`, `src/ui/touch.ts`): mobile layout on touch-only devices
    (`(pointer: coarse)` and no `(any-pointer: fine)`); `?mobile=1` / `?mobile=0` force it.
    `PcbApp.mobile`; `body.is-mobile` + `.layout.mobile` scope all mobile CSS (end of
    `src/ui/styles.css`); mobile-only markup comes from conditionals in `buildDom` /
    `mobileDockHtml` / `mobileMoreHtml` / `rotateHintHtml` (desktop markup untouched).
  - **Touch input (any layout)**: `TouchGestures` — tap = active tool (`touchTap`), 1 finger
    pans (orbits in 3D), 2-finger pinch zooms + pans, a leftover finger after a pinch does
    nothing, `pointercancel` ends without a tap. Mouse code path unchanged. Page zoom is blocked
    on mobile (`touch-action: pan-x pan-y`, iOS `gesturestart`), the board has its own pinch.
  - **Phone layout**: top bar = logo · board picker · power · Run tests (▶) · panel (flag) ·
    More (⋯). More sheet holds view / display / bench / board / app controls (the desktop
    top-bar elements are *moved* into it, listeners intact; icon buttons are proxied via
    `data-proxy`). Tool strip with labels (bottom in portrait, left in landscape; undo/redo
    pinned, reset in More). Panel = bottom sheet (portrait) / right drawer (landscape); opens on
    Select-tap of a part, Run tests, and on loading a non-tutorial board. Floating Fit · 2D/3D ·
    side buttons. Instruments stacked in `.m-hud` (scope, supply folded to one line — tap for
    chart — and meter). Board refits when the canvas shape changes (`refitOnShapeChange`).
    Phones in portrait (≤ 600 px) get a "Turn your phone sideways" overlay (CSS only; "Keep
    portrait" → localStorage `pcbfix_portrait_ok`). Modals full screen.
  - **Meter on touch**: probe tags on the meter pick which probe the next tap places
    (`activeProbe`); in two-probe modes red auto-advances to black and back.
  - **Text: shorter, not smaller** (user asked explicitly not to just shrink the font):
    tutorial steps have a hand-written `phone` task in `src/ui/tutorial.ts` (≤ 70 chars, no
    coordinates, no mouse words — tested), explanation behind "Why?"; `touchCopy` rewrites other
    copy (click → tap, right-click → black probe, shortcut keys removed); `TOOL_TIP_PHONE`;
    toasts > ~90 chars show the first sentence + More (`splitLead`); meter / scope / supply
    explanations on one line (tap for all); Inspector notes (`.callout`) fold to their heading.
    **New tutorial steps need a `phone` text** or `test/touch.test.ts` fails.
  - **Board list on phones** (`phoneCatalogSection`): one row per board (lesson / difficulty
    badge, title, 2-line description without the "Beginner Tutorial N:" prefix, status),
    filters on one scrolling line, Blank / Import / Mods in a bottom bar (header + 2 columns in
    landscape).
  - **Install**: `public/app.webmanifest` + `public/icons/icon-{180,192,512}.png` (from
    `desktop/icon.png`); manifest link injected only on mobile (no desktop install prompt);
    apple-touch-icon / web-app metas and `viewport-fit=cover` in `app.html`, safe-area insets in CSS.
  - **Testing**: only headless Chrome with phone emulation so far (`isMobile`, `hasTouch`,
    CDP `Input.dispatchTouchEvent` for pinch; 390×844, 844×390, 360×740, 820×1180 tablet).
    **No real phone yet.** WebGPU needs a secure context, so a phone on `http://<LAN-IP>` gets no
    `navigator.gpu`: test on the Pages site (or an HTTPS tunnel). Needs iOS 26+ (any iOS browser)
    or Chrome 121+ on Android 12+; the WebGPU error card has phone-specific advice. Desktop
    check recipe: build HEAD in a `git worktree` (symlink `node_modules`), serve both builds with
    `vite preview`, compare `#app.innerHTML` with whitespace collapsed after the same actions.
  - **Open (mobile)**: (1) real-device test on iPhone + Android, collect the user's screenshots;
    (2) landscape phones are still tight (tutorial card + instruments cover part of the board);
    (3) Overview / Inspector / Author panel content itself is not yet condensed for phones;
    (4) performance on phones unmeasured (DPR capped at 2; big demo boards may be slow);
    (5) App Store: wrap the web build (e.g. Capacitor / WKWebView on iOS 26+, which has WebGPU),
    decide offline bundling, icons / splash, store listing — not started.

- **Mods (2026-11-17):** `deadboard-mod/1`, data-only packages (folder or .zip with `mod.json`)
  of boards (.kicad_pcb / .brd / .pcbfix.json) + optional BOM CSV (R/C values, DNP via
  `applyBom` in `src/io/bom.ts`) + optional schematic (PDF / image, floating viewer). Loader in
  `src/mods/` (own zip reader/writer with size caps, manifest validation listing every error).
  In the app: Boards → **Mods** window (install .zip into IndexedDB, remove, warnings), "Community
  Mods" section, **Export as mod** (Author tab; a built-in board gets its own id). A
  `.pcbfix.json` keeps its id (flag lock); imported boards get `mod-<mod>-<board>`. Example mod
  `examples/mods/starter-kit/` (`npm run example-mod` rebuilds its challenge +
  `public/examples/starter-kit.zip`); `test/mods.test.ts` (17th suite). Guide: `docs/MODDING.md`,
  rendered into the site page `modding.html` at build time (vite plugin, `marked`).

- **Session 2026-11-17 in one line:** all work is pushed and live (last code commit `257debd`:
  mods + the modding guide page `modding.html`, linked from the homepage). Earlier that day: Both-view
  X-ray (`826a8c0`), inverted left/right when looking up at the underside (`b031184`), issue #1
  closed, feedback form verified. No open issues.
- **Fixed 2026-11-19:** the floating-net `+1.000 V` reading (see the 2026-11-19 status entry).

- **Released 2026-11-16 as v0.1.0**: public repo https://github.com/tholtman1-del/deadboard
  (Apache-2.0), live site https://deadboard.org/ (homepage `index.html` +
  bench `app.html`). `.github/workflows/pages.yml` runs `npm test` + `npm run build` and deploys
  on every push to `main`. The release carries the showcase MP4 (`docs/media/*.mp4` is
  git-ignored; upload with `gh release upload v0.1.0 <file> --clobber`).
- **Content:** 11 built-in scenarios (5 beginner lessons added 2026-11-16: Cold Joint 101,
  Solder Bridge 101, One-Way LED, Resistor & Ohm's Law, Voltage Divider 101) + 2 open-hardware
  demos (MNT Reform 2 mainboard, Antmicro Jetson baseboard; `docs/DEMOS.md`).
- **Videos:** walkthroughs for 8 scenes (approach + spoiler-gated solution), captions explain
  each step and every quoted reading is checked live (`docs/VIDEOS.md`). The 5 beginner lessons
  have **no videos yet**.
- **Showcase video** (`scripts/promo/{stage,showcase}.ts`, `npm run showcase`): motion-graphics
  stage around the live app, recorded slow (`--slow 2.5`) and retimed to 30 fps; writes
  `docs/media/deadboard-showcase.{mp4,gif}` + poster. Starts at the 3D fly-in; `--hook` keeps
  the 3 s thermal cold open. Outro shows the site and repo URLs.
- **Recording tip:** a dev server reloads on every source save, which kills long recordings.
  Record against a frozen build instead:
  `npx vite build --outDir <tmp>/dist && npx vite preview --outDir <tmp>/dist --port 5299`,
  then `--base http://localhost:5299`.
- **Bug fixes after release (2026-11-16, live on the site):**
  - `71e63ff` 3D orbit is grab-and-turn by default (board follows the drag, `Camera.orbit`).
    The old camera-style movement is a toggle next to 2D/3D (`#btn-invert-orbit`, rotate icon,
    `Camera.invertOrbit`, saved as localStorage `pcbfix_invert_orbit`). The showcase recorder's
    orbit call was sign-flipped so the recorded move is unchanged.
  - `71e63ff` "WebGPU is not available" card gives Firefox-specific steps (`App.webGpuHelp()`:
    update Firefox, `about:config` → `dom.webgpu.enabled`, driver / `about:support`).
    Firefox reports "Intel Mac OS X" even on Apple silicon, so the text can't tell those apart.
  - `3b68f5f` "Both" view: through-hole pads (`layers === 'FB'`) are now drawn on both panels
    (mirrored on the back, with drill). Before, pins and mounting holes of top-side parts were
    missing from the back panel, which read as "vias invisible". Vias themselves were fine; at
    the Both fit zoom they are just half the size of the Bottom view.
- **Second round (2026-11-17, live):**
  - `1e90dbe` Bottom-side domes (solder blobs, joint fillets, bottom LED lenses) were invisible:
    a negative Z scale mirrors the mesh, flips winding, and back-face culling dropped the outside.
    `InstanceBucket.pushTRS` now also mirrors Y when `sz < 0` (a rotation; all unit meshes are
    Y-symmetric). Closed GitHub issue #1.
  - `f389b74` Inner-layer copper of imported KiCad boards is kept as display-only `Board.inner`
    (tracks + filled pours, pours simplified to 0.05 mm): X-ray draws every inner layer (one tint
    each, pours under tracks, above the outer pours), and a selected net with hidden copper is
    overlaid on the viewed face. Connectivity / flags unchanged; demos rebuilt (+~1 MB each).
  - `d8fe40c` Frost / IPA film drawn per thermal cell on the board (`ThermalModel.forEachFilm`),
    so the wet patch visibly dries from hot spots outward (physics was already per cell).
  - `3e1ac56` No-WebGPU card: Chrome/Edge-on-Linux advice (flags + Vulkan driver).
  - `03b8f9a` In-app **Feedback** (speech bubble in the top bar, help modal, homepage footer
    `app.html?feedback`, no-WebGPU card): bug / idea + optional contact + optional diagnostics,
    sent by FormSubmit to the build setting `VITE_FEEDBACK_TO`, fed on Pages from the
    **repository** variable `FEEDBACK_TO` (not an environment variable: the build job has no
    environment). It holds FormSubmit's random alias, not the address, so the public bundle has
    no email; activated and tested 2026-11-17. Never put the address in source (a session privacy
    guard also refuses it). Local builds: `.env.local` (git-ignored); `src/ui/feedback.ts`. Unset → prefilled GitHub
    issue (`.github/ISSUE_TEMPLATE/{bug_report,suggestion}.yml`), also offered as secondary route.
  - `635c2c5` IR view: the board surface is drawn from the thermal grid (one vertex per cell, colours
    interpolated, near-ambient cells fade out) instead of per-part halo discs; copper pours take
    their net colour in IR / voltage views. Palette is fixed 24–119 °C (no auto-range yet).
  - Both + X-ray: each panel also shows the opposite face's copper (tracks, pours, single-side
    pads, blobs) faintly and mirrored, as single-side X-ray shows the far side through the board
    (`ghost` / `GHOST_Z` in `src/render/webgpu.ts`, just above the panel's own pours).
  - 3D orbit, left/right while looking up at the underside: after orbiting over the edge the
    camera sits at negative pitch in the back frame (= the positive-pitch view turned 180° on
    screen), so yaw read mirrored. `Camera.orbit` flips the yaw sign at negative pitch (±5°
    dead zone); same for tilting past face-on. `test/camera.test.ts` (16th suite) checks the
    board's near edge follows the drag in every pose, and with the invert toggle.
- **Linux check (2026-11-17):** production build in the Playwright Linux image (Ubuntu 24.04,
  arm64) under Colima: Chromium on SwiftShader and Firefox 146 on Mesa llvmpipe Vulkan
  (`mesa-vulkan-drivers`, `dom.webgpu.enabled`) render everything with no page errors. Colima only
  mounts `$HOME`, so pipe scripts in via stdin and `docker cp` results out. Real GPU drivers untested.
  Recipe: `colima start`; `docker run -i --ipc=host -v $PWD/dist:/site:ro
  -v $PWD/node_modules/playwright-core:/pw:ro mcr.microsoft.com/playwright:v1.58.2-noble
  node --input-type=module < script.mjs` (script serves /site on :8080 and imports `/pw/index.mjs`;
  Chromium flags `--enable-unsafe-webgpu --enable-features=Vulkan --use-vulkan=swiftshader
  --use-webgpu-adapter=swiftshader --enable-unsafe-swiftshader`; for Firefox
  `apt-get install mesa-vulkan-drivers xvfb`, run under `xvfb-run`, prefs `dom.webgpu.enabled`,
  `gfx.webgpu.ignore-blocklist`). Software GPUs run the Reform at 1–4 fps. `colima stop` after;
  the image (3.7 GB) stays cached in the VM.
- **Ad-hoc screenshot scripts** (macOS Chrome, `?automation=1` → `window.deadboard` API in
  `App.exposeAutomation`): write them as `.mts` in the scratchpad and import playwright-core by
  absolute path (`<repo>/node_modules/playwright-core/index.mjs`); tsx injects `__name` into
  named inner functions, so pass `page.evaluate` a string when it defines functions. Reading a
  WebGPU canvas back via `createImageBitmap` returns black; judge renders from screenshots.
- **Testing in stock Firefox** (Playwright's `moz-firefox` channel can't start inside the Claude
  Code sandbox): launch through Launch Services so Firefox runs outside the sandbox, then drive it
  over WebDriver BiDi with a raw WebSocket client (`session.new` → `browsingContext.create` →
  `navigate` / `input.performActions` / `captureScreenshot`; always `session.end`, Firefox allows
  one session):
  `open -n -a Firefox --args --no-remote --profile <tmp-profile> --remote-debugging-port 9333 --new-instance`
  then connect to `ws://127.0.0.1:9333/session`. Put `user_pref("dom.webgpu.enabled", false);` in
  the profile's `user.js` to see the no-WebGPU card.
- **Private fixtures:** see Data / licensing. Before every push, check images and copy (not only
  code) for anything derived from them: a MacBook render once reached the public homepage.

### Next steps (proposed)

- **Mobile first** (the user's current focus): test on a real phone via the live site, fix what
  the screenshots show, then the open mobile items above (landscape, panel content, performance),
  then the App Store wrapper.
- **Sim expansion idea: ESP32 board** (user, 2026-11-17; not started, nothing ESP32-related in
  the project yet). ESP32 boards are what many hobbyists actually repair, so one would be a
  strong "real hardware" scenario next to the Reform / Jetson demos. Plan:
  - Source: an open-hardware ESP32 dev board with KiCad files and a licence that allows
    redistribution (candidates to check: Olimex ESP32 boards, other KiCad-native open designs);
    import through `npm run demos` like the existing demos (`scripts/build-demos.ts`, pinned
    commit, credits + licence in `public/demos/`).
  - Model: the ESP32 module is a **black box** (no firmware): a 3.3 V load with a plausible idle
    / active current (estimate, labelled), its pins as nets. What gets simulated is the support
    circuitry: USB 5 V input, 3.3 V LDO (e.g. AMS1117-class), USB-UART bridge, EN / IO0
    auto-reset transistors, decoupling, LEDs. Check `src/spice/devicelib.ts` for the LDO and
    USB-UART parts; add datasheet specs with `verified: false` like the others.
  - Faults that fit (all existing fault classes): dead or shorted LDO (`ic-rail-short`), shorted
    3.3 V decoupling cap (thermal camera / injection finds it), cracked joint on the USB connector
    (intermittent), broken auto-reset path (board powers but won't enter flash mode: needs a new
    objective type, e.g. "IO0 low while EN rises"), reversed / missing protection diode.
  - Open question: a "flash mode" / "boots" objective would need a small behavioural model of
    the ESP32 strapping pins (IO0, EN, IO2, IO12 at reset), still without running firmware.
- **Sim expansion idea: car ECU, EDC15 / EDC16-style** (user, 2026-11-17; not started). Engine
  control units are a large share of real paid board repair, and their typical faults are
  electrical, which is what the simulator does well.
  - **Legal / data:** EDC15 / EDC16 are proprietary Bosch designs: no public board files or
    schematics, so (like the MacBook fixtures, see Data / licensing) nothing of theirs can ship.
    Build an **invented board with a typical diesel-ECU architecture** (Builder or KiCad), named
    generically (e.g. "Diesel ECU, EDC-style"); check that using the EDC name in a description is
    acceptable before release.
  - **Typical architecture to model:** 12 V vehicle supply with terminal 30 (battery) and 15
    (ignition), reverse-polarity / transient protection, main-relay driver, 5 V regulator for the
    microcontroller and a separate 5 V sensor supply, analog sensor inputs (pull-ups / dividers /
    RC filters), injector and solenoid power stages (MOSFET / transistor drivers into inductive
    loads with flyback / clamp diodes), CAN + K-line transceivers. The microcontroller is a
    black box (no firmware, no immobiliser / EEPROM data), like the ESP32 idea above.
  - **Faults that match real ECU repairs** (all from existing fault classes): cracked joints from
    heat cycling and vibration (`thermal-open`, `flex-open`: Press tool, freeze spray / hot air),
    dead 5 V sensor-supply regulator or shorted sensor line, failed injector / solenoid driver,
    shorted CAN transceiver (no communication), corrosion from water ingress (residue, IPA),
    blown protection diode after a reverse jump-start. Verify the list against ECU-repair
    sources before writing scenario text; keep severity values labelled as estimates.
  - **New pieces needed:** a bench-harness setup (supply 12–14 V on terminals 30 / 15 / ground,
    like real bench ECU testing), inductive loads in the board → SPICE path (L is supported by
    the engine), objectives such as "sensor supply 5 V present", "CAN transceiver powered and not
    shorted", "injector driver switches" (scope, synthesized PWM like the converter switch node),
    and optionally conformal coating that must be removed before rework.
- **More expansion ideas** (proposed by Claude 2026-11-17 when the user asked for more; the user
  has not picked any yet, so ask). Claude's suggested order: Arduino Uno-style board first, then
  known-good comparison, then repair-shop mode.
  - Boards:
    - **Arduino Uno-style board:** open hardware (Eagle files; KiCad ports exist; check the
      licence and credit). Classic first repairs: dead 5 V regulator, blown USB polyfuse, dead
      USB-serial chip, reverse-polarity diode. Bridges the tutorials and the big demos; needs
      nothing new in the engine.
    - **3D-printer mainboard:** open designs exist (e.g. Prusa Einsy, licence to check). Faults:
      burnt heated-bed MOSFET (the thermal camera finds it), melted power connector, dead stepper
      driver, broken thermistor input.
    - **Mains switching PSU** (TV / charger / LED driver): the most common real repair (bulging
      caps, shorted switching transistor, blown fuse, open start-up resistor) and the place to
      teach safety (discharge the bulk cap, isolation transformer). Needs a mains flyback /
      switching model: more work than the two above.
    - **Guitar pedal / small audio amp:** simple analog, many open designs; signal tracing with
      the scope instead of power-fault hunting.
  - Features:
    - **Known-good comparison:** reference readings (diode mode / resistance to ground per net)
      from the healthy board, as real repairers compare against a good board or boardview values;
      works on every board and builds on `src/spice/dmm.ts`.
    - **Repair-shop mode:** customer tickets with a symptom ("dead after a coffee spill", "works
      only when cold"), time budget, parts cost; turns the scenarios into a campaign (good for
      Steam, see `desktop/STEAM.md`).
    - **Microscope tool:** magnified inspection where cracked joints, corrosion and bridges are
      only visible up close.
0. Thermal view polish (user said "not for now" on 2026-11-17, so ask first): auto-range IR
   palette (real cameras rescale to the scene; a 45 °C spot is faint on the fixed 24–119 °C
   scale), and show sub-ambient cold spots from IPA / freeze spray (palette floor is 24 °C).
1. Walkthrough videos for the 5 beginner lessons (`scripts/videos/scenes.ts`, `npm run videos -- --dry` first).
2. Full-board regression tests on the open demo boards, replacing the private MacBook coverage.
3. Real bench data: `npm run calibrate` with measurements from one known-good board.
4. Two-layer thermal model still open (below).
5. Browser support: Firefox 160 on macOS verified 2026-11-16 (render, 3D orbit, wheel zoom).
   Firefox without WebGPU (older versions, Linux, Intel Macs, blocklisted GPUs) gets a tailored
   how-to on the error card; a WebGL2 fallback renderer would make it work there out of the box.
   Linux checked 2026-11-17 (see above). Safari still untested. Open: a customer reported Firefox not working; it works here, so it is
   likely their setup. Ask for Firefox version, OS and `about:support` → WebGPU before building
   the WebGL2 fallback (renderer GPU code is isolated: init, `ensureAttachments`, `render()` in
   `src/render/webgpu.ts`; scene building is API-agnostic; 3 small WGSL shaders to port).
6. Player feedback now arrives by email (Feedback form) and as GitHub issues: check both at the
   start of a session (`gh issue list`).
7. Launch: Reddit posts drafted (kept outside the repo); trademark/domain clearance for the name not done.

## How to run

```bash
npm test                 # 28 suites, all passing (private-fixture parts skip when absent; ngspice suite skips without ngspice)
npm run showcase         # re-record the showcase video (needs a running site; see Status)
npm run videos           # re-render walkthrough videos (needs the dev server; docs/VIDEOS.md)
npm run demos -- --fetch # rebuild the open-hardware demo boards (docs/DEMOS.md)
npm run calibrate -- <board.brd> <measurements.csv>   # model vs bench readings (template: docs/measurements.template.csv)
npm run parts -- fetch-db                       # local parts catalogue (jlcparts, ~330 MB, needs 7zz) → .parts-cache/ (git-ignored)
npm run parts -- lookup <board | MPN…>          # board part numbers → catalogue match, datasheet link, library coverage
npm run parts -- datasheets <board | MPN…>      # download matched datasheets into .parts-cache/datasheets/ (read with poppler)
npm run calibrate -- public/demos/demo-mnt-reform2-mb30.pcbfix.json docs/calibration/demo-mnt-reform2-mb30.csv --repair
npm run build            # typecheck + production build
npx vite --port 5199     # dev server → http://localhost:5199 (WebGPU: use Chrome)
npm run spice -- "board_schemas/J113  820-00165.brd" --quiet --behavioral --states --supply PPVBAT_G3H_CONN=8.4:0.05
npm run schematic -- <schematic.pdf | bom.csv> <board.brd> --list | --product 639-00623
```

Browser automation for UI checks, videos and the showcase: Playwright (`playwright-core`
devDependency) driving the local `/Applications/Google Chrome.app` headless with
`--enable-unsafe-webgpu --use-angle=metal` (`CHROME_PATH` to override). Ad-hoc screenshot
scripts lived in the session scratchpad; recreate as needed.

## What exists (all test-covered)

| Area | Files | Notes |
|---|---|---|
| SPICE engine | `src/spice/{engine,devices,sparse,netlist,expr,units,types}.ts` | MNA + sparse Markowitz LU; .op/.dc/.tran; R C L V I D M Q S E G X B; ngspice-compatible decks; gmin/source stepping + pseudo-transient continuation; warm start |
| Board → SPICE | `src/spice/board.ts`, `adapter.ts` | game faults honoured (burnt, cold, reversed, leak, drift, resistive cold joints), ESD pin model, injection supply, meter loading |
| Schematic / BOM import | `src/io/{pdf,schematic,schematicLibrary,bom,schematic-cli}.ts` | Concept-HDL PDFs (Apple style) incl. BOM configurations / NO STUFF; universal CSV BOM path |
| Device library | `src/spice/{devicelib,resolveParts}.ts` | datasheet specs → fitted models; pins = datasheet numbers; 2-pin diode convention inferred per board; net-checked pinouts. 8/21 parts **datasheet-verified** (`source`, `thetaJA`), 3 checked against limits, 10 unverified estimates (each says why); `src/spice/regulators.ts`: datasheet Vref / fixed output / current limit for listed regulators |
| Power tree | `src/spice/{powertree,powermodels,sequencer}.ts` | converters/switches/LDOs from topology + net names; behavioral regulators (B sources); FB-divider check; ACPI state sequencing (MacBook: 83.6 % agreement with rail names) |
| Faults & meter | `src/faults.ts`, `src/spice/dmm.ts` | severity ranges (estimates, as data); generic 6000-count DMM (ranges, test current, contact resistance, diode test) |
| Thermal | `src/thermal.ts` | 2D plate + part nodes; injection, freeze spray, IPA; plane heat-sinking; rework heat sources |
| Intermittents | `src/intermittent.ts` | thermal-open, thermal-leak, flex-open, flex-close |
| Rework | `src/rework.ts` | reflow (flux), molten/removable, lifted pads, overheat, MLCC shock (preheat), blow-off |
| Author Studio faults | `src/faults.ts` (`applicableFaults`, `listFaults`, `clearFault`), `src/ui/app.ts` | inspector card (author mode): every class that fits the part, pad + severity (blank = sampled from the documented range), per-part fault list with remove; Studio tab lists all faults board-wide; Fast-DC warning for SPICE-only faults |
| Rendering / camera | `src/render/{camera,webgpu}.ts` | one realistic palette for every board (no blue boardview); free 3D orbit that hands over to the other side past edge-on (3D = one board, "Both" is 2D only); dense-board labels only when ≥ 9 px on screen and non-overlapping (`placeLabels`); 2-pad chip parts drawn with end caps over their pads; selected part shows airwires (`src/airwires.ts`, per-net MST, nets > 250 pins skipped). `.brd` import draws **no** copper (the format has no routing; the old MacBook `tracedNets` straight-line traces were removed — all nets connect by name) |
| Power-up / bench PSU | `src/boot.ts`, `src/spice/{loads,sequencer,powermodels}.ts`, `src/spice/solveWorker.ts` | SPICE+PWR: emulated controller steps G3H→S5→S3→S0→S0SW, waits for its main regulators (bucks/boosts/LDOs, ≥ medium confidence), else gives up → standby → retry (boot loop). Rail loads = decoupling-cap count × 20 mW × state activity (**estimate**). Regulator current limits (estimates). diode-OR / FET-switch models; enables with no netlist node follow the controller; guessed-value R links between rails ≈ 0 Ω. PSU panel with V/A + 10 s chart; state solves run in a Web Worker. MacBook (repaired): 17 mA G3H → 51 mA S5 → 91 mA S3 → 313 mA S0 |
| Chip & copper faults | `src/faults.ts`, `src/connectivity.ts` | `ic-rail-short` (power pin → GND inside a chip, from net names); damaged converter stops regulating; `net-break` (broken copper on a name-connected net: spanning tree minus the link toward the larger rest; jumper repairs, reflow / new part do not) |
| Visual evidence | `src/residue.ts`, `src/render/webgpu.ts` | liquid / corrosion crust at pins (amount 0..1); IPA scrub halves it, leak rises, gone < 0.1; scorch under burnt parts |
| Oscilloscope | `src/scope.ts` (tool O) | Roll = real simulated data per frame (ramps, sequencing, boot loops); Auto = **synthesized** switch node (duty Vout/Vin, fsw 600 kHz est.), ripple (0.8 % est.), clocks from net-name frequency when a chip on the net is powered |
| Thermal camera | `src/thermal.ts` | apparent temperature ⁴√(εT⁴+(1−ε)Ta⁴): bare metal ε 0.1, mask/packages 0.9; rosin method (tool R): film melts clear above 60 °C (estimate) |
| Meter F / A | `src/spice/dmm.ts` | capacitance by charge time: parallel R inflates / OL in circuit (lift to measure); 10 A shunt in series |
| Calibration | `src/calibrate.ts`, `src/calibrate-cli.ts` | measurements CSV → per-reading comparison with tolerances, fitted `loadScale` → scenario `calibration` block applied by the simulator; optional per-row `tol`; `--repair` for demos. `docs/calibration/` = published design values of the open demos. **No bench measurements yet** |
| Problem generator | `src/scenarios/generate.ts` | `generateProblem(parent, fixedBoard, {solver, faults})`: 1–3 catalogue faults on a just-fixed board, each failing a bench check alone, no overloads; flag re-locked to the fixed board; `Scenario.generated` = root board. UI: "Next problem on this board" card (Overview tab) |
| mod.io client | `src/mods/modio.ts` | build-time `VITE_MODIO_*` config (tab hidden when unset), `listMods` / `downloadMod` (100 MB cap, size check), installed-file tracking for Update. UI: Mods window → Browse mod.io |
| Airwires | `src/airwires.ts` | follow design nets (pad net names), not live connectivity, so they do not reveal damage |
| KiCad import (real boards) | `src/io/{kicad,benchSupply}.ts`, `src/connectivity.ts`, `src/geom.ts` | rotation sign fixed (KiCad CCW kept); inner-layer copper → `Board.hiddenCopperNets` (vias / TH pads joined by design) plus display-only `Board.inner` (tracks + fills, pours simplified to 0.05 mm; drawn in X-ray and as the selected net's overlay); arcs; multi-layer + multi-island pours; thermal-relief contact; `dnp` → not fitted; bidirectional ESD/TVS + multi-pin diodes → no DC path; L/FB/NT → low-ohm paths; `C_100n_0402` values; coin cells 3 V; bench supply (`J_BENCH`) on the power tree's input rail (12 V assumed if unnamed); earcut triangulation cached per pour; part bodies sized from the F.Fab/B.Fab outline (SMD parts as chips/boxes, offset outlines kept in `body.off`); bodies that cover ≥2 other parts on their side (module sockets, shields) render as open frames with a light tint so parts beneath stay visible and clickable (`occluders()` in `src/render/webgpu.ts`) |
| Open-hardware demos | `scripts/build-demos.ts`, `public/demos/`, `docs/DEMOS.md` | MNT Reform 2 motherboard (CERN-OHL-S-2.0) and Antmicro Jetson Nano baseboard (Apache-2.0) at pinned commits; build verifies healthy-pass / faulted-fail / repair-unlocks; lazy-loaded; `Scenario.solver`, `meta.credits/license/source` |
| Walkthrough videos | `scripts/videos/{director,scenes,record}.ts`, `public/videos/`, `docs/VIDEOS.md` | approach + spoiler-gated solution per premade scene (8 scenes, 16 videos, 9 MB); recorded from the real app via `?automation=1` hook; a solution take fails unless the flag really unlocks; flags blurred; Inspector "Fit new part" for any empty / damaged footprint |
| Boardview import | `src/io/{brd,tvw}.ts` | TopTest / OpenBoardView `.brd`, BRD2, Tebo-ICT `.tvw` (arcs, header codes, fixture objects via resync); `buildBoardview` shared; pins named, pad shapes and R/C values from TVW; no copper routing (nets by name) |
| Translations | `src/i18n/{index,ru}.ts`, `docs/TRANSLATING.md` | English keys, plurals, lazy-loaded language chunk; Russian complete and test-enforced |
| Bug snapshots | `src/snapshot.ts`, `scripts/repro.ts`, `src/ui/feedback.ts` | `DBSNAP1:…:END` in feedback emails; repro rebuilds shipped boards and flags shorts / mismatches |
| Game integration | `src/ui/app.ts`, `src/render/webgpu.ts`, `src/verify.ts` | solver choice (Fast DC / SPICE / SPICE+PWR) in **Bench** dropdown; tools 9 freeze, 0 IPA, H hot air, B press; realistic rework mode; live thermal at 60 fps on the 2,030-part board |

Tests: `test/{solve,spice,differential,ngspice,devicelib,schematic,powertree,realism,thermal,intermittent,rework,authoring,generate,boot,scope,camera,calibrate,kicad,brd,tvw,importnets,snapshot,i18n,demos,demoboards,videos,mods,modio,touch,analytics}.test.ts` (`npm test` runs all).

Flag lock: `topology()` (`src/crypto.ts`) adds per-part tokens for leak (`!L`, incl. thermal-leak), drift (`!D`) and
intermittents (`!I`, even dormant), like `!X` for burnt — a fault the objectives miss must still be repaired.

## Data / licensing

- `board_schemas/schematic-macbook-j113-82000165-05100385.pdf` and the generated
  `board_schemas/J113  820-00165.spice.json` are Apple-proprietary **test fixtures only**;
  the final product will not ship them. Nothing derived from them is in the build.
- `board_schemas/820-00165.backlight.spice.json` is a small hand-written test fixture.
- These fixtures are **not in the public repository**: `board_schemas/` and `test/private/`
  (the MacBook scenario, `MACBOOK_820_00165_QUIRKS`, `loadMacbookAirScenario`) are git-ignored.
  Tests load them through `test/fixtures.ts` only when present and skip otherwise.
  `parseBrd` itself is generic and ships.

## Open items (proposed order)

0. **Two-layer thermal model — attempted 2026-11-16, reverted.** Skins + core with implicit
   vertical coupling works numerically (4 ms/frame on the MacBook board) but shifts tuned
   rework behaviour: the crux is the iron contact model (heat into pad vs part body via the
   solder bead). With pad-only contact a single tip cannot melt a 0402; with a body share both
   pads reflow equally fast and flux melts in 0.05 s. Needs a redesigned contact model, then
   recalibration of the rework tests. The attempt is not in the tree.
0. **Provenance-tier UI (plan step 7, proposed 2026-11-19, ask before building):** show each
   value's tier ("datasheet-verified" / "matches published board values" / "bench-measured" /
   "estimate") and regulator confidence next to meter readings and in the Inspector. Data exists:
   `DeviceDef.verified/source`, `RegulatorDef.source`, power-tree `confidence` + `target` (setpoint /
   rail-name / fb-divider), estimated rail loads. Needs English + Russian strings, gated mobile text.
0. **Re-record the walkthrough videos** for Backwards Day, Smoke Test, Bridge Troll (quoted
   fast-mode readings changed 2026-11-19; captions are checked live during recording).
0. Real bench data: run `npm run calibrate` with measurements of one known-good board (diode /
   Ω / supply-current rows; none are published for the open demos).
0. **CI:** no PR workflow yet; `pages.yml` does not install ngspice, so `test/ngspice.test.ts`
   skips in CI (add `sudo apt-get install -y ngspice`). Private MacBook fixtures still local only.
0. **Device library:** 17/22 verified (BC846BLP = Diodes BC846BLP4, via the parts pipeline; CSD87333Q3D
   added from TI SLPS350A — the MacBook's CSD58873Q3D is a different, apparently custom part with no
   public datasheet; follow-ups on 2026-11-19 with poppler and PDFs the user
   downloaded into ~/Downloads: DMN32D2LFB4, DMN5L06VK, RB160M-60, SiSA18DN / SiSA12DN (measured
   column of Vishay's SPICE-model documents), BAT30CWFILM, RB521ES-30; typicals partly read from
   datasheet figures and noted as such). Still unverified: CSD58873Q3D (no public datasheet), the
   debug LED (no part number); partial: MMBT3904LP (Vbe / Early
   estimates), SDZT15R6.8 (Vz checked, no forward spec), ESD112 (limits only). Vendors serve bot
   pages to scripted downloads (a browser user-agent was refused): the user downloads PDFs by hand;
   read them with `pdftotext -layout` / `pdftoppm` (poppler installed). Never commit datasheets.
   `thetaJA` is recorded but the thermal model does not use it yet.
0. **Regulators:** only the demos' parts are listed; CURRENT_LIMIT per class, rail loads
   (decoupling caps × 20 mW) and dropout remain estimates. The power tree misses the Reform's
   LM62460 / TLV62568 FB dividers (targets come from rail names; within 0.5 % of design).
0. **Engine:** transient step control has no truncation-error check (fast edges at default step
   ~10 % off vs ngspice 4.5 %; only the CLI uses `.tran`).
0. **Importers:** NM-D562 file never received (fix is generic, confirm when it arrives); `.tvw`
   traces / vias / pours still not imported.
0. MacBook S4 load switch U3210 (PP3V3RHV_S4_TBTAPWR) never powers (input rail unmodelled);
   PP3V3_S0SW_LCD_UF buck is low-confidence (unmodelled). Scenario load (first solve) still blocks ~0.5 s.

1. Visual polish: frost reads grey; cold spots (IPA / frost cooling) are clamped by the IR palette
   floor (24 °C) and barely show.
2. Missing chip models: IC-internal LDOs (PCH/SMC), setpoints for VID rails (CPU VR),
   charger and backlight boost targets.
3. Two-layer thermal model (surface vs planes) to drop the hot-air coefficient compensation.
4. (done 2026-11-19 for 8 parts; see above.)
5. Voltage injection not yet exercised in the browser (covered by Node tests).
6. Pre-existing: favicon 404 (harmless).

## Known modelling assumptions (documented in code)

Fault severity ranges, intermittent trigger ranges, thermal constants (k_in-plane 35 W/mK,
h 12 W/m²K, joint 11 000 W/m²K ≈ 150 K/W for 0402), rework limits (SAC305 217 °C, pad lift
300 °C/6 s, part 300 °C/10 s, MLCC shock 150 K/s unless ≥100 °C baseline), hot-air
coefficients at the upper end of the jet range (compensates the 1-layer plate), PCB-copper
"SHORT footprint" rule for OMIT parts (R5490 — to confirm on a real board).
