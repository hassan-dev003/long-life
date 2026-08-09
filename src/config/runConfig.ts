/**
 * RunConfig — the per-run base config that perks modify before a run starts.
 * Perks (content/perks.ts) are pure `modify(cfg) => cfg` functions; the engine
 * merges the result with trait effects into the effective modifiers it reads.
 */
export interface RunConfig {
  startCashBonus: number; // added to the scenario's starting cash
  studyWeeksMult: number; // scales education study-weeks
  jobStressDelta: number; // added to each role's h & hp stress (negative = easier)
  businessGrowthMod: number; // additive to business growth (M2)
  eventLuck: number; // >0 skews the event roll positive
  happyPassivePerWeek: number; // flat happiness passive/week
}

export function baseRunConfig(): RunConfig {
  return {
    startCashBonus: 0,
    studyWeeksMult: 1,
    jobStressDelta: 0,
    businessGrowthMod: 0,
    eventLuck: 0,
    happyPassivePerWeek: 0,
  };
}
