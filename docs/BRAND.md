# DEADBOARD — brand basics

**Name:** DEADBOARD (always one word, all caps in the wordmark; "Deadboard" in running text is fine).
Repair slang for a board that will not power on, with a nod to `0xDEADBEEF`.
**Tagline:** *Bring dead boards back.*  **Descriptor:** Board-level repair trainer.

Audience: a professional core (repair technicians, training centres) with a playful
challenge edge (CTF-style repair puzzles). Credibility first, personality second.

## Logo

| Asset | File |
|---|---|
| Mark (board outline, flatlined trace that spikes back to life, ending in a via) | [`brand/deadboard-mark.svg`](brand/deadboard-mark.svg), in-app: `markSvg()` in `src/ui/logo.ts` |
| Lockup (mark + wordmark + cursor + tagline, on dark) | [`brand/deadboard-lockup.svg`](brand/deadboard-lockup.svg) |
| Favicon / app icon | `public/favicon.svg` |

- The wordmark is JetBrains Mono Bold, tracked +0.14 em, followed by a phosphor-green block cursor
  (blinks in the app; static in print and when reduced motion is on).
- Signal green is only for the trace and cursor; the board outline uses the text colour.
- Minimum mark size: 16 px. Keep clear space of half the mark's width around it.
- Don't recolour the trace, add glows or gradients, or put the mark on a busy background.

## Colour (tokens in `src/ui/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--bg` / `--surface` / `-2` / `-3` | `#090c0a` `#0f1311` `#141916` `#1a201c` | green-tinted near-blacks, back to front |
| `--border` / `--border-strong` | `#222a25` `#2e3832` | 1 px hairlines |
| `--text` / `--text-2` / `--muted` | `#e3eae5` `#aeb9b1` `#7d8a82` | primary / secondary / tertiary text |
| `--accent` (phosphor) | `#4be38a` | the one brand accent: active states, primary actions, focus |
| `--accent-ink` | `#04140a` | text on an accent fill (never white on green) |
| `--warn` / `--danger` / `--ok` | `#f2b33d` `#ff5f57` `#34c77b` | status |

Instrument colours keep their bench meaning and are **not** brand colours: probe red, scope
trace yellow `#f5d547`, supply volts green `#7ee787`, supply amps amber `#ffa657`, thermal ramp.

## Type

- **JetBrains Mono** (variable): wordmark, readings, values, net names, code.
- **Inter** (variable): interface text, labels, explanations.
- Both are bundled (`@fontsource-variable/*`), with no font requests to third parties.

## Voice

Precise like a technician, terse like a terminal, with the occasional dry joke.

- Lead with the fact and its unit; name the part and the net (`R7788`, `PP3V3_S5`, `317 mA`).
- Say what to do next, not only what went wrong.
- Never fake certainty: estimates and synthesized data are labelled as such.
- Humour stays short and goes in successes and empty states, never in error details.

| Instead of | Write |
|---|---|
| All test bench objectives passed! | All checks green. The board is alive. |
| Objectives pass electrically, but circuit topology differs… | Checks pass, but the circuit is not the reference design — a fault is still hiding in there. |
| Flag unlocked | Flag captured |
| Created blank sandbox board. Lock a flag in CTF Studio! | Blank board ready. Lock a flag in the Author tab, then break it. |

## Kept for compatibility

The scenario file format id `pcbfix/1`, the `.pcbfix.json` extension, the `pcbfix_*` browser
storage keys and existing `PCB{…}` flags are unchanged, so shared challenges and saved settings
keep working. Rename them only together with a migration.
