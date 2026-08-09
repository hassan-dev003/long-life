/** Step 2 — bank interest on the prior balance (weekly compound). */
import { clampMoney } from '../../util/money';
import { bankRate } from '../economy';
import type { GameState } from '../../state/types';

export function stepInterest(s: GameState): void {
  if (s.money.bank <= 0) return;
  const interest = Math.round(s.money.bank * bankRate(s.money.bank));
  if (interest <= 0) return;
  s.money.bank = clampMoney(s.money.bank + interest);
  s.money.bankInterestEarned = clampMoney(s.money.bankInterestEarned + interest);
  s.money.lifetimeEarned = clampMoney(s.money.lifetimeEarned + interest);
}
