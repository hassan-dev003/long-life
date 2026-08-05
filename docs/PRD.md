# Life Sim — Product Requirements Document

> **Status:** DRAFT v0.1 — discussion document. Nothing here is locked.
> Sections marked **⟡ OPEN DECISION** are the things we need to agree on before
> the Game Design Doc, Technical Architecture, and Content/Data Spec can be finalized.

---

## 1. Vision

**Life Sim** is a turn-based life-and-finance simulator where a single click advances
your character's life by one week. From a broke 18-year-old, the player navigates
education, careers, business, housing, health, and the slow pressure of aging — trying
to build a life worth living before the clock runs out. When a life ends, the player is
reborn wiser, carrying a permanent legacy into the next run.

It sits at the intersection of three genres:

- **Idle / incremental** — compounding income, passive systems, prestige loops.
- **Management sim** — allocate a scarce resource (time) across competing needs.
- **Narrative life sim** — the emergent *story* of one person's choices over decades.

The current prototype (working title *The Long Game*) nails the incremental and
management layers. The "evolve" mandate for this rebuild is to make it feel **alive** —
persistent, eventful, and personal — not just a spreadsheet you optimize.

### One-line pitch
*"BitLife meets an idle game: live a whole life one week at a time, then do it again — better."*

---

## 2. Target player

- **Primary:** fans of incremental/idle games (Universal Paperclips, Cookie Clicker,
  AdVenture Capitalist) who want more decision depth and a life-story wrapper.
- **Secondary:** BitLife / life-sim players who want a deeper economic and progression
  system than tap-to-random-event.
- **Session shape:** designed for both *short* sessions (advance a few weeks, make a
  decision, leave) and *long* optimization sessions. Persistence is therefore mandatory.

---

## 3. Core loop

```
  ┌─────────────────────────────────────────────────────────┐
  │  1. SPEND A WEEK  (work · study · leisure · advance time) │
  │  2. TICK resolves: income, interest, upkeep, stat decay,  │
  │     aging, and any life EVENT that fires this week        │
  │  3. Stats & money change → new options unlock/lock        │
  │  4. Invest surplus (education · business · assets · bank)  │
  │  5. Age accelerates decay → survival pressure rises        │
  │  6. Life ends (death) → PRESTIGE → reborn with a Legacy    │
  └─────────────────────────────────────────────────────────┘
```

The **week-tick** is the atomic unit and the design's center of gravity: every system
must express itself through what happens during a tick. This is preserved from the
prototype and is not up for debate — it's the game's identity.

---

## 4. What carries over from the prototype (the keep list)

These systems work and stay, structurally intact (numbers will be re-tuned):

| System | Keep | Notes |
|---|---|---|
| Week/month/year clock, start at 18 | ✅ | Core identity |
| Health + Happiness survival stats, death at 0 health | ✅ | |
| Age-accelerated decay | ✅ | |
| Jobs w/ education + experience gating, tenure-based pay | ✅ | |
| Education programs gating careers | ✅ | |
| Passive-income businesses | ✅ | |
| Tiered-interest bank + automation toggles | ✅ | A genuinely nice touch |
| Housing tiers + stackable lifestyle assets | ✅ | |
| Leisure activities (cash → stats) | ✅ | |
| Prestige / rebirth / Legacy points | ✅ | |
| Achievements | ✅ | |
| Elixir of Life (longevity sink) | ✅ | Maybe reframed — see §6 |

---

## 5. What's broken or missing (the fix list)

Non-negotiable improvements for the "proper version," independent of new mechanics:

1. **Persistence.** Save/load to `localStorage` (autosave each tick). A game about the
   *long* game must survive a refresh. This is the #1 gap.
2. **Time automation.** Manual clicking to age 150 is thousands of clicks. Need
   "advance N weeks" and/or an auto-live mode with a stop-on-event rule.
3. **Real code structure.** TypeScript, data in modules, logic in pure functions/hooks,
   UI in components. The 960-line single file becomes a maintainable project.
4. **Central tuning config.** All balance magic-numbers move into one data layer so we
   can iterate on the economy without touching logic.
5. **Deterministic-but-testable core.** The tick becomes a pure reducer we can unit-test
   and (later) seed for reproducible runs.

---

## 6. The "evolve" layer — ⟡ OPEN DECISIONS

This is the heart of what we need to discuss. The prototype is a deterministic optimizer;
these are the candidate systems that would make it a *life*. **I'm proposing a tiered
scope below — please tell me what belongs in MVP vs. later, and what to cut entirely.**

### D1 — Random life events ⟡
Weekly (or probabilistic) events: illness, injury, layoff, inheritance, market crash,
scam, promotion offer, chance encounter. Some are pure outcomes; some present a **choice**
(pay for surgery or gamble on recovery). This is the single biggest lever for turning the
game into a story.
- *Question:* In MVP, or a fast-follow? Fully random, or weighted by your life state
  (job stress, no insurance, bad neighborhood)? How punishing?

### D2 — Relationships & family ⟡
Dating → partner (dual income, happiness) → marriage → children (cost + happiness + a
potential *heir* who could inherit and continue the bloodline instead of a cold prestige).
- *Question:* This is a large system. MVP, roadmap, or out of scope? Does the "heir"
  idea appeal, or keep prestige abstract?

### D3 — Health as a system, not just a bar ⟡
Chronic conditions, fitness, diet, mental health as distinct inputs; insurance becomes
meaningful because events can bankrupt the uninsured.
- *Question:* Deepen health, or keep the single bar and let events do the work?

### D4 — Investing beyond the bank ⟡
Stock/index/crypto with volatility, real estate you actually manage, risk/reward instead
of the current guaranteed-interest bank. Adds decisions and event hooks (crashes).
- *Question:* Appetite for a market system, or is the bank + businesses enough?

### D5 — Skills / talents ⟡
An orthogonal progression to education — soft skills, a starting-trait/background system,
so two playthroughs feel different from week one.
- *Question:* Worth it, or does education + experience already cover this?

### D6 — Goals / narrative arcs ⟡
Explicit selectable life goals ("retire by 40", "become a surgeon", "raise a family")
that give a run direction and a scored ending, beyond raw net worth.
- *Question:* Does the game need authored goals, or is emergent optimization the point?

### Proposed MVP cut (my recommendation — argue with it)
- **In MVP:** fix list (§5) + **D1 events (light, weighted)** + **D6 a small set of
  goals**. This is the minimum that makes it feel alive without ballooning scope.
- **Phase 2:** D2 relationships/family, D4 investing.
- **Phase 3 / stretch:** D3 deep health, D5 skills.

---

## 7. Non-goals (for now)

- Multiplayer / online / leaderboards.
- Accounts / cloud saves / backend. (Local-first; a backend is a later question.)
- Monetization.
- Mobile-native app (responsive web should cover mobile browsers).
- Real-time clock (this is turn-based, not a play-while-away idle timer). **⟡ confirm.**

---

## 8. Success criteria

A build is "good" when:

1. A new player understands the core loop within the first 5 weeks without a tutorial wall.
2. A run to a natural death is reachable in a reasonable session, and *feels* like a life
   with ups and downs — not a monotone climb.
3. Prestige meaningfully changes the next run (a reason to rebirth, not just a reset).
4. The economy has no dominant one-click strategy that trivializes every run.
5. Closing the tab and coming back loses nothing.

---

## 9. Open questions summary (for our discussion)

- **Scope:** which of D1–D6 are MVP vs. roadmap vs. cut? (§6)
- **Tone:** grounded/realistic, or playful/absurd (BitLife-style)? Shapes event writing.
- **Difficulty:** is death a frequent, real threat, or mostly a late-game inevitability?
- **Prestige identity:** cold "reborn stranger," or a "bloodline/heir" that inherits?
- **Real-time or purely turn-based?** (Non-goal §7 assumes turn-based.)
- **Naming:** "Life Sim" is the working title — placeholder, or does it stick?

---

*Next docs, once this direction is agreed: **Game Design Doc** (formulas, economy tables,
curves), **Technical Architecture** (stack, structure, state/persistence model), and
**Content/Data Spec** (schemas for jobs, education, businesses, events).*
