import { describe, it, expect, beforeEach } from 'vitest';
import { freshLife } from './initial';
import { freshProfile, absorbRun } from './profile';
import {
  saveRun,
  loadRun,
  saveProfile,
  loadProfile,
  clearRun,
  RUN_KEY,
} from './persistence';

beforeEach(() => {
  localStorage.clear();
});

describe('run persistence', () => {
  it('round-trips a run through localStorage', () => {
    const game = freshLife('normal-life', [], 123);
    game.clock.totalWeeks = 17;
    game.money.cash = 4242;
    saveRun(game);

    const loaded = loadRun();
    expect(loaded).not.toBeNull();
    expect(loaded!.clock.totalWeeks).toBe(17);
    expect(loaded!.money.cash).toBe(4242);
    expect(loaded!.meta.scenarioId).toBe('normal-life');
  });

  it('returns null when there is no save', () => {
    expect(loadRun()).toBeNull();
  });

  it('survives a corrupt save without crashing and backs it up', () => {
    localStorage.setItem(RUN_KEY, '{not valid json');
    expect(loadRun()).toBeNull();
    expect(localStorage.getItem('longlife.run.corrupt')).toBe('{not valid json');
  });

  it('clears a run', () => {
    saveRun(freshLife('normal-life', [], 1));
    clearRun();
    expect(loadRun()).toBeNull();
  });

  it('migrates a v1 save (no bankruptcy fields) up to the current schema', () => {
    // A v1 run predates weeksInDebt / pendingBankruptcyWarning.
    const v1 = JSON.parse(JSON.stringify(freshLife('normal-life', [], 1))) as {
      meta: { schemaVersion: number };
      money: Record<string, number>;
      pendingBankruptcyWarning?: boolean;
    };
    v1.meta.schemaVersion = 1;
    delete v1.money.weeksInDebt;
    delete v1.pendingBankruptcyWarning;
    localStorage.setItem(RUN_KEY, JSON.stringify(v1));

    const loaded = loadRun();
    expect(loaded).not.toBeNull();
    expect(loaded!.meta.schemaVersion).toBe(4);
    expect(loaded!.money.weeksInDebt).toBe(0);
    expect(loaded!.pendingBankruptcyWarning).toBe(false);
  });

  it('migrates a v2 save (scalar tenure) to per-role tenure + field standing', () => {
    // A v2 run held a single roleTenure number for the active role and no fieldRole.
    const v2 = JSON.parse(JSON.stringify(freshLife('normal-life', [], 1))) as {
      meta: { schemaVersion: number };
      career: Record<string, unknown>;
    };
    v2.meta.schemaVersion = 2;
    v2.career = { roleId: 'swe', roleTenure: 30, fieldExp: { tech: 30 } };
    localStorage.setItem(RUN_KEY, JSON.stringify(v2));

    const loaded = loadRun();
    expect(loaded).not.toBeNull();
    expect(loaded!.meta.schemaVersion).toBe(4);
    expect(loaded!.career.roleTenure).toEqual({ swe: 30 }); // folded into the map
    expect(loaded!.career.fieldRole).toEqual({ tech: 'swe' }); // resume point seeded
  });

  it('migrates a v3 save: businesses gain a base branch, profit share dropped', () => {
    const v3 = JSON.parse(JSON.stringify(freshLife('normal-life', [], 1))) as {
      meta: { schemaVersion: number };
      businesses: Record<string, unknown>[];
    };
    v3.meta.schemaVersion = 3;
    v3.businesses = [{ id: 'x', defId: 'cafe', branches: 0, staff: 2, profitSharePct: 0.5 }];
    localStorage.setItem(RUN_KEY, JSON.stringify(v3));

    const loaded = loadRun();
    expect(loaded).not.toBeNull();
    expect(loaded!.meta.schemaVersion).toBe(4);
    expect(loaded!.businesses[0]!.branches).toBe(1); // 0 extra branches → 1 total
    expect('profitSharePct' in loaded!.businesses[0]!).toBe(false);
  });
});

describe('profile persistence', () => {
  it('returns a fresh profile when none is stored', () => {
    const p = loadProfile();
    expect(p.stats.livesLived).toBe(0);
    expect(p.unlockedScenarios).toContain('normal-life');
  });

  it('round-trips a profile', () => {
    const p = freshProfile();
    p.achievements.push('first-job');
    p.stats.bestNetWorth = 999;
    saveProfile(p);
    const loaded = loadProfile();
    expect(loaded.achievements).toContain('first-job');
    expect(loaded.stats.bestNetWorth).toBe(999);
  });
});

describe('absorbRun', () => {
  it('folds running bests into the profile', () => {
    const p = freshProfile();
    const game = freshLife('normal-life', [], 1);
    game.progress.peakNet = 250_000;

    const next = absorbRun(p, game, 42);
    expect(next.stats.bestNetWorth).toBe(250_000);
    expect(next.stats.oldestAge).toBe(42);
  });

  it('does not bank achievements — they are per life', () => {
    const p = freshProfile();
    const game = freshLife('normal-life', [], 1);
    game.progress.runAchievements = ['first-job', 'graduate'];

    const next = absorbRun(p, game, 42);
    expect(next.achievements).toEqual([]);
  });

  it('returns the same object when nothing changed', () => {
    const p = freshProfile();
    const game = freshLife('normal-life', [], 1);
    game.progress.peakNet = 0;
    expect(absorbRun(p, game, 0)).toBe(p);
  });
});
