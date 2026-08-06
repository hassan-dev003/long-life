/**
 * Money handling — the $999,999,999,999,999 (~$1 quadrillion) ceiling and the
 * `moneyShort` display formatter. Contract from PRD §17 / GDD §1.4 / TECH-ARCH §7.
 *
 * MONEY_CAP (~1e15) is well under Number.MAX_SAFE_INTEGER (~9e15), so plain
 * integers are safe up to the ceiling — no BigInt needed.
 */
import { clamp } from './clamp';

export const MONEY_CAP = 999_999_999_999_999;

/** Clamp any money value into [-MONEY_CAP, MONEY_CAP]. Every write to money state passes through this. */
export const clampMoney = (n: number): number => clamp(Math.round(n), -MONEY_CAP, MONEY_CAP);

const TIERS: { div: number; suffix: string }[] = [
  { div: 1e12, suffix: 'T' },
  { div: 1e9, suffix: 'B' },
  { div: 1e6, suffix: 'M' },
  { div: 1e3, suffix: 'k' },
];

/** Format a mantissa in [1, 1000) to 3 significant figures. */
function threeSigFigs(m: number): string {
  if (m >= 100) return m.toFixed(0); // 125, 847
  if (m >= 10) return m.toFixed(1); // 12.5
  return m.toFixed(2); // 1.25
}

/**
 * Compact money display: 3 significant figures with k/M/B/T suffixes.
 *   $842 · $12.5k · $125k · $1.25M · $12.5M · $125M · $1.25B · $847T
 * Values at/over the cap render as "$999T". Never overflows past the ceiling.
 */
export function moneyShort(n: number): string {
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);

  if (v >= MONEY_CAP) return `${sign}$999T`;
  if (v < 1000) return `${sign}$${Math.round(v).toLocaleString('en-US')}`;

  for (let i = 0; i < TIERS.length; i++) {
    const tier = TIERS[i]!;
    if (v >= tier.div) {
      let str = threeSigFigs(v / tier.div);
      // Rounding can carry the mantissa to 1000 (e.g. 999.6k → "1000"): promote a tier.
      if (parseFloat(str) >= 1000) {
        if (i === 0) return `${sign}$999T`; // already at the top tier; clamp
        const up = TIERS[i - 1]!;
        str = threeSigFigs(v / up.div);
        return `${sign}$${str}${up.suffix}`;
      }
      return `${sign}$${str}${tier.suffix}`;
    }
  }
  /* c8 ignore next */
  return `${sign}$${Math.round(v).toLocaleString('en-US')}`;
}

/** Exact, grouped-comma money display (used where precision matters, e.g. tooltips). */
export function money(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
}
