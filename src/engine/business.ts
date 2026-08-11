/**
 * Pure business math (GDD §7). The lifecycle — loss → breakeven → profit — falls
 * out of these formulas: a fresh business has low `growth`, so revenue can't cover
 * running cost; as growth climbs (driven by owner competence and Team Morale),
 * revenue overtakes cost. Nothing here mutates state; engine/steps/business.ts
 * calls these each tick and applies the results.
 */
import { TUNING } from '../config/tuning';
import { BUSINESS_BY_ID, type BusinessDef, type FieldStat } from '../content/businesses';
import type { BusinessInstance, Field, GameState, Major } from '../state/types';

export const defOf = (b: BusinessInstance): BusinessDef | undefined => BUSINESS_BY_ID[b.defId];

/** Majors that make an owner competent to run a business in a given field. */
const FIELD_MAJORS: Partial<Record<Field, Major[]>> = {
  tech: ['cs', 'engineering'],
  business: ['business'],
  medical: ['medicine'],
  legal: ['law'],
  creative: ['arts'],
};

/**
 * Competence multiplier on growth: 1.0 when the owner's education or experience
 * matches the field, else 0.5 (GDD §7.4). A relevant degree (at any spine level)
 * or ≥ 2 years of field experience counts.
 */
export function competence(s: GameState, field: Field): number {
  const majors = FIELD_MAJORS[field];
  const hasMajor =
    !!majors &&
    s.education.credentials.some((c) =>
      majors.some((m) => c === `degree:${m}` || c === `master:${m}` || c === `phd:${m}`),
    );
  const experienced = (s.career.fieldExp[field] ?? 0) >= 96;
  return hasMajor || experienced ? 1.0 : TUNING.BIZ_COMPETENCE_PENALTY;
}

/** The field-unique stat's multiplier on revenue (GDD §7.5). */
export function fieldStatMultiplier(stat: FieldStat, value: number): number {
  const v = value / 100;
  switch (stat) {
    case 'reputation':
      return 0.7 + 0.3 * v; // good service scales revenue
    case 'inventory':
      return 0.7 + 0.3 * v; // stock-outs cap revenue
    case 'techDebt':
      return 1 - 0.35 * v; // debt drags revenue
    case 'none':
      return 1;
  }
}

/**
 * Capacity multiplier on revenue (GDD §7.3). Morale sets the baseline (a fully
 * motivated owner-operated shop runs at 1.0); hiring staff and opening branches
 * scale output *beyond* that ceiling — expansion that only pays off once the pay
 * they require is outrun by the revenue they unlock.
 */
export function capacity(b: BusinessInstance, def: BusinessDef): number {
  const moraleFactor = b.morale / 100;
  const staffScale = def.staffCap > 0 ? 0.6 * (b.staff / def.staffCap) : 0;
  return (0.8 + 0.2 * moraleFactor) * (1 + staffScale + 0.5 * b.branches);
}

export function weeklyRevenue(b: BusinessInstance, def: BusinessDef): number {
  const base = def.baseRevenue * (b.growth / 100) * capacity(b, def);
  return base * fieldStatMultiplier(def.fieldStat, b.fieldStatValue);
}

export function weeklyRunningCost(b: BusinessInstance, def: BusinessDef): number {
  return def.baseCost + b.staff * b.wagePerStaff + b.branches * def.branchUpkeep;
}

/** Gross weekly profit (before the team's profit share) — negative early. */
export function grossProfit(b: BusinessInstance, def: BusinessDef): number {
  return weeklyRevenue(b, def) - weeklyRunningCost(b, def);
}

/** The slice of a profitable week handed to the team (0 on a loss). */
export function profitShareCost(b: BusinessInstance, def: BusinessDef): number {
  const gross = grossProfit(b, def);
  return gross > 0 ? gross * b.profitSharePct : 0;
}

/** The owner's weekly take: gross profit minus the team's profit share. */
export function weeklyNet(b: BusinessInstance, def: BusinessDef): number {
  return Math.round(grossProfit(b, def) - profitShareCost(b, def));
}

/** Full cash-flow breakdown for one business (for the UI). */
export interface BusinessFlow {
  revenue: number;
  runningCost: number;
  profitShare: number;
  net: number;
}
export function businessFlow(b: BusinessInstance, def: BusinessDef): BusinessFlow {
  const revenue = weeklyRevenue(b, def);
  const runningCost = weeklyRunningCost(b, def);
  const profitShare = profitShareCost(b, def);
  return {
    revenue: Math.round(revenue),
    runningCost: Math.round(runningCost),
    profitShare: Math.round(profitShare),
    net: Math.round(revenue - runningCost - profitShare),
  };
}

/** Resale/net-worth value of a business — scales with maturity and morale. */
export function valuation(b: BusinessInstance, def: BusinessDef): number {
  return Math.round(def.cost * (0.4 + 0.6 * (b.growth / 100)) * (0.7 + 0.3 * (b.morale / 100)));
}

/** True if any owned business (optionally in `field`) is turning a weekly profit. */
export function hasProfitableBusiness(s: GameState, field?: Field): boolean {
  return s.businesses.some((b) => {
    if (field && b.field !== field) return false;
    const def = defOf(b);
    return !!def && weeklyNet(b, def) > 0;
  });
}
