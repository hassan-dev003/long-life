/**
 * Business model invariants (GDD §7): the loss → profit lifecycle, morale
 * responding to pay, valuation tracking maturity, and attrition from neglect.
 */
import { describe, it, expect } from 'vitest';
import { freshLife } from '../state/initial';
import { tick } from './tick';
import { work } from './actions';
import {
  buyBusiness,
  setBusinessWage,
  setBusinessProfitShare,
  acknowledgeGoal,
  acknowledgeWarning,
} from './instant';
import { weeklyNet, valuation } from './business';
import { BUSINESS_BY_ID } from '../content/businesses';
import type { BusinessInstance, GameState } from '../state/types';

/** A run with enough cash to buy in, and a competent owner (business degree). */
function ownerWith(defId: string): GameState {
  let s = freshLife('normal-life', [], 12345);
  s.education.credentials.push('degree:business');
  s.money.cash += 400_000;
  s = buyBusiness(s, defId);
  return s;
}

const cafeDef = BUSINESS_BY_ID.cafe!;
const cafeInstance = (over: Partial<BusinessInstance>): BusinessInstance => ({
  id: 'x',
  defId: 'cafe',
  field: 'service',
  tier: 'medium',
  growth: 5,
  morale: 50,
  staff: 0,
  branches: 0,
  wagePerStaff: cafeDef.marketWage,
  profitSharePct: 0,
  fieldStatValue: 50,
  ...over,
});

describe('business lifecycle', () => {
  it('starts a fresh business at a loss', () => {
    expect(weeklyNet(cafeInstance({}), cafeDef)).toBeLessThan(0);
  });

  it('turns a profit once mature and well-run (loss → profit is reachable)', () => {
    const mature = cafeInstance({ growth: 95, morale: 90, fieldStatValue: 85 });
    expect(weeklyNet(mature, cafeDef)).toBeGreaterThan(0);
  });

  it('grows maturity and morale over time when the team is paid well', () => {
    let s = ownerWith('cafe');
    const id = s.businesses[0]!.id;
    s = setBusinessWage(s, id, Math.round(cafeDef.marketWage * 1.4));
    s = setBusinessProfitShare(s, id, 0.4);
    s.money.bank = 5_000_000; // stay solvent through the ramp (pay-upkeep not the point here)

    const before = s.businesses[0]!;
    const netBefore = weeklyNet(before, cafeDef);
    // Isolate business dynamics: keep the owner alive and solvent through the ramp,
    // clearing any blocking modal (a cash top-up can trip the net-worth goal).
    for (let i = 0; i < 200; i++) {
      if (s.pendingGoal) s = acknowledgeGoal(s);
      if (s.pendingBankruptcyWarning) s = acknowledgeWarning(s);
      s = tick(s, work());
      s.stats.health = 80;
      s.stats.happiness = 80;
      s.money.cash = 2_000_000;
    }
    const after = s.businesses[0]!;

    expect(after.growth).toBeGreaterThan(before.growth);
    expect(after.morale).toBeGreaterThan(before.morale);
    expect(weeklyNet(after, cafeDef)).toBeGreaterThan(netBefore); // loss shrinks / turns to profit
  });

  it('valuation rises as the business matures', () => {
    const fresh = cafeInstance({ growth: 5, morale: 50 });
    const mature = cafeInstance({ growth: 95, morale: 90 });
    expect(valuation(mature, cafeDef)).toBeGreaterThan(valuation(fresh, cafeDef));
  });

  it('sheds staff when morale collapses (attrition)', () => {
    let s = ownerWith('cafe');
    const id = s.businesses[0]!.id;
    // Staff up, then pay nothing — morale falls under the floor and staff quit.
    s.businesses[0]!.staff = 5;
    s = setBusinessWage(s, id, 0);
    for (let i = 0; i < 400; i++) {
      if (s.pendingGoal) s = acknowledgeGoal(s);
      if (s.pendingBankruptcyWarning) s = acknowledgeWarning(s);
      s = tick(s, work());
      s.stats.health = 80;
      s.stats.happiness = 80;
      s.money.cash = 2_000_000;
      if (s.businesses[0] && s.businesses[0].staff < 5) break;
    }
    expect(s.businesses[0]!.staff).toBeLessThan(5);
  });
});
