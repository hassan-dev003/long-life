/**
 * Business catalog (CONTENT_DATA_SPEC §8) — the buyable operations, tiered by
 * capital cost and product. Each row is pure data; the growth/morale/capacity
 * math lives in engine/business.ts and the per-tick advance in
 * engine/steps/business.ts. `marketWage` is the per-staff reference wage that
 * morale is judged against; `branchUpkeep` is the weekly cost of each branch.
 *
 * No `req`: any player with the capital can buy in — the education/experience
 * lever is *competence* (GDD §7.4), which accelerates growth rather than locking
 * the door. `fieldStat` names the one field-unique modifier the field carries.
 */
import type { BizTier, Field, Requirement } from '../state/types';

export type FieldStat = 'reputation' | 'techDebt' | 'inventory' | 'none';

export interface BusinessDef {
  id: string;
  name: string;
  field: Field;
  tier: BizTier;
  cost: number; // upfront to open
  baseRevenue: number; // weekly at growth=100, capacity=1
  baseCost: number; // weekly fixed (excl. payroll/branches)
  marketWage: number; // per-staff reference wage (morale benchmark)
  staffCap: number;
  branchCap: number;
  branchUpkeep: number; // weekly, per branch
  fieldStat: FieldStat;
  req?: Requirement;
}

// `marketWage` is scaled to each business's revenue (≈ 0.3 × baseRevenue / staffCap)
// so hiring is a net-positive lever at maturity: a staff member adds more revenue
// than they cost. Early on, when growth is low, staff still cost more than they
// add — so you staff up as the business matures, not on day one.
export const BUSINESSES: BusinessDef[] = [
  { id: 'lemonade-stand', name: 'Lemonade Stand', field: 'service', tier: 'micro', cost: 2_000, baseRevenue: 120, baseCost: 55, marketWage: 35, staffCap: 1, branchCap: 3, branchUpkeep: 60, fieldStat: 'none' },
  { id: 'vending', name: 'Vending Route', field: 'business', tier: 'micro', cost: 8_000, baseRevenue: 430, baseCost: 200, marketWage: 130, staffCap: 1, branchCap: 4, branchUpkeep: 150, fieldStat: 'inventory' },
  { id: 'market-stall', name: 'Market Stall', field: 'service', tier: 'micro', cost: 20_000, baseRevenue: 1_050, baseCost: 480, marketWage: 160, staffCap: 2, branchCap: 3, branchUpkeep: 350, fieldStat: 'reputation' },
  { id: 'ecom', name: 'E-commerce Store', field: 'business', tier: 'small', cost: 50_000, baseRevenue: 2_600, baseCost: 1_200, marketWage: 260, staffCap: 3, branchCap: 2, branchUpkeep: 700, fieldStat: 'inventory' },
  { id: 'foodtruck', name: 'Food Truck', field: 'service', tier: 'small', cost: 120_000, baseRevenue: 6_300, baseCost: 2_900, marketWage: 480, staffCap: 4, branchCap: 3, branchUpkeep: 1_500, fieldStat: 'reputation' },
  { id: 'laundromat', name: 'Laundromat', field: 'business', tier: 'small', cost: 300_000, baseRevenue: 15_500, baseCost: 7_200, marketWage: 780, staffCap: 6, branchCap: 5, branchUpkeep: 2_600, fieldStat: 'none' },
  { id: 'cafe', name: 'Coffee Shop', field: 'service', tier: 'medium', cost: 700_000, baseRevenue: 36_000, baseCost: 17_000, marketWage: 1_080, staffCap: 10, branchCap: 4, branchUpkeep: 5_500, fieldStat: 'reputation' },
  { id: 'fitness-gym', name: 'Fitness Gym', field: 'service', tier: 'medium', cost: 1_500_000, baseRevenue: 78_000, baseCost: 36_000, marketWage: 1_950, staffCap: 12, branchCap: 4, branchUpkeep: 11_000, fieldStat: 'reputation' },
  { id: 'consult', name: 'Consulting Firm', field: 'business', tier: 'medium', cost: 3_500_000, baseRevenue: 182_000, baseCost: 85_000, marketWage: 2_700, staffCap: 20, branchCap: 3, branchUpkeep: 26_000, fieldStat: 'reputation' },
  { id: 'startup', name: 'Software Startup', field: 'tech', tier: 'large', cost: 8_000_000, baseRevenue: 430_000, baseCost: 200_000, marketWage: 4_300, staffCap: 30, branchCap: 2, branchUpkeep: 60_000, fieldStat: 'techDebt' },
  { id: 'restaurant-chain', name: 'Restaurant Chain', field: 'service', tier: 'large', cost: 20_000_000, baseRevenue: 1_040_000, baseCost: 480_000, marketWage: 7_800, staffCap: 40, branchCap: 8, branchUpkeep: 140_000, fieldStat: 'reputation' },
  { id: 'clinic', name: 'Private Clinic', field: 'medical', tier: 'large', cost: 50_000_000, baseRevenue: 2_600_000, baseCost: 1_200_000, marketWage: 26_000, staffCap: 30, branchCap: 5, branchUpkeep: 320_000, fieldStat: 'reputation' },
  { id: 'factory', name: 'Manufacturing Plant', field: 'business', tier: 'enterprise', cost: 150_000_000, baseRevenue: 8_000_000, baseCost: 3_700_000, marketWage: 30_000, staffCap: 80, branchCap: 6, branchUpkeep: 900_000, fieldStat: 'none' },
  { id: 'franchise', name: 'Franchise Empire', field: 'business', tier: 'enterprise', cost: 500_000_000, baseRevenue: 26_000_000, baseCost: 12_000_000, marketWage: 65_000, staffCap: 120, branchCap: 15, branchUpkeep: 2_800_000, fieldStat: 'none' },
  { id: 'conglomerate', name: 'Global Conglomerate', field: 'business', tier: 'enterprise', cost: 2_000_000_000, baseRevenue: 104_000_000, baseCost: 48_000_000, marketWage: 150_000, staffCap: 200, branchCap: 20, branchUpkeep: 11_000_000, fieldStat: 'none' },
];

export const BUSINESS_BY_ID: Record<string, BusinessDef> = Object.fromEntries(
  BUSINESSES.map((b) => [b.id, b]),
);

/**
 * Wage policy presets (the morale benchmark is the business's `marketWage`).
 * Pay sets which way Team Morale drifts each week: generous lifts it moderately,
 * well paid a little, market rate holds steady, underpaying erodes it. Higher pay
 * also means higher payroll. The `trend` is a human-readable summary of the drift.
 */
export interface WageTier {
  id: string;
  label: string;
  ratio: number; // multiple of marketWage
  trend: string; // what it does to morale
}
export const WAGE_TIERS: WageTier[] = [
  { id: 'severe', label: 'Severely underpaid', ratio: 0.5, trend: 'morale falls fast' },
  { id: 'under', label: 'Underpaid', ratio: 0.75, trend: 'morale slips' },
  { id: 'market', label: 'Market rate', ratio: 1.0, trend: 'morale holds' },
  { id: 'well', label: 'Well paid', ratio: 1.25, trend: 'morale rises' },
  { id: 'generous', label: 'Generous', ratio: 1.5, trend: 'morale climbs fast' },
];

/** The starting value of a business's field-unique stat when it opens. */
export function startingFieldStat(stat: FieldStat): number {
  switch (stat) {
    case 'reputation':
      return 50;
    case 'inventory':
      return 60;
    case 'techDebt':
      return 0;
    case 'none':
      return 0;
  }
}
