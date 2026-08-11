/**
 * Banking automation: auto-deposit applies to *all* income (salary + business
 * profit), and pay-from-bank covers *all* weekly expenses (upkeep + business loss).
 */
import { describe, it, expect } from 'vitest';
import { freshLife } from '../state/initial';
import { tick } from './tick';
import { work } from './actions';
import { weeklyUpkeep } from './economy';
import { buyBusiness } from './instant';
import { weeklyNet } from './business';
import { BUSINESS_BY_ID } from '../content/businesses';

describe('pay upkeep from bank', () => {
  it('takes upkeep from the bank even when cash could cover it', () => {
    let s = freshLife('normal-life', [], 1); // basic food = the only upkeep here
    s.money.cash = 10_000;
    s.money.bank = 10_000;
    s.banking.payUpkeepFromBank = true;
    const upkeep = weeklyUpkeep(s, 1).total;
    expect(upkeep).toBeGreaterThan(0);

    const cashBefore = s.money.cash;
    const bankBefore = s.money.bank;
    s = tick(s, work()); // idle week: no salary; bank earns a little interest

    expect(s.money.cash).toBe(cashBefore); // upkeep didn't touch cash
    expect(s.money.bank).toBeLessThan(bankBefore); // it came out of the bank
  });

  it('falls back to cash for whatever the bank can’t cover', () => {
    let s = freshLife('normal-life', [], 1);
    s.money.cash = 10_000;
    s.money.bank = 10; // not enough to cover upkeep
    s.banking.payUpkeepFromBank = true;

    s = tick(s, work());
    expect(s.money.bank).toBe(0); // bank drained first
    expect(s.money.cash).toBeLessThan(10_000); // remainder from cash
  });

  it('covers a business loss from the bank, not just lifestyle upkeep', () => {
    let s = freshLife('normal-life', [], 6);
    s.money.cash = 1_000_000;
    s = buyBusiness(s, 'cafe'); // a fresh cafe runs at a steep loss
    s.money.cash = 1_000; // little cash…
    s.money.bank = 1_000_000; // …but plenty banked
    s.banking.payUpkeepFromBank = true;
    expect(weeklyNet(s.businesses[0]!, BUSINESS_BY_ID.cafe!)).toBeLessThan(0);

    const bankBefore = s.money.bank;
    s = tick(s, work()); // idle: business loss + upkeep both due

    expect(s.money.cash).toBe(1_000); // cash untouched — the bank absorbed the loss
    expect(s.money.bank).toBeLessThan(bankBefore);
  });
});

describe('auto-deposit', () => {
  it('deposits a slice of all income, including business profit', () => {
    let s = freshLife('normal-life', [], 5);
    s.money.cash = 1_000_000;
    s = buyBusiness(s, 'ecom');
    // Force a mature, profitable state.
    Object.assign(s.businesses[0]!, { growth: 100, morale: 100, fieldStatValue: 100 });
    s.banking.autoDepositPct = 50;
    const net = weeklyNet(s.businesses[0]!, BUSINESS_BY_ID.ecom!);
    expect(net).toBeGreaterThan(0);

    s = tick(s, work()); // no job → no salary; business profit is the only income
    // Half the business profit was routed to the bank (bank started at 0, no interest).
    expect(s.money.bank).toBe(Math.round(net * 0.5));
  });
});
