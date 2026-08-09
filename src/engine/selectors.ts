/**
 * Derived reads — computed from state, never stored redundantly. The UI and the
 * engine both read through these so there is one definition of net worth, age, etc.
 */
import { TUNING } from '../config/tuning';
import { clampMoney } from '../util/money';
import { ROLE_BY_ID, ladderOfRole, type RoleDef } from '../content/careers';
import { meets, type MeetsResult } from './eligibility';
import { computeRunMods, weeklyInterest, weeklyUpkeep, type UpkeepBreakdown } from './economy';
import type { Field, GameState } from '../state/types';

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function ageYears(s: GameState): number {
  return s.meta.startAge + Math.floor(s.clock.totalWeeks / TUNING.WEEKS_PER_YEAR);
}

/** In-game month 1..12 (GDD/UI: monthOfYear = floor((totalWeeks % 48) / 4) + 1). */
export function monthOfYear(s: GameState): number {
  return Math.floor((s.clock.totalWeeks % TUNING.WEEKS_PER_YEAR) / 4) + 1;
}

/** Week-of-month 1..4. */
export function weekOfMonth(s: GameState): number {
  return (Math.floor(s.clock.totalWeeks / 1) % 4) + 1;
}

/** Clock display parts for the top bar: "Age 34 · Mar ○●○○". */
export function clockDisplay(s: GameState): { age: number; month: string; week: number } {
  return { age: ageYears(s), month: MONTH_ABBR[monthOfYear(s) - 1]!, week: weekOfMonth(s) };
}

/** Net worth = liquid + illiquid asset value. M1: cash + bank (businesses/property later). */
export function netWorth(s: GameState): number {
  return clampMoney(s.money.cash + s.money.bank);
}

export function currentRole(s: GameState): RoleDef | null {
  return s.career.roleId ? (ROLE_BY_ID[s.career.roleId] ?? null) : null;
}

/** Weekly passive income outside of a paycheck. M1: none (bank interest is handled in the tick). */
export function passiveIncome(_s: GameState): number {
  return 0;
}

/**
 * The next role up the current ladder and whether the player qualifies. Returns
 * null if the player isn't on a ladder or is already at the top.
 */
export function nextPromotion(
  s: GameState,
): { role: RoleDef; result: MeetsResult } | null {
  if (!s.career.roleId) return null;
  const ladder = ladderOfRole(s.career.roleId);
  if (!ladder) return null; // standalone entry job — no ladder above
  const idx = ladder.roles.findIndex((r) => r.id === s.career.roleId);
  const next = ladder.roles[idx + 1];
  if (!next) return null; // at the top
  return { role: next, result: meets(s, next.gate) };
}

/** Field experience in weeks for a given field. */
export function fieldExp(s: GameState, field: Field): number {
  return s.career.fieldExp[field] ?? 0;
}

export function elixirAffordable(s: GameState): boolean {
  return s.money.cash + s.money.bank >= s.elixir.price;
}

/**
 * A forecast of this week's cash flow, derived from current state. Income is
 * conditional on the action (salary only lands on a working week), so we surface
 * both a working-week and an idle-week net. Uses the same upkeep/interest math the
 * tick does, so the numbers match what actually happens.
 */
export interface Financials {
  role: RoleDef | null;
  salary: number; // per working week (0 if unemployed)
  interest: number; // projected weekly bank interest at the current balance
  upkeep: UpkeepBreakdown;
  netWorking: number; // salary + interest − upkeep (a week you work)
  netIdle: number; // interest − upkeep (a week you don't work)
}

export function financials(s: GameState): Financials {
  const mods = computeRunMods(s);
  const role = currentRole(s);
  const salary = role?.salaryPerWeek ?? 0;
  const interest = weeklyInterest(s.money.bank);
  const upkeep = weeklyUpkeep(s, mods.priceMod);
  return {
    role,
    salary,
    interest,
    upkeep,
    netWorking: salary + interest - upkeep.total,
    netIdle: interest - upkeep.total,
  };
}
