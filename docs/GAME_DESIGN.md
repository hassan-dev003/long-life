# Life Sim — Game Design Document (GDD)

> **Status:** DRAFT v0.1. Turns the PRD vision into concrete mechanics, formulas, ladders, and
> first-pass economy numbers. **Every number here is a starting point and lives in a central
> tuning config** (see Technical Architecture) — expect to re-balance. Numbers are labeled
> *[TUNE]* where they're especially provisional.
>
> Scope note: this GDD specs the **full game**, but flags what belongs to **M1 (vertical slice)**
> vs. later milestones, per PRD §17.

---

## 0. Design pillars (what every decision defers to)

1. **The week is sacred.** Every system resolves through the tick. If a mechanic can't be
   expressed as "what happens this week," it doesn't belong.
2. **Time is the scarce resource, not money.** The core tension is always *what do I spend this
   week on* — money is just stored time.
3. **Grounded, with spice.** Realistic systems; occasional absurd events/flavor.
4. **No dominant strategy.** Every path (career vs. business vs. market) should be viable and have
   a counter-pressure. Snowballing is fine; a *free* snowball is not.
5. **A run is a story.** Events and swings must make two runs feel different even with the same plan.

---

## 1. Core numeric model

### 1.1 Time
- `WEEKS_PER_YEAR = 48`; 4 weeks = 1 month; 12 months = 1 year.
- `ageYears = floor(startAge + totalWeeks / 48)`; `startAge` from scenario (usually 18).
- **Time-skip:** "Advance N weeks" runs N ticks. **Auto-live** runs ticks until a stop condition
  (event requiring a decision, low-stat warning, money below threshold, goal completed, or N reached).
  Stop conditions are user-configurable. *(M1: manual + "advance N"; auto-live in M1 too if cheap.)*

### 1.2 Stats
Two visible survival stats, `health` and `happiness`, each clamped `[0,100]`.

Per-tick update (order matters — see §2 for the full tick):
```
health     += passiveHealth   - healthDecay   + actionHealth
happiness  += passiveHappy     - happyDecay     + actionHappy
```

**Decay (the aging pressure):**
```
ageDecay   = max(0, ageYears - 25) * AGE_DECAY_RATE * agingMult      // AGE_DECAY_RATE = 0.02 [TUNE]
healthDecay   = BASE_H_DECAY  + ageDecay + (happiness < 30 ? CROSS_PENALTY : 0)   // BASE_H_DECAY = 0.10
happyDecay    = BASE_HP_DECAY            + (health    < 30 ? CROSS_PENALTY : 0)   // BASE_HP_DECAY = 0.40
CROSS_PENALTY = 0.30    // low body drags the mind and vice-versa
```
`agingMult` comes from prestige/perks (<1 slows aging). Insurance & deep-health inputs (M4) further
scale `ageDecay`.

**Passive contributions** come from home/lifestyle/business-management drains (§7, §8, §9), summed each tick.

### 1.3 Death & breakdown (PRD §6)
Track `weeksAtZeroHealth` and `weeksAtZeroHappy` counters.
```
if health   == 0: weeksAtZeroHealth++  else weeksAtZeroHealth = 0
if happiness == 0: weeksAtZeroHappy++   else weeksAtZeroHappy = 0
if weeksAtZeroHealth >= 3 → DEATH        ("your body gave out")
if weeksAtZeroHappy   >= 3 → BREAKDOWN    ("your mind gave out")  // conscious death
```
Both are **run-terminal → prestige**. Reaching 0 shows an escalating warning; the 3-week grace lets a
desperate player claw back (a costly spa week, quitting a brutal job) before it's over. Warnings at
`<18` remain as early alerts. *(M1: full rule.)*

### 1.4 Money model
- `cash` (liquid), `bank` (safe yield), plus asset holdings (M3). Net worth sums all + illiquid asset
  value (home, businesses, property).
- **Bank:** tiered weekly compound interest (kept from prototype) as the *safe, low* option:
  `<10k: 0.12%/wk · 10k–100k: 0.15% · 100k–1M: 0.18% · 1M+: 0.22%` *[TUNE]*. Automation toggles
  (auto-deposit %, pay-upkeep-from-bank, overdraft) carry over.
- **Weekly upkeep** = home upkeep + subscriptions + business management costs, billed each tick.

---

## 2. The tick (authoritative order)

The tick is a **pure reducer**: `tick(state, action, rng) → newState`. One `action` per week
(`work` | `study` | `activity` | `advance` | `manageBusiness` | …). Order:

```
 1. totalWeeks += 1
 2. Bank interest on prior balance
 3. Business pass: compute per-business income/loss, growth step, morale step, management drains
 4. Market pass (M3): advance asset prices per news + volatility
 5. Income in: business net + salary(if work) + rent(M3), apply auto-deposit split
 6. Upkeep out: home + subscriptions + payroll(businesses) (+overdraft/bank rules)
 7. Passive stat deltas (home/lifestyle/business drains)
 8. Decay (age-driven), then apply action's stat/money/xp/study effects
 9. Skills/experience increments (M4/M2)
10. Event roll (§10): eligibility → weight buckets → probabilistic pick → apply/queue decision
11. Clamp stats; update zero-counters; check death/breakdown
12. Update peak net worth; evaluate goals (§11) & achievements
13. Append log lines; autosave
```

M1 implements steps 1–3, 5–8, 10–13 (no market/rent). Deterministic given `(state, action, rng seed)`.

---

## 3. Education (PRD §7)

### 3.1 Spine (sequential, each gates the next)
| Level | id | Study weeks | Tuition [TUNE] | Requires |
|---|---|---|---|---|
| School (baseline) | `school` | — | — | given at start (most scenarios) |
| Diploma | `diploma` | 24 | 6,000 | school |
| **Degree (choose major)** | `degree:<major>` | 48 | 24,000 | diploma |
| Master's | `master:<major>` | 24 | 36,000 | matching degree |
| PhD | `phd:<major>` | 48 | 30,000 | matching master |

### 3.2 Majors (branch at Degree)
`CS · Law · Business · Medicine · Engineering · Arts · Science · Education` (extensible).
A major is carried on the credential (`degree:law`). **Strict lock:** a career field consumes a
specific major (see §4 map). Medicine additionally routes through **Med School** (auxiliary) for a
license, mirroring the prototype.

### 3.3 Auxiliary tracks (off-spine unlockers)
`Community College · Trade Certificate · Police Academy · Military Academy · Med School · Bar Exam …`
Each is a standalone `{weeks, cost, grants}` that unlocks specific jobs/businesses/skills without being
on the degree ladder. *(M1: spine + majors only; auxiliaries in M2.)*

### 3.4 Rules
- One enrollment at a time; tuition upfront; **Study** action = +1 progress week; graduation grants the
  credential. Study weeks carry a small happiness cost.
- Credentials are permanent and carry across the spine (a PhD implies the degree).

---

## 4. Careers (PRD §8)

### 4.1 Model
- Career = **field ladder** of named **roles**. Taking a job places you at the lowest role you qualify for.
- **Salary is fixed per role**; it changes **only on promotion** (no weekly creep).
- **Promotion gate = weeks-in-field (experience) AND education tier.** The job UI shows progress to next
  promotion and what's blocking it (need weeks, or need a credential).
- **Field entry = strict education lock** for professional fields (need the field's major). **Entry-tier
  jobs** (service/labor) need no education and are the universal fallback.
- Working costs weekly `health`/`happiness` by role (stress). Higher roles often pay more *and* drain more.

### 4.2 Fields
`Service · Labor · Tech · Medical · Legal · Business/Finance · Creative · Public (police/military) · Academia`

### 4.3 Reference ladder — **Tech** (fully authored for M1)
| Role | Salary/wk [TUNE] | Promote after (wks in field) | Edu required | Stress (h/hp per wk) |
|---|---|---|---|---|
| Intern | 400 | 24 | Degree:CS | 0.3 / 0.8 |
| Junior Developer | 900 | 48 | Degree:CS | 0.3 / 1.0 |
| Software Engineer | 1,450 | 96 | Degree:CS | 0.3 / 1.2 |
| Senior Engineer | 2,100 | 96 | Degree:CS | 0.3 / 1.4 |
| Team Lead | 2,800 | 144 | Master:CS | 0.4 / 1.6 |
| Engineering Manager | 3,600 | 144 | Master:CS | 0.4 / 1.8 |
| Director of Eng | 4,800 | 192 | Master:CS | 0.5 / 2.0 |
| VP Engineering | 6,500 | — | Master:CS | 0.6 / 2.2 |
| CTO | 9,000 | — | Master:CS | 0.7 / 2.4 |

*Promotion also requires meeting the role's edu bar — e.g., you stall at Senior Engineer until you hold a
Master's, even with the experience.* Every other field gets an equivalent authored ladder in the Data Spec
(M2). Skills/traits (M4) can shorten "promote after" or reduce stress.

### 4.4 Entry-tier fallback jobs (no education)
Dishwasher, Cashier, Warehouse Packer, Rideshare Driver, Barista — low pay, always available, feed the
Service/Labor experience that some businesses/auxiliaries want.

---

## 5. Skills & traits (PRD §9) — *M4*

- **Traits/Background:** set by scenario + some events. Examples: *Hustler* (+business growth),
  *Ivy Legacy* (start with a degree, more debt), *Iron Constitution* (slower health decay),
  *Anxious* (faster happiness decay, cheaper therapy events). Traits are mostly permanent per run.
- **Skills** (0–100, leveled by use): *Discipline, Charisma, Negotiation, Fitness, Coding, Finance,
  Street Smarts*. Effects: promotion speed, event-choice success odds, relationship gains, market read,
  business growth. Skills are per-run; prestige perks may grant starting levels.

---

## 6. Relationships & family (PRD §10) — *M4*

- **Relationship meter** per active relationship (partner; friends optional later). Raised by
  time/gifts/attention actions and some events; decays slowly if neglected.
- **Partner:** dating → committed → married. Provides shared income (a fraction of a generated partner
  salary), happiness passive, but shared costs and event surface (illness, conflict, divorce → asset split).
- **Children:** ongoing weekly cost + happiness volatility + dedicated events (school, milestones,
  emergencies). **No heir/succession** — children are texture and finance/event surface only.
- Marriage/kids can be **goal/scenario** objectives (§11).

---

## 7. Business (PRD §11) — *M2 (roadmap: IPO)*

The signature deep system. Each owned business is an object with its own state.

### 7.1 Tiers & fields
Businesses are tiered by **capital cost & product** (micro → small → medium → large → enterprise) and
belong to a **field** (Food, Retail, E-commerce, Software, Consulting, Medical, Real-Estate-Ops, …).
Field determines the flavor and the **field-unique modifier** (§7.5).

### 7.2 Per-business state
```
{ id, tier, field,
  invested,            // capital poured in
  growth,   // 0..100  // maturity: drives revenue realization
  morale,   // 0..100  // aggregate Team Morale (single meter — DECIDED)
  staff, branches,     // counts, each capped by tier
  reputation/techDebt/inventory/... // one field-unique stat
}
```

### 7.3 Lifecycle: loss → breakeven → profit
Each business has a `baseRevenue` and `baseCost` for its tier. **Realized revenue scales with growth**;
costs (incl. payroll) are paid from week one — so a young business runs at a **loss** until growth climbs.
```
capacity      = tierCapacity * (1 + 0.5*branches) * (0.5 + 0.5*moraleFactor)   // moraleFactor = morale/100
revenue       = baseRevenue * (growth/100) * capacity
payroll       = staff * wagePerStaff            // wage is a player-set lever (see morale)
runningCost   = baseCost + payroll + branches*branchUpkeep
weeklyNet     = revenue - runningCost           // negative early = the startup loss
```

### 7.4 Growth & morale steps (per tick)
```
competence  = matchEduField(owner, field) ? 1.0 : 0.5     // strict-ish: relevant edu/exp doubles growth
growthDrive = GROWTH_BASE * competence * moraleFactor * (1 + investEffect(invested))
growth     += growthDrive - decayIfNeglected                // approaches 100 asymptotically [TUNE]

// morale: set wages & profit-share; morale rises toward a target set by generosity, falls if stingy
wageRatio   = wagePerStaff / marketWage           // 1.0 = market rate
shareRatio  = profitSharePct                       // % of weeklyNet returned to staff
moraleTarget = clamp(40 + 40*(wageRatio-1) + 60*shareRatio)   // generous pay/share → high target [TUNE]
morale     += (moraleTarget - morale) * MORALE_LERP           // MORALE_LERP = 0.08
if morale < ATTRITION_FLOOR: staff may quit (capacity drops)  // ATTRITION_FLOOR = 25
```
So the player nurtures a company by **paying well / sharing profit** (raises morale → capacity → revenue)
vs. **extracting** (higher take now, morale erodes, attrition stalls growth). Owner competence
(education/experience match) is the other big lever — matching background makes growth far cheaper.

### 7.5 Operations & caps
- **Invest** capital → `investEffect` bumps growth (diminishing returns) and can raise tier.
- **Hire** staff up to `tierStaffCap`; raises capacity ceiling *and* payroll.
- **Open branch** up to `tierBranchCap`; multiplies capacity, adds upkeep, dilutes morale slightly.
- **Field-unique stat** modifies the formulas: Food `reputation` (events + service quality scale revenue),
  Software `techDebt` (accrues with fast growth, drags revenue until you invest to pay it down),
  Retail/E-com `inventory` (stock-outs cap revenue). Each field authors one such stat in the Data Spec.
- **Management drain:** owning businesses costs weekly `happiness` (and a little `health`) scaling with
  count/complexity — the prototype's `mh/mhp`, generalized.

### 7.6 Roadmap: IPO
A mature large/enterprise business can **IPO** → becomes a tradable ticker on the market (§8), unlocking
share sales, dilution, and (grey-zone) insider-trading events. Post-v1.

---

## 8. Investing & the Market (PRD §12) — *M3 (real estate too)*

### 8.1 Asset classes (tabbed UI)
`Stocks · Commodities · Cryptocurrencies` (+ later: Bonds, player IPOs). Each asset:
`{ id, name, class, price, volatility, driftFromNews }`.

### 8.2 Price model (per tick, in the market pass)
```
price *= 1 + drift + noise
noise  = gaussian(0, volatility[class])          // crypto ≫ commodities > stocks
drift  = sum(activeNewsEffects on this asset)     // news is the deterministic signal
```

### 8.3 News feed (DECIDED: always predictive)
Each week, 0–3 headlines publish. A headline binds to asset(s) with a **known sign & magnitude** and a
**horizon** (the drift applies over the next K weeks). *"Taslo R&D breakthrough" → Taslo +drift for 4 wks;
"Silver supply glut" → Silver −drift for 3 wks.* Because news is always predictive, the skill is
**timing and allocation, not guessing** — you still choose size, entry, and when to exit before the drift
decays and volatility reasserts.

### 8.4 Real estate (rent & flip)
Properties are market assets with a slow price series:
- **Rent:** buy → collect weekly rent (passive income) − upkeep/vacancy risk (event surface).
- **Flip:** buy → optional **renovate** (spend weeks + cash to raise value) → sell into the variable market.
  Profit = sale − purchase − reno − holding costs; timing vs. the property price series matters.
- Distinct from your **residence** (Lifestyle §9).

---

## 9. Lifestyle (PRD §13) — *M2*

Split into four spend categories; each contributes passive stats and/or weekly upkeep:
- **Home (residence tiers):** Parents' → Studio → Condo → House → Villa → Mansion. Value (net worth) +
  weekly upkeep + passive health/happiness. Exclusive (one at a time). *(Kept from prototype.)*
- **Food (diet tiers):** from instant-noodles to personal-chef; recurring cost, health-leaning passive.
- **Clothes (wardrobe tiers):** happiness/social passive; mix of one-time buys and upkeep; some gate
  social/relationship event outcomes.
- **Subscriptions (stackable):** Gym (health), **Health Insurance** (scales down health-event costs &
  aging), Streaming/Hobbies (happiness), etc. Recurring upkeep.

*(M1 ships Home + a couple of subscriptions; Food/Clothes in M2.)*

---

## 10. Events (PRD §15) — *light set in M1, full in later milestones*

### 10.1 Structure
```
Event = {
  id, category,                        // health/finance/career/social/absurd
  eligible(state) → bool,              // gating (e.g., no insurance, has job, has business)
  weight(state) → number,              // situational likelihood
  severity,                            // minor | major | catastrophic
  kind: "outcome" | "choice",
  apply(state) OR choices:[{label, apply(state), successOdds?(state)}]
}
```

### 10.2 Roll (tick step 10)
```
pool     = events.filter(e => e.eligible(state))
if rand() > WEEKLY_EVENT_CHANCE: return          // most weeks: nothing (WEEKLY_EVENT_CHANCE ≈ 0.15 [TUNE])
bucketed = groupByWeightRange(pool)               // severity/weight buckets
bucket   = pickBucketBiasedToMinor()              // minor common, major rare, catastrophic very rare
event    = weightedPick(bucket, e => e.weight(state))
event.kind == "choice" ? queueDecisionModal(event) : apply(event)   // choice pauses auto-live
```
`weight` keys off life state: no insurance ↑ medical-bill severity; high job stress ↑ burnout; wealth ↑
lawsuit/scam surface; bad neighborhood ↑ theft; relationship state ↑ social events; etc.

### 10.3 Sample events (M1 seed set)
- *Minor:* found $200; caught a cold (−health, 1 wk); friend's wedding (−cash, +happiness);
  car trouble (−cash if you own a car).
- *Major (choice):* medical scare — **pay $8k for treatment** vs. **gamble** (odds scale w/ insurance & health).
- *Major:* surprise layoff (lose job) — weighted up by high stress / down by seniority.
- *Absurd:* a distant relative leaves you a llama farm (small passive income + upkeep + flavor).
- *Catastrophic (rare):* market-linked wipeout, serious illness, lawsuit.

Balance: mostly minor, occasional major, rare catastrophic — texture without arbitrariness (Pillar 5).

---

## 11. Scenarios, Goals & Perks (PRD §5) — *framework in M1, catalog in M5*

### 11.1 Scenario
```
Scenario = {
  id, name, difficulty,              // tiered: easy → nightmare
  start: { age, cash, bank, edu, home, traits[], flags },   // shapes how life begins
  goal: Goal
}
```
- **Normal Life** (baseline): age 18, modest parental cash, school certificate.
- **Slumdog Millionaire** (hard): worst start (age 18, ~$0, no edu, bad neighborhood flag, maybe a debt);
  goal = net worth ≥ $1M.
- Many more, tiered.

### 11.2 Goal
```
Goal = { id, test(state)→bool, reward?: PerkId }
```
- **Non-terminal:** on `test` first passing, fire a **blocking celebration modal** (centered, dims screen);
  on acknowledge, **play continues**.
- Some goals award a **Perk**.

### 11.3 Perks (meta-progression, opt-in)
```
Perk = { id, name, desc, modifier(baseConfig) → config }   // toggled on/off per future run
```
Unlocked by goals; the player **toggles perks on/off before a run**. Examples: *Trust Fund* (start +$25k),
*Fast Learner* (−20% study weeks), *Workaholic* (−1 stress across jobs), *Green Thumb* (+business growth).
Perks stack on top of prestige bonuses but are chosen, so players can self-impose difficulty.

---

## 12. Prestige / Legacy (PRD §10, cold rebirth) — *M5 tuning*

On death/breakdown → **cold rebirth as the same player** at the scenario's start age, keeping:
- **Legacy points** earned this life, spendable/auto-applied as permanent bonuses.
- Unlocked **achievements** and **perks** (perks remain toggleable).

**Legacy earned (first pass, from prototype, [TUNE]):**
```
earned = floor(sqrt(max(0, peakNetWorth)) / 50)
       + achievementsUnlocked * 2
       + floor((ageYears - startAge) / 10)
```
**Legacy bonuses (per point P):** `startMoney = 500 + 300P`, `incomeMult = 1 + 0.01P`,
`agingMult = max(0.4, 1 - 0.004P)`. Longevity **Elixir** (escalating cost, rewind ~10 yrs, restore health)
stays as the in-life longevity sink.

---

## 13. Balancing philosophy (how we'll tune)

- **Weeks-to-milestone targets** guide numbers: e.g., a focused player reaches first business by ~year 3,
  first $100k by ~year 6, first natural-death run in a single sitting.
- **Three viable engines** (career salary, business net, market/property) should reach comparable
  end-game wealth by different risk/effort profiles; no single one dominates (Pillar 4).
- **Counter-pressures:** income scales, but so do aging decay, business management drain, and event
  severity with wealth — so you must keep *spending* on health/happiness, not just hoard.
- All constants live in `config/tuning.ts`; balance changes never touch logic (Tech Arch).

---

## 14. Milestone mapping (build order, PRD §17)

| System | Milestone |
|---|---|
| Tick reducer, save/load, time-skip, stats, death rules | **M1** |
| Education spine + majors; Tech ladder + entry jobs; Bank; leisure; Home + basic subs; light events; Normal Life scenario; goal/perk framework | **M1** |
| All majors + all career ladders; Businesses (morale model); Food/Clothes lifestyle; auxiliaries | **M2** |
| Market (stocks/commodities/crypto) + news feed; real-estate rent/flip | **M3** |
| Relationships/family; skills/traits; deep health | **M4** |
| Full scenario/goal/perk catalog; prestige tuning; achievements; balance pass | **M5** |
| Company IPO + insider trading | **Roadmap** |

---

*Next: **Technical Architecture** (stack, project structure, state shape, persistence, RNG, testing) and
**Content/Data Spec** (concrete schemas + first data for scenarios, education, careers, businesses, assets,
events). The Data Spec will carry the exhaustive tables this GDD references.*
