/**
 * Derived reads — computed from state, never stored redundantly. The UI and the
 * engine both read through these so there is one definition of net worth, age, etc.
 */
import { TUNING } from '../config/tuning';
import { clampMoney } from '../util/money';
import { ROLE_BY_ID, ladderOfRole, type RoleDef } from '../content/careers';
import { meets, requirementProgress, type MeetsResult } from './eligibility';
import { computeRunMods, weeklyInterest, weeklyUpkeep, type UpkeepBreakdown } from './economy';
import { defOf, valuation, weeklyNet } from './business';
import type { GameState, Requirement } from '../state/types';

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
  return (s.clock.totalWeeks % 4) + 1;
}

/** Clock display parts for the top bar: "Age 34 · Mar ○●○○". */
export function clockDisplay(s: GameState): { age: number; month: string; week: number } {
  return { age: ageYears(s), month: MONTH_ABBR[monthOfYear(s) - 1]!, week: weekOfMonth(s) };
}

/** Total resale value of all owned businesses (0 if none). */
export function businessesValue(s: GameState): number {
  let total = 0;
  for (const b of s.businesses) {
    const def = defOf(b);
    if (def) total += valuation(b, def);
  }
  return total;
}

/** Net worth = liquid + illiquid asset value: cash + bank + businesses (property in M3). */
export function netWorth(s: GameState): number {
  return clampMoney(s.money.cash + s.money.bank + businessesValue(s));
}

export function currentRole(s: GameState): RoleDef | null {
  return s.career.roleId ? (ROLE_BY_ID[s.career.roleId] ?? null) : null;
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

/** The tenure (weeks) the next promotion demands in the *current* role, if any. */
function tenureWeeksFor(req: Requirement, roleId: string): number | undefined {
  if (req.kind === 'roleTenure') return req.roleId === roleId ? req.weeks : undefined;
  if (req.kind === 'allOf' || req.kind === 'anyOf') {
    for (const r of req.reqs) {
      const w = tenureWeeksFor(r, roleId);
      if (w !== undefined) return w;
    }
  }
  return undefined;
}

/**
 * Progress toward the next promotion, in [0, 1] — what the Work card's bar shows.
 * When the next role demands time served in the current role (the usual case),
 * this is simply weeks-in-role / weeks-required: it resets to zero on every
 * promotion and fills smoothly, however many years the role takes. Roles gated on
 * skills/credentials alone (no tenure) fall back to overall requirement progress.
 */
export function promotionProgress(s: GameState): number | null {
  if (!s.career.roleId) return null;
  const promo = nextPromotion(s);
  if (!promo) return null;
  const weeks = tenureWeeksFor(promo.role.gate, s.career.roleId);
  if (weeks !== undefined) return Math.min(1, (s.career.roleTenure[s.career.roleId] ?? 0) / weeks);
  return requirementProgress(s, promo.role.gate);
}

/** Purchases draw from cash-in-hand only — bank savings must be withdrawn first. */
export function elixirAffordable(s: GameState): boolean {
  return s.money.cash >= s.elixir.price;
}

/**
 * A forecast of this week's cash flow, derived from current state. Income is
 * conditional on the action (salary only lands on a working week), so we surface
 * both a working-week and an idle-week net. Uses the same upkeep/interest math the
 * tick does, so the numbers match what actually happens.
 */
/** One owned business's weekly contribution to cash flow (net can be negative). */
export interface BusinessLine {
  id: string;
  name: string;
  net: number;
}

export interface Financials {
  role: RoleDef | null;
  salary: number; // per working week (0 if unemployed)
  interest: number; // projected weekly bank interest at the current balance
  businesses: BusinessLine[]; // per-business weekly net (profit or loss)
  businessNet: number; // sum of the business lines
  upkeep: UpkeepBreakdown;
  totalIncome: number; // salary + interest + business net
  totalCosts: number; // upkeep total
  net: number; // totalIncome − totalCosts
}

export function financials(s: GameState): Financials {
  const mods = computeRunMods(s);
  const role = currentRole(s);
  const salary = role?.salaryPerWeek ?? 0;
  const interest = weeklyInterest(s.money.bank);

  const businesses: BusinessLine[] = s.businesses.map((b) => {
    const def = defOf(b);
    return { id: b.id, name: def?.name ?? b.defId, net: def ? weeklyNet(b, def) : 0 };
  });
  const businessNet = businesses.reduce((sum, line) => sum + line.net, 0);

  const upkeep = weeklyUpkeep(s, mods.priceMod);
  const totalIncome = salary + interest + businessNet;
  const totalCosts = upkeep.total;
  return {
    role,
    salary,
    interest,
    businesses,
    businessNet,
    upkeep,
    totalIncome,
    totalCosts,
    net: totalIncome - totalCosts,
  };
}
