/**
 * Lifestyle catalog (CONTENT_DATA_SPEC §7): rented home tiers, food/diet tiers,
 * and stackable subscriptions. Passive stat contributions are per-week; upkeep is
 * billed each tick. Health Insurance carries an `agingMod` and cuts health-event costs.
 */
export interface HomeTier {
  id: string;
  name: string;
  upkeepPerWeek: number;
  h: number; // health/wk
  hp: number; // happiness/wk
}

export interface FoodTier {
  id: string;
  name: string;
  costPerWeek: number;
  h: number;
  hp: number;
}

export interface ClothesTier {
  id: string;
  name: string;
  cost: number; // one-time purchase from cash
  upkeepPerWeek: number;
  hp: number; // happiness/wk (social standing)
  socialTier: number; // 0..4 — gates some social/relationship event outcomes (M4)
}

export interface Subscription {
  id: string;
  name: string;
  cost: number; // one-time signup
  upkeepPerWeek: number;
  h?: number;
  hp?: number;
  agingMod?: number; // multiplies aging decay (insurance)
  insurance?: boolean; // scales down health-event costs
}

/** Rented residences. The 'parents' tier is the Normal Life start (free, no passives). */
export const HOME_TIERS: HomeTier[] = [
  { id: 'parents', name: "Parents' Place", upkeepPerWeek: 0, h: 0, hp: 0 },
  { id: 'studio', name: 'Studio', upkeepPerWeek: 300, h: 0.3, hp: 0.2 },
  { id: 'condo', name: 'Condo', upkeepPerWeek: 700, h: 0.6, hp: 0.6 },
  { id: 'house', name: 'House', upkeepPerWeek: 1_200, h: 1.0, hp: 1.0 },
  { id: 'villa', name: 'Villa', upkeepPerWeek: 4_000, h: 1.6, hp: 2.0 },
  { id: 'mansion', name: 'Mansion', upkeepPerWeek: 12_000, h: 2.6, hp: 3.2 },
];

export const HOME_TIER_BY_ID: Record<string, HomeTier> = Object.fromEntries(
  HOME_TIERS.map((t) => [t.id, t]),
);

export const FOOD_TIERS: FoodTier[] = [
  { id: 'instant', name: 'Instant Noodles', costPerWeek: 40, h: -0.1, hp: 0 },
  { id: 'basic', name: 'Basic Groceries', costPerWeek: 90, h: 0, hp: 0.1 },
  { id: 'healthy', name: 'Healthy Diet', costPerWeek: 180, h: 0.5, hp: 0.2 },
  { id: 'gourmet', name: 'Gourmet', costPerWeek: 500, h: 0.3, hp: 0.6 },
  { id: 'chef', name: 'Personal Chef', costPerWeek: 2_500, h: 0.7, hp: 0.9 },
];

export const FOOD_TIER_BY_ID: Record<string, FoodTier> = Object.fromEntries(
  FOOD_TIERS.map((t) => [t.id, t]),
);

/**
 * Wardrobe tiers (CONTENT_DATA_SPEC §7). Buying a tier is a one-time cash cost;
 * it then carries a small weekly upkeep and a happiness passive. `socialTier`
 * is authored now for the social/relationship event gating that lands in M4.
 */
export const CLOTHES_TIERS: ClothesTier[] = [
  { id: 'thrift', name: 'Thrift Wardrobe', cost: 60, upkeepPerWeek: 2, hp: 0.1, socialTier: 0 },
  { id: 'basic', name: 'Basic Wardrobe', cost: 300, upkeepPerWeek: 6, hp: 0.3, socialTier: 1 },
  { id: 'smart', name: 'Smart Wardrobe', cost: 1_200, upkeepPerWeek: 15, hp: 0.6, socialTier: 2 },
  { id: 'designer', name: 'Designer Wardrobe', cost: 8_000, upkeepPerWeek: 60, hp: 1.1, socialTier: 3 },
  { id: 'couture', name: 'Couture Wardrobe', cost: 60_000, upkeepPerWeek: 300, hp: 1.8, socialTier: 4 },
];

export const CLOTHES_TIER_BY_ID: Record<string, ClothesTier> = Object.fromEntries(
  CLOTHES_TIERS.map((t) => [t.id, t]),
);

export const SUBSCRIPTIONS: Subscription[] = [
  { id: 'gym', name: 'Gym Membership', cost: 600, upkeepPerWeek: 25, h: 0.5 },
  {
    id: 'health-insurance',
    name: 'Health Insurance',
    cost: 3_000,
    upkeepPerWeek: 120,
    agingMod: 0.9,
    insurance: true,
  },
  { id: 'streaming', name: 'Streaming', cost: 0, upkeepPerWeek: 15, hp: 0.3 },
  { id: 'country-club', name: 'Country Club', cost: 25_000, upkeepPerWeek: 400, hp: 1.0 },
];

export const SUBSCRIPTION_BY_ID: Record<string, Subscription> = Object.fromEntries(
  SUBSCRIPTIONS.map((s) => [s.id, s]),
);
