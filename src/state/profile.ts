/**
 * The account-level Profile — the only thing that persists across runs (perks,
 * achievements, unlocked scenarios/traits, lifetime stats). No prestige carry-over
 * beyond this.
 */
import { SCHEMA_VERSION } from './initial';
import type { GameState, Profile } from './types';

export function freshProfile(): Profile {
  return {
    schemaVersion: SCHEMA_VERSION,
    unlockedPerks: [],
    activePerks: [],
    unlockedTraits: [],
    achievements: [],
    unlockedScenarios: ['normal-life'],
    stats: { livesLived: 0, bestNetWorth: 0, oldestAge: 0 },
  };
}

/**
 * Fold a run's running bests into the Profile. Pure — returns a new Profile
 * (unchanged if nothing new). Called after each committed state change so the
 * account always reflects the latest run.
 *
 * Achievements are deliberately **not** banked here: they are a per-life record
 * that resets with each new life (they live only in GameState.progress). Only
 * lifetime *stats* (best net worth, oldest age) and goal-earned perks persist.
 */
export function absorbRun(profile: Profile, game: GameState, ageYears: number): Profile {
  const bestNetWorth = Math.max(profile.stats.bestNetWorth, game.progress.peakNet);
  const oldestAge = Math.max(profile.stats.oldestAge, ageYears);

  const changed =
    bestNetWorth !== profile.stats.bestNetWorth || oldestAge !== profile.stats.oldestAge;

  if (!changed) return profile;
  return {
    ...profile,
    stats: { ...profile.stats, bestNetWorth, oldestAge },
  };
}
