import { describe, it, expect } from 'vitest';
import { freshLife } from '../state/initial';
import { financials } from './selectors';
import { takeJob, toggleSubscription, deposit } from './instant';
import { tick } from './tick';
import { work } from './actions';
import { FOOD_TIER_BY_ID } from '../content/lifestyle';

describe('financials selector', () => {
  it('itemizes upkeep and reflects it as negative net when idle', () => {
    const s = freshLife('normal-life', [], 1); // parents (free), basic food, no subs
    const fin = financials(s);
    expect(fin.salary).toBe(0);
    expect(fin.upkeep.residence).toBe(0);
    expect(fin.upkeep.food).toBe(FOOD_TIER_BY_ID.basic!.costPerWeek);
    expect(fin.upkeep.total).toBe(FOOD_TIER_BY_ID.basic!.costPerWeek);
    expect(fin.totalIncome).toBe(0);
    expect(fin.totalCosts).toBe(fin.upkeep.total);
    expect(fin.net).toBe(-fin.upkeep.total);
  });

  it('sums salary + interest as income and upkeep as costs', () => {
    let s = freshLife('normal-life', [], 1);
    s.money.cash = 10_000;
    s = takeJob(s, 'service-worker').state; // 560/wk
    s = toggleSubscription(s, 'gym'); // 25/wk upkeep
    const fin = financials(s);
    expect(fin.salary).toBe(560);
    expect(fin.upkeep.subscriptions).toBe(25);
    expect(fin.totalIncome).toBe(560 + fin.interest);
    expect(fin.net).toBe(fin.totalIncome - fin.totalCosts);
  });

  it('projects bank interest that matches what a tick actually credits', () => {
    let s = freshLife('normal-life', [], 1);
    s.money.cash = 100_000;
    s = deposit(s, 50_000);
    const projected = financials(s).interest;
    const bankBefore = s.money.bank;
    s = tick(s, work()); // unemployed idle week; interest is applied on prior balance
    expect(s.money.bank - bankBefore).toBe(projected);
  });
});
