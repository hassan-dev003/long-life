# Long Life — Product Requirements Document

> **Status:** v1.0 — FINALIZED. This document describes the game as it stands now;
> superseded ideas are not tracked here. Companion docs: **Game Design** (`GAME_DESIGN.md`),
> and — next — **Technical Architecture** and **Content/Data Spec**.

---

## 1. Vision

**Long Life** is a turn-based life-and-finance simulator. One click advances your character's life
by one week. From a starting **scenario** — a comfortable 18-year-old with a school certificate and
some parental cash, or a destitute nobody with nothing — you navigate education, careers, business,
investing, relationships, and the slow pressure of aging.

The long-term spine is survival against time: aging erodes health, and the only way to buy more life
is the **Elixir** — expensive, and pricier every time. So the real game is *out-earning your own
mortality*: compound enough wealth, fast enough, to keep affording the next Elixir before your health
gives out. There are no prestige multipliers or resets propping you up — just your choices, the
compounding math, and the clock.

Genre blend: **idle/incremental** (compounding income) × **management sim** (allocate scarce *time*)
× **narrative life sim** (the emergent story of one person's decades).

### Pitch
*"An idle-tycoon life sim where you race compounding wealth against your own aging — build a career,
an empire, a portfolio, a family, and buy yourself more years, one week at a time."*

### Tone
**Grounded, with a spice of absurdity.** Real careers, real economics, real prices — but life is
occasionally absurd, and events and news flavor lean into that. Wry realism with the odd curveball.

---

## 2. Target player

- **Primary:** incremental/idle fans who want more decision depth and a life-story wrapper.
- **Secondary:** life-simulation (BitLife-style) players who want a deeper economic engine.
- **Sessions:** both short ("live a few weeks, make a call, leave") and long optimization runs.
  **Persistence is mandatory** — autosave every tick, nothing lost on refresh.

---

## 3. Core loop

```
  ┌──────────────────────────────────────────────────────────────┐
  │  1. SPEND A WEEK  (work · study · leisure · invest · manage)   │
  │  2. TICK resolves: income, interest, upkeep, stat decay,       │
  │     aging, market movement, and any EVENT that fires this week │
  │  3. Stats / money / relationships change → options un/lock     │
  │  4. Invest surplus (education · career · business · market ·   │
  │     property · bank · lifestyle)                               │
  │  5. Age accelerates decay → survival pressure rises            │
  │  6. Buy an ELIXIR to turn back the clock — or fail to, and die │
  └──────────────────────────────────────────────────────────────┘
```

The **week-tick** is the atomic unit and the game's identity: every system expresses itself through
what happens in a tick. **Turn-based only — no time-skip:** every advance of the clock is a deliberate
one-week action. A long life is many considered choices.

---

## 4. Scenarios, Goals & Perks (the meta layer)

Play is organized into **Scenarios** — a starting condition + a headline **Goal**. The scenario sets
*how you begin life*.

- **Normal Life** (baseline): start at 18 with a school certificate and modest parental cash.
- **Slumdog Millionaire** (hard): worst possible start — ~$0, no education, rough circumstances;
  goal = reach $1M net worth.
- Many more, **tiered by difficulty**.

Rules:
- **Goals are non-terminal.** When a goal is first met, a **blocking celebration modal** (centered,
  dims the screen) appears; the player acknowledges it and **keeps living**.
- **Goals (and some special scenarios/actions) unlock Perks** — opt-in modifiers the player can
  **toggle on/off before a future run** (e.g., *Trust Fund*, *Fast Learner*, *Lucky*). Perks are the
  game's meta-progression.
- **Achievements** remain as passive badges for notable feats.

There is **no prestige/points/multiplier system** (see §7 rationale). Perks and achievements are the
only things that carry between runs.

---

## 5. Time, health & death

- 1 week/tick · 4 weeks/month · 48 weeks/year. Start age set by scenario (usually 18).
- **Turn-based, no time-skip** (see §3).
- **Health** and **Happiness** (0–100), decaying weekly; decay accelerates with age past ~25.
- **Death rules (both run-terminal):**
  - **Health at 0 for 3 consecutive weeks → death** (the body gives out).
  - **Happiness at 0 for 3 consecutive weeks → breakdown** (the mind gives out — a "conscious death").
  - Hitting 0 is a warning state with a 3-week grace window to recover, not an instant game-over.
- On a run ending, the player starts a **new life** by choosing a scenario; unlocked **perks and
  achievements persist**, nothing else does.

---

## 6. Longevity: the Elixir (the continuity spine)

The Elixir is the **only** way to extend a life against aging, and the game's central long-term tension.

- Drinking an Elixir turns the clock back (~10 years younger) and restores some health.
- **Each Elixir costs dramatically more than the last**, so sustaining a long life demands
  ever-growing income — which is what makes compounding wealth (bank, market, business) matter.
- Managing the timing is the skill: earn enough for the next Elixir *and* drink it before aging
  erodes your health past recovery. Mistime it and the run ends.

This replaces prestige entirely: continuity is earned in-life through strategy, not granted by
between-life multipliers.

---

## 7. Design rationale for two deliberate departures

Kept here because their *absence* would otherwise look like an oversight:

- **No prestige/rebirth multipliers.** The Elixir already provides continuity, and permanent
  multipliers would flatten strategy into "stack the multiplier." Removing them makes each run stand
  on its own decisions and keeps the long game about the compounding-vs-aging race.
- **Owning a business never costs health/happiness.** Realistically it would, but it made the game
  feel punishing rather than fun. Business is a purely financial/management system.

---

## 8. Education

**Spine (sequential):** `School → Diploma → Degree → Master's → PhD`.
- The **Degree branches into field-specific majors** (CS, Law, Business, Medicine, Engineering, Arts,
  Science, Education…). A major couples to career fields (§9) and some businesses.
- Each level: tuition upfront + study-weeks to complete.

**Auxiliary tracks (off-spine unlockers):** Community College, Trade Certificate, Police Academy,
Military Academy, Med School, Bar prep, etc. — each gates specific jobs/businesses/skills without
being on the degree ladder.

**Life Courses (skill/trait unlockers):** short courses / hobbies / experiences that unlock a specific
**Skill or Trait** (not a career credential), each priced and paced by the value it grants — e.g.,
*thrifting → Frugality* (cheaper purchases/upkeep). Certain powerful traits (e.g., **Lucky**) are
**not** in this catalog and only unlock via special scenarios/actions.

**Pricing is market-realistic** (see §17): a degree costs on the order of a real US degree; med school
far more. Education is a genuine multi-year, high-cost commitment.

---

## 9. Careers

Careers are **field-specific ladders** with named **promotion tiers**.

- **Take a job → you enter that field's ladder at the lowest role you qualify for.** The job screen
  shows progress toward the next promotion and what's blocking it.
- **Promotion, not tenure, raises pay.** Salary is **fixed per role**; it only changes on promotion.
- **Every role has a UNIQUE gate — no strictly-dominated roles.** A higher-paying role always requires
  *something the one below does not* (a distinct mix of experience, a skill threshold, a trait, an
  achievement, or a higher credential), so a rational player is never left choosing between a
  higher-pay and lower-pay role with identical requirements.
- **Field entry = strict education lock** for professional fields (you need that field's major).
  **Entry-tier jobs** (service/labor) need no education and are the universal fallback.

---

## 10. Skills & traits

An **orthogonal** progression to education.

- **Traits/Background:** set by scenario, some events, and some Life Courses (§8). Examples: *Hustler*
  (+business growth), *Iron Constitution* (slower health decay), *Frugality* (cheaper everything),
  and **Lucky** — biases the event roll (§16) toward positive outcomes; **special-unlock only**
  (scenarios/actions), never purchasable.
- **Skills** (leveled by use): Discipline, Charisma, Negotiation, Fitness, Coding, Finance, Market
  Sense, Street Smarts, etc. They gate and accelerate promotions, improve event-choice odds, help
  relationships and business growth, and subtly sharpen a player's read of the market.

---

## 11. Relationships & family

- **Relationship meter** per partner. Dating → committed → married; provides shared income, a
  happiness passive, shared costs, and an event surface (conflict, illness, divorce → asset split).
- **Children:** ongoing cost + happiness volatility + dedicated events. **No heir/succession** —
  children are life texture and finance/event surface, not a continuation mechanic.

---

## 12. Business

Businesses are **tiered by cost & product** and are **living operations**, not flat passive income.

- **Lifecycle:** a new business **starts at a loss**, moves to **breakeven**, then **profit** as it
  grows. Growth is driven by **two inputs**:
  1. **Owner competence match** — relevant education/experience accelerates growth.
  2. **Team Morale** — a **single aggregate meter per business**, raised by wages + profit-share,
     decayed by underpayment/over-extraction. Drives productivity and attrition. **No individual
     employees; no capital-investment mechanic.**
- **Operations:** **hire employees** and **open branches** — each capped. More staff/branches raise
  the capacity ceiling *and* the payroll morale depends on. Moving to a bigger business is a separate
  upfront purchase.
- **No survival-stat cost** for owning/running a business (§7).
- **Field-unique mechanics** layer on the shared engine (restaurant *reputation*, software startup
  *tech debt*, retail *inventory*…), authored per field.
- **Roadmap:** take a mature business to **IPO** → its own tradable ticker on the market (§13), with
  insider-trading intrigue.

---

## 13. Investing & the Market

A real market is the primary risk/reward money system; the bank (§15) is the safe, low-yield option.

- **Asset classes in tabs:** **Stocks**, **Commodities**, **Cryptocurrencies** (extensible).
- **Parody tickers.** Brand-based assets use **distorted-but-guessable** names to avoid trademarks
  (Tesla→**Taslo**, Nvidia→**Nvadia**, Google→**Gaggle**…). Real commodities (gold, silver, oil) keep
  their real names — they aren't brands.
- **Hidden volatility.** Every asset has a volatility that is **never shown or explained anywhere** in
  the game. Players learn an asset's temperament only by watching its price patterns. It's tuned per
  **class** (crypto ≫ commodities > stocks) and per-asset **field/reputation** (abstract) — surfaced
  only implicitly, through behavior.
- **News feed (0–3 short headlines/week, each targeting one specific asset).** News is always
  predictive of **direction**; the **magnitude is encoded in the headline's language/tone** — a vague,
  soft-positive item ("in talks to onboard a partner") nudges the price up a little, while a strong,
  explicit one ("achieved an R&D breakthrough") moves it hard. Reading tone is a skill. News is the
  signal; hidden volatility is the fog.
- **Real estate** (own a property; slow price series + a **quality** stat). The catalog runs from a
  starter studio all the way to skyscrapers, garden estates, private islands, and whole city districts —
  **prices climb into the hundreds of billions and get wildly profitable at the top.** Three uses:
  - **Rent** it out (passive income − upkeep/vacancy risk).
  - **Flip** it (renovate over weeks to raise quality/value → sell into the variable market).
  - **Live in it** — removes all separate housing costs; the property's **quality and price drive your
    weekly health/happiness passives**. Renovating improves them, but each property caps how good the
    living-boost gets, set by its **price bracket**.

---

## 13.5 Philanthropy (endgame giving)

The most outrageously expensive content in the game — a way for the ultra-wealthy to convert a fortune
into legacy and meaning.

- **Seven great works** (cure cancer, end world hunger, universal clean water, reverse climate change,
  global free education, fund a Mars colony, eradicate poverty), with costs escalating in **wide gaps from
  $1 trillion up to $950 trillion** — just under the money ceiling. Only reachable by an empire deep into
  the trillions.
- Each completed work grants a one-time **happiness** boost and a milestone.
- **Completing any one** unlocks an achievement; **completing all seven** is the game's biggest
  achievement and unlocks the special **Beloved** perk (and a nightmare-tier **Benefactor scenario** that
  challenges you to do it all again from nothing).
- Doubles as a genuine *win-flavored* goal for the top 0.001% of runs and a meaningful sink for money
  that would otherwise pile up against the ceiling.

---

## 14. Lifestyle

Distinct spend categories, each affecting stats/upkeep:

- **Home** — your residence: **rent a tier** (Studio → Condo → House → Villa → Mansion; upkeep +
  passives) **or live in an owned property** (§13), which zeroes housing upkeep.
- **Food** — diet tier (health-leaning, recurring).
- **Clothes** — wardrobe (happiness/social; some gate social/relationship outcomes).
- **Subscriptions (stackable)** — Gym (health), **Health Insurance** (reduces health-event costs &
  aging), hobbies/streaming (happiness), etc.

---

## 15. Bank

Tiered weekly compound interest as the *safe, low* option alongside the market, with automation
toggles (auto-deposit %, pay-upkeep-from-bank, overdraft). Rates stay modest so the market and
business are the real growth engines.

---

## 16. Events

- **Weighted by life state.** Each event has eligibility + situational weight (no insurance ↑
  medical-bill severity, high job stress ↑ burnout, wealth ↑ lawsuit/scam surface, etc.).
- **Buckets by severity, biased toward minor** — mostly minor, occasionally major, rarely
  catastrophic — so runs have texture without feeling arbitrary.
- **Outcome vs. choice events:** some just happen; some present a decision (pay for surgery vs. gamble
  on recovery). Choice events open a blocking modal.
- **Lucky (§10)** tilts the roll toward positive outcomes without disabling bad events.

---

## 17. Economy scale & pricing

- **Everything is priced to real markets** — salaries, tuition, homes, cars, food, activities,
  businesses, and market assets all reference real-world values. The early/mid game should *feel*
  grounded.
- **Range:** pocket change up to a **hard ceiling of $999,999,999,999,999** (~$1 quadrillion). Cash,
  bank, net worth, and holdings are each clamped at the cap.
- **Formatting (`moneyShort`): 3 significant figures**, with `k / M / B / T` suffixes — e.g.
  `$1.25M`, `$12.5M`, `$125M`, `$1.25B`, `$847T`. The formatter and all balance curves must stay sane
  right up to the cap.
- The trillion tier is deep-endgame empire territory reached only by compounding across a very long
  (Elixir-extended) life — never by a paycheck.

---

## 18. Engine requirements (independent of features)

1. **Persistence** — autosave to localStorage every tick; explicit new-game/reset.
2. **TypeScript + real structure** — data modules, pure logic, hooks, components.
3. **Central tuning config** — all balance numbers in one data layer; balance changes never touch logic.
4. **Pure, testable tick reducer** — unit-testable; seedable RNG for reproducible runs.
5. **Money scale + formatting** — the $999,999,999,999,999 cap and 3-sig-fig `moneyShort` (§17).

---

## 19. Build sequencing (all in scope — order, not cuts)

- **M1 — Playable vertical slice:** tick reducer + save/load + money scale + Health/Happiness + death
  rules + Elixir + education spine + **one** career field ladder (unique-gated promotions) + leisure +
  bank + a small event set + **one scenario (Normal Life)**. *A full life is playable end-to-end.*
- **M2 — Economy depth:** all majors + all career ladders + businesses (Team-Morale model) + Food/Clothes
  + auxiliary education tracks.
- **M3 — Markets & property:** market tabs + parody tickers + hidden volatility + news feed +
  real-estate rent/flip/live-in.
- **M4 — Life texture:** relationships/family + skills/traits + Life Courses + deep health.
- **M5 — Meta:** full scenario/goal/perk catalog + achievements + **Philanthropy (the seven great works)**
  + balance pass.
- **Roadmap (post-v1):** business IPO + insider trading.

---

## 20. Non-goals (for now)

- Multiplayer / leaderboards / accounts / cloud saves / backend (local-first).
- Monetization; native mobile app (responsive web covers mobile browsers).
- Real-time / play-while-away clock — the game is **turn-based, no time-skip**.

---

## 21. Success criteria

1. A new player grasps the loop within ~5 weeks, no tutorial wall.
2. A full life *feels* like a life — ups, downs, events — and the aging-vs-Elixir race creates real
   late-game tension.
3. Unlocked perks meaningfully change how a future run plays.
4. No single strategy (career vs. business vs. market) dominates; each is a viable path to the Elixir
   treadmill.
5. Closing the tab loses nothing.
