/** Clamp a number into the inclusive range [lo, hi]. */
export function clamp(n: number, lo: number, hi: number): number {
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}

/** Clamp into the 0..100 stat range. */
export function clampStat(n: number): number {
  return clamp(n, 0, 100);
}
