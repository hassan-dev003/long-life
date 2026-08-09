import { describe, it, expect } from 'vitest';
import { nextRng, Rng, seedFromString } from './rng';

describe('nextRng', () => {
  it('is deterministic: same state → same draw', () => {
    const a = nextRng(12345);
    const b = nextRng(12345);
    expect(a.value).toBe(b.value);
    expect(a.state).toBe(b.state);
  });

  it('produces values in [0, 1)', () => {
    let state = 1;
    for (let i = 0; i < 1000; i++) {
      const d = nextRng(state);
      expect(d.value).toBeGreaterThanOrEqual(0);
      expect(d.value).toBeLessThan(1);
      state = d.state;
    }
  });

  it('reproduces the same sequence from the same seed', () => {
    const seqFrom = (seed: number): number[] => {
      const r = new Rng(seed);
      return Array.from({ length: 8 }, () => r.next());
    };
    expect(seqFrom(999)).toEqual(seqFrom(999));
    expect(seqFrom(999)).not.toEqual(seqFrom(1000));
  });
});

describe('Rng helpers', () => {
  it('threads state so persisted state resumes the same sequence', () => {
    const r1 = new Rng(42);
    const first = [r1.next(), r1.next()];
    const savedState = r1.state;

    // Resume from the saved state — should continue, not restart.
    const r2 = new Rng(savedState);
    const cont = [r2.next(), r2.next()];

    const r3 = new Rng(42);
    const all = [r3.next(), r3.next(), r3.next(), r3.next()];
    expect([...first, ...cont]).toEqual(all);
  });

  it('int stays within [0, n)', () => {
    const r = new Rng(7);
    for (let i = 0; i < 500; i++) {
      const v = r.int(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('weighted respects weights (zero-weight items never chosen)', () => {
    const r = new Rng(123);
    const items = ['a', 'b', 'c'];
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 2000; i++) {
      const pick = r.weighted(items, (x) => (x === 'a' ? 0 : x === 'b' ? 1 : 3));
      counts[pick] = (counts[pick] ?? 0) + 1;
    }
    expect(counts.a).toBe(0);
    expect(counts.c!).toBeGreaterThan(counts.b!);
  });

  it('seedFromString is stable and differs by input', () => {
    expect(seedFromString('normal-life')).toBe(seedFromString('normal-life'));
    expect(seedFromString('normal-life')).not.toBe(seedFromString('slumdog'));
  });
});
