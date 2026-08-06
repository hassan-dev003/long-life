# Long Life — UI Design System

> **Status:** v1.0 — FINALIZED. The visual & interaction language for **Long Life** —
> a **dark-first, green-accented** system built from current fintech/dashboard and idle-game UX research,
> and from the `dataviz` skill's rules for the game's chart-heavy surfaces. This replaces the prototype's
> look entirely. Companions: `PRD.md`, `GAME_DESIGN.md`, `TECHNICAL_ARCHITECTURE.md`, `CONTENT_DATA_SPEC.md`.

---

## 1. Design principles (why it looks the way it does)

Drawn from 2026 dark-dashboard/fintech practice and idle-game UX research:

1. **Dark-first, not dark-toggle.** Near-black surfaces are the default and the design is *built* for
   them (dark is selected, never an auto-inverted light theme). New-gen audience expects it; OLED-friendly.
2. **One accent, used sparingly. Green = money.** A single vivid green carries wealth, gains, primary
   actions, and active state. Most of the UI is neutral; green *guides the eye* to what matters. Never a
   wall of green.
3. **Color is functional, never decorative.** Green = positive/wealth/healthy, red = loss/danger, amber =
   caution — and everything else is neutral ink. A color always *means* something.
4. **Lead with one trusted number.** **Net Worth** is the hero figure, always visible — the fintech
   pattern of anchoring on a single number the player trusts.
5. **Show momentum.** Idle/tycoon games are visual metaphors for progress: bars fill, numbers roll up,
   locked things unlock with a flourish. Every meaningful change gets visible, satisfying feedback.
6. **Numbers must be legible.** It's a number-dense game — tabular figures, `moneyShort`, clear hierarchy,
   and a monospace face for financial/ticker data give a calm "terminal" precision.
7. **Accessible by construction.** Contrast is validated (not eyeballed); meaning never rides on color
   alone (icon + label + position); motion respects `prefers-reduced-motion`.

---

## 2. Color system (validated)

Dark surfaces + a money-green accent. All foreground/surface pairs were checked with the `dataviz`
validator: the accent, positive, negative, warning, and info colors each **clear ≥ 3:1 on the card
surface**, and **green↔red are CVD-separable** (ΔE 16.8) — critical, since gains/losses lean on that pair.

```css
:root {
  color-scheme: dark;

  /* Surfaces — near-black, faint cool-green cast */
  --bg:          #0a0d0b;   /* page plane */
  --surface-1:   #121714;   /* cards, panels */
  --surface-2:   #1a201c;   /* raised / hover / active row */
  --well:        #0e1210;   /* inputs, progress tracks, chart wells */
  --border:      rgba(255,255,255,0.08);   /* hairline */
  --border-strong: rgba(255,255,255,0.14);

  /* Ink */
  --text-primary:   #f4f7f5;
  --text-secondary: #9fb0a8;
  --text-muted:     #6a7873;

  /* Accent — MONEY green (the one highlight) */
  --accent:       #2fe37a;   /* highlights, active tab, primary CTA text/borders, positive */
  --accent-deep:  #16a34a;   /* large filled buttons where dark text sits on top */
  --accent-wash:  rgba(47,227,122,0.14);  /* subtle glow / selected wash */

  /* Functional status (each means one thing) */
  --positive: #2fe37a;   /* gains, income, up-ticks */
  --negative: #e5484d;   /* losses, debt, danger, down-ticks */
  --warning:  #fb923c;   /* caution (distinct from happiness gold) */
  --info:     #3987e5;   /* neutral info / links */

  /* Stat identities (kept OFF the money-green so the UI isn't all green) */
  --health:    #2dd4bf;  /* teal — vitality */
  --happiness: #fbbf24;  /* gold — warmth */
}
```
> **Light mode** is out of scope for now (the game commits to dark). If added later, it's *stepped* for a
> light surface and re-validated — never an automatic flip (per the dataviz rule).

**Stat colors are deliberately not green:** Health (teal) and Happiness (gold) each own a distinct hue so
the money-green stays special. Each stat always ships with its **label + icon + fixed position**, so the
hues never have to carry meaning alone.

---

## 3. Typography

System sans for UI text; a monospace for all figures/tickers — the "financial terminal" feel without a
loud display face.

```css
--font-ui:   'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;   /* money, tickers, stats */
```
- **All money, ages, stat values, ticker prices → `--font-mono` with `font-variant-numeric: tabular-nums`**
  so digits align and don't jitter as they roll.
- Body/labels/buttons → `--font-ui`.
- **The wordmark** ("LONG LIFE") is the *only* place a heavier display treatment is allowed (tracked caps).
- Scale (rem): hero 32–40 · h1 22 · h2 17 · body 14 · label 11 (uppercase, tracked) · fine 11 mono.

---

## 4. Layout & shell

Responsive app shell — feels like an app, not a webpage.

```
┌───────────────────────────────────────────────────────────────┐
│  TOP BAR:  ◷ Age 34 · Mar ○●○○        │  NET WORTH  $1.24M ▲    │  ← hero number, always visible
│            Health ▉▉▉▉▉░ 78 (teal)   Happiness ▉▉▉▉░ 61 (gold)  │  ← stat meters
├──────────────┬────────────────────────────────────────────────┤
│  NAV (rail)  │   TAB CONTENT (cards / panels)                   │
│  🌱 Live     │                                                  │
│  💼 Work     │   [ Card ] [ Card ] [ Card ]                     │
│  🎓 Learn    │   [ Card ] [ Card ] [ Card ]                     │
│  📈 Business │                                                  │
│  🏦 Bank     │                                                  │
│  💹 Market   │                                                  │
│  🏡 Assets   │                                                  │
│  ❤ Giving   │                                                  │
│  ✦ Life     │                                                  │
├──────────────┴────────────────────────────────────────────────┤
│  LIFE LOG (streaming feed, newest first)                        │
└───────────────────────────────────────────────────────────────┘
```
- **Wide (≥ 900px):** left **nav rail** (icons + labels) + content; top bar spans full width.
- **Narrow / mobile:** nav collapses to a **bottom tab bar** (game-app pattern); top bar compresses to
  age + net worth, stats drop below it.
- **Content** is a responsive card grid (`minmax(220px, 1fr)`), one consistent `Card` for every list item
  (jobs, programs, businesses, assets, properties, works).
- Max content width ~1040px; generous 16–20px gutters; 12–14px radius on cards; hairline borders, not heavy.
- Tabs gate by milestone (Market/Assets appear in M3, Giving in M5).

### 4.1 Time display (the clock)

The clock reads as **`Age {n} · {Mon} {week-dots}`** — e.g. `Age 34 · Mar ○●○○`. No "Year N" anywhere;
age carries the sense of time passing.

- **Age** is the primary temporal readout, in mono: `Age 34`. (Replaces the prototype's "Year 17".)
- **Month** is the in-game month (1–12) shown as its **three-letter abbreviation**: `Jan Feb Mar Apr May
  Jun Jul Aug Sep Oct Nov Dec`. Derived from `monthOfYear = floor((totalWeeks % 48) / 4) + 1`.
- **Week-of-month** is **four dots**; the active week is the one filled (dark/accent) dot, the rest hollow:

  | Week | Dots |
  |---|---|
  | 1 | ●○○○ |
  | 2 | ○●○○ |
  | 3 | ○○●○ |
  | 4 | ○○○● |

  Filled dot = `--accent` (or `--text-primary`); hollow = `--text-muted` outline. The dots advance one step
  each week — a tiny, constant momentum cue in the top bar.

---

## 5. Component library

Every screen is built from these. Tokens above; behavior below.

| Component | Spec |
|---|---|
| **HeroNetWorth** | Big mono figure in top bar; delta chip (▲ green / ▼ red) vs last week; tap → net-worth sparkline. |
| **StatMeter** | Labeled bar (Health teal / Happiness gold); value in mono; **pulses its color** on change; turns `--warning`/`--negative` with a ⚠ icon when in the danger/zero-grace state. |
| **MoneyValue** | Mono, `tabular-nums`; **color by sign** (green positive / red negative / neutral for plain balances); formatted via `moneyShort`, exact on hover. |
| **Card** | `--surface-1`, hairline border; title + tag row + action button; `--surface-2` on hover; dimmed + 🔒 with reason when locked; ✓ accent state when owned/done. |
| **Tag / Chip** | Small mono pill for facts (`+$520/wk`, `−0.5 health`, `$120k`); colored by role (positive/negative/neutral/info). |
| **Button** | *Primary* = filled `--accent-deep`, dark text; *Ghost* = hairline; *Danger* = `--negative` outline. Disabled = 40% + not-allowed. |
| **ProgressBar** | Education, promotion-to-next-role, business growth, reno progress, elixir-affordability — accent fill on `--well`; % label; smooth width transition. |
| **NavItem** | Icon + label; active = `--accent-wash` bg + accent left-border + accent icon. |
| **Modal** | Centered, dims screen; used for event-choice, **goal celebration** (blocking, confetti-lite accent burst), and death/breakdown. |
| **Toast / LogEntry** | Life-log line + transient toast for achievements/events; week stamp in muted mono; achievement toast gets an accent glow. |
| **Sparkline / PriceChart** | See §6 (dataviz method). |
| **Toggle** | Pill switch; on = `--accent`. |

---

## 6. Charts & data-viz (governed by the `dataviz` skill)

The market, portfolio, and net-worth-over-time surfaces are real charts and follow the skill's procedure
(form → color-by-job → validated palette → mark specs → hover → a11y):

- **Asset price chart = single-series line** (one asset at a time, per the tabbed market). Line in
  `--accent` when the visible window is up, `--negative` when down; soft gradient area fill beneath;
  **crosshair + tooltip** on hover (mandatory for line/area); recessive hairline grid; thin 2px line;
  4px rounded data-end. Hidden volatility is *felt* in the line's shape — we never draw a "volatility"
  number (GDD §8.2).
- **Portfolio / watchlist = rows with mini-sparklines** + a `MoneyValue` delta; if a multi-asset *compare*
  view is ever added, it uses the skill's **validated categorical palette** (fixed hue order, ≤ 3 series
  all-pairs or fold to "Other"), never the money-green for a series.
- **Net worth over time = area sparkline** in the top bar's expand.
- **Stat meters are not charts** — they're the `StatMeter` component (a labeled bar), the right call per
  "is it even a chart?".
- Every chart ships the hover layer, a table fallback, and validated contrast; status/up-down cues pair
  color with an arrow glyph so they're never color-alone.

---

## 7. Motion & feedback (the idle-game dopamine)

Restrained but present — momentum is the genre's heartbeat.

- **Number roll-up:** money and net worth *count* to their new value (~300ms ease-out) rather than snapping.
- **Bar transitions:** stat/progress bars animate width; stat meters pulse their hue on change.
- **Week advance:** a subtle tick/flash on the clock; the log's newest entry slides in.
- **Positive events / income:** brief accent glow; **achievements** pop a glowing toast.
- **Unlocks:** a card revealing (job/business/property newly affordable or eligible) does a short
  reveal + accent shimmer — "you earned access."
- **Goal complete:** the blocking celebration modal does a tasteful accent burst.
- **All motion honors `prefers-reduced-motion`** (roll-ups become instant, glows become static).

---

## 8. How this improves on the prototype

| Prototype | Long Life UI |
|---|---|
| Parchment/navy, decorative color | Dark-first, near-black; **one functional green accent** |
| Net worth buried among cards | **Hero net-worth** anchored in the top bar |
| No charts; flat tags | Real **price charts + sparklines** (dataviz method) |
| Static, snappy state changes | **Roll-ups, bar fills, unlock reveals** — visible momentum |
| Top tab strip only | Responsive **nav rail / bottom bar** app shell |
| Ad-hoc styles inline | **Token-driven** system (CSS variables) → consistent, themeable |
| Everything re-renders on any change | Pairs with selector-based store (Tech Arch §9) for snappy, scoped updates |

---

## 9. Implementation notes

- **Tokens live in one place** — a `:root` variables block (or `ui/theme.css`) holds every value above;
  components reference roles, never raw hex. Re-skinning = editing tokens.
- **CSS Modules per component** (Tech Arch §2) scope styles; the token file is global.
- **Icons:** a lightweight inline-SVG set (or emoji for flavor in logs/tabs as the prototype did) — no
  heavy icon dependency.
- **Fonts:** `Inter` + `JetBrains Mono` self-hosted or system fallbacks; never block first paint on a
  font CDN (a prototype smell — it injected a Google Fonts link at runtime).
- This doc defines the *system*; per-tab pixel layouts are built against it during each milestone, starting
  with the **M1** shell (top bar, nav, Live/Work/Learn/Bank/Assets tabs, log, modals).

---

*The five-doc bible — PRD, Game Design, Technical Architecture, Content/Data Spec, and this UI Design
System — together specify Long Life end to end: what it is, how it plays, how it's built, what's in it,
and how it looks.*
