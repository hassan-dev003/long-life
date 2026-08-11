/**
 * Pay-upkeep-from-bank: when opted in, weekly upkeep is drawn straight from the
 * bank whether or not cash is short (not just as a shortfall backstop).
 */
import { describe, it, expect } from 'vitest';
import { freshLife } from '../state/initial';
import { tick } from './tick';
import { work } from './actions';
import { weeklyUpkeep } from './economy';

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
});
