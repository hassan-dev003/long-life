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

  // Money
  MONEY_CAP,
  BANK_TIERS: [
    [1_000_000, 0.0022],
    [100_000, 0.0018],
    [10_000, 0.0015],
    [0, 0.0012],
  ] as const satisfies readonly BankTier[],

  // Events (GDD §10.2)
  WEEKLY_EVENT_CHANCE: 0.15,
  // Severity bucket weights, biased toward minor (minor common, major rare, catastrophic very rare).
  SEVERITY_WEIGHTS: { minor: 0.8, major: 0.18, catastrophic: 0.02 } as const,

  // Business (M2 — present for completeness)
  GROWTH_BASE: 1.5,
  MORALE_LERP: 0.08,
  ATTRITION_FLOOR: 25,

  // Elixir (GDD §12)
  ELIXIR_BASE_PRICE: 5_000_000,
  ELIXIR_PRICE_MULT: 2.6,
  ELIXIR_REWIND_WEEKS: 480, // 10 years * 48 weeks
  ELIXIR_HEAL: 25,

  // Market news drift/week per strength (M3 — present for completeness)
  NEWS_DRIFT: { soft: 0.004, moderate: 0.012, strong: 0.03 } as const,

  // Study (GDD §3.1) — small happiness cost per study week
  STUDY_HAPPY_COST: 0.6,

  // Skills (M1 lightweight accrual — see engine/steps/skills.ts)
  SKILL_MAX: 100,
  CODING_PER_WORK_WEEK: 0.9, // coding grows while working in tech
  LEADERSHIP_PER_LEAD_WEEK: 0.7, // leadership grows in lead-and-up roles
  NEGOTIATION_PER_MGMT_WEEK: 0.5,
  FINANCE_PER_SENIOR_WEEK: 0.4,

  // Log ring buffer size
  LOG_CAP: 60,
} as const;

export type Tuning = typeof TUNING;
