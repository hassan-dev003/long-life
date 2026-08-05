# Long Life — Product Requirements Document

> **Name LOCKED: "Long Life."** (Repo/package ids may still read "life-sim".)
>
> **Status:** DRAFT v0.4 — discussion document.
> v0.4 locks the name, makes the game **turn-based with no time-skip**, opens the economy to a
> **$999T ceiling with market-realistic pricing**, removes business capital-investment and the
> business health/happiness drain, hides market volatility (felt, never shown), makes news
> **per-asset (0–3/week)**, adds **live-in owned real-estate**, the **Lucky** trait/perk, a
> **Life-Courses** skill/trait track, and the **unique-gate-per-role** career rule. See §20 for the
> full decisions log.

---

## 1. Vision

**Long Life** is a turn-based life-and-finance simulator where a single click advances your
character's life by one week. From a chosen starting **scenario** — a comfortable 18-year-old
with a school certificate and some parental cash, or a destitute nobody with nothing — the
player navigates education, careers, business, investing, relationships, and the slow pressure
of aging. Random life events push the story off any straight line. When a life ends, the
player is reborn as themselves — wiser, with permanent legacy bonuses — to try again.

Genre blend: **idle/incremental** (compounding income, prestige) × **management sim** (allocate
scarce *time*) × **narrative life sim** (the emergent story of one person's decades).

### Pitch
*"BitLife meets an idle tycoon: live a whole life one week at a time — build a career, a
business empire, a portfolio, a family — then do it again, wiser."*

### Tone
**Grounded, with a spice of absurdity.** The world is realistic — real careers, real economics —
but life is occasionally absurd, and events, news headlines, and flavor text lean into that. Not
BitLife-zany; more "wry realism with the odd curveball."

---

## 2. Target player

- **Primary:** incremental/idle fans wanting more decision depth and a life-story wrapper.
- **Secondary:** life-sim (BitLife) players wanting a deeper economic engine.
- **Sessions:** both short ("advance a few weeks, make a call, leave") and long optimization
  runs. **Persistence is mandatory** — autosave every tick, nothing lost on refresh.

---

## 3. Core loop

```
  ┌──────────────────────────────────────────────────────────────┐
  │  1. SPEND A WEEK  (work · study · leisure · invest · advance)  │
  │  2. TICK resolves: income, interest, upkeep, stat decay,       │
  │     aging, market movement, and any EVENT that fires this week │
  │  3. Stats / money / relationships change → options un/lock     │
  │  4. Invest surplus (education · career · business · market ·   │
  │     property · bank · lifestyle)                               │
  │  5. Age accelerates decay → survival pressure rises            │
  │  6. Life ends (death or breakdown) → PRESTIGE → reborn, wiser  │
  └──────────────────────────────────────────────────────────────┘
```

The **week-tick** is the atomic unit and the game's identity. Every system expresses itself
through what happens in a tick. It becomes a pure, testable reducer.

---

## 4. Naming — ✅ LOCKED

**The game is called "Long Life."** (Other candidates — Threescore, Compound, Lifespan, The Long Game,
Ledger — are retired. Repo/package identifiers may still say `life-sim` for continuity.)

---

## 5. Scenarios & Goals (the framing layer)

Play is organized into **Scenarios** — a starting condition + a headline **Goal**. Scenarios
set *how you begin life*.

- **Normal Life** (baseline): start at 18 with a school certificate and modest parental cash.
- **Slumdog Millionaire** (hard): start with the worst possible conditions; goal = reach $1M.
- …many more, **tiered by difficulty**.

Rules:
- **Goals are non-terminal.** Completing a goal fires a **blocking celebration modal** (centered,
  dims the screen) that the player must acknowledge; then **the game continues** — you keep living.
- **Goals unlock Perks.** Certain goals award a **Perk** the player can **toggle on/off for future
  runs** (meta-progression on top of prestige points). Perks are opt-in modifiers, not always-on.
- **Many goals, tiered.** Achievement-like breadth, but goals also shape the *start* and award perks.

*(Scenarios subsume and replace the old flat "achievements+goals" split: achievements still exist
as passive badges; scenarios/goals are the chosen objectives that shape a run.)*

---

## 6. Time, health & death

- 1 week/tick · 4 weeks/month · 48 weeks/year. Start age set by scenario (usually 18).
- **Turn-based only — no time-skip.** Every advance of the clock is a deliberate one-week action; there is
  no "advance N weeks" and no auto-live. A long life is many considered choices (which makes aging perks and
  the Elixir genuinely valuable).
- **Health** and **Happiness** (0–100), decaying weekly; decay accelerates with age.
- **Death rules (both run-terminal → prestige):**
  - **Health at 0 for 3 consecutive weeks → death** (body gives out).
  - **Happiness at 0 for 3 consecutive weeks → breakdown / "conscious death"** (mind gives out).
  - Hitting 0 is a warning state with a 3-week grace window to recover, not instant game-over.
- Longevity sink (elixir or successor) still exists to fight aging (see §14).

---

## 7. Education (reworked)

A **spine** plus **branching majors** plus **auxiliary tracks**.

**Main spine (sequential):**
`School → Diploma → Degree → Master's → PhD`

- **Degree branches into field-specific majors** (CS, Law, Business, Medicine, Engineering,
  Arts, …). Your major couples to career fields (§8) and some businesses.
- Each level: tuition upfront + a number of study-weeks to complete.

**Auxiliary tracks (off-spine, gate specific jobs/businesses/skills):**
Police Academy, Military Academy, Community College, trade certifications, etc. These aren't
on the degree ladder; they unlock particular paths.

**Life Courses (new — skill/trait unlockers):** short courses / hobbies / experiences that unlock a
specific **Skill or Trait** (not a career credential), each priced and paced by the value it grants —
e.g., *thrifting → Frugality* (cheaper everything). Certain powerful traits (e.g., **Lucky**) are **not**
in this catalog and only unlock via special scenarios/actions. See GDD §3.5.

**Pricing:** education is **market-realistic** — a degree costs ~$120k, med school ~$300k, etc. (the
prototype's prices were toy-scale). Salaries and other prices are scaled to match (§ economy note).

**DECIDED — strict lock.** A field's professional ladder requires that field's specific
major/credential; without it you cannot enter that field at all. No-education **entry jobs**
(service/labor) remain open to everyone as the fallback for the un-credentialed (§8).

---

## 8. Career (reworked)

Careers are **field-specific ladders** with named **promotion tiers**.

- **Take a job → you're on that field's ladder at an entry role.** The job screen shows your
  **progress toward the next promotion**.
- **Promotion, not tenure, raises pay.** Salary is **fixed per role** and only changes when you're
  **promoted**. (This replaces the old weekly pay-creep.)
- **Every role has a UNIQUE gate — no strictly-dominated roles.** A higher-paying role must require
  *something the one below does not* (a distinct mix of experience, a skill threshold, a trait, an
  achievement, or a higher credential), so there's never a role a rational player would skip past yet the
  lower one still makes sense to have held. This fixes a prototype flaw (identical requirements on
  different-paying jobs). See GDD §4.2–4.3.
- **Promotions gated by BOTH experience (weeks in field) AND education.** Some higher roles simply
  cannot be reached without the required degree.
- **Jobs gated by education only** at entry (you can take an entry role once you meet the edu bar).
- Each field has its own named ladder, e.g. **Tech:** Junior Dev → Software Engineer → Senior →
  Team Lead → Eng Manager → Director → VP Eng → CTO. Every field gets an authored ladder in the GDD.
- Working still costs weekly health/happiness by role (stress varies).

---

## 9. Skills & traits (new, D5)

An **orthogonal** progression to education.

- **Traits/Background:** scenario- and event-driven starting characteristics that make runs differ
  from week one.
- **Skills:** soft/hard skills (negotiation, discipline, charisma, coding, fitness…) leveled by
  activities, jobs, and events; they modify promotions, event outcomes, relationship success,
  business growth, etc.

---

## 10. Relationships & family (D2, no heir)

- Dating → partner (dual income potential, happiness, shared costs) → marriage → children
  (ongoing cost + happiness swings + event surface).
- Relationship is a **meter** nurtured by time/gifts/attention; neglect erodes it (breakups,
  divorce with financial consequences).
- **No heir / no bloodline.** Death always leads to **cold rebirth as the same player**, wiser.
  Children are life texture and event/finance surface, not a succession mechanic.

---

## 11. Business (deep, reworked)

Businesses are **tiered by cost & product** and are **living operations**, not flat passive income.

- **Lifecycle:** a new business **starts at a loss**, moves to **breakeven**, then **profit** as it
  grows. Growth is driven by **two inputs** (capital-investment mechanic **removed**):
  1. **Owner competence match** — relevant education/experience accelerates growth.
  2. **Team Morale (single aggregate meter per business)** — raised by wages + profit-share/incentives,
     decayed by underpayment/over-extraction. Drives productivity and attrition. **No individual employees.**
- **Operations:** **hire employees** and **open branches** — each with a **cap**. More staff/branches raise
  the capacity ceiling *and* the payroll that morale depends on. Moving up to a bigger business is a
  separate upfront purchase, not an incremental "invest."
- **No survival-stat cost:** owning/running businesses **never** drains player health or happiness —
  it's a purely financial/management system. (Realism here was more annoying than fun.)
- **Field-unique mechanics** layer on the shared engine (e.g., restaurant *reputation*, software
  startup *tech debt*, retail *inventory*). Authored per field in the GDD.
- **Later (roadmap):** take a company to **IPO** → own ticker on the market (§12), with
  insider-trading intrigue.

---

## 12. Investing & the Market (D4)

A real market replaces guaranteed returns as the primary risk/reward money system (the bank
stays as the safe, low-yield option).

- **Asset classes in tabs:** **Stocks**, **Commodities**, **Cryptocurrencies**, … (extensible).
  Each asset has a price that moves with volatility per class.
- **News page (new):** a **weekly feed of headlines** that *telegraph* likely moves, e.g.
  *"Taslo R&D announces sustainable-energy breakthrough"* → Taslo likely to rise; *"New mining tech
  floods silver supply"* → silver likely to crash. **News is always predictive** of *direction*, and each
  week publishes **0–3 short headlines, each targeting one specific asset** (not the whole market).
- **Hidden volatility:** every asset also has a **volatility that is never shown on screen or explained
  anywhere.** Players learn an asset's temperament only by watching its price patterns. Volatility is tuned
  per **class** (crypto ≫ commodities > stocks) and per-asset **field/reputation** (abstract) — surfaced to
  the player only implicitly, through behavior. News is the signal; volatility is the fog.
- **Real estate as an asset:** buy properties to **rent out** (passive income), **flip**
  (buy → optional renovate → sell into a variable market), **or live in** — a lived-in owned property
  **removes all separate housing costs** and its **quality/price drives your health/happiness passives**
  (renovation improves them, capped by the property's price bracket). Distinct from renting a plain Home
  tier (§13).
- **Later (roadmap):** player-company IPOs and insider trading.

---

## 13. Lifestyle (split out)

The old "lifestyle" tab splits into distinct spend categories, each affecting stats/upkeep:

- **Home** — your *residence*: either **rent a tier** (health/happiness + weekly upkeep) **or live in an
  owned property** (§12), which zeroes housing upkeep and derives passives from that property's
  quality/price.
- **Food** — diet tier (health-leaning, recurring).
- **Clothes** — wardrobe (happiness/social, some one-time some recurring).
- **Subscriptions** — recurring comforts/services (gym, insurance, streaming, etc.).

Insurance (a subscription) becomes meaningful because health events can bankrupt the uninsured (§6, §15).

---

## 14. Bank & longevity

- Tiered compound interest + automation (auto-deposit %, pay-upkeep-from-bank, overdraft) — kept
  from the prototype as the *safe* money option alongside the market.
- Longevity sink (Elixir of Life or a reframed equivalent) to push past natural lifespan; escalating cost.

---

## 15. Events (D1)

- **Weighted by life state.** Each event has eligibility/weight functions keyed to the player's
  situation (no insurance, high job stress, bad neighborhood, high wealth, relationship state…).
- **Buckets by weight range; pick probabilistically within a bucket.** Multiple candidate events per
  situation; the tick rolls which (if any) fires.
- **Outcome vs. choice events:** some just happen (windfall, illness); some present a **decision**
  (pay for surgery vs. gamble on recovery; take the risky promotion; invest in a friend's startup).
- **Balanced punishment across severity tiers** — mostly minor, occasionally major, rarely
  catastrophic — so runs have texture without feeling arbitrary or unsurvivable.

---

## 16. Fix list (engine, independent of features)

1. **Persistence** — autosave to localStorage every tick; explicit new-game/reset.
2. **Money scale + formatting** — economy spans pocket change to a **$999T hard cap**; `moneyShort` handles
   k/M/B/T and the formatter/curves stay sane to the ceiling. *(No time-automation — turn-based only, §6.)*
3. **TypeScript + real structure** — data modules, pure logic, hooks, components.
4. **Central tuning config** — all balance numbers in one data layer.
5. **Pure, testable tick reducer** — unit-testable; seedable RNG for reproducible runs.

---

## 17. Build sequencing (all in scope — this is order, not cuts)

Because everything above is "MVP," we sequence to stay playable:

- **M1 — Playable vertical slice:** tick reducer + save/load + money scale (k/M/B/T, $999T cap) +
  Health/Happiness + death rules + education spine + **one** career field ladder w/ unique-gated promotions
  + leisure + bank + a small event set + **one scenario (Normal Life)**. *Goal: a full life is playable
  end-to-end (turn-based, no time-skip).*
- **M2 — Economy depth:** all education majors + all career fields + businesses (with Team-Morale
  model) + lifestyle split.
- **M3 — Markets & property:** market tabs + news feed + real-estate rent/flip.
- **M4 — Life texture:** relationships/family + skills/traits + deep health.
- **M5 — Meta:** full scenario/goal/perk catalog + prestige tuning + achievements.
- **Roadmap (post-v1):** company IPOs + insider trading.

**DECIDED — vertical-slice-first (M1→M5).** All systems in scope; this is build order, not cuts.

---

## 18. Non-goals (for now)

- Multiplayer / leaderboards / accounts / cloud saves / backend (local-first).
- Monetization. Native mobile app (responsive web covers mobile browsers).
- Real-time / play-while-away clock — this is **turn-based, no time-skip**. ✅ confirmed.

---

## 19. Success criteria

1. New player grasps the loop within ~5 weeks, no tutorial wall.
2. A full life is reachable in a session and *feels* like a life — ups, downs, events — not a monotone climb.
3. Prestige and unlocked perks meaningfully change the next run.
4. No single dominant strategy trivializes every run.
5. Closing the tab loses nothing.

---

## 20. Decisions log

**Resolved:**
- **Q1 — Build sequencing:** ✅ vertical-slice-first (M1→M5). (§17)
- **Q2 — Business team model:** ✅ single aggregate **Team Morale** meter; no individual employees. (§11)
- **Q3 — Major↔career coupling:** ✅ **strict lock** — field ladders require the matching major;
  no-education entry jobs remain open to all. (§7, §8)
- **Q4 — News reliability:** ✅ **always predictive** headlines. (§12)
- **Business workforce, tone, difficulty/death, prestige (cold rebirth):** resolved in prior rounds.

**Resolved (v0.4 round):**
- **Name:** ✅ **Long Life** (locked). (§4)
- **Turn-based, no time-skip:** ✅ every week is a deliberate action; no advance-N / auto-live. (§6, §18)
- **Economy scale:** ✅ pocket-change → **$999T hard cap**; market-realistic pricing (tuition/salaries/homes);
  `moneyShort` k/M/B/T. (§12, GDD §1.4)
- **Business:** ✅ removed capital-investment mechanic; ✅ owning a business costs **no** health/happiness. (§11)
- **Market:** ✅ **hidden, unexplained volatility** (felt via patterns), tuned by class + abstract
  field/rep; ✅ news is **0–3 short headlines/week, each per individual asset**, always direction-predictive. (§12)
- **Real estate:** ✅ can **live in** an owned property — removes housing costs; quality/price drive stats;
  renovation improves them, capped by price bracket. (§12, §13)
- **Careers:** ✅ **unique gate per role** — no strictly-dominated roles. (§8)
- **Lucky trait/perk:** ✅ positive-event bias, unlocked only via special scenarios/actions. (GDD §5)
- **Life Courses:** ✅ new education-adjacent track unlocking skills/traits, priced by value; some
  special-locked. (§7, GDD §3.5)

**Still open:**
- *(none blocking — ready to proceed to Technical Architecture + Data Spec.)*

---

*Next docs, once this is agreed: **Game Design Doc** (formulas, ladders, economy tables, curves),
**Technical Architecture** (stack, structure, state/persistence, RNG), **Content/Data Spec**
(schemas for scenarios, education, careers, businesses, assets, events).*
