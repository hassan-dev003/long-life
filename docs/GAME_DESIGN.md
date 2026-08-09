# Long Life — Game Design Document (GDD)

> **Status:** v1.0 — FINALIZED. Concrete mechanics, formulas, ladders, and first-pass
> economy numbers for **Long Life**. Every number is a starting point and lives in a central tuning
> config (see Technical Architecture); values flagged *[TUNE]* are especially provisional. Superseded
> ideas are not tracked here. The GDD specs the full game and flags what belongs to **M1** vs. later
> milestones (§14).

---

## 0. Design pillars

1. **The week is sacred.** Every system resolves through the tick. Turn-based, no time-skip.
2. **Time is the scarce resource, not money.** The core tension is always *what to spend this week on*.
3. **Grounded, with spice.** Realistic systems and prices; occasional absurd events/flavor.
4. **No dominant strategy.** Career, business, and market are each viable paths; snowballing is fine, a
   *free* snowball is not.
5. **A run is a story.** Events and swings make two runs feel different even with the same plan.
6. **Out-earn your mortality.** The endgame is the compounding-vs-aging race, funded to buy Elixirs (§12).

---

## 1. Core numeric model

### 1.1 Time
- `WEEKS_PER_YEAR = 48`; 4 weeks = 1 month; 12 months = 1 year.
- `ageYears = floor(startAge + totalWeeks / 48)`; `startAge` from scenario (usually 18).
- **No time-skip.** Every clock advance is a deliberate one-week action (`work` / `study` / `activity`
  / `manage`). No "advance N," no auto-live.

### 1.2 Stats
`health` and `happiness`, each clamped `[0,100]`. Per-tick:
```
health     += passiveHealth  - healthDecay + actionHealth
happiness  += passiveHappy    - happyDecay   + actionHappy
```
**Decay (aging pressure):**
```
ageDecay      = max(0, ageYears - 25) * AGE_DECAY_RATE * agingMod    // AGE_DECAY_RATE = 0.02 [TUNE]
healthDecay   = BASE_H_DECAY  + ageDecay + (happiness < 30 ? CROSS_PENALTY : 0)   // BASE_H_DECAY = 0.10
happyDecay    = BASE_HP_DECAY            + (health    < 30 ? CROSS_PENALTY : 0)   // BASE_HP_DECAY = 0.40
CROSS_PENALTY = 0.30
```
`agingMod` (<1 slows aging) comes from **insurance, traits, and perks only** — there are no prestige
multipliers. Passive contributions come from residence, lifestyle, and (later) deep-health inputs.

**Starting values (as built):** new lives begin at **health 80 / happiness 80** — deliberately below the
*Zen* achievement threshold (both ≥ 90) so it must be earned, with headroom to climb through leisure.

### 1.3 Death, breakdown & bankruptcy
Track `weeksAtZeroHealth` / `weeksAtZeroHappy`:
```
health   == 0 ? weeksAtZeroHealth++ : weeksAtZeroHealth = 0
happiness == 0 ? weeksAtZeroHappy++  : weeksAtZeroHappy = 0
weeksAtZeroHealth >= 3 → DEATH      ("your body gave out")
weeksAtZeroHappy   >= 3 → BREAKDOWN  ("your mind gave out")
```
Both are run-terminal. Reaching 0 shows an escalating warning; the 3-week grace lets a desperate player
claw back before it's over.

**Bankruptcy (as built in M1) — a third run-terminal condition.** Track `weeksInDebt`:
```
cash < 0 ? weeksInDebt++ : weeksInDebt = 0
weeksInDebt == 1                → WARNING (blocking "balance severely low" modal)
weeksInDebt >= BANKRUPTCY_GRACE  → BANKRUPT ("the debts came due")   // BANKRUPTCY_GRACE = 2
```
The first week in the red fires a blocking warning; if cash is still negative the next week, the run
ends. Because purchases and leisure are cash-gated (§1.4), debt only accrues from **unavoidable upkeep
or bad events** — the *pay-upkeep-from-bank* toggle is the player's tool to avoid it.

On any run ending, the player picks a new scenario; **unlocked perks & achievements persist, nothing else
does** (no prestige carry-over).

### 1.4 Money model
- `cash` (liquid), `bank` (safe yield), asset holdings (M3). Net worth = all liquid + illiquid asset
  value (residence-if-owned, businesses, property).
- **Cash is what you spend (as built).** Purchases — tuition, subscriptions, leisure, the Elixir — draw
  from and are gated on **cash-in-hand only**; the **bank is a separate vault you must withdraw from
  first**. Bank still counts toward net worth (it's your wealth), but it never silently funds a purchase.
  The lone exception is the opt-in *pay-upkeep-from-bank* automation, which covers recurring upkeep only.
- **Hard ceiling `MONEY_CAP = 999_999_999_999_999`** (~$1 quadrillion). `cash`, `bank`, net worth, and
  holdings are each clamped at the cap.
- **`moneyShort` — 3 significant figures**, suffixes `k/M/B/T`:
  ```
  <1e3 : exact, grouped commas        e.g. $842
  ≥1e3 : $#.##k / $##.#k / $###k       e.g. $12.5k
  ≥1e6 : M   ≥1e9 : B   ≥1e12 : T      e.g. $1.25M · $12.5M · $125M · $1.25B · $847T
  at cap → "$999T" (MAX badge)
  ```
  Exact/precise displays use full grouped-comma form. The formatter must not overflow at the cap.
- **Bank:** tiered weekly compound interest, the *safe, low* option. Tiers span the whole range; rates
  stay modest so market/business are the real growth engines *[TUNE]*. Automation toggles (auto-deposit
  %, pay-upkeep-from-bank, overdraft) carry over.
- **Weekly upkeep** = residence upkeep + subscriptions, billed each tick. (No business management cost.)
- **Pricing is market-realistic across every element** (§3, §4, §9, §12): tuition, salaries, homes,
  cars, food, activities, businesses, and assets all peg to real-world references; the fantasy scaling
  lives only at the very top.

---

## 2. The tick (authoritative order)

Pure reducer: `tick(state, action, rng) → newState`. One `action` per week. Order:
```
 1. totalWeeks += 1
 2. Bank interest on prior balance
 3. Business pass: per-business income/loss, growth step, morale step (no owner stat drain)
 4. Market pass (M3): advance asset prices per active news drift + hidden volatility
 5. Income in: business net + salary(if work) + rent(M3); apply auto-deposit split
 6. Upkeep out: residence + subscriptions + business payroll (+ overdraft/bank rules)
 7. Passive stat deltas (residence/lifestyle)
 8. Decay (age-driven), then apply the action's stat/money/xp/study effects
 9. Skills/experience increments (M4/M2)
10. Event roll (§10): eligibility → severity buckets → weighted pick → apply / open decision modal
11. Clamp stats & money(cap); update zero-counters; check death/breakdown
12. Update peak net worth; evaluate goals (§11) & achievements
13. Append log lines; autosave
```
Deterministic given `(state, action, rng seed)`. M1 implements 1–3, 5–8, 10–13 (no market/rent).

---

## 3. Education

### 3.1 Spine (sequential; market-realistic tuition)
| Level | id | Study weeks | Tuition [TUNE] | Requires |
|---|---|---|---|---|
| School (baseline) | `school` | — | — | given at start (most scenarios) |
| Diploma / Associate | `diploma` | 24 | ~$25,000 | school |
| **Degree (choose major)** | `degree:<major>` | 96 | ~$120,000 | diploma |
| Master's | `master:<major>` | 48 | ~$70,000 | matching degree |
| PhD | `phd:<major>` | 96 | ~$45,000 | matching master |

Credentials are permanent and cumulative (a PhD implies the degree). One enrollment at a time; **Study**
= +1 progress week (small happiness cost); graduation grants the credential.

### 3.2 Majors (branch at Degree)
`CS · Law · Business · Medicine · Engineering · Arts · Science · Education` (extensible). A major is
carried on the credential (`degree:law`). **Strict lock:** a professional field requires its specific
major (see §4). Medicine routes through **Med School** (auxiliary, ~$300k) for a license.

### 3.3 Auxiliary tracks (off-spine unlockers)
`Community College · Trade Certificate · Police Academy · Military Academy · Med School · Bar Exam …`
Each `{weeks, cost, grants}` unlocks specific jobs/businesses/skills, priced to real-world analogues.

### 3.4 Life Courses (skill/trait unlockers)
```
LifeCourse = { id, name, cost, weeks, grants: SkillOrTraitId, req?, special? }
```
Short courses/hobbies/experiences that unlock a **Skill or Trait**, **priced & paced by the value they
unlock**:
- *Thrifting workshop* → **Frugality** (cheaper purchases/upkeep). Low cost, few weeks.
- *Public-speaking class* → **Charisma+**.
- *Investing seminar* → **Market Sense** (sharper read of hidden volatility, §8).
- *Fitness program* → **Iron Constitution** (slower health decay).

**Special-locked traits** (e.g., **Lucky**, §5) are **never** in this catalog — only via special
scenarios/actions. Each Skill/Trait unlocks once; some courses have prerequisites (`req`).

---

## 4. Careers

### 4.1 Model
- Field ladders of named roles. Taking a job places you at the lowest role you qualify for; the UI shows
  progress to next promotion and what's blocking it.
- **Salary is fixed per role; it changes only on promotion.**
- **Field entry = strict education lock** for professional fields; **entry-tier jobs** (service/labor)
  need no education and are the universal fallback.

> **Design rule — every role has a UNIQUE gate (no strictly-dominated roles).** A higher-paying role
> must require *something the lower one does not*, drawn from a mix of: weeks-in-field, prior-role
> tenure, education tier, a **skill threshold**, a **trait**, or an **achievement/milestone**. Two
> adjacent roles never share the same requirement set. Applies to **every** ladder in the Data Spec.

### 4.2 Fields
`Service · Labor · Tech · Medical · Legal · Business/Finance · Creative · Public · Academia`.

### 4.3 Reference ladder — **Tech** (fully authored for M1; salaries market-realistic)
| Role | Salary/wk | ≈ Annual | Unique gate to reach this role |
|---|---|---|---|
| Intern | 1,000 | ~$48k | `Degree:CS` (field entry) |
| Junior Developer | 2,100 | ~$100k | 24 wks as Intern **+ Coding ≥ 20** |
| Software Engineer | 3,300 | ~$160k | 48 wks in field **+ Coding ≥ 40 + achievement "Shipped a Feature"** |
| Senior Engineer | 4,800 | ~$230k | 96 wks in field **+ Coding ≥ 65 + achievement "Owned a System"** |
| Team Lead | 6,300 | ~$300k | `Master:CS` **+ Leadership ≥ 40 + 24 wks as Senior** |
| Engineering Manager | 8,300 | ~$400k | Leadership ≥ 60 **+ Negotiation ≥ 40 + achievement "Managed a Team 48wk"** |
| Director of Eng | 11,500 | ~$550k | 192 wks in field **+ Leadership ≥ 75 + Finance ≥ 40** |
| VP Engineering | 16,000 | ~$770k | Leadership ≥ 85 **+ achievement "Shipped a $10M Product"** |
| CTO | 25,000 | ~$1.2M | `PhD:CS` **OR** founded & grew a tech business to profit **+ Finance ≥ 70** |

Every gate is unique, so no lower role is ever strictly dominated, and the top demands *broadening*
(leadership, finance, a founder achievement). Per-role stress (weekly health/happiness cost) is tabled
in the Data Spec. Every other field gets an equivalently unique-gated ladder (M2). M1 approximates
skill/achievement gates with experience+education where the skill system isn't live yet.

### 4.4 Entry-tier fallback jobs (no education)
Dishwasher, Cashier, Warehouse Packer, Rideshare Driver, Barista — low pay, always available, build
Service/Labor experience some businesses/auxiliaries want.

---

## 5. Skills & traits

- **Traits/Background:** from scenario + some events + some Life Courses. Examples: *Hustler*
  (+business growth), *Iron Constitution* (slower health decay), *Frugality* (cheaper everything),
  *Anxious* (faster happiness decay, cheaper therapy events).
- **Lucky (special trait):** biases the event roll (§10) toward positive outcomes — more windfalls,
  softer catastrophes, better choice odds. **Not purchasable**; unlocks only via specific
  scenarios/actions, then usable as a toggleable **Perk** (§11.3).
- **Skills (leveled by use):** Discipline, Charisma, Negotiation, Fitness, Coding, Finance, Market
  Sense, Street Smarts. Effects: gate/accelerate promotions, event-choice odds, relationship gains,
  business growth, market read. Skills are per-run; perks may grant starting levels.

---

## 6. Relationships & family

- **Relationship meter** per partner. Dating → committed → married. Shared income (a fraction of a
  generated partner salary), happiness passive, shared costs, event surface (illness, conflict, divorce
  → asset split).
- **Children:** ongoing weekly cost + happiness volatility + dedicated events. **No heir/succession.**
- Marriage/kids can be goal/scenario objectives (§11).

---

## 7. Business

### 7.1 Tiers & fields
Tiered by **capital cost & product** (micro → small → medium → large → enterprise), each in a **field**
(Food, Retail, E-commerce, Software, Consulting, Medical, Real-Estate-Ops…). Field sets the flavor and
the field-unique modifier (§7.5).

### 7.2 Per-business state
```
{ id, tier, field,
  growth,   // 0..100  maturity → revenue realization
  morale,   // 0..100  aggregate Team Morale (single meter)
  staff, branches,     // counts, each capped by tier
  reputation/techDebt/inventory/... // one field-unique stat
}
```
No `invested` field — there is no capital-investment mechanic.

### 7.3 Lifecycle: loss → breakeven → profit
```
capacity     = tierCapacity * (1 + 0.5*branches) * (0.5 + 0.5*moraleFactor)   // moraleFactor = morale/100
revenue      = baseRevenue * (growth/100) * capacity
payroll      = staff * wagePerStaff
runningCost  = baseCost + payroll + branches*branchUpkeep
weeklyNet    = revenue - runningCost          // negative early = the startup loss
```

### 7.4 Growth & morale (per tick)
```
competence  = matchEduField(owner, field) ? 1.0 : 0.5      // relevant edu/exp doubles growth
growthDrive = GROWTH_BASE * competence * moraleFactor       // no capital-investment term
growth     += growthDrive - decayIfNeglected                // asymptotic toward 100 [TUNE]

wageRatio    = wagePerStaff / marketWage                    // 1.0 = market rate
shareRatio   = profitSharePct
moraleTarget = clamp(40 + 40*(wageRatio-1) + 60*shareRatio) // generous pay/share → higher target [TUNE]
morale      += (moraleTarget - morale) * MORALE_LERP        // MORALE_LERP = 0.08
if morale < ATTRITION_FLOOR: staff may quit (capacity drops) // ATTRITION_FLOOR = 25
```
You nurture a company by **paying well / sharing profit** (morale → capacity → revenue) vs. **extracting**
(more take now, morale erodes, attrition stalls growth). Owner competence is the other big lever.

### 7.5 Operations & caps (two levers only)
- **Hire** staff up to `tierStaffCap` — raises capacity ceiling *and* payroll.
- **Open branch** up to `tierBranchCap` — multiplies capacity, adds upkeep, slightly dilutes morale.
- **Field-unique stat:** Food `reputation` (scales revenue), Software `techDebt` (accrues with fast
  growth, drags revenue until paid down with time/focus), Retail/E-com `inventory` (stock-outs cap
  revenue). One per field in the Data Spec.
- **No health/happiness cost for owning a business** — purely financial/management (deliberate: fun > realism here).

### 7.6 Roadmap: IPO
A mature large/enterprise business can **IPO** → a tradable ticker on the market (§8), enabling share
sales, dilution, and insider-trading events. Post-v1.

---

## 8. Investing & the Market

### 8.1 Asset classes & names
`Stocks · Commodities · Cryptocurrencies` (+ later Bonds, player IPOs). Player sees only `{ id, name,
class, price }` and price history.
- **Parody tickers** for brand-based assets — distorted-but-guessable to avoid trademarks (Tesla→**Taslo**,
  Nvidia→**Nvadia**, Google→**Gaggle**, Amazon→**Amazor**, Bitcoin→**Bitcorn**…). **Real commodities**
  (gold, silver, oil, wheat…) keep real names — they aren't brands.

### 8.2 Price model & HIDDEN volatility
```
price *= 1 + drift + noise
noise  = gaussian(0, sigma(asset))    // sigma is INTERNAL — never shown, never documented in-game
drift  = sum(activeNewsEffects on this asset)
```
- **Volatility (`sigma`) is hidden and unexplained.** Not shown anywhere; players learn an asset's
  temperament only by watching its price patterns over time.
- `sigma` is set per asset from its **class** (crypto ≫ commodities > stocks) **and an abstract per-asset
  field/reputation modifier** (a blue-chip is calmer than a meme stock within "Stocks"). Authored in the
  Data Spec, surfaced to the player only implicitly. The *Market Sense* skill subtly improves the read
  but never prints the number.

### 8.3 News feed (always direction-predictive; magnitude by tone)
- **Each week, 0–3 short headlines publish; each targets one specific asset.**
- A headline sets a **known direction** and a **strength tier** that scales the **drift magnitude** over a
  short horizon:

  | Strength | Reads like | Drift magnitude |
  |---|---|---|
  | **Soft** | vague / speculative ("in talks to onboard a partner") | small |
  | **Moderate** | concrete but limited ("beat quarterly earnings") | medium |
  | **Strong** | unambiguous, major ("achieved an R&D breakthrough") | large |

- Direction is always reliable; **magnitude is encoded in the language**, so *reading tone* is the skill.
  You know which way a named asset leans, but still fight hidden volatility (§8.2) on entry/exit and on
  every un-newsed asset. News is the signal; volatility is the fog.

### 8.4 Real estate (rent, flip & live-in)
Properties are market assets with a slow price series and a **quality** stat (0–100):
- **Rent:** weekly rent (passive) − upkeep/vacancy risk (event surface).
- **Flip:** optional **renovate** (weeks + cash → raise quality/value) → sell into the variable market;
  profit = sale − purchase − reno − holding.
- **Live in it:** designate as residence →
  - **All separate housing costs removed** (you own your home; you still pay property upkeep/taxes).
  - **Quality + price drive weekly health/happiness passives** (like the old housing tiers).
  - **Renovation raises the passive up to a cap set by the property's price bracket** — a cheap home can
    never reach mansion-tier wellbeing.
- One residence at a time; the rest rent or await a flip.

---

## 9. Lifestyle
Four spend categories, each contributing passive stats and/or weekly upkeep; all market-priced:
- **Home (residence):** **rent a tier** (Studio → Condo → House → Villa → Mansion; upkeep + passives) or
  **live in an owned property** (§8.4, zeroes Home upkeep).
- **Food (diet tiers):** recurring, health-leaning passive.
- **Clothes (wardrobe):** happiness/social passive; some gate social/relationship event outcomes.
- **Subscriptions (stackable):** Gym (health), **Health Insurance** (scales down health-event costs &
  aging via `agingMod`), hobbies/streaming (happiness), etc.

---

## 10. Events

### 10.1 Structure
```
Event = { id, category, eligible(state)→bool, weight(state)→number, severity,
          kind: "outcome" | "choice",
          apply(state) OR choices:[{label, apply(state), successOdds?(state)}] }
```

### 10.2 Roll (tick step 10)
```
pool  = events.filter(e => e.eligible(state))
if rand() > WEEKLY_EVENT_CHANCE: return                     // WEEKLY_EVENT_CHANCE ≈ 0.15 [TUNE]
bucket = pickBucketBiasedToMinor()                           // minor common, major rare, catastrophic very rare
event  = weightedPick(bucket, e => e.weight(state))
event.kind == "choice" ? openDecisionModal(event) : apply(event)
```
`weight` keys off life state (no insurance ↑ medical severity, high stress ↑ burnout, wealth ↑
lawsuit/scam, relationship state ↑ social events…). **Lucky** (§5) multiplies positive-event weight,
down-weights catastrophes, and bonuses choice `successOdds` — never disables bad events.

### 10.3 Sample events (M1 seed set)
- *Minor:* found $200; caught a cold (−health, 1wk); friend's wedding (−cash, +happiness); car trouble.
- *Major (choice):* medical scare — **pay for treatment** vs. **gamble** (odds scale w/ insurance & health).
- *Major:* surprise layoff (weighted up by high stress, down by seniority).
- *Absurd:* a distant relative leaves you a llama farm (small passive + upkeep + flavor).
- *Catastrophic (rare):* market-linked wipeout, serious illness, lawsuit.

---

## 11. Scenarios, Goals & Perks

### 11.1 Scenario
```
Scenario = { id, name, difficulty, start:{ age, cash, bank, edu, home, traits[], flags }, goal }
```
- **Normal Life:** age 18, modest parental cash, school certificate.
- **Slumdog Millionaire (hard):** worst start (age 18, ~$0, no edu, rough flags/debt); goal = net worth ≥ $1M.
- Many more, tiered easy → nightmare. The scenario shapes how life begins.

### 11.2 Goal (non-terminal)
```
Goal = { id, test(state)→bool, reward?: PerkId }
```
On first pass → **blocking celebration modal** (centered, dims screen) → acknowledge → **play continues**.
Some goals award a **Perk**.

### 11.3 Perks (meta-progression, opt-in)
```
Perk = { id, name, desc, modifier(baseConfig)→config }   // toggled on/off before a run
```
Unlocked by goals or special scenarios/actions; toggled before a run. Examples: *Trust Fund* (start
+$250k), *Fast Learner* (−20% study weeks), *Workaholic* (−1 stress across jobs), *Green Thumb*
(+business growth), **Lucky** (§5, special-unlock only). Perks are the **only** cross-run progression —
there is no prestige.

---

## 12. Longevity: the Elixir (the endgame spine)

The Elixir replaces prestige as the game's continuity mechanic and is the heart of the late game.
```
drinkElixir():
  totalWeeks = max(0, totalWeeks - ELIXIR_REWIND_WEEKS)   // ELIXIR_REWIND_WEEKS = 10*48 = 480
  health     = clamp(health + ELIXIR_HEAL)                 // ELIXIR_HEAL = 25 [TUNE]
  elixirPrice *= ELIXIR_PRICE_MULT                         // ELIXIR_PRICE_MULT ≈ 2.6 [TUNE]
  elixirCount += 1
```
- **Turns the clock back ~10 years and restores some health**; each Elixir costs **much** more than the
  last (`elixirPrice` compounds), so sustaining a very long life needs ever-growing income.
- **This is the core long-term loop:** compound wealth (bank + market + business) faster than aging
  erodes health, timing each Elixir to land before your health passes the point of no return. Mismanage
  the timing or the money and the run ends (§1.3).
- Base `elixirPrice` [TUNE] is set high enough that the first Elixir is a real mid/late-game milestone,
  and the geometric price growth is what pushes players toward empires and market mastery.

---

## 12.5 Philanthropy (the moral capstone)

The most expensive content in the game and a deliberate sink for fortunes that would otherwise pile up
against the money ceiling. Available only when you can actually afford it (net worth deep into the
billions/trillions).

```ts
fundWork(work):
  requires cash + liquidatable ≥ work.cost      // $1T to $950T each (wide gaps)
  spend(work.cost)
  happiness = clamp(happiness + work.happinessReward)
  completedWorks.add(work.id)
  if completedWorks.size == 1:  unlock achievement 'philanthropist'
  if completedWorks.size == 7:  unlock achievement 'humanitys-benefactor'
                                 → unlock perk 'beloved' + scenario 'benefactor'
```
- **Seven great works** (Content §10.5), costs escalating with wide gaps from **$1T to $950T** (the
  priciest sits just under the $999T ceiling, so it's affordable alone); funded sequentially, ≈ $1,751T total.
- Each is a permanent, one-time purchase granting a happiness boost and a milestone log line.
- **Design intent:** a *win-flavored* endgame for the top fraction of runs — not a stat treadmill but a
  legacy the player chooses. It rewards the compounding empire with meaning (achievements + the Beloved
  perk) rather than yet another multiplier, keeping faith with the "no free snowball" pillar.

---

## 13. Balancing philosophy

- **Weeks-to-milestone targets** guide tuning: first business ~year 3, first $100k ~year 6, first Elixir
  as a mid/late-game achievement, first natural death reachable in a sitting.
- **Three viable engines** (career salary, business net, market/property) should reach comparable wealth
  by different risk/effort profiles; none dominates (Pillar 4).
- **Counter-pressures scale with success:** aging decay rises, event severity scales with wealth, and the
  Elixir price compounds — so you must keep *spending* to stay alive, not just hoard.
- **$999,999,999,999,999 ceiling** anchors the top; the trillion tier is empire-only.
- **Everything is market-priced** at the bottom/middle so the early game feels grounded.
- All constants live in `config/tuning.ts`; balance changes never touch logic (Tech Arch).

---

## 14. Milestone mapping (build order)

| System | Milestone |
|---|---|
| Tick reducer, save/load, stats, death rules, **Elixir** (turn-based, no time-skip) | **M1** |
| Money scale + `moneyShort` (k/M/B/T, $999,999,999,999,999 cap); Education spine + majors; Tech ladder + entry jobs; Bank; leisure; Home + basic subs; light events; Normal Life scenario; goal/perk framework | **M1** |
| All majors + all career ladders; Businesses (morale model); Food/Clothes; auxiliaries | **M2** |
| Market (parody tickers, hidden volatility, tone-scaled news) + real-estate rent/flip/live-in | **M3** |
| Relationships/family; skills/traits; **Life Courses**; deep health | **M4** |
| Full scenario/goal/perk catalog; achievements; **Philanthropy (seven great works)**; balance pass | **M5** |
| Business IPO + insider trading | **Roadmap** |

---

*Next: **Technical Architecture** (stack, project structure, state shape, persistence, seeded RNG,
testing) and **Content/Data Spec** (concrete schemas + first data for scenarios, education, careers,
businesses, assets, events). The Data Spec carries the exhaustive tables this GDD references.*
