/**
 * GLOBAL balance knobs — every constant not tied to a single catalog item.
 * Transcribed from CONTENT_DATA_SPEC §15. Balancing the game means editing this
 * file (or a content/ row); engine logic never hard-codes these numbers.
 *
 * Values flagged [TUNE] in the docs are provisional first passes.
 */
import { MONEY_CAP } from '../util/money';

/** Bank interest tiers: [minBalance, weeklyRate], highest threshold first. */
export type BankTier = readonly [minBalance: number, weeklyRate: number];

export const TUNING = {
  // Time
  WEEKS_PER_YEAR: 48,

  // Decay / aging (GDD §1.2)
  AGE_DECAY_RATE: 0.02,
  AGE_DECAY_START: 25, // decay begins accelerating past this age
  BASE_H_DECAY: 0.1,
  BASE_HP_DECAY: 0.4,
  CROSS_PENALTY: 0.3,
  CROSS_PENALTY_THRESHOLD: 30, // the other stat below this triggers the cross penalty

  // Death / breakdown (GDD §1.3)
  DEATH_GRACE_WEEKS: 3,
  // Bankruptcy: cash below zero for this many consecutive weeks ends the run.
  // The first negative week fires a warning; the next unrecovered week is terminal.
  BANKRUPTCY_GRACE_WEEKS: 2,

  // Money
  MONEY_CAP,
  BANK_TIERS: [
    [1_000_000, 0.0022],
    [100_000, 0.0018],
    [10_000, 0.0015],
    [0, 0.0012],
  ] as const satisfies readonly BankTier[],

  // Events (GDD §10.2). Only decision events fire, so this is kept low — a big
  // choice should be an occasional interruption, not a near-weekly one.
  WEEKLY_EVENT_CHANCE: 0.03,
  // Severity bucket weights among the decision events that are eligible.
  SEVERITY_WEIGHTS: { minor: 0.8, major: 0.18, catastrophic: 0.02 } as const,

  // Business (GDD §7) — the Team-Morale model
  GROWTH_BASE: 3.0, // base weekly growth drive at full morale + competence (breakeven in ~6mo well-run)
  MORALE_LERP: 0.12, // how fast morale (and reputation/inventory) chase their target
  ATTRITION_FLOOR: 25, // morale below this risks staff quitting + stalls growth
  BIZ_GROWTH_START: 8, // a new business opens near zero maturity
  BIZ_MORALE_START: 50, // …and at neutral morale
  BIZ_COMPETENCE_PENALTY: 0.7, // growth multiplier when the owner's field doesn't match (1.0 when it does)
  BIZ_NEGLECT_DECAY: 0.5, // growth lost per week while morale is below the floor
  BIZ_TECHDEBT_ACCRUAL: 0.6, // tech debt added per point of growth gained (fast growth → more debt)
  BIZ_TECHDEBT_PAYDOWN: 0.3, // tech debt naturally worked down per week (wins once mature)
  // Morale drifts each week by BIZ_MORALE_RATE × (wageRatio − 1): overpaying lifts
  // it, underpaying erodes it, paying the market rate holds it steady.
  BIZ_MORALE_RATE: 3.0,

  // Elixir (GDD §12)
  ELIXIR_BASE_PRICE: 5_000_000,
  ELIXIR_PRICE_MULT: 2.6,
  ELIXIR_REWIND_WEEKS: 480, // 10 years * 48 weeks
  ELIXIR_HEAL: 25,

  // Market news drift/week per strength (M3 — present for completeness)
  NEWS_DRIFT: { soft: 0.004, moderate: 0.012, strong: 0.03 } as const,

  // Study (GDD §3.1) — small happiness cost per study week
  STUDY_HAPPY_COST: 0.6,

  // Skills (lightweight accrual — see engine/steps/skills.ts). Roles carry a
  // per-role `skillGain` map (content/careers.ts) built from these rates:
  //   primary   = the field's core skill, grown every working week
  //   secondary = a supporting skill, grown more slowly
  SKILL_MAX: 100,
  SKILL_PRIMARY_PER_WEEK: 0.9,
  SKILL_SECONDARY_PER_WEEK: 0.5,
  // Tech-specific rates, kept distinct so the M1 Tech ladder's accrual is unchanged.
  CODING_PER_WORK_WEEK: 0.9, // coding grows while working in tech
  LEADERSHIP_PER_LEAD_WEEK: 0.7, // leadership grows in lead-and-up roles
  NEGOTIATION_PER_MGMT_WEEK: 0.5,
  FINANCE_PER_SENIOR_WEEK: 0.4,

  // Log ring buffer size
  LOG_CAP: 60,
} as const;

export type Tuning = typeof TUNING;
