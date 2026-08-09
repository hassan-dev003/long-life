# Long Life — Technical Architecture

> **Status:** v1.0 — FINALIZED. How **Long Life** is built: stack, project structure,
> state model, the pure tick engine, seeded RNG, the data/tuning split, persistence, UI architecture,
> and testing. Companion docs: `PRD.md`, `GAME_DESIGN.md`, and — next — the Content/Data Spec.

---

## 1. Guiding principles

1. **Pure core, thin shell.** All game rules live in a **framework-agnostic engine** of pure functions.
   React only renders state and dispatches actions. You could run the whole game in a Node script.
2. **Data, not code, defines the world.** Careers, businesses, assets, events, scenarios, and every
   balance constant are **data** in `content/` and `config/`. Adding a job or re-tuning salaries never
   touches engine logic.
3. **Deterministic & reproducible.** The tick is `(state, action) → state` with a **seeded PRNG whose
   state lives inside the save**. The same seed + same inputs always produce the same life — which makes
   the game unit-testable and bugs reproducible.
4. **Local-first, loss-proof.** Autosave to `localStorage` every tick; versioned saves with migrations.
5. **Typed end-to-end.** TypeScript everywhere; the `GameState` shape is the single source of truth.

---

## 2. Stack & tooling

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** (strict) | Typed state end-to-end |
| Build/dev | **Vite** | Fast dev server, simple prod build |
| UI | **React 18** | Matches the prototype; component model fits the tabbed UI |
| State store | **Zustand** | Tiny; selector-based subscriptions avoid the prototype's "every card re-renders on any state change" smell; the store just wraps the pure engine |
| Styling | **CSS Modules** (or a single design-token stylesheet) | Keep the prototype's look; scope styles per component |
| Testing | **Vitest** | Vite-native; fast; ideal for pure-engine golden-run tests |
| Lint/format | **ESLint + Prettier** | Consistency |

No backend, no router needed for M1 (single-page, tab state is in-app). Dependencies stay minimal.

---

## 3. Project structure

```
long-life/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ docs/                      # this bible
└─ src/
   ├─ main.tsx                # React entry
   ├─ App.tsx                 # shell: header, stat bars, tabs, log, modals
   │
   ├─ engine/                 # PURE game logic — no React imports
   │  ├─ tick.ts              # the authoritative reducer: tick(state, action) → state
   │  ├─ actions.ts           # Action union + creators
   │  ├─ rng.ts               # seeded PRNG (state serialized into GameState)
   │  ├─ steps/               # pure sub-steps composed by tick.ts
   │  │  ├─ interest.ts
   │  │  ├─ business.ts
   │  │  ├─ income.ts
   │  │  ├─ upkeep.ts
   │  │  ├─ decay.ts
   │  │  ├─ study.ts
   │  │  └─ death.ts
   │  ├─ events/
   │  │  ├─ roll.ts           # eligibility → bucket → weighted pick (uses rng)
   │  │  └─ apply.ts
   │  ├─ eligibility.ts       # can the player take this job/program/business?
   │  ├─ economy.ts           # jobPay, bankRate, business math, elixir price
   │  └─ selectors.ts         # derived reads: netWorth, passiveIncome, ageYears…
   │
   ├─ content/                # DATA: what exists in the world (catalog tables)
   │  ├─ education.ts         # spine, majors, auxiliaries, life courses
   │  ├─ careers.ts           # fields + role ladders (salary, unique gates, stress)
   │  ├─ businesses.ts        # tiers, fields, field-unique stats
   │  ├─ assets.ts            # market: parody tickers, class, base price + hidden sigma
   │  ├─ realEstate.ts
   │  ├─ lifestyle.ts         # home tiers, food, clothes, subscriptions
   │  ├─ activities.ts        # leisure
   │  ├─ events/              # event registry, split by category
   │  ├─ scenarios.ts         # start conditions + goals
   │  ├─ perks.ts
   │  ├─ achievements.ts
   │  └─ skills.ts            # skill & trait definitions
   │
   ├─ config/
   │  └─ tuning.ts            # GLOBAL balance constants (decay, event chance, elixir mult, caps…)
   │
   ├─ state/
   │  ├─ types.ts             # GameState, Profile, and all sub-types
   │  ├─ initial.ts           # freshLife(scenario, profile) → GameState
   │  ├─ persistence.ts       # save/load, SCHEMA_VERSION, migrations
   │  └─ profile.ts           # account-level store (perks/achievements across runs)
   │
   ├─ store/
   │  └─ gameStore.ts         # Zustand store: holds GameState, dispatch() → engine, autosave
   │
   ├─ ui/
   │  ├─ hooks/               # useStats(), useMoney(), useTab()… selector hooks
   │  ├─ components/          # StatBar, Card, Tag, Toggle, MoneyText, Modal…
   │  └─ tabs/                # LiveTab, WorkTab, LearnTab, BizTab, BankTab, LifeTab, MarketTab…
   │
   └─ util/
      ├─ money.ts             # moneyShort (3 sig figs, k/M/B/T), MONEY_CAP clamp
      └─ clamp.ts
```

**The key boundary:** `engine/` and `content/` and `config/` import **nothing** from `ui/`, `store/`, or
React. The dependency arrow points one way: UI → store → engine → content/config.

---

## 4. State model

Two distinct persisted stores — **don't conflate them**:

### 4.1 `GameState` — one life (a run)
```ts
interface GameState {                                                       // schemaVersion is 2 as of M1
  meta: { schemaVersion: number; scenarioId: string; rngState: number; startAge: number; activePerks: PerkId[] };
  clock: { totalWeeks: number };
  stats: { health: number; happiness: number; weeksAtZeroHealth: number; weeksAtZeroHappy: number };
  money: { cash: number; bank: number; bankInterestEarned: number; lifetimeEarned: number; weeksInDebt: number };
  banking: { autoDepositPct: number; payUpkeepFromBank: boolean; overdraft: boolean };
  education: { credentials: CredentialId[]; enrolled: { id: string; progress: number; weeks: number } | null };
  skills: Partial<Record<SkillId, number>>;
  traits: TraitId[];
  career: { roleId: RoleId | null; roleTenure: number; fieldExp: Partial<Record<Field, number>> };
  businesses: BusinessInstance[];
  realEstate: PropertyInstance[];
  holdings: Partial<Record<AssetId, { units: number; avgCost: number }>>;   // M3
  market: { prices: Record<AssetId, number>; news: NewsItem[] };            // M3
  lifestyle: { residence: ResidenceRef; food: TierId; clothes: TierId; subscriptions: SubId[] };
  relationships: Relationship[];                                            // M4
  elixir: { count: number; price: number };
  progress: { peakNet: number; goalsMet: string[]; runAchievements: string[] };
  log: LogEntry[];                 // capped ring (last 60)
  pendingEvent: { eventId: string } | null;         // a choice event awaiting the modal
  pendingGoal: { goalId: string; description: string } | null;  // goal celebration awaiting ack
  pendingBankruptcyWarning: boolean;                 // first week in debt — blocking warning
  status: 'alive' | 'dead' | 'breakdown' | 'bankrupt';
}
```
`ResidenceRef` = `{ kind: 'rented'; tier: TierId } | { kind: 'owned'; propertyId: string }` — this models
the "live in an owned property" rule cleanly (§ GDD 8.4). The three `pending*` fields drive the blocking
modals and gate the tick (no week advances while one is set); `bankrupt` is the run-terminal state for
sustained negative cash (§ GDD 1.3).

### 4.2 `Profile` — the account (persists across all runs)
```ts
interface Profile {
  schemaVersion: number;
  unlockedPerks: PerkId[];         // earned from goals/special scenarios
  activePerks: PerkId[];           // toggled on for the next run
  unlockedTraits: TraitId[];       // e.g. Lucky, once earned
  achievements: string[];          // lifetime badges
  unlockedScenarios: string[];
  stats: { livesLived: number; bestNetWorth: number; oldestAge: number };
}
```
On death/breakdown the **run** ends and its `GameState` is discarded (or archived); the **Profile**
absorbs any newly unlocked perks/achievements. There is **no prestige carry-over** beyond this.

---

## 5. The engine

### 5.1 The tick reducer
```ts
function tick(state: GameState, action: Action): GameState
```
Pure. Implements the 13-step order from **GDD §2** by composing the `steps/*` functions, threading the
RNG through `state.meta.rngState`. One `action` advances exactly one week (except instant actions, §5.3).

```ts
type Action =
  | { type: 'WORK' }
  | { type: 'STUDY' }
  | { type: 'ACTIVITY'; id: string }
  | { type: 'MANAGE_BUSINESS'; id: string; op: BusinessOp }   // still one week
  | { type: 'RESOLVE_EVENT'; eventId: string; choiceId?: string }
  // …instant (no week passes): see 5.3
```

### 5.2 Seeded RNG (determinism)
```ts
// rng.ts — mulberry32-style; state is a single serializable number
function nextRng(s: number): { value: number; state: number }  // value ∈ [0,1)
```
The reducer reads `state.meta.rngState`, consumes as many draws as it needs (event roll, market noise,
choice outcomes), and writes the advanced state back. Because the seed lives **in the save**, reloading a
game and taking the same actions reproduces the same outcomes — and tests can pin a seed for golden runs.

### 5.3 Instant transactions (no week passes)
Enrolling, taking a job, buying a business/house/asset, bank deposit/withdraw, buying an Elixir, toggling
perks — these mutate state without advancing the clock. They're plain pure updaters
(`applyBuyBusiness(state, id)` etc.), separate from `tick`, and never consume a week or the RNG.

### 5.4 Economy & selectors
`economy.ts` holds the formulas from the GDD (jobPay per role, bankRate tiers, business growth/morale,
elixir price growth). `selectors.ts` holds **derived reads** used by the UI — `netWorth`, `passiveIncome`,
`ageYears`, `eligibility` — computed from state, never stored redundantly (kills the prototype's
"peakNet recomputed everywhere" duplication).

---

## 6. Data & tuning split

Two flavors of non-logic data, both editable without touching the engine:

- **`content/`** — the **catalog**: what jobs/businesses/assets/events/scenarios *exist*, including their
  own numbers (a role's salary, a business's cost, an asset's base price + hidden `sigma`). Adding content
  = adding a table row.
- **`config/tuning.ts`** — **global knobs** that aren't tied to one catalog item: `AGE_DECAY_RATE`,
  `BASE_H_DECAY`, `CROSS_PENALTY`, `WEEKLY_EVENT_CHANCE`, `MORALE_LERP`, `ATTRITION_FLOOR`,
  `ELIXIR_REWIND_WEEKS`, `ELIXIR_PRICE_MULT`, bank interest tiers, `MONEY_CAP`, etc.

Balancing the game is editing these files. Engine code reads constants; it never hard-codes them.

---

## 7. Money handling

```ts
// util/money.ts
export const MONEY_CAP = 999_999_999_999_999;                // ~$1 quadrillion
export const clampMoney = (n: number) => Math.max(-MONEY_CAP, Math.min(MONEY_CAP, n));
export function moneyShort(n: number): string;               // 3 sig figs, k/M/B/T, "$999T" MAX at cap
export function money(n: number): string;                    // exact, grouped commas
```
Every place money is written to state passes through `clampMoney`. All values are **integers where
sensible** (avoid float drift on cash); interest/market math rounds explicitly per tick. `moneyShort` is
the display formatter everywhere in the UI.

> **Note on the cap and JS numbers:** `MONEY_CAP` (~1e15) is well under `Number.MAX_SAFE_INTEGER` (~9e15),
> so plain integers are safe up to the ceiling — no BigInt needed.

---

## 8. Persistence

```ts
// state/persistence.ts
const RUN_KEY = 'longlife.run';
const PROFILE_KEY = 'longlife.profile';
export const SCHEMA_VERSION = 2;   // v2 added the bankruptcy fields (weeksInDebt, pendingBankruptcyWarning)

saveRun(state)      // called on every tick + every instant transaction (synchronous write)
loadRun(): GameState | null
saveProfile(p) / loadProfile(): Profile
```
- **Autosave on every commit** (each tick and instant transaction), written **synchronously**. Turn-based
  play writes at most a few times/second, so there's no thrash to debounce — and a synchronous write means
  a refresh mid-turn never loses the last action (the "closing the tab loses nothing" criterion). *(An
  earlier debounced write was dropped for exactly this reason.)*
- **Versioned + migrated.** Each save carries `schemaVersion`; on load, an ordered `RUN_MIGRATIONS` ladder
  upgrades old saves step by step (the v1→v2 step backfills the bankruptcy fields). Never silently drop a
  player's life on a schema change; every bump ships a migration test.
- **Corruption-safe.** Wrap parse in try/catch; on failure, keep a backup key and return "no save" rather
  than crashing.
- Explicit **New Game** (pick scenario) and **New Life / Reset** (abandon the run → scenario select) actions.

---

## 9. UI architecture

- **Store:** a single Zustand `gameStore` holds `GameState` + `Profile`, exposes `dispatch(action)` (runs
  the pure `tick`/instant updaters, then autosaves) and the current state. **Selector hooks**
  (`useStats`, `useMoney`, `useCareer`) subscribe components to *slices*, so a bank-balance change doesn't
  re-render the whole job grid — directly fixing the prototype's global-re-render issue.
- **Achievements/goals** are evaluated inside the tick (step 12) and pushed into state, **not** via a
  `useEffect` watching the whole state object (the prototype's `useEffect([s])` smell is gone).
- **Components:** presentational (`StatBar`, `Card`, `Tag`, `MoneyText`, `Modal`), fed by hooks.
- **Tabs:** one component per tab (Live, Work, Learn, Business, Bank, Lifestyle, Market, Legacy→"Life").
  Tab visibility gates by milestone (Market appears in M3).
- **Modals:** death/breakdown screen, event-choice modal, goal-celebration modal (blocking, centered).
- **Design tokens:** keep the prototype's palette/typography as CSS variables; port the visual style.

---

## 10. Determinism & testing

- **Pure-engine unit tests** (Vitest): each `steps/*` function tested in isolation with hand-built states.
- **Golden-run tests:** seed the RNG, apply a scripted action sequence, assert the resulting state — this
  locks economy/balance behavior and catches regressions when tuning changes.
- **Property tests** for invariants: money never exceeds `MONEY_CAP`; stats stay in `[0,100]`; death
  triggers exactly after 3 zero-weeks; a business's `weeklyNet` is negative early and positive at high
  growth+morale.
- **Migration tests:** every `schemaVersion` bump ships a fixture old-save + expected upgraded save.
- CI runs `tsc --noEmit`, ESLint, and Vitest.

---

## 11. Performance & scale notes

- **Turn-based, no time-skip** means the tick runs at most a few times/second (human click rate) — the
  engine has generous headroom; no batching/worker needed.
- **Long lives** (many Elixirs) never grow state unboundedly: the log is a **capped ring buffer**; skills/
  experience are bounded counters; only businesses/property/holdings are unbounded collections, and those
  are capped by tier/economy in practice.
- Selector-based subscriptions keep re-renders proportional to what actually changed.

---

## 12. Extensibility checklist (adding content later)

- **A new job:** add a role row to a field ladder in `content/careers.ts` (with its unique gate). Done.
- **A new business/asset/event/scenario/perk:** add a row to the relevant `content/` table.
- **A balance change:** edit `config/tuning.ts` or the item's number in `content/`. No logic changes.
- **A new system (e.g., relationships in M4):** add its slice to `GameState`, a `steps/` function wired
  into the tick order, its `content/` data, and its tab/hook. A `schemaVersion` bump + migration.

---

## 13. M1 scaffold — ✅ built

1. Vite + React + TS + Vitest + ESLint/Prettier project skeleton; design tokens in `ui/theme.css`.
2. `state/types.ts` (GameState + Profile), `util/money.ts`, `config/tuning.ts`, `engine/rng.ts`.
3. `engine/tick.ts` + `steps/*` for M1 (interest, income, upkeep, decay, work, study, activity, skills,
   events) + `finalize.ts` (clamp/death/bankruptcy/goals/achievements) + `selectors.ts`.
4. `content/` for M1: education spine + majors, the **Tech** career ladder + entry jobs, activities,
   home/food tiers + subscriptions, the Normal Life scenario, a small event set, the Elixir.
5. `state/persistence.ts` (synchronous autosave + v2 migrations + load) and `store/gameStore.ts`.
6. UI shell + Live/Work/Learn/Bank/**Finances**/Lifestyle/**Legacy** tabs + stat meters + log +
   death/goal/event/**bankruptcy-warning** modals + a **New Life** reset.
7. Golden-run test: birth → educate → promote → buy an Elixir → natural death, deterministic in CI.

**Lightweight skills in M1 (decision):** the finalized Tech ladder gates roles on skills and
achievements, nominally M4 systems. Rather than stub those gates, M1 ships a *minimal* skills slice —
`coding`/`leadership`/etc. accrue by working (`steps/skills.ts`) and the four career achievements are
granted on milestone conditions — so `content/careers.ts` stays byte-faithful and every promotion is
genuinely unique-gated. The full skills/traits/Life-Courses system still lands in M4.

**Definition of done for M1 (met):** a full life is playable end-to-end in the browser, saves survive
refresh, and a seeded golden run passes in CI.

---

*Next and final bible doc: the **Content/Data Spec** — concrete TypeScript schemas plus the first real
data tables (all majors, every M1 career role with its unique gate, business tiers, market assets with
hidden sigma, the event registry, scenarios, perks, achievements) that `content/` will hold.*
