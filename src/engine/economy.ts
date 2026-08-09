/**
 * Economy formulas and the merged "run modifiers" the engine reads each tick.
 * Formulas live here; the numbers they use live in config/tuning.ts and content/.
 */
import { TUNING } from '../config/tuning';
import { buildRunConfig } from '../content/perks';
import { TRAITS } from '../content/skills';
import {
  HOME_TIER_BY_ID,
  FOOD_TIER_BY_ID,
  CLOTHES_TIER_BY_ID,
  SUBSCRIPTION_BY_ID,
} from '../content/lifestyle';
import type { GameState } from '../state/types';

/** Weekly compound interest rate for a bank balance (tiered; highest threshold first). */
export function bankRate(balance: number): number {
  for (const [minBalance, rate] of TUNING.BANK_TIERS) {
    if (balance >= minBalance) return rate;
  }
  return 0;
}

/** Weekly interest a balance would earn at its current tier (0 if non-positive). */
export function weeklyInterest(bank: number): number {
  return bank > 0 ? Math.round(bank * bankRate(bank)) : 0;
}

export interface UpkeepBreakdown {
  residence: number;
  food: number;
  clothes: number;
  subscriptions: number;
  total: number; // price-modified, rounded — matches what the tick actually bills
}

/** The weekly upkeep bill, itemized. Single source of truth for stepUpkeep and the
 *  financials selector, so the forecast can never drift from what's charged. */
export function weeklyUpkeep(s: GameState, priceMod: number): UpkeepBreakdown {
  const residence =
    s.lifestyle.residence.kind === 'rented'
      ? (HOME_TIER_BY_ID[s.lifestyle.residence.tier]?.upkeepPerWeek ?? 0)
      : 0;
  const food = FOOD_TIER_BY_ID[s.lifestyle.food]?.costPerWeek ?? 0;
  const clothes = s.lifestyle.clothes
    ? (CLOTHES_TIER_BY_ID[s.lifestyle.clothes]?.upkeepPerWeek ?? 0)
    : 0;
  let subscriptions = 0;
  for (const subId of s.lifestyle.subscriptions) {
    subscriptions += SUBSCRIPTION_BY_ID[subId]?.upkeepPerWeek ?? 0;
  }
  const total = Math.round((residence + food + clothes + subscriptions) * priceMod);
  return { residence, food, clothes, subscriptions, total };
}

/** The effective modifiers for a run, merging active perks, traits, and insurance. */
export interface RunMods {
  studyWeeksMult: number;
  jobStressDelta: number;
  eventLuck: number;
  agingMod: number; // multiplies age-driven decay (<1 slows aging)
  happyDecayMod: number; // additive to happiness decay
  priceMod: number; // multiplies purchase/upkeep prices (<1 cheaper)
  happyPassivePerWeek: number;
  businessGrowthMod: number;
}

export function computeRunMods(s: GameState): RunMods {
  const cfg = buildRunConfig(s.meta.activePerks);

  let agingMod = 1;
  let happyDecayMod = 0;
  let priceMod = 1;
  let eventLuck = cfg.eventLuck;
  let businessGrowthMod = cfg.businessGrowthMod;

  for (const traitId of s.traits) {
    const e = TRAITS[traitId]?.effects;
    if (!e) continue;
    if (e.agingMod !== undefined) agingMod *= e.agingMod;
    if (e.happyDecayMod !== undefined) happyDecayMod += e.happyDecayMod;
    if (e.priceMod !== undefined) priceMod *= e.priceMod;
    if (e.eventLuck !== undefined) eventLuck += e.eventLuck;
    if (e.businessGrowthMod !== undefined) businessGrowthMod += e.businessGrowthMod;
  }

  // Insurance (and any aging-modifying subscription) folds into agingMod.
  for (const subId of s.lifestyle.subscriptions) {
    const sub = SUBSCRIPTION_BY_ID[subId];
    if (sub?.agingMod !== undefined) agingMod *= sub.agingMod;
  }

  return {
    studyWeeksMult: cfg.studyWeeksMult,
    jobStressDelta: cfg.jobStressDelta,
    eventLuck,
    agingMod,
    happyDecayMod,
    priceMod,
    happyPassivePerWeek: cfg.happyPassivePerWeek,
    businessGrowthMod,
  };
}

/** Price of the next Elixir after drinking the current one. */
export function nextElixirPrice(current: number): number {
  return Math.round(current * TUNING.ELIXIR_PRICE_MULT);
}
