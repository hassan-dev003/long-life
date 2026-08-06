import { describe, it, expect } from 'vitest';
import { moneyShort, money, clampMoney, MONEY_CAP } from './money';

describe('moneyShort', () => {
  it('shows exact grouped values under $1k', () => {
    expect(moneyShort(0)).toBe('$0');
    expect(moneyShort(842)).toBe('$842');
    expect(moneyShort(999)).toBe('$999');
  });

  it('formats k/M/B/T to 3 significant figures', () => {
    expect(moneyShort(1_250)).toBe('$1.25k');
    expect(moneyShort(12_500)).toBe('$12.5k');
    expect(moneyShort(125_000)).toBe('$125k');
    expect(moneyShort(1_250_000)).toBe('$1.25M');
    expect(moneyShort(12_500_000)).toBe('$12.5M');
    expect(moneyShort(125_000_000)).toBe('$125M');
    expect(moneyShort(1_250_000_000)).toBe('$1.25B');
    expect(moneyShort(847_000_000_000_000)).toBe('$847T');
  });

  it('carries rounding into the next tier', () => {
    expect(moneyShort(999_600)).toBe('$1.00M');
    expect(moneyShort(999_600_000)).toBe('$1.00B');
  });

  it('renders at/over the cap as $999T and never overflows', () => {
    expect(moneyShort(MONEY_CAP)).toBe('$999T');
    expect(moneyShort(MONEY_CAP + 1)).toBe('$999T');
    expect(moneyShort(999_600_000_000_000)).toBe('$999T'); // top-tier carry clamps
  });

  it('handles negatives with a leading minus', () => {
    expect(moneyShort(-2_500)).toBe('-$2.50k');
    expect(moneyShort(-500)).toBe('-$500');
  });
});

describe('money (exact)', () => {
  it('groups with commas', () => {
    expect(money(1234567)).toBe('$1,234,567');
    expect(money(-1000)).toBe('-$1,000');
  });
});

describe('clampMoney', () => {
  it('clamps to the cap in both directions and rounds', () => {
    expect(clampMoney(MONEY_CAP * 2)).toBe(MONEY_CAP);
    expect(clampMoney(-MONEY_CAP * 2)).toBe(-MONEY_CAP);
    expect(clampMoney(10.4)).toBe(10);
    expect(clampMoney(10.6)).toBe(11);
  });
});
