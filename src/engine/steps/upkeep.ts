/** Step 6 — weekly upkeep out: residence + subscriptions + food (price-modified). */
import { clampMoney } from '../../util/money';
import { weeklyUpkeep } from '../economy';
import type { GameState } from '../../state/types';
import type { TickCtx } from '../context';

export function stepUpkeep(s: GameState, ctx: TickCtx): void {
  const upkeep = weeklyUpkeep(s, ctx.mods.priceMod).total;
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
