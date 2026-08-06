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

🚧 **Design finalized; build next.** The **design bible** (five docs in `docs/`) is complete and
finalized at v1.0 — it specifies the game end to end. The **M1 playable slice** is the next step (see the
roadmap). An earlier single-file React prototype proved the core loop; this is the ground-up, structured
rebuild.

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

- **M1 — Playable vertical slice:** pure tick engine + save/load + Health/Happiness + death rules + Elixir
  + education spine + one career ladder + leisure + bank + a small event set + the Normal Life scenario.
  *A full life playable end-to-end, deterministic golden-run test in CI.*
- **M2 — Economy depth:** all majors & career ladders, businesses, split lifestyle, auxiliary education.
- **M3 — Markets & property:** market tabs, parody tickers, hidden volatility, news feed, real estate.
- **M4 — Life texture:** relationships/family, skills/traits, life courses, deep health.
- **M5 — Meta:** full scenario/goal/perk catalog, achievements, philanthropy, balance pass.
- **Roadmap:** business IPOs & insider trading.

## Development

_Not scaffolded yet — the commands below land with the M1 setup._

```bash
npm install
npm run dev      # Vite dev server
npm test         # Vitest (engine + golden-run tests)
```

---

*Design in progress. The bible in `docs/` is the source of truth; expect it to evolve as the game is built.*
