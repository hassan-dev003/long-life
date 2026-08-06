/**
 * Step 8b (WORK) — job stress plus career bookkeeping. Working accrues role
 * tenure and field experience (which drive promotion gates). Stress is a weekly
 * health/happiness cost, softened by the run's jobStressDelta (e.g. Workaholic).
 */
import { addHealth, addHappy } from '../../state/mutations';
import { currentRole } from '../selectors';
import type { GameState } from '../../state/types';
import type { TickCtx } from '../context';

export function stepWork(s: GameState, ctx: TickCtx): void {
  if (ctx.action.type !== 'WORK') return;
  const role = currentRole(s);
  if (!role) return;

  // Career bookkeeping.
  s.career.roleTenure += 1;
  s.career.fieldExp[role.field] = (s.career.fieldExp[role.field] ?? 0) + 1;

  // Stress (a cost; the delta can reduce it but never turns it into a gain).
  const stressH = Math.max(0, role.stress.h + ctx.mods.jobStressDelta);
  const stressHp = Math.max(0, role.stress.hp + ctx.mods.jobStressDelta);
  addHealth(s, -stressH);
  addHappy(s, -stressHp);
}
