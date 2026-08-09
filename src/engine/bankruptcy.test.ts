import { describe, it, expect } from 'vitest';
import { freshLife } from '../state/initial';
import { finalize } from './finalize';
import type { GameState } from '../state/types';

const base = (): GameState => freshLife('normal-life', [], 1);

describe('bankruptcy (negative cash → warn → 1 week to recover)', () => {
  it('warns on the first negative week, then goes bankrupt the next', () => {
    const s = base();
    s.money.cash = -100;

    finalize(s); // week 1 in the red
    expect(s.status).toBe('alive');
    expect(s.money.weeksInDebt).toBe(1);
    expect(s.pendingBankruptcyWarning).toBe(true);

    s.pendingBankruptcyWarning = false; // player acknowledged the warning
    finalize(s); // week 2 still in the red → bankrupt
    expect(s.status).toBe('bankrupt');
  });

  it('clears the counter and warning when cash recovers within grace', () => {
    const s = base();
    s.money.cash = -100;
    finalize(s);
    expect(s.money.weeksInDebt).toBe(1);

    s.money.cash = 500; // clawed back
    finalize(s);
    expect(s.money.weeksInDebt).toBe(0);
    expect(s.pendingBankruptcyWarning).toBe(false);
    expect(s.status).toBe('alive');
  });

  it('does not fire while cash stays non-negative', () => {
    const s = base();
    s.money.cash = 3_000;
    finalize(s);
    expect(s.money.weeksInDebt).toBe(0);
    expect(s.pendingBankruptcyWarning).toBe(false);
    expect(s.status).toBe('alive');
  });
});
