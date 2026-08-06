/**
 * The typed spine of the whole game. `GameState` is the single source of truth
 * for one life (a run); `Profile` is the account that persists across runs.
 * Shapes from TECHNICAL_ARCHITECTURE §4; domain primitives from CONTENT_DATA_SPEC §2.
 *
 * M3/M4 slices (market, holdings, relationships) are typed here so the shape is
 * stable, but stay empty/unused until their milestone.
 */

// ── Domain primitives (CONTENT_DATA_SPEC §2) ──────────────────────────────────

export type Field =
  | 'service'
  | 'labor'
  | 'tech'
  | 'medical'
  | 'legal'
  | 'business'
  | 'creative'
  | 'public'
  | 'academia';

export type Major =
  | 'cs'
  | 'law'
  | 'business'
  | 'medicine'
  | 'engineering'
  | 'arts'
  | 'science'
  | 'education';

export type CredentialId =
  | 'school'
  | 'diploma'
  | `degree:${Major}`
  | `master:${Major}`
  | `phd:${Major}`
  | 'med-school'
  | 'bar'
  | 'police-academy'
  | 'military-academy'
  | 'community-college'
  | `cert:${string}`;

export type SkillId =
  | 'discipline'
  | 'charisma'
  | 'negotiation'
  | 'fitness'
  | 'coding'
  | 'finance'
  | 'market-sense'
  | 'street-smarts'
  | 'leadership';

export type TraitId = 'hustler' | 'iron-constitution' | 'frugality' | 'anxious' | 'lucky';

export type AssetClass = 'stock' | 'commodity' | 'crypto';
export type BizTier = 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
export type Severity = 'minor' | 'major' | 'catastrophic';

export type PerkId =
  | 'trust-fund'
  | 'fast-learner'
  | 'workaholic'
  | 'green-thumb'
  | 'lucky'
  | 'beloved';

/** The unique-gate primitive that powers career gates, eligibility, and event conditions. */
export type Requirement =
  | { kind: 'always' }
  | { kind: 'credential'; id: CredentialId }
  | { kind: 'fieldExp'; field: Field; weeks: number }
  | { kind: 'roleTenure'; roleId: string; weeks: number }
  | { kind: 'skill'; id: SkillId; min: number }
  | { kind: 'trait'; id: TraitId }
  | { kind: 'achievement'; id: string }
  | { kind: 'businessProfit'; field?: Field }
  | { kind: 'netWorth'; min: number }
  | { kind: 'allOf'; reqs: Requirement[] }
  | { kind: 'anyOf'; reqs: Requirement[] };

// ── Sub-types of a run ────────────────────────────────────────────────────────

export type RunStatus = 'alive' | 'dead' | 'breakdown';

/** How the player is housed. Models the "live in an owned property" rule cleanly. */
export type ResidenceRef =
  | { kind: 'rented'; tier: string }
  | { kind: 'owned'; propertyId: string };

export interface LogEntry {
  week: number; // totalWeeks at the time
  kind: 'info' | 'money' | 'health' | 'career' | 'event' | 'milestone' | 'death';
  text: string;
}

export interface Enrollment {
  id: CredentialId;
  progress: number; // study-weeks completed
  weeks: number; // total study-weeks required
}

export interface BusinessInstance {
  id: string;
  defId: string;
  field: Field;
  tier: BizTier;
  growth: number; // 0..100
  morale: number; // 0..100
  staff: number;
  branches: number;
  wagePerStaff: number;
  profitSharePct: number;
  fieldStatValue: number; // reputation / techDebt / inventory
}

export interface PropertyInstance {
  id: string;
  defId: string;
  quality: number; // 0..100
  purchasePrice: number;
  rentedOut: boolean;
}

export interface Holding {
  units: number;
  avgCost: number;
}

export interface NewsItem {
  id: string;
  assetId: string;
  direction: 1 | -1;
  strength: 'soft' | 'moderate' | 'strong';
  text: string;
  weeksLeft: number;
}

/** A pending choice event awaiting the player's decision (drives the blocking modal). */
export interface PendingEvent {
  eventId: string;
}

/** A pending goal celebration awaiting acknowledgement (blocking modal). */
export interface PendingGoal {
  goalId: string;
  description: string;
}

// ── The run ───────────────────────────────────────────────────────────────────

export interface GameState {
  meta: {
    schemaVersion: number;
    scenarioId: string;
    rngState: number;
    startAge: number;
    activePerks: PerkId[];
  };
  clock: { totalWeeks: number };
  stats: {
    health: number;
    happiness: number;
    weeksAtZeroHealth: number;
    weeksAtZeroHappy: number;
  };
  money: {
    cash: number;
    bank: number;
    bankInterestEarned: number;
    lifetimeEarned: number;
  };
  banking: {
    autoDepositPct: number;
    payUpkeepFromBank: boolean;
    overdraft: boolean;
  };
  education: {
    credentials: CredentialId[];
    enrolled: Enrollment | null;
  };
  skills: Partial<Record<SkillId, number>>;
  traits: TraitId[];
  career: {
    roleId: string | null;
    roleTenure: number; // weeks in current role
    fieldExp: Partial<Record<Field, number>>; // weeks worked per field
  };
  businesses: BusinessInstance[]; // M2
  realEstate: PropertyInstance[]; // M3
  holdings: Partial<Record<string, Holding>>; // M3
  market: { prices: Record<string, number>; news: NewsItem[] }; // M3
  lifestyle: {
    residence: ResidenceRef;
    food: string;
    clothes: string | null;
    subscriptions: string[];
  };
  relationships: unknown[]; // M4
  elixir: { count: number; price: number };
  philanthropy: string[]; // M5 — completed work ids
  progress: {
    peakNet: number;
    goalsMet: string[];
    runAchievements: string[];
  };
  log: LogEntry[]; // capped ring buffer (TUNING.LOG_CAP)
  pendingEvent: PendingEvent | null;
  pendingGoal: PendingGoal | null;
  status: RunStatus;
}

// ── The account (persists across all runs) ────────────────────────────────────

export interface Profile {
  schemaVersion: number;
  unlockedPerks: PerkId[];
  activePerks: PerkId[]; // toggled on for the next run
  unlockedTraits: TraitId[];
  achievements: string[];
  unlockedScenarios: string[];
  stats: { livesLived: number; bestNetWorth: number; oldestAge: number };
}
