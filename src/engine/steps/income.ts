/** Step 5 — income in: salary if working. Auto-deposit is applied in receiveIncome. */
import { receiveIncome, pushLog } from '../../state/mutations';
import { moneyShort } from '../../util/money';
import { currentRole } from '../selectors';
import type { GameState } from '../../state/types';
import type { TickCtx } from '../context';

export function stepIncome(s: GameState, ctx: TickCtx): void {
  if (ctx.action.type !== 'WORK') return;
  const role = currentRole(s);
  if (!role) return;

  const salary = role.salaryPerWeek;
  receiveIncome(s, salary); // credits cash + auto-deposit split

  pushLog(s, 'money', `Worked as ${role.title}: +${moneyShort(salary)}.`);
}
