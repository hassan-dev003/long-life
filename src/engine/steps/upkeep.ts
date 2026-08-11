/** Step 6 — weekly upkeep out: residence + subscriptions + food (price-modified). */
import { clampMoney } from '../../util/money';
import { weeklyUpkeep } from '../economy';
import type { GameState } from '../../state/types';
import type { TickCtx } from '../context';

export function stepUpkeep(s: GameState, ctx: TickCtx): void {
  const upkeep = weeklyUpkeep(s, ctx.mods.priceMod).total;
  if (upkeep <= 0) return;

  // When opted in, upkeep is drawn straight from the bank (whatever it can cover),
  // with any shortfall falling to cash. Otherwise it comes from cash.
  if (s.banking.payUpkeepFromBank) {
    const fromBank = Math.min(s.money.bank, upkeep);
    s.money.bank = clampMoney(s.money.bank - fromBank);
    s.money.cash = clampMoney(s.money.cash - (upkeep - fromBank)); // remainder (may go negative)
  } else {
    s.money.cash = clampMoney(s.money.cash - upkeep); // may go negative (debt)
  }
}
