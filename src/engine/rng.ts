/**
 * Seeded PRNG (mulberry32). The RNG state is a single serializable number that
 * lives inside the save (GameState.meta.rngState), so reloading a game and taking
 * the same actions reproduces the same outcomes — and tests can pin a seed.
 *
 * All engine randomness threads through this: read the state, consume draws,
 * write the advanced state back. Pure — no module-level mutable state.
 */

export interface RngDraw {
  value: number; // ∈ [0, 1)
  state: number;
}

/** Advance the RNG one step, returning the next value and the new state. */
export function nextRng(state: number): RngDraw {
  let a = state | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: a };
}

/**
 * A tiny stateful cursor over the pure PRNG, for ergonomic use inside a single
 * tick. Construct from the saved state, draw as needed, then persist `.state`
 * back into GameState. This is a convenience wrapper — determinism still comes
 * entirely from the seed.
 */
export class Rng {
  state: number;

  constructor(state: number) {
    this.state = state | 0;
  }

  /** Next float in [0, 1). */
  next(): number {
    const d = nextRng(this.state);
    this.state = d.state;
    return d.value;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Pick a random element from a non-empty array. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)]!;
  }

  /**
   * Weighted pick: given items and a weight for each, choose one proportional to
   * its weight. Weights must be non-negative and not all zero.
   */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    const weights = items.map(weightOf);
    const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= Math.max(0, weights[i]!);
      if (r < 0) return items[i]!;
    }
    return items[items.length - 1]!;
  }
}

/** Derive a stable numeric seed from a string (e.g. for reproducible test seeds). */
export function seedFromString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
