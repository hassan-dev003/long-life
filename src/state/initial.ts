/**
 * freshLife — builds the initial GameState for a run from a scenario and the
 * player's active perks. The Trust Fund perk adds starting cash here; other perk
 * effects apply later through computeRunMods.
 */
import { SCENARIO_BY_ID } from '../content/scenarios';
import { buildRunConfig } from '../content/perks';
import { seedFromString } from '../engine/rng';
import { clampMoney } from '../util/money';
import { TUNING } from '../config/tuning';
import type { GameState, PerkId } from './types';

export const SCHEMA_VERSION = 3;

/**
 * Create a new life. `seed` is optional — pass a fixed number for reproducible
 * runs (tests); otherwise it's derived from the scenario id + a time salt.
 */
export function freshLife(
  scenarioId: string,
  activePerks: PerkId[] = [],
  seed?: number,
): GameState {
  const scenario = SCENARIO_BY_ID[scenarioId];
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);

  const cfg = buildRunConfig(activePerks);
  const start = scenario.start;
  const rngState =
    seed ?? (seedFromString(scenarioId) ^ (Date.now() & 0xffffffff)) >>> 0;

  const startCash = clampMoney(start.cash + cfg.startCashBonus);
  const startBank = clampMoney(start.bank);

  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      scenarioId,
      rngState: rngState | 0,
      startAge: start.age,
      activePerks: [...activePerks],
    },
    clock: { totalWeeks: 0 },
    stats: {
      // Start below full so Zen (both stats at 100) must be earned through leisure.
      health: 80,
      happiness: 80,
      weeksAtZeroHealth: 0,
      weeksAtZeroHappy: 0,
    },
    money: {
      cash: startCash,
      bank: startBank,
      bankInterestEarned: 0,
      lifetimeEarned: 0,
      weeksInDebt: 0,
    },
    banking: { autoDepositPct: 0, payUpkeepFromBank: false, overdraft: false },
    education: { credentials: [...start.credentials], enrolled: null },
    skills: {},
    traits: [...start.traits],
    career: { roleId: null, roleTenure: {}, fieldRole: {}, fieldExp: {} },
    businesses: [],
    realEstate: [],
    holdings: {},
    market: { prices: {}, news: [] },
    lifestyle: {
      residence: { ...start.residence },
      food: start.food,
      clothes: null,
      subscriptions: [...start.subscriptions],
    },
    relationships: [],
    elixir: { count: 0, price: TUNING.ELIXIR_BASE_PRICE },
    philanthropy: [],
    progress: { peakNet: clampMoney(startCash + startBank), goalsMet: [], runAchievements: [] },
    log: [
      {
        week: 0,
        kind: 'info',
        text: `A new life begins — ${scenario.name}, age ${start.age}.`,
      },
    ],
    pendingEvent: null,
    pendingGoal: null,
    pendingBankruptcyWarning: false,
    status: 'alive',
  };
}
