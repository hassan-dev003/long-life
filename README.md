# Long Life

**Long Life** is a turn-based life-and-finance simulator. One click advances your character's life by a
week. From a chosen starting scenario — a comfortable 18-year-old with a school certificate, or a
destitute nobody with nothing — you navigate education, careers, business, investing, real estate,
relationships, and the slow pressure of aging.

The long-term spine is survival against time: aging erodes your health, and the only way to buy more life
is the **Elixir** — expensive, and pricier every time. So the real game is *out-earning your own
mortality*: compound enough wealth, fast enough, to keep affording the next Elixir before your health
gives out. Get obscenely rich and you can even fund the **seven great works** — cure cancer, end world
hunger, reverse climate change — the game's moral capstone.

> *"An idle-tycoon life sim where you race compounding wealth against your own aging — build a career, an
> empire, a portfolio, a family, and buy yourself more years, one week at a time."*

---

## Status

🟢 **M1 is playable.** The **design bible** (five docs in `docs/`) is finalized at v1.0 and specifies the
game end to end; the **M1 vertical slice** is now built on top of it — a full life is playable
end-to-end in the browser, saves survive a refresh, and a seeded golden-run test locks the behavior in
CI. An earlier single-file React prototype proved the core loop; this is the ground-up, structured
rebuild.

🟡 **M2 (economy depth) is underway.** On top of the M1 slice: all nine unique-gated career ladders,
the full business system (Team-Morale model), the Food/Clothes lifestyle split, and the auxiliary
education tracks are now built and green in CI. Markets & property (M3) come next.

**What's in M1:** the pure `tick(state, action)` engine + seeded RNG, versioned localStorage saves,
Health/Happiness with age-driven decay, **death, breakdown & bankruptcy** rules, the Elixir, the
education spine (with majors), the unique-gated **Tech** career ladder + entry jobs (backed by a
lightweight skills slice), leisure, the bank with an **auto-deposit** slider, home/food/subscription
lifestyle, a small event set (outcome + choice), and the **Normal Life** scenario. Purchases are gated on
**cash-in-hand** (the bank is a separate vault you withdraw from). All wired to a dark-first,
green-accented UI: a **Live** hub, **Work / Learn / Bank / Finances / Lifestyle / Legacy** tabs, blocking
modals (event choice, goal celebration, bankruptcy warning, death), and a **New Life** reset.

## The design bible

Five documents, in `docs/`, specify the game end to end:

| Doc | What it covers |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product vision, the Elixir-vs-aging spine, scope, scenarios/goals/perks, success criteria |
| [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) | Mechanics & formulas: the tick, stats/death, careers, business, market, events, longevity, philanthropy |
| [`docs/TECHNICAL_ARCHITECTURE.md`](docs/TECHNICAL_ARCHITECTURE.md) | Stack, project structure, the pure tick engine, seeded RNG, persistence, testing |
| [`docs/CONTENT_DATA_SPEC.md`](docs/CONTENT_DATA_SPEC.md) | TypeScript schemas + first data: education, careers, businesses, assets, real estate, events, scenarios, perks |
| [`docs/UI_DESIGN.md`](docs/UI_DESIGN.md) | The dark-mode, green-accent visual & interaction system |

## What makes it tick

- **The week is the atom.** Every system — work, study, income, interest, aging, events — resolves through
  one pure `tick(state, action) → state` reducer. Turn-based, no time-skip.
- **Out-earn mortality.** No prestige multipliers. The Elixir is the only continuity, and it compounds in
  cost — so the endgame is a genuine compounding-vs-aging race.
- **Three viable engines.** Careers (promotion ladders with a *unique gate per role*), businesses (grow
  from loss to profit via team morale), and the market (hidden volatility you learn by feel, news you read
  by tone) — no single dominant strategy.
- **A life, not a spreadsheet.** State-weighted random events, relationships and family, skills and traits,
  and scenario-driven starts make each run its own story.
- **Grounded economy.** Market-realistic prices from pocket change up to a $999,999,999,999,999 ceiling.

## Tech stack (planned)

TypeScript · React 18 · Vite · Zustand · Vitest. A framework-agnostic pure engine (`src/engine/`) with the
world defined as data (`src/content/`, `src/config/tuning.ts`); local-first, versioned `localStorage`
saves. See the Technical Architecture doc.

## Roadmap

- **M1 — Playable vertical slice ✅ built:** pure tick engine + save/load + Health/Happiness + death rules
  + Elixir + education spine + one career ladder + leisure + bank + a small event set + the Normal Life
  scenario. *A full life playable end-to-end, deterministic golden-run test in CI.*
- **M2 — Economy depth (in progress):** all majors & **all nine career ladders**, the **business
  system** (Team-Morale model, loss→profit lifecycle), **split lifestyle** (Food/Clothes), and
  **auxiliary education** (med school, bar, academies, trade). *Life Courses move to M4 with the full
  skills/traits system they depend on.*
- **M3 — Markets & property:** market tabs, parody tickers, hidden volatility, news feed, real estate.
- **M4 — Life texture:** relationships/family, skills/traits, life courses, deep health.
- **M5 — Meta:** full scenario/goal/perk catalog, achievements, philanthropy, balance pass.
- **Roadmap:** business IPOs & insider trading.

## Development

```bash
npm install
npm run dev        # Vite dev server
npm test           # Vitest (engine, property, and the seeded golden-run test)
npm run typecheck  # tsc --noEmit (strict)
npm run lint       # ESLint
npm run build      # typecheck + production build
```

**Architecture:** a framework-agnostic pure engine (`src/engine/`) with the world defined as data
(`src/content/`, `src/config/tuning.ts`), a typed `GameState`/`Profile` (`src/state/`), a thin Zustand
store (`src/store/`), and a token-driven React UI (`src/ui/`). The dependency arrow points one way:
UI → store → engine → content/config. All balance numbers live in `config/tuning.ts` and per-item
`content/` rows — re-tuning never touches engine logic. See `docs/TECHNICAL_ARCHITECTURE.md`.

---

*Design in progress. The bible in `docs/` is the source of truth; expect it to evolve as the game is built.*
