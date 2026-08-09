import { describe, it, expect } from 'vitest';
import { freshLife } from '../../state/initial';
import { stepDeath } from './death';
import type { GameState } from '../../state/types';

// Exercise the zero-counter/death rule directly, free of event randomness.
function base(): GameState {
  return freshLife('normal-life', [], 1);
}

describe('death & breakdown (3-week grace)', () => {
  it('dies exactly after 3 consecutive weeks at zero health', () => {
    const s = base();
    s.stats.health = 0;

    stepDeath(s); // week 1
    expect(s.status).toBe('alive');
    expect(s.stats.weeksAtZeroHealth).toBe(1);

    stepDeath(s); // week 2
    expect(s.status).toBe('alive');
    expect(s.stats.weeksAtZeroHealth).toBe(2);

    stepDeath(s); // week 3 → death
    expect(s.status).toBe('dead');
  });

  it('breaks down after 3 weeks at zero happiness', () => {
    const s = base();
    s.stats.health = 100;
    s.stats.happiness = 0;

    stepDeath(s);
    stepDeath(s);
    expect(s.status).toBe('alive');
    stepDeath(s);
    expect(s.status).toBe('breakdown');
  });

  it('resets the zero-counter when the stat recovers within grace', () => {
    const s = base();
    s.stats.health = 0;
    stepDeath(s);
    expect(s.stats.weeksAtZeroHealth).toBe(1);

    s.stats.health = 50; // clawed back
    stepDeath(s);
    expect(s.stats.weeksAtZeroHealth).toBe(0);
    expect(s.status).toBe('alive');
  });
});
