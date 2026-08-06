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
  it('folds newly-earned achievements and running bests into the profile', () => {
    const p = freshProfile();
    const game = freshLife('normal-life', [], 1);
    game.progress.runAchievements = ['first-job', 'graduate'];
    game.progress.peakNet = 250_000;

    const next = absorbRun(p, game, 42);
    expect(next.achievements).toEqual(expect.arrayContaining(['first-job', 'graduate']));
    expect(next.stats.bestNetWorth).toBe(250_000);
    expect(next.stats.oldestAge).toBe(42);
  });

  it('returns the same object when nothing changed', () => {
    const p = freshProfile();
    const game = freshLife('normal-life', [], 1);
    game.progress.peakNet = 0;
    expect(absorbRun(p, game, 0)).toBe(p);
  });
});
