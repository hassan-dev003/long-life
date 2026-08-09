/** Step 8b (ACTIVITY) — leisure: a cash cost (price-modified) and stat gains. */
import { clampMoney } from '../../util/money';
import { addHealth, addHappy } from '../../state/mutations';
import { ACTIVITY_BY_ID } from '../../content/activities';
import type { GameState } from '../../state/types';
import type { TickCtx } from '../context';

export function stepActivity(s: GameState, ctx: TickCtx): void {
  if (ctx.action.type !== 'ACTIVITY') return;
  const act = ACTIVITY_BY_ID[ctx.action.id];
  if (!act) return;

  const cost = Math.round(act.cost * ctx.mods.priceMod);
  if (cost > 0) s.money.cash = clampMoney(s.money.cash - cost);
  addHealth(s, act.h);
  addHappy(s, act.hp);
}
