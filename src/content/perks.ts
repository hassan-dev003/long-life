/**
 * Perks — opt-in, cross-run modifiers toggled on before a run (Profile.activePerks).
 * They are the *only* cross-run progression (no prestige). Each perk purely
 * modifies the RunConfig. Data from CONTENT_DATA_SPEC §13.
 *
 * M1 ships the earnable subset; lucky/beloved are defined (special-unlock only)
 * so the framework is complete.
 */
import type { PerkId } from '../state/types';
import { baseRunConfig, type RunConfig } from '../config/runConfig';

export interface PerkDef {
  id: PerkId;
  name: string;
  desc: string;
  special?: boolean; // special-unlock only (not awarded by ordinary goals)
  modify: (cfg: RunConfig) => RunConfig;
}

export const PERKS: Record<PerkId, PerkDef> = {
  'trust-fund': {
    id: 'trust-fund',
    name: 'Trust Fund',
    desc: 'Start with an extra $250k.',
    modify: (c) => ({ ...c, startCashBonus: c.startCashBonus + 250_000 }),
  },
  'fast-learner': {
    id: 'fast-learner',
    name: 'Fast Learner',
    desc: 'Education takes 20% fewer weeks.',
    modify: (c) => ({ ...c, studyWeeksMult: c.studyWeeksMult * 0.8 }),
  },
  workaholic: {
    id: 'workaholic',
    name: 'Workaholic',
    desc: 'Every job is 1 point less stressful (health & happiness).',
    modify: (c) => ({ ...c, jobStressDelta: c.jobStressDelta - 1 }),
  },
  'green-thumb': {
    id: 'green-thumb',
    name: 'Green Thumb',
    desc: 'Businesses grow faster.',
    modify: (c) => ({ ...c, businessGrowthMod: c.businessGrowthMod + 0.2 }),
  },
  lucky: {
    id: 'lucky',
    name: 'Lucky',
    desc: 'The event roll leans in your favor.',
    special: true,
    modify: (c) => ({ ...c, eventLuck: c.eventLuck + 0.5 }),
  },
  beloved: {
    id: 'beloved',
    name: 'Beloved',
    desc: 'A happiness passive, and fortune smiles on you.',
    special: true,
    modify: (c) => ({
      ...c,
      happyPassivePerWeek: c.happyPassivePerWeek + 0.5,
      eventLuck: c.eventLuck + 0.25,
    }),
  },
};

/** Build the effective RunConfig for a set of active perks. */
export function buildRunConfig(activePerks: PerkId[]): RunConfig {
  let cfg = baseRunConfig();
  for (const id of activePerks) {
    const perk = PERKS[id];
    if (perk) cfg = perk.modify(cfg);
  }
  return cfg;
}
