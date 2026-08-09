/**
 * Step 3 — the business pass. For each owned business: bank the week's net
 * (revenue − running cost), then advance maturity (growth), Team Morale, the
 * field-unique stat, and staff attrition. No owner health/happiness cost — business
 * is a purely financial/management system (GDD §7, deliberate departure §7).
 */
import { TUNING } from '../../config/tuning';
import { clampMoney } from '../../util/money';
import { clampStat } from '../../util/clamp';
import { earn, pushLog } from '../../state/mutations';
import { moneyShort } from '../../util/money';
import { competence, defOf, weeklyNet } from '../business';
import type { BusinessInstance } from '../../state/types';
import type { BusinessDef } from '../../content/businesses';
import type { TickCtx } from '../context';
import type { GameState } from '../../state/types';

function advanceStats(
  s: GameState,
  b: BusinessInstance,
  def: BusinessDef,
  businessGrowthMod: number,
  rng: TickCtx['rng'],
): void {
  const moraleFactor = b.morale / 100;
  const growthDrive = TUNING.GROWTH_BASE * competence(s, b.field) * moraleFactor * (1 + businessGrowthMod);
  const growthStep = growthDrive * (1 - b.growth / 100); // asymptotic toward 100

  // Growth is asymptotic toward 100; neglect (low morale) erodes it.
  b.growth = clampStat(b.growth + growthStep);
  if (b.morale < TUNING.ATTRITION_FLOOR) b.growth = clampStat(b.growth - TUNING.BIZ_NEGLECT_DECAY);

  // Morale chases a target set by pay generosity and profit share.
  const wageRatio = def.marketWage > 0 ? b.wagePerStaff / def.marketWage : 1;
  const moraleTarget = Math.max(0, Math.min(100, 40 + 40 * (wageRatio - 1) + 60 * b.profitSharePct));
  b.morale = clampStat(b.morale + (moraleTarget - b.morale) * TUNING.MORALE_LERP);

  // Field-unique stat.
  switch (def.fieldStat) {
    case 'reputation': {
      const target = 40 + 0.6 * b.morale;
      b.fieldStatValue = clampStat(b.fieldStatValue + (target - b.fieldStatValue) * TUNING.MORALE_LERP);
      break;
    }
    case 'inventory': {
      const target = 50 + 0.5 * b.morale;
      b.fieldStatValue = clampStat(b.fieldStatValue + (target - b.fieldStatValue) * TUNING.MORALE_LERP);
      break;
    }
    case 'techDebt': {
      // Debt accrues while growing fast, and is paid down once the product matures.
      const next =
        b.fieldStatValue + growthStep * TUNING.BIZ_TECHDEBT_ACCRUAL - TUNING.BIZ_TECHDEBT_PAYDOWN;
      b.fieldStatValue = clampStat(next);
      break;
    }
    case 'none':
      break;
  }

  // Attrition: unhappy teams shed staff, dropping capacity.
  if (b.morale < TUNING.ATTRITION_FLOOR && b.staff > 0) {
    const p = (TUNING.ATTRITION_FLOOR - b.morale) / 100;
    if (rng.next() < p) {
      b.staff -= 1;
      pushLog(s, 'money', `A worker quit ${def.name} — morale is low.`);
    }
  }
}

export function stepBusiness(s: GameState, ctx: TickCtx): void {
  if (s.businesses.length === 0) return;

  let totalNet = 0;
  for (const b of s.businesses) {
    const def = defOf(b);
    if (!def) continue;
    const net = weeklyNet(b, def);
    totalNet += net;
    if (net >= 0) earn(s, net);
    else s.money.cash = clampMoney(s.money.cash + net);
    advanceStats(s, b, def, ctx.mods.businessGrowthMod, ctx.rng);
  }

  if (totalNet !== 0) {
    const verb = totalNet >= 0 ? 'netted' : 'lost';
    pushLog(s, 'money', `Your businesses ${verb} ${moneyShort(Math.abs(totalNet))} this week.`);
  }
}
