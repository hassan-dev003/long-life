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

export const BUSINESSES: BusinessDef[] = [
  { id: 'vending', name: 'Vending Route', field: 'business', tier: 'micro', cost: 15_000, baseRevenue: 900, baseCost: 400, marketWage: 500, staffCap: 1, branchCap: 3, branchUpkeep: 200, fieldStat: 'inventory' },
  { id: 'ecom', name: 'E-commerce Store', field: 'business', tier: 'small', cost: 30_000, baseRevenue: 2_200, baseCost: 1_100, marketWage: 800, staffCap: 3, branchCap: 1, branchUpkeep: 500, fieldStat: 'inventory' },
  { id: 'foodtruck', name: 'Food Truck', field: 'service', tier: 'small', cost: 80_000, baseRevenue: 4_500, baseCost: 2_600, marketWage: 800, staffCap: 4, branchCap: 2, branchUpkeep: 1_200, fieldStat: 'reputation' },
  { id: 'cafe', name: 'Coffee Shop', field: 'service', tier: 'medium', cost: 250_000, baseRevenue: 12_000, baseCost: 7_800, marketWage: 900, staffCap: 10, branchCap: 4, branchUpkeep: 3_000, fieldStat: 'reputation' },
  { id: 'laundromat', name: 'Laundromat', field: 'business', tier: 'medium', cost: 300_000, baseRevenue: 11_000, baseCost: 6_500, marketWage: 850, staffCap: 6, branchCap: 5, branchUpkeep: 2_500, fieldStat: 'none' },
  { id: 'consult', name: 'Consulting Firm', field: 'business', tier: 'large', cost: 500_000, baseRevenue: 26_000, baseCost: 16_000, marketWage: 2_200, staffCap: 20, branchCap: 3, branchUpkeep: 6_000, fieldStat: 'reputation' },
  { id: 'startup', name: 'Software Startup', field: 'tech', tier: 'large', cost: 1_000_000, baseRevenue: 60_000, baseCost: 34_000, marketWage: 2_600, staffCap: 30, branchCap: 2, branchUpkeep: 12_000, fieldStat: 'techDebt' },
  { id: 'clinic', name: 'Private Clinic', field: 'medical', tier: 'enterprise', cost: 2_500_000, baseRevenue: 90_000, baseCost: 55_000, marketWage: 2_400, staffCap: 25, branchCap: 4, branchUpkeep: 18_000, fieldStat: 'reputation' },
  { id: 'franchise', name: 'Franchise Empire', field: 'business', tier: 'enterprise', cost: 5_000_000, baseRevenue: 220_000, baseCost: 120_000, marketWage: 1_500, staffCap: 60, branchCap: 12, branchUpkeep: 30_000, fieldStat: 'none' },
];

export const BUSINESS_BY_ID: Record<string, BusinessDef> = Object.fromEntries(
  BUSINESSES.map((b) => [b.id, b]),
);

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
