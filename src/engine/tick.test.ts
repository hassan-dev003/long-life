import { describe, it, expect } from 'vitest';
import { freshLife } from '../state/initial';
import { tick } from './tick';
import { work, study, activity } from './actions';
import { takeJob, enroll, buyElixir, resolveEvent } from './instant';
import { ageYears } from './selectors';
import { EVENT_BY_ID } from '../content/events';
import type { GameState } from '../state/types';

const S = (seed = 42): GameState => freshLife('normal-life', [], seed);

/** Pick the first choice of the pending event (test helper). */
function event0Choice(s: GameState): string {
  const ev = s.pendingEvent ? EVENT_BY_ID[s.pendingEvent.eventId] : undefined;
  return ev?.choices?.[0]?.id ?? '';
}

describe('tick — core loop', () => {
  it('advances exactly one week and is pure (input unchanged)', () => {
    const s0 = S();
    const s1 = tick(s0, activity('rest'));
    expect(s1.clock.totalWeeks).toBe(1);
    expect(s0.clock.totalWeeks).toBe(0); // original not mutated
  });

  it('is deterministic for a fixed seed + action sequence', () => {
    const run = () => {
      let s = S(7);
      for (let i = 0; i < 40; i++) s = tick(s, activity('walk'));
      return s;
    };
    const a = run();
    const b = run();
    expect(a.stats).toEqual(b.stats);
    expect(a.money).toEqual(b.money);
    expect(a.meta.rngState).toBe(b.meta.rngState);
  });

  it('pays salary when working an entry job', () => {
    let s = takeJob(S(), 'dishwasher').state;
    const cashBefore = s.money.cash;
    s = tick(s, work());
    expect(s.money.cash).toBeGreaterThan(cashBefore); // +500 salary − upkeep/food
    expect(s.career.roleTenure).toBe(1);
    expect(s.career.fieldExp.service).toBe(1);
  });

  it('accrues study progress and graduates', () => {
    // Give enough cash and the diploma prerequisite path.
    let s = S();
    s.money.cash = 500_000;
    s.education.credentials.push('diploma');
    s = enroll(s, 'degree', 'cs').state;
    expect(s.education.enrolled?.weeks).toBe(96);
    // Study to completion, resolving any choice event that pauses the week.
    for (let i = 0; i < 400 && s.education.enrolled && s.status === 'alive'; i++) {
      s = s.pendingEvent ? resolveEvent(s, event0Choice(s)) : tick(s, study());
    }
    expect(s.education.credentials).toContain('degree:cs');
    expect(s.education.enrolled).toBeNull();
  });

  it('never advances a dead run', () => {
    const s = S();
    s.status = 'dead';
    const after = tick(s, activity('rest'));
    expect(after).toBe(s); // returned unchanged
  });

  it('keeps stats within [0,100] under sustained neglect', () => {
    let s = S();
    for (let i = 0; i < 300; i++) {
      s = tick(s, work()); // unemployed → just decay + events
      expect(s.stats.health).toBeGreaterThanOrEqual(0);
      expect(s.stats.health).toBeLessThanOrEqual(100);
      expect(s.stats.happiness).toBeGreaterThanOrEqual(0);
      expect(s.stats.happiness).toBeLessThanOrEqual(100);
      if (s.status !== 'alive') break;
    }
  });
});

describe('elixir', () => {
  it('rewinds the clock ~10 years, heals, and raises the price', () => {
    const s = S();
    // Fast-forward the clock and afford the elixir.
    s.clock.totalWeeks = 40 * 48; // age 58
    s.money.cash = 10_000_000;
    s.stats.health = 40;
    const priceBefore = s.elixir.price;
    const ageBefore = ageYears(s);

    const res = buyElixir(s);
    expect(res.ok).toBe(true);
    const after = res.state;
    expect(ageYears(after)).toBe(ageBefore - 10);
    expect(after.stats.health).toBe(65); // 40 + ELIXIR_HEAL(25)
    expect(after.elixir.count).toBe(1);
    expect(after.elixir.price).toBeGreaterThan(priceBefore);
  });

  it('refuses when unaffordable', () => {
    const s = S();
    s.money.cash = 10;
    const res = buyElixir(s);
    expect(res.ok).toBe(false);
    expect(res.state).toBe(s);
  });
});
