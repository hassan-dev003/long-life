/** Step 6 — weekly upkeep out: residence + subscriptions + food (price-modified). */
import { clampMoney } from '../../util/money';
import { HOME_TIER_BY_ID, FOOD_TIER_BY_ID, SUBSCRIPTION_BY_ID } from '../../content/lifestyle';
import type { GameState } from '../../state/types';
import type { TickCtx } from '../context';

export function stepUpkeep(s: GameState, ctx: TickCtx): void {
  let upkeep = 0;

  // Residence upkeep (rented tiers only; owned property upkeep arrives in M3).
  if (s.lifestyle.residence.kind === 'rented') {
    upkeep += HOME_TIER_BY_ID[s.lifestyle.residence.tier]?.upkeepPerWeek ?? 0;
  }

  // Food (recurring).
  upkeep += FOOD_TIER_BY_ID[s.lifestyle.food]?.costPerWeek ?? 0;

  // Subscriptions.
  for (const subId of s.lifestyle.subscriptions) {
    upkeep += SUBSCRIPTION_BY_ID[subId]?.upkeepPerWeek ?? 0;
  }

  upkeep = Math.round(upkeep * ctx.mods.priceMod);
  if (upkeep <= 0) return;

  // Pay from bank first if the player opted in and cash can't cover it.
  if (s.banking.payUpkeepFromBank && s.money.cash < upkeep) {
    const fromBank = Math.min(s.money.bank, upkeep - Math.max(0, s.money.cash));
    s.money.bank = clampMoney(s.money.bank - fromBank);
    s.money.cash = clampMoney(s.money.cash - (upkeep - fromBank));
  } else {
    s.money.cash = clampMoney(s.money.cash - upkeep); // may go negative (debt)
  }
}
