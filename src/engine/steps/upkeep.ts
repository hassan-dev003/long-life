/** Step 6 — weekly upkeep out: residence + food + clothes + subscriptions. */
import { payExpense } from '../../state/mutations';
import { weeklyUpkeep } from '../economy';
import type { GameState } from '../../state/types';
import type { TickCtx } from '../context';

export function stepUpkeep(s: GameState, ctx: TickCtx): void {
  const upkeep = weeklyUpkeep(s, ctx.mods.priceMod).total;
  // Drawn from the bank first when opted in (then cash), else from cash (may go
  // negative → debt). Same path as every other automatic expense.
  payExpense(s, upkeep);
}
