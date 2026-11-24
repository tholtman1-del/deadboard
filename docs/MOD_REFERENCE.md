# Mod reference

Every field a mod can use, in one place. New to mods? Start with the guide,
[Make your own boards](MODDING.md), and come back here to look things up. Programs (solvers,
importers, panels) are in [Code mods](CODE_MODS.md); what keeps players safe is in
[Are mods safe?](MOD_SAFETY.md).

## A mod package

A mod is a folder, or a `.zip` of it, with `mod.json` at its top (or inside one top-level folder).
Paths in `mod.json` are relative to that top, use `/`, and are case-sensitive. A path can't leave
the mod (`..` is refused).

| Limit | Value |
| --- | --- |
| Files in a `.zip` | 4,000 |
| Unpacked size | 512 MB in all, 256 MB per file |
| Boards per mod | 500 |
| Entries per list (`patches`, `knowledge`, `puzzles`, …) | 500 |
| Code file | 2 MB |

Encrypted and ZIP64 archives aren't read; the zip tools built into Windows and macOS make
archives that work.

## mod.json

Two formats are read. `deadboard-mod/1` lists boards and works in every version of the app.
`deadboard-mod/2` adds everything else on this page. Use `/2` only when you need it.

| Field | Format | Required | What it is |
| --- | --- | --- | --- |
| `format` | both | yes | `"deadboard-mod/1"` or `"deadboard-mod/2"`. |
| `id` | both | yes | 2–64 characters: lowercase letters, digits, `.`, `-`, `_`. Unique; keep it the same in every version (installing the same id replaces the mod). Ids starting with `official-` are reserved. |
| `name` | both | yes | What players see (up to 80 characters). |
| `license` | both | yes | SPDX id of the mod's content: `CC-BY-4.0`, `CC0-1.0`, `CERN-OHL-S-2.0`, `MIT`… |
| `version` | both | no | `/1`: any text, default `1.0.0`. `/2`: must be `MAJOR.MINOR.PATCH` (`1.2.0`; a `-beta.1` tag is allowed). |
| `author` | both | no | Name or handle. Default `anonymous`. |
| `description` | both | no | Up to 2,000 characters. |
| `homepage` | both | no | An `https://` link. |
| `boards` | both | `/1`: yes | The boards (see [Boards](#boards)). A `/2` mod may leave it out when it has other items or lists mods in `requires`. |
| `requires` | `/2` | no | Mods this one needs: `{ "mod-id": "version range" }` (see [Dependencies](#dependencies)). |
| `conflicts` | `/2` | no | Mods this one can't run next to: `{ "mod-id": "version range" }`. |
| `patches` | `/2` | no | Changes to other mods' items ([Patches](#patches)). |
| `knowledge` | `/2` | no | [Knowledge packs](#knowledge-packs). |
| `puzzles` | `/2` | no | [Puzzles](#puzzles). |
| `devices` | `/2` | no | [Device models](#devices). |
| `faultTypes` | `/2` | no | [Fault types](#fault-types). |
| `meters` | `/2` | no | [Meters](#meters). |
| `rules` | `/2` | no | [Diagnostic rules](#rules). |
| `code` | `/2` | no | Makes this a [code mod](CODE_MODS.md): `{ "entry", "api", "permissions" }`. |

Problems that stop a mod are reported together, so one install shows everything to fix. Fields a
newer app knows (or that are misspelt) are reported as warnings and ignored, so a mod made for a
newer app still loads.

## Ids, versions and addresses

**Versions** are compared as semver. **Version ranges** in `requires` and `conflicts`:

| Range | Means |
| --- | --- |
| `"^1.2"` | 1.2.0 or newer, below 2.0.0 (for `0.x`: the same minor) |
| `"~1.2.3"` | 1.2.3 or newer, below 1.3.0 |
| `">=1.0"`, `">1.0"`, `"<2"`, `"<=2.1"` | comparisons; combine with a space: `">=1.0 <2"` |
| `"1.2.3"` | exactly that version (`"1"` or `"1.2"`: any version in that major or minor) |
| `"*"` | any version |

A prerelease (`2.0.0-beta`) only matches a range that names a prerelease.

**Addresses** name one item of one mod: `<mod id>/<type>/<item id>`.

| Type | Address example | Item id is |
| --- | --- | --- |
| `boards` | `starter-kit/boards/night-light` | the board's `id` (shipped boards: their built-in id) |
| `puzzles` | `night-light-extras/puzzles/barely-glows` | the puzzle's `id` |
| `knowledge` | `night-light-extras/knowledge/night-light-rails` | the pack's `id` |
| `devices` | `official-solvers/devices/bss138pw` | the part number in lowercase, other characters as `-` |
| `faultTypes` | `official-faults/faultTypes/mlcc-dead-short` | the class or fault type `id` |
| `meters` | `official-instruments/meters/generic` | the meter's `id` |
| `rules` | `official-rules/rules/short-cap` | the rule's `id` |
| `solvers` | `official-solvers/solvers/spice-power` | the solver's id |

To use another mod's item (patch it, build a puzzle on its board, attach knowledge to it), list
that mod in `requires`. The shipped content is the [official mods](#official-items): require
`"official-boards": "^1.0"` and so on.

## Dependencies

When the app loads mods it works out which can run:

- a mod the player turned **off** (Mods window, per loadout) doesn't run;
- a mod whose `requires` aren't met is **blocked**: the dependency is missing, the wrong version,
  turned off, or blocked itself. Its card says which, with **Find on mod.io** or **Turn on**;
- a mod whose `conflicts` match a running mod steps aside and says why;
- running mods load **dependencies first**; otherwise in install order.

A `/2` mod with only `requires` and no items is a **pack**: share a set of mods as one.

## Boards

| Field | Required | What it is |
| --- | --- | --- |
| `file` | yes | `.kicad_pcb`, `.brd` (boardview), `.tvw`, or `.pcbfix.json` (exported from the Author tab). |
| `id` | no | Unique within the mod. Default: the file name. |
| `title` | no* | Name in the board list (*give imported boards one: they're then listed without being parsed). |
| `description` | no | Up to 4,000 characters. |
| `difficulty` | no | 1–5. |
| `hints` | no | Up to 10 notes, revealed one by one. |
| `bom` | no | CSV/TSV that sets part values and DNP parts (see the guide). |
| `schematic` | no | `.pdf`, `.png`, `.jpg`, `.webp` or `.svg`, shown next to the board. |
| `objectives` | no | The tests (below). A `.pcbfix.json` brings its own. |
| `solver` | no | `"fast"`, `"spice"`, `"spice-power"`, or an address: `official-solvers/solvers/…`, or a code mod's solver (that mod in `requires`; players without it get SPICE). |
| `credits`, `license`, `source` | no | Attribution for a board you didn't design; `source` must be `https://`. |

A `.pcbfix.json` may also carry `"alloy"`: `"sac305"` (lead-free, the default), `"sn63"` (63/37
tin-lead) or `"sn60"` (60/40). It sets the melting points for realistic rework on that board.

**Objectives:**

```json
{ "type": "led", "ref": "D1", "on": true, "switches": { "SW1": true } }
{ "type": "voltage", "a": "TP1", "b": "TP2", "min": 2.3, "max": 2.7, "switches": { "SW1": true } }
```

`led`: the LED is lit (or not). `voltage`: the voltage at pin 1 of `a`, against ground or against
pin 1 of `b`, lies in `[min, max]`. `switches` sets switches first (`true` = pressed / closed).

A challenge's **flag** is locked to the board's repaired wiring and fault state in the Author tab;
it unlocks only after a real repair, whatever solver or mod is in use.

## Patches

A patch changes one item of another mod, without copying it:

```json
{ "target": "official-boards/boards/builtin-ghost-short", "set": { "difficulty": 5 }, "why": "harder for my class" }
```

- `set` is a JSON merge patch: objects merge, lists and plain values replace, `null` removes.
- `why` (up to 500 characters) is shown in the Mods window next to the change.
- Patches apply in load order; when two mods set the same field the later wins and both are shown.
- After each patch the item is checked again; a patch that would break it is skipped with the reason.
- Turning the mod off undoes its patches.

| Target type | Fields `set` may change |
| --- | --- |
| `boards` | `title`, `description`, `difficulty`, `hints`, `objectives`, `solver` (never the board, its parts or its flag) |
| `devices` | `description`, `pkg`, `units`, `verified`, `source`, `thetaJA`, `note` (a patch that changes numbers without its own `source` makes the part unverified) |
| `faultTypes` (official) | `range` only |
| `faultTypes` (a mod's) | `name`, `description`, `applies`, `effects` |
| `meters` | any meter field |
| `rules` | `when`, `suspect`, `weight`, `confirm`, `why` |

## Knowledge packs

What a technician knows about a board that its file doesn't say. Shown in the Overview tab.

| Field | What it is |
| --- | --- |
| `id`, `board` | The pack's id; the board's address. |
| `title` | Optional heading. |
| `rails` | Each: `net` (its name on the board), `nominal` (V), `domain` (e.g. "always on"), `source: { ref, kind }`, `checks: [{ at, pin, expect, readsLowIf }]`, `notes`, `provenance`. |
| `powerUp` | Rail nets in the order they come up. |
| `notes` | Up to 20 texts. |
| `provenance` | `{ confidence: "documented" \| "derived" \| "estimated", kind, where }`. On the pack, and on a rail that differs. |

Parts and nets the board doesn't have are kept, struck through and listed under **Not on this board**.

## Puzzles

A challenge as a recipe: a working board, faults to plant, a story.

| Field | What it is |
| --- | --- |
| `id`, `board` | The puzzle's id (not the same as a board id in this mod); the board's address. |
| `title` | Required. |
| `description`, `difficulty`, `hints` | As for boards. |
| `objectives` | Optional: the board's own tests by default. |
| `faults` | 1–10: `{ ref, fault, severity?, pad? }`. `fault` is a class from the catalogue (see [the table](#fault-classes-official-faults)) or a fault type's address. `severity` must lie in the class's range. `pad` names a pad. |
| `flag` | Optional; locked to the working board, so only a real repair unlocks it. Readable in `mod.json`. |

The board must be a working one: a board without a flag, a shipped board (the app knows its
repaired state), or a puzzle's or generated problem's base. A community challenge with a flag isn't.

## Devices

Semiconductor models from datasheet numbers, used by the SPICE solvers for every board whose parts
carry that part number (KiCad value field, BOM part number, boardview label).

| Field | What it is |
| --- | --- |
| `mpn` | Part number (the device's identity). |
| `description`, `pkg` | Text. |
| `units` | 1–8, one per transistor / diode in the package (below). |
| `verified` | `true` only with a `source`: every number read from the named datasheet. |
| `source`, `note` | The datasheet (maker, document, revision); remarks. |
| `thetaJA` | Thermal resistance, °C/W. |

| Unit `kind` | Fields |
| --- | --- |
| `nmos`, `pmos` | `vth` (V), `rds` (1–4 `[ohms, \|Vgs\|]`), `body` (`[V, A]`), `caps` (`[Ciss, Crss, Coss]` F), `pins: { D, G, S }` |
| `npn`, `pnp` | `hfe`, `vbe` (`[V, A]`), `vaf` (V), `pins: { C, B, E }` |
| `diode`, `schottky`, `zener`, `led`, `tvs-bi` | `vf` (1–6 `[V, A]`), `bv` (`[V, A]`), `cj` (F), `pins: { A, K }` |

Every model is fitted when the mod loads; one that can't be fitted is refused.

## Fault types

A fault made of effects; the Author tab and puzzles offer it next to the built-in classes.

| Field | What it is |
| --- | --- |
| `id`, `name`, `description` | Identity and text. |
| `applies` | `kinds` (part kinds), `minPads`, `needsNet` (a pad with a named net), `railToGround` (a chip with power and ground pins). |
| `effects` | 1–6 of the effects below. The first one with a range takes the severity an author types. |

| Effect `do` | Fields | Does |
| --- | --- | --- |
| `leak` | `ohms` range; `between`: two pad names or `"rail-ground"` | a resistance across the part |
| `drift` | `factor` range | multiplies the value |
| `cold` | `pad`; `ohms` range (open without it) | a cold joint |
| `open` | — | the part is open |
| `break` | `pad` | broken copper near the pad (a jumper wire fixes it) |
| `residue` | `amount` 0–1; `leaky` | visible corrosion; `leaky` makes it the leak, so IPA repairs it |
| `warm-open` | `pad`; `temp` range (°C) | opens above a temperature |
| `warm-leak` | `temp` range | leaks above a temperature |
| `flex-open`, `flex-close` | `pad`; `level` range (0–1) | opens on flex / conducts only while pressed |

Ranges are `{ "min", "max", "dist": "log" | "lin" }` (log by default).

## Meters

A multimeter profile; players pick one under **Bench → Meter**. Fields left out are the official
meter's ([values below](#meter-official-instrumentsmetersgeneric)).

| Field | What it is |
| --- | --- |
| `id`, `name` | Identity. |
| `counts` | Display counts (400–1,000,000). |
| `vInputOhms` | Voltage input impedance (Ω). |
| `vGainError`, `noiseCounts` | Gain error (fraction of the reading); last-digit noise. |
| `ohmRanges` | `[{ fullScale, itest, voc }]`, increasing. |
| `leadOhms`, `contactOhms` | Test-lead resistance; probe contact range `[min, max]`. |
| `beepOhms` | Continuity beep below this. |
| `diode` | `{ itest, voc, olVolts }` for the diode test. |

## Rules

Rules drive **Where to look?**: what the bench shows → which parts to measure first.

| Field | Values |
| --- | --- |
| `id` | Rule id. |
| `when` | `dead`, `low`, `high` (a net against the working board), `short` (a rail to ground, power off), `hot` (a part), `dark` (an LED that should light), `tested` (a part a failing test names). |
| `suspect.where` | `on-net`, `series` (two-terminal parts between this net and another), `feeds-net` (those on the side nearer the supply), `the-part` (only with `hot`, `dark`, `tested`). |
| `suspect.kinds` | Optional part kinds. |
| `weight` | 1–10 (default 5). A rule pointing at one part counts more than one pointing at many; a part on the live/dead boundary and the first net to go wrong count extra. |
| `confirm` | What to measure; `{net}` and `{ref}` are filled in. |
| `why` | Optional explanation. |

Before a rule credits parts, the engine keeps only those the physics allows (compared with the
working board in the same switch setting): for `high` and `low` with `on-net` or `series`, parts that
lead somewhere lower (ground, or a net the working board holds lower), since only those can pull a
net down; for `low` with `feeds-net`, parts that carried current on the working board; for `high` with
`feeds-net`, parts that carry current now or have voltage across them. Below 0.3 V on the working
board a net only counts as `high` or `dead`, never `low` (a floating net reads leakage).

The bench check's **recall test** plants catalogue faults on the small working boards and counts
how often the planted part is in the top 3, with and without your rules.

## Bench check

**Mods → Bench check** on a running mod, or `npm run bench-check -- <mod> [mods it needs…]`
(`--no-demos` to skip the large demos, `--run-code` to run your own code mod without the sandbox).

| The mod has | Checked |
| --- | --- |
| boards | a challenge fails its tests as shipped, a board without a flag passes, nothing burns at power-up |
| puzzles | the working board passes, the puzzle fails, each fault shows on its own |
| patches to boards | a working board still passes the patched tests |
| knowledge | every part and net named is on the board |
| devices | every board using the part, solved with and without the mod: nets that move, tests that change |
| fault types | planted on every part they fit: how often they show, whether a part burns |
| rules | the recall test, with and without the mod |
| meters | a valid profile |
| code solvers | every working board: runs, and agrees with the official solvers (tests; voltages within 50 mV / 5 %) |

✓ passed · ! worth a look · ✗ a problem players would hit.

## Official items

<!-- generated:official-items -->
<!-- Written by npm run docs from the code; edit the code, not this block. -->

### Official mods

| Mod | Version | What it holds |
| --- | --- | --- |
| `official-boards` | 1.0.0 | The tutorials, repair challenges and open-hardware demo boards that ship with DEADBOARD. |
| `official-solvers` | 1.0.0 | The circuit solvers (Fast DC, SPICE, SPICE + PWR) and the device library of datasheet-fitted semiconductor models. |
| `official-faults` | 1.0.0 | The fault catalogue: shorts, leaks, drift, cold joints, broken copper and intermittents, with severity ranges from repair practice. |
| `official-importers` | 1.0.0 | Board files the app reads: KiCad layouts (.kicad_pcb), boardviews (.brd, .tvw) and DEADBOARD challenges (.pcbfix.json). |
| `official-rules` | 1.0.1 | Diagnostic rules for «Where to look?»: from what the bench shows (a dead rail, a short, a hot part, a dark LED) to the parts worth measuring first. |
| `official-instruments` | 1.0.0 | The bench instruments and their profiles: the multimeter (ranges, test currents, input impedance), scope, thermal camera and bench supply. |

### Boards (`official-boards`)

| Address | Board |
| --- | --- |
| `official-boards/boards/builtin-first-light` | First Light |
| `official-boards/boards/builtin-tut-cold-joint` | Cold Joint 101 |
| `official-boards/boards/builtin-tut-solder-bridge` | Solder Bridge 101 |
| `official-boards/boards/builtin-tut-polarity` | One-Way LED |
| `official-boards/boards/builtin-tut-resistor` | Resistor & Ohm's Law |
| `official-boards/boards/builtin-tut-divider` | Voltage Divider 101 |
| `official-boards/boards/builtin-transistor-switch` | Transistor Switch |
| `official-boards/boards/builtin-bridge-troll` | Bridge Troll |
| `official-boards/boards/builtin-backwards-day` | Backwards Day |
| `official-boards/boards/builtin-ghost-short` | Ghost Short |
| `official-boards/boards/builtin-smoke-test` | Smoke Test |
| `official-boards/boards/builtin-sagging-rail` | The Sagging Rail |
| `official-boards/boards/hr-solder-flux` | Solder and Flux |
| `official-boards/boards/hr-heat-time` | Heat and Time |
| `official-boards/boards/hr-clean-inspect` | Clean and Inspect |
| `official-boards/boards/demo-mnt-reform2-mb30` | MNT Reform 2 · dead 3.3 V rail (demo, loads when opened) |
| `official-boards/boards/demo-antmicro-jetson-nano-bb` | Antmicro baseboard · no 3.3 V, flaky 5 V (demo, loads when opened) |
| `official-boards/boards/demo-olimex-esp32-devkit-lipo` | Olimex ESP32-DevKit-LiPo · dead on USB, won't charge (demo, loads when opened) |
| `official-boards/boards/demo-olimex-esp32-c3-devkit-lipo` | Olimex ESP32-C3-DevKit-Lipo · hot board, wrong 3.3 V (demo, loads when opened) |
| `official-boards/boards/demo-esp32-c3-rust-board` | ESP32-C3 Rust board · rails fine, chip asleep (demo, loads when opened) |
| `official-boards/boards/demo-rana-tadpole-v2` | Rana Tadpole · dead controller, warm chips, one dead button (demo, loads when opened) |
| `official-boards/boards/demo-rana-tadpole-v1` | Rana Tadpole V1 · dead on USB (demo, loads when opened) |

### Solvers (`official-solvers`)

| Address | Short name | Solver |
| --- | --- | --- |
| `official-solvers/solvers/fast` | `fast` | Fast DC: Piecewise-linear DC solver: instant, parts are open or closed. |
| `official-solvers/solvers/spice` | `spice` | SPICE: Device physics and a realistic meter; uses the device library. |
| `official-solvers/solvers/spice-power` | `spice-power` | SPICE + PWR: SPICE plus the board's regulators and power sequencing from its power tree. |

### Device library (`official-solvers`)

Patch an entry by its address. Numbers are the datasheet quantities; see [Devices](#devices).

| Address | Part number | Units | Verified |
| --- | --- | --- | --- |
| `official-solvers/devices/fdc638apz` | FDC638APZ | pmos | yes |
| `official-solvers/devices/dmn5l06vk` | DMN5L06VK | nmos, nmos | yes |
| `official-solvers/devices/dmn32d2lfb4` | DMN32D2LFB4 | nmos | yes |
| `official-solvers/devices/ntud3169cz` | NTUD3169CZ | nmos, pmos | yes |
| `official-solvers/devices/si5419du` | SI5419DU | pmos | yes |
| `official-solvers/devices/si7137dp` | SI7137DP | pmos | yes |
| `official-solvers/devices/si8409db` | SI8409DB | pmos | yes |
| `official-solvers/devices/irf9395` | IRF9395 | pmos, pmos | yes |
| `official-solvers/devices/sisa18dn` | SISA18DN | nmos | yes |
| `official-solvers/devices/sisa12dn` | SISA12DN | nmos | yes |
| `official-solvers/devices/csd58873q3d` | CSD58873Q3D | nmos, nmos | no |
| `official-solvers/devices/csd87333q3d` | CSD87333Q3D | nmos, nmos | yes |
| `official-solvers/devices/ntmfd4902nf` | NTMFD4902NF | nmos, nmos | yes |
| `official-solvers/devices/bc846blp` | BC846BLP | npn | yes |
| `official-solvers/devices/mmbt3904lp` | MMBT3904LP | npn | no |
| `official-solvers/devices/2n3904` | 2N3904 | npn | no |
| `official-solvers/devices/rb160m-60` | RB160M-60 | schottky | yes |
| `official-solvers/devices/rb521es-30` | RB521ES-30 | schottky | yes |
| `official-solvers/devices/nsr1020mw2` | NSR1020MW2 | schottky | yes |
| `official-solvers/devices/bat30cwfilm` | BAT30CWFILM | schottky, schottky | yes |
| `official-solvers/devices/sdzt15r6.8` | SDZT15R6.8 | zener | no |
| `official-solvers/devices/esd112-b1-02els` | ESD112-B1-02ELS | tvs-bi | no |
| `official-solvers/devices/bss138pw` | BSS138PW | nmos | yes |
| `official-solvers/devices/pmv50enea` | PMV50ENEA | nmos | yes |
| `official-solvers/devices/pmv50epea` | PMV50EPEA | pmos | yes |
| `official-solvers/devices/irlml6402` | IRLML6402 | pmos | yes |
| `official-solvers/devices/wpm2015` | WPM2015 | pmos | yes |
| `official-solvers/devices/1n5819` | 1N5819 | schottky | yes |
| `official-solvers/devices/dmg3415u` | DMG3415U | pmos | yes |
| `official-solvers/devices/b5819w` | B5819W | schottky | yes |
| `official-solvers/devices/si7850dp` | SI7850DP | nmos | yes |
| `official-solvers/devices/si7461dp` | SI7461DP | pmos | yes |
| `official-solvers/devices/bat46wj` | BAT46WJ | schottky | yes |
| `official-solvers/devices/sbr0560s1` | SBR0560S1 | schottky | yes |
| `official-solvers/devices/1n4148ws` | 1N4148WS | diode | yes |
| `official-solvers/devices/green-56mcd-2ma-2.65v` | GREEN-56MCD-2MA-2.65V | led | no |

### Fault classes (`official-faults`)

Only `range` can be patched; see [Fault types](#fault-types).

| Address | Fault | Severity range |
| --- | --- | --- |
| `official-faults/faultTypes/mlcc-dead-short` | Dead short (failed MLCC) | 0.05–2 Ω |
| `official-faults/faultTypes/cap-partial-short` | Partial short (leaky cap) | 2–50 Ω |
| `official-faults/faultTypes/liquid-leakage` | Liquid residue leakage | 100–50000 Ω |
| `official-faults/faultTypes/resistor-drift` | Resistance drift | 1.5–30 × |
| `official-faults/faultTypes/cap-capacitance-loss` | Capacitance loss | 0.05–0.6 × |
| `official-faults/faultTypes/cold-joint` | Resistive cold joint | 0.5–1000000 Ω |
| `official-faults/faultTypes/open-part` | Open (damaged part) | — |
| `official-faults/faultTypes/ic-rail-short` | Chip shorted inside (power pin to ground) | 0.2–10 Ω |
| `official-faults/faultTypes/net-break` | Broken copper near a pin (corroded trace / via) | — |
| `official-faults/faultTypes/thermal-open-joint` | Intermittent: opens when warm | 35–75 °C |
| `official-faults/faultTypes/thermal-leak` | Intermittent: leaks when warm | 35–60 °C |
| `official-faults/faultTypes/flex-open-joint` | Intermittent: opens on flex | 0.3–0.8 (flex level, 0 = still, 1 = hard) |
| `official-faults/faultTypes/flex-close-joint` | Intermittent: works only when pressed | 0.3–0.8 (flex level, 0 = still, 1 = hard) |

### Rules (`official-rules`)

| Address | When | Suspects | Weight |
| --- | --- | --- | --- |
| `official-rules/rules/short-cap` | `short` | `on-net` (capacitor) | 8 |
| `official-rules/rules/short-ic` | `short` | `on-net` (ic) | 5 |
| `official-rules/rules/short-any` | `short` | `on-net` (diode, led, resistor, generic, connector) | 3 |
| `official-rules/rules/dead-source` | `dead` | `on-net` (battery, connector) | 8 |
| `official-rules/rules/dead-series` | `dead` | `feeds-net` (resistor, fuse, switch, diode, led, generic, connector) | 7 |
| `official-rules/rules/dead-any` | `dead` | `on-net` | 2 |
| `official-rules/rules/low-source` | `low` | `on-net` (battery, connector) | 5 |
| `official-rules/rules/low-series` | `low` | `feeds-net` (resistor, fuse, diode, switch, led, generic) | 6 |
| `official-rules/rules/low-load` | `low` | `on-net` (capacitor, resistor, ic, led, diode, generic) | 4 |
| `official-rules/rules/high-open` | `high` | `on-net` (resistor, capacitor, led, diode, ic, generic) | 5 |
| `official-rules/rules/high-leak` | `high` | `feeds-net` (resistor, switch, capacitor, generic, ic) | 5 |
| `official-rules/rules/high-series` | `high` | `series` (resistor, diode, led) | 3 |
| `official-rules/rules/hot-part` | `hot` | `the-part` | 9 |
| `official-rules/rules/hot-neighbour` | `hot` | `series` (resistor, capacitor, diode) | 3 |
| `official-rules/rules/dark-led` | `dark` | `the-part` (led) | 6 |
| `official-rules/rules/tested-part` | `tested` | `the-part` | 2 |
| `official-rules/rules/dark-series` | `dark` | `series` (resistor, switch, fuse, diode) | 5 |

### Meter (`official-instruments/meters/generic`)

| Field | Value |
| --- | --- |
| `name` | generic 6000-count DMM |
| `counts` | 6000 |
| `vInputOhms` | 10000000 |
| `vGainError` | 0.001 |
| `noiseCounts` | 1 |
| `ohmRanges` | 600 Ω (0.0005 A, 1 V); 6000 Ω (0.0001 A, 1 V); 60000 Ω (0.00001 A, 1 V); 600000 Ω (0.000001 A, 1 V); 6000000 Ω (1e-7 A, 1 V); 60000000 Ω (1e-8 A, 1 V) |
| `leadOhms` | 0.2 |
| `contactOhms` | [0.02, 0.6] |
| `beepOhms` | 30 |
| `diode` | itest 0.001 A, voc 3 V, olVolts 2.5 V |

<!-- /generated:official-items -->
