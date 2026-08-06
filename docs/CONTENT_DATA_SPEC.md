# Long Life — Content & Data Spec

> **Status:** v1.0 — FINALIZED. The concrete TypeScript schemas and first real data tables
> that `src/content/` and `src/config/tuning.ts` will hold. This is the doc you edit to add or re-balance
> content. Numbers are market-realistic first passes, flagged *[TUNE]* where provisional. Companions:
> `PRD.md`, `GAME_DESIGN.md`, `TECHNICAL_ARCHITECTURE.md`.

---

## 1. Conventions

- **IDs** are lowercase kebab/camel strings, stable forever (they appear in saves): `degree:cs`,
  `swe`, `taslo`.
- **Money** is integer USD. Weekly figures are per game-week (48/year). Display via `moneyShort`.
- **Stats** deltas are points/week on the 0–100 scale.
- Data tables below are **representative first data** — the full catalog is filled during the milestone
  that owns each system (see GDD §14). Every table is pure data; no logic.

---

## 2. Shared types

```ts
type Field = 'service' | 'labor' | 'tech' | 'medical' | 'legal'
           | 'business' | 'creative' | 'public' | 'academia';

type Major = 'cs' | 'law' | 'business' | 'medicine' | 'engineering'
           | 'arts' | 'science' | 'education';

type CredentialId =
  | 'school' | 'diploma'
  | `degree:${Major}` | `master:${Major}` | `phd:${Major}`
  | 'med-school' | 'bar' | 'police-academy' | 'military-academy' | 'community-college'
  | `cert:${string}`;

type SkillId = 'discipline' | 'charisma' | 'negotiation' | 'fitness'
             | 'coding' | 'finance' | 'market-sense' | 'street-smarts' | 'leadership';

type TraitId = 'hustler' | 'iron-constitution' | 'frugality' | 'anxious' | 'lucky' /* …*/;

type AssetClass = 'stock' | 'commodity' | 'crypto';
type BizTier = 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
type Severity = 'minor' | 'major' | 'catastrophic';
```

### 2.1 Requirement (the unique-gate primitive)
The single schema that powers career gates, job/education/business eligibility, and event conditions.
Its composability is what lets **every role have a unique gate** (GDD §4.1).
```ts
type Requirement =
  | { kind: 'credential'; id: CredentialId }
  | { kind: 'fieldExp'; field: Field; weeks: number }
  | { kind: 'roleTenure'; roleId: string; weeks: number }
  | { kind: 'skill'; id: SkillId; min: number }
  | { kind: 'trait'; id: TraitId }
  | { kind: 'achievement'; id: string }
  | { kind: 'businessProfit'; field?: Field }      // founded & grew a business to profit
  | { kind: 'netWorth'; min: number }
  | { kind: 'allOf'; reqs: Requirement[] }
  | { kind: 'anyOf'; reqs: Requirement[] };

// engine/eligibility.ts
function meets(state: GameState, req?: Requirement): { ok: boolean; reason?: string };
```

---

## 3. Education

### 3.1 Spine & auxiliaries
```ts
interface EducationProgram {
  id: CredentialId;
  name: string;
  weeks: number;
  cost: number;
  req?: Requirement;         // prerequisite credential(s)
  grantsMajorChoice?: boolean; // 'degree' asks the player to pick a Major → degree:<major>
}
```
| id | name | weeks | cost | req |
|---|---|---|---|---|
| `diploma` | Diploma / Associate | 24 | 25,000 | `school` |
| `degree:*` | Bachelor's Degree (choose major) | 96 | 120,000 | `diploma` |
| `master:*` | Master's Degree | 48 | 70,000 | matching `degree` |
| `phd:*` | Doctorate | 96 | 45,000 | matching `master` |
| `med-school` | Medical School | 60 | 300,000 | `degree:medicine` |
| `bar` | Bar Exam prep | 16 | 20,000 | `degree:law` |
| `community-college` | Community College | 32 | 12,000 | `school` |
| `police-academy` | Police Academy | 24 | 8,000 | `school` |
| `military-academy` | Military Academy | 48 | 0 | `school` |

### 3.2 Life Courses (skill/trait unlockers)
```ts
interface LifeCourse {
  id: string; name: string; weeks: number; cost: number;
  grants: { skill?: SkillId; trait?: TraitId };
  req?: Requirement;
  special?: boolean;   // if true, NOT listed in the catalog; unlocked only via scenario/action
}
```
| id | name | weeks | cost | grants |
|---|---|---|---|---|
| `thrifting` | Thrifting Workshop | 4 | 500 | trait `frugality` |
| `public-speaking` | Public Speaking Class | 8 | 2,000 | skill `charisma` (+start) |
| `investing-seminar` | Investing Seminar | 6 | 5,000 | skill `market-sense` |
| `fitness-program` | Fitness Program | 12 | 1,200 | trait `iron-constitution` |
| `negotiation-bootcamp` | Negotiation Bootcamp | 10 | 6,000 | skill `negotiation` |
| *(special)* `lucky` | — | — | — | trait `lucky` — **special-only, never in catalog** |

---

## 4. Careers

### 4.1 Schema
```ts
interface RoleDef {
  id: string;                 // 'swe'
  field: Field;
  title: string;              // 'Software Engineer'
  salaryPerWeek: number;      // fixed for the role
  stress: { h: number; hp: number };  // weekly health/happiness cost
  gate: Requirement;          // FULL requirement to hold this role (unique per role)
}
interface FieldLadder { field: Field; roles: RoleDef[] }  // ordered entry → top
```
The **first role's `gate`** is field entry (the strict education lock); each later role's `gate` is its
unique promotion requirement. `meets()` on the next role's gate drives the "promote now" check.

### 4.2 Tech ladder (full M1 data)
```ts
const TECH: FieldLadder = { field: 'tech', roles: [
  { id:'tech-intern', title:'Intern',            salaryPerWeek:1000, stress:{h:0.3,hp:0.8},
    gate:{kind:'credential', id:'degree:cs'} },
  { id:'tech-junior', title:'Junior Developer',  salaryPerWeek:2100, stress:{h:0.3,hp:1.0},
    gate:{kind:'allOf', reqs:[ {kind:'roleTenure',roleId:'tech-intern',weeks:24},
                               {kind:'skill',id:'coding',min:20} ]} },
  { id:'swe', title:'Software Engineer',          salaryPerWeek:3300, stress:{h:0.3,hp:1.2},
    gate:{kind:'allOf', reqs:[ {kind:'fieldExp',field:'tech',weeks:48},
                               {kind:'skill',id:'coding',min:40},
                               {kind:'achievement',id:'shipped-a-feature'} ]} },
  { id:'tech-senior', title:'Senior Engineer',    salaryPerWeek:4800, stress:{h:0.3,hp:1.4},
    gate:{kind:'allOf', reqs:[ {kind:'fieldExp',field:'tech',weeks:96},
                               {kind:'skill',id:'coding',min:65},
                               {kind:'achievement',id:'owned-a-system'} ]} },
  { id:'tech-lead', title:'Team Lead',            salaryPerWeek:6300, stress:{h:0.4,hp:1.6},
    gate:{kind:'allOf', reqs:[ {kind:'credential',id:'master:cs'},
                               {kind:'skill',id:'leadership',min:40},
                               {kind:'roleTenure',roleId:'tech-senior',weeks:24} ]} },
  { id:'eng-manager', title:'Engineering Manager',salaryPerWeek:8300, stress:{h:0.4,hp:1.8},
    gate:{kind:'allOf', reqs:[ {kind:'skill',id:'leadership',min:60},
                               {kind:'skill',id:'negotiation',min:40},
                               {kind:'achievement',id:'managed-a-team'} ]} },
  { id:'eng-director', title:'Director of Eng',   salaryPerWeek:11500, stress:{h:0.5,hp:2.0},
    gate:{kind:'allOf', reqs:[ {kind:'fieldExp',field:'tech',weeks:192},
                               {kind:'skill',id:'leadership',min:75},
                               {kind:'skill',id:'finance',min:40} ]} },
  { id:'vp-eng', title:'VP Engineering',          salaryPerWeek:16000, stress:{h:0.6,hp:2.2},
    gate:{kind:'allOf', reqs:[ {kind:'skill',id:'leadership',min:85},
                               {kind:'achievement',id:'shipped-10m-product'} ]} },
  { id:'cto', title:'CTO',                        salaryPerWeek:25000, stress:{h:0.7,hp:2.4},
    gate:{kind:'allOf', reqs:[
            {kind:'anyOf', reqs:[ {kind:'credential',id:'phd:cs'},
                                  {kind:'businessProfit',field:'tech'} ]},
            {kind:'skill',id:'finance',min:70} ]} },
]};
```
Every `gate` is a distinct set → no strictly-dominated role (GDD §4.1). Other fields (medical, legal,
business, creative, public, academia) get equivalently unique-gated ladders in M2, following this pattern.

### 4.3 Entry-tier jobs (no education; `gate` = always true)
```ts
const ENTRY_JOBS: RoleDef[] = [
  { id:'dishwasher', field:'service', title:'Dishwasher',       salaryPerWeek:500, stress:{h:0.5,hp:1.0}, gate:ALWAYS },
  { id:'cashier',    field:'service', title:'Retail Cashier',   salaryPerWeek:560, stress:{h:0.3,hp:1.1}, gate:ALWAYS },
  { id:'packer',     field:'labor',   title:'Warehouse Packer', salaryPerWeek:640, stress:{h:1.0,hp:0.8}, gate:ALWAYS },
  { id:'driver',     field:'labor',   title:'Rideshare Driver', salaryPerWeek:700, stress:{h:0.6,hp:0.9}, gate:ALWAYS },
  { id:'barista',    field:'service', title:'Barista',          salaryPerWeek:560, stress:{h:0.4,hp:0.8}, gate:ALWAYS },
];
```

---

## 5. Skills & traits

```ts
interface SkillDef { id: SkillId; name: string; desc: string }   // 0..100, leveled by use
interface TraitDef {
  id: TraitId; name: string; desc: string;
  effects: Partial<{
    agingMod: number; happyDecayMod: number; businessGrowthMod: number;
    priceMod: number;             // frugality: <1 on purchases/upkeep
    eventLuck: number;            // lucky: >0 skews the roll positive
  }>;
}
```
Seed traits: `hustler` (businessGrowthMod +0.2), `iron-constitution` (agingMod ×0.85), `frugality`
(priceMod ×0.9), `anxious` (happyDecayMod +0.15), **`lucky`** (eventLuck +0.5, special-unlock only).

---

## 6. Activities (leisure)

```ts
interface Activity { id:string; name:string; emoji:string; cost:number; h:number; hp:number }  // 1 week
```
| id | name | cost | +health | +happy |
|---|---|---|---|---|
| rest | Rest at home | 0 | 4 | 1 |
| walk | Take a walk | 0 | 2 | 3 |
| meditate | Meditate | 0 | 0 | 3 |
| gym | Hit the gym | 25 | 7 | 2 |
| movie | Movie night | 45 | 1 | 8 |
| dinner | Nice dinner out | 110 | 1 | 11 |
| spa | Spa day | 360 | 11 | 11 |
| trip | Weekend getaway | 1,900 | 6 | 26 |
| vacation | Luxury vacation | 13,000 | 22 | 46 |
| retreat | Wellness retreat | 65,000 | 65 | 28 |

---

## 7. Lifestyle

```ts
interface HomeTier { id:string; name:string; upkeepPerWeek:number; h:number; hp:number }  // rented
interface FoodTier { id:string; name:string; costPerWeek:number; h:number; hp:number }
interface ClothesTier { id:string; name:string; cost:number; upkeepPerWeek:number; hp:number }
interface Subscription { id:string; name:string; cost:number; upkeepPerWeek:number;
                         h?:number; hp?:number; agingMod?:number; insurance?:boolean }
```
**Home (rented) [TUNE]:** Parents' (0/0/0) · Studio (300/0.3/0.2) · Condo (700/0.6/0.6) ·
House (1,200/1.0/1.0) · Villa (4,000/1.6/2.0) · Mansion (12,000/2.6/3.2). *(upkeep/wk · h/wk · hp/wk)*
**Food:** Instant (40) · Basic (90) · Healthy (180,+h) · Gourmet (500) · Personal Chef (2,500,+h,+hp).
**Clothes:** Thrift · Basic · Smart · Designer · Couture (rising cost/upkeep, +hp, gate social events).
**Subscriptions:** Gym (600 / 25/wk, +h) · **Health Insurance** (3,000 / 120/wk, insurance:true,
agingMod ×0.9, cuts health-event costs) · Streaming (0 / 15/wk, +hp) · Country Club (25,000 / 400/wk, +hp).

---

## 8. Business

```ts
interface BusinessDef {
  id:string; name:string; field:Field; tier:BizTier;
  cost:number;                 // upfront to open
  baseRevenue:number;          // weekly at growth=100, capacity=1
  baseCost:number;             // weekly fixed (excl. payroll/branches)
  marketWage:number;           // per-staff reference wage
  staffCap:number; branchCap:number; branchUpkeep:number;
  fieldStat:'reputation'|'techDebt'|'inventory'|'none';
  req?:Requirement;
}
```
Realistic capital costs (the prototype's were toy-scale). Sample tiers [TUNE]:
| id | name | field | tier | cost | baseRev/wk | baseCost/wk | staffCap | branchCap | fieldStat |
|---|---|---|---|---|---|---|---|---|---|
| vending | Vending Route | retail→business | micro | 15,000 | 900 | 400 | 1 | 3 | inventory |
| ecom | E-commerce Store | business | small | 30,000 | 2,200 | 1,100 | 3 | 1 | inventory |
| foodtruck | Food Truck | service | small | 80,000 | 4,500 | 2,600 | 4 | 2 | reputation |
| cafe | Coffee Shop | service | medium | 250,000 | 12,000 | 7,800 | 10 | 4 | reputation |
| laundromat | Laundromat | business | medium | 300,000 | 11,000 | 6,500 | 6 | 5 | none |
| consult | Consulting Firm | business | large | 500,000 | 26,000 | 16,000 | 20 | 3 | reputation |
| startup | Software Startup | tech | large | 1,000,000 | 60,000 | 34,000 | 30 | 2 | techDebt |
| clinic | Private Clinic | medical | enterprise | 2,500,000 | 90,000 | 55,000 | 25 | 4 | reputation |
| franchise | Franchise Empire | business | enterprise | 5,000,000 | 220,000 | 120,000 | 60 | 12 | none |

Growth/morale/capacity math and the field-unique stat behavior are in GDD §7; constants
(`GROWTH_BASE`, `MORALE_LERP`, `ATTRITION_FLOOR`) live in `tuning.ts`.

---

## 9. Market

### 9.1 Asset schema
```ts
interface AssetDef {
  id:string; name:string; class:AssetClass;
  basePrice:number;
  sigmaBase:number;     // HIDDEN volatility from class — NEVER shown in UI
  sigmaRepMod:number;   // HIDDEN per-asset field/reputation modifier — NEVER shown
  realName?:string;     // dev-only note (parody mapping); not shipped to UI
}
```
`sigmaBase`/`sigmaRepMod` are authored here but **never rendered** (GDD §8.2). `class` baseline: crypto ≫
commodity > stock. Parody names for brands; real names for commodities.

| id | name (parody) | class | basePrice | sigmaBase | repMod | (real) |
|---|---|---|---|---|---|---|
| taslo | Taslo | stock | 250 | 0.05 | 1.4 | Tesla |
| nvadia | Nvadia | stock | 900 | 0.05 | 1.3 | Nvidia |
| gaggle | Gaggle | stock | 170 | 0.05 | 0.8 | Google |
| amazor | Amazor | stock | 180 | 0.05 | 0.9 | Amazon |
| applo | Applo | stock | 220 | 0.05 | 0.7 | Apple |
| gold | Gold | commodity | 2,400 | 0.03 | 0.6 | — |
| silver | Silver | commodity | 30 | 0.03 | 1.0 | — |
| oil | Crude Oil | commodity | 80 | 0.04 | 1.2 | — |
| bitcorn | Bitcorn | crypto | 60,000 | 0.12 | 1.3 | Bitcoin |
| ethreum | Ethreum | crypto | 3,200 | 0.12 | 1.5 | Ethereum |

### 9.2 News templates (direction reliable; magnitude by tone)
```ts
type NewsStrength = 'soft' | 'moderate' | 'strong';
interface NewsTemplate {
  id:string; assetId:string; direction:1|-1; strength:NewsStrength;
  text:string;               // headline shown to player (tone matches strength)
  horizonWeeks:number;       // how long the drift applies
}
// drift/week per strength (tuning): soft ≈ 0.4%, moderate ≈ 1.2%, strong ≈ 3% [TUNE]
```
Examples:
| assetId | dir | strength | headline |
|---|---|---|---|
| taslo | +1 | soft | "Taslo in talks to onboard a potentially high-value partner" |
| taslo | +1 | strong | "Taslo achieves a breakthrough in sustainable-energy R&D" |
| silver | −1 | strong | "New mining tech floods the market with silver supply" |
| bitcorn | +1 | moderate | "Major payment network to begin accepting Bitcorn" |
| oil | −1 | moderate | "Unexpected rise in reserves pressures crude prices" |

Each week the engine publishes **0–3** of these, each on **one** asset (GDD §8.3).

---

## 10. Real estate

```ts
interface PropertyDef {
  id:string; name:string; class:'residential'|'commercial';
  basePrice:number; baseRentPerWeek:number;
  livingH:number; livingHp:number;   // passives when lived-in at quality=100 (residential only)
  qualityCapByPrice:number;          // ceiling multiplier the price bracket allows
}
```
Real estate spans from a starter unit to nation-scale holdings — **the range runs wild, into the
hundreds of billions, and gets wildly profitable at the top.** `residential` can be lived in (§ GDD 8.4);
`commercial` is rent/flip only (no living passives) but throws off enormous rent.

**Residential (livable):**
| id | name | basePrice | rent/wk | livingH | livingHp |
|---|---|---|---|---|---|
| studio-unit | Studio Unit | 180,000 | 350 | 0.3 | 0.3 |
| condo-unit | Condo | 420,000 | 800 | 0.6 | 0.7 |
| suburban-house | Suburban House | 750,000 | 1,400 | 1.0 | 1.1 |
| lakeside-villa | Lakeside Villa | 3,200,000 | 5,500 | 1.8 | 2.2 |
| city-penthouse | City Penthouse | 8,000,000 | 12,000 | 2.6 | 3.0 |
| beachfront-estate | Beachfront Estate | 25,000,000 | 35,000 | 3.2 | 3.6 |
| historic-chateau | Historic Château | 90,000,000 | 110,000 | 3.6 | 4.2 |
| botanical-estate | Botanical Garden Estate | 320,000,000 | 380,000 | 4.0 | 4.8 |
| private-island | Private Island | 850,000,000 | 900,000 | 4.4 | 5.2 |
| private-archipelago | Private Archipelago | 6,500,000,000 | 6,800,000 | 5.0 | 5.8 |

**Commercial (rent / flip only — wildly profitable):**
| id | name | basePrice | rent/wk |
|---|---|---|---|
| retail-strip | Retail Strip Mall | 4,000,000 | 9,000 |
| office-tower | Office Tower | 120,000,000 | 320,000 |
| downtown-skyscraper | Downtown Skyscraper | 1,800,000,000 | 5,200,000 |
| mega-complex | Mega Shopping Complex | 12,000,000,000 | 38,000,000 |
| resort-chain | Island Resort Chain | 45,000,000,000 | 160,000,000 |
| city-district | City District | 200,000,000,000 | 780,000,000 |

Rent / flip / live-in behavior and the renovation-cap-by-price rule are in GDD §8.4. *(Table is a first
pass; more archetypes — vineyards, ski lodges, orbital habitats — can slot in along the same curve.)*

---

## 10.5 Philanthropy (the ultra-endgame money sink)

Once you're absurdly wealthy, you can pour fortunes into **doing genuine good** — the single most
expensive content in the game. Costs run from **$1 trillion up toward the money ceiling**, with wide gaps
between each work, so only an empire deep into the trillions ever touches it. It's the game's moral
capstone: a way to convert an obscene fortune into legacy, happiness, and prestige-of-a-different-kind.

```ts
interface PhilanthropyDef {
  id:string; name:string; cost:number; desc:string;
  happinessReward:number;   // one-time boost — doing enormous good feels enormous
  achievement:string;       // per-work log; the meta-achievements are in §14
}
```
**The seven great works** [TUNE] — costs escalate with wide gaps from $1T to just under the cap:
| id | name | cost | what it does |
|---|---|---|---|
| clean-water | Universal Clean Water | 1,000,000,000,000 | Safe drinking water for every community on Earth |
| free-education | Global Free Education | 5,000,000,000,000 | Schooling for every child alive |
| end-hunger | End World Hunger | 20,000,000,000,000 | Permanent global food security |
| cure-cancer | Cure Cancer | 75,000,000,000,000 | Fund the research that ends a great killer |
| space-colony | Fund a Mars Colony | 200,000,000,000,000 | Humanity's backup home |
| reverse-climate | Reverse Climate Change | 500,000,000,000,000 | Planet-scale carbon capture & restoration |
| eradicate-poverty | Eradicate Poverty | 950,000,000,000,000 | Lift the entire world above the poverty line |

Rules (full mechanics in GDD §12.5):
- Each completed work is permanent, grants a one-time **happiness** boost, and logs a milestone.
- **Completing any one** → achievement **`philanthropist`**.
- **Completing all seven** → the game's biggest achievement **`humanitys-benefactor`**, which **unlocks the
  special perk `beloved`** (§13) and the **`benefactor` scenario** (§12).
- Costs span **$1T → $950T** (the priciest single work sits just under the $999T ceiling, so it's
  affordable on its own). Funded **sequentially** — you earn back up between works — the seven total
  ≈ **$1,751T** over a life, far more than can be held at once.

---

## 11. Events

```ts
interface EventDef {
  id:string; category:'health'|'finance'|'career'|'social'|'absurd';
  severity:Severity;
  eligible:(s:GameState)=>boolean;
  weight:(s:GameState)=>number;
  kind:'outcome'|'choice';
  apply?:(s:GameState, rng:Rng)=>Partial<GameState>;                 // outcome
  choices?:{ id:string; label:string; successOdds?:(s:GameState)=>number;
             apply:(s:GameState, rng:Rng)=>Partial<GameState> }[];    // choice
}
```
Seed registry (M1):
| id | cat | sev | kind | note |
|---|---|---|---|---|
| found-cash | finance | minor | outcome | +$200 |
| common-cold | health | minor | outcome | −health for 1 wk |
| friend-wedding | social | minor | outcome | −cash, +happiness |
| car-trouble | finance | minor | outcome | −cash if owns a car |
| medical-scare | health | major | choice | pay treatment vs. gamble (odds ↑ w/ insurance & health) |
| surprise-layoff | career | major | outcome | lose job; weight ↑ w/ stress, ↓ w/ seniority |
| llama-inheritance | absurd | minor | outcome | small passive + upkeep + flavor |
| serious-illness | health | catastrophic | choice | rare; large cost or health loss |

`weight` reads life state (no insurance ↑ medical severity, high stress ↑ layoff, wealth ↑ lawsuit/scam).
`lucky` (§5) multiplies positive weights and softens catastrophes (GDD §10.2).

---

## 12. Scenarios

```ts
interface ScenarioDef {
  id:string; name:string; difficulty:'easy'|'normal'|'hard'|'nightmare';
  start:{ age:number; cash:number; bank:number;
          credentials:CredentialId[]; residence:ResidenceRef;
          traits:TraitId[]; flags:string[] };
  goal:{ id:string; description:string; test:(s:GameState)=>boolean; reward?:PerkId };
}
```
| id | name | diff | start | goal |
|---|---|---|---|---|
| normal-life | Normal Life | normal | age 18, cash 3,000, `['school']`, rented Parents', no traits | *(open-ended; optional milestones)* |
| slumdog | Slumdog Millionaire | hard | age 18, cash 0, `[]`, rough flags, small debt | net worth ≥ $1,000,000 → reward `lucky` |
| trust-fund | Born Lucky | easy | age 18, cash 250,000, `['school']` | net worth ≥ $10M |
| dropout | The Dropout | hard | age 18, cash 500, `['school']`, trait `hustler` | build a business to profit |
| benefactor | The Benefactor | nightmare | age 18, cash 0, `['school']` | complete all 7 great works (§10.5) → reward `beloved` — unlocked after first earning `humanitys-benefactor` |

Completing a goal fires the blocking celebration modal; play continues (GDD §11.2). `slumdog` is one way
to unlock the special **Lucky** trait/perk.

---

## 13. Perks

```ts
interface PerkDef { id:PerkId; name:string; desc:string; modify:(cfg:RunConfig)=>RunConfig }
```
| id | name | effect |
|---|---|---|
| trust-fund | Trust Fund | start cash +250,000 |
| fast-learner | Fast Learner | study weeks ×0.8 |
| workaholic | Workaholic | −1 stress (h & hp) across all jobs |
| green-thumb | Green Thumb | businessGrowthMod +0.2 |
| lucky | Lucky | eventLuck +0.5 (positive-event bias) — **special-unlock only** |
| beloved | Beloved | +happiness passive & eventLuck +0.25 — **special-unlock only** (complete all 7 great works) |

Perks are toggled on before a run (Profile.activePerks) and applied to the run's base config. They are the
only cross-run progression.

---

## 14. Achievements

```ts
interface AchievementDef { id:string; name:string; emoji:string; desc:string;
                           test:(s:GameState, p:Profile)=>boolean }
```
Seed set: `first-job`, `graduate` (`degree:*`), `phd`, `med-licensed`, `entrepreneur` (own a business),
`mogul` (3 businesses), `homeowner` (own a residence), `six-figures` (peakNet ≥ 100k),
`millionaire` (≥ 1M), `deca` (≥ 10M), `billionaire` (≥ 1B), `trillionaire` (≥ 1T), `first-elixir`,
`ageless` (5 elixirs), `centenarian` (age 100), `methuselah` (age 150), `zen` (health & happiness both ≥
90), **`philanthropist`** (complete any 1 great work), **`humanitys-benefactor`** (complete all 7). Plus the
career-gate achievements referenced by ladders (`shipped-a-feature`, `owned-a-system`, `managed-a-team`,
`shipped-10m-product`).

---

## 15. Tuning constants (reference — lives in `config/tuning.ts`)

```ts
export const TUNING = {
  WEEKS_PER_YEAR: 48,
  AGE_DECAY_RATE: 0.02, BASE_H_DECAY: 0.10, BASE_HP_DECAY: 0.40, CROSS_PENALTY: 0.30,
  DEATH_GRACE_WEEKS: 3,
  MONEY_CAP: 999_999_999_999_999,
  BANK_TIERS: [ [1_000_000, 0.0022], [100_000, 0.0018], [10_000, 0.0015], [0, 0.0012] ],
  WEEKLY_EVENT_CHANCE: 0.15,
  GROWTH_BASE: 1.5, MORALE_LERP: 0.08, ATTRITION_FLOOR: 25,
  ELIXIR_BASE_PRICE: 5_000_000, ELIXIR_PRICE_MULT: 2.6, ELIXIR_REWIND_WEEKS: 480, ELIXIR_HEAL: 25,
  NEWS_DRIFT: { soft: 0.004, moderate: 0.012, strong: 0.030 },
} as const;
```

---

*This completes the four-doc bible: **PRD**, **Game Design**, **Technical Architecture**, and this
**Content/Data Spec**. Together they specify Long Life well enough to scaffold M1 and begin building.*
