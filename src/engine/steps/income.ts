/** Step 5 — income in: salary if working, with the auto-deposit split. */
import { clampMoney } from '../../util/money';
import { earn, pushLog } from '../../state/mutations';
import { moneyShort } from '../../util/money';
import { currentRole } from '../selectors';
import type { GameState } from '../../state/types';
import type { TickCtx } from '../context';

export function stepIncome(s: GameState, ctx: TickCtx): void {
  if (ctx.action.type !== 'WORK') return;
  const role = currentRole(s);
  if (!role) return;

  const salary = role.salaryPerWeek;
  earn(s, salary);

  // Auto-deposit: move a slice of the paycheck into the bank.
  const pct = s.banking.autoDepositPct;
  if (pct > 0) {
    const move = Math.min(s.money.cash, Math.round((salary * pct) / 100));
    if (move > 0) {
      s.money.cash = clampMoney(s.money.cash - move);
      s.money.bank = clampMoney(s.money.bank + move);
    }
  }

  pushLog(s, 'money', `Worked as ${role.title}: +${moneyShort(salary)}.`);
}
