/**
 * Skills & traits definitions (CONTENT_DATA_SPEC §5). Skills are 0..100, leveled
 * by use (M1 accrues a lightweight subset — see engine/steps/skills.ts). Traits
 * are on/off modifiers set by scenario, events, or Life Courses.
 */
import type { SkillId, TraitId } from '../state/types';

export interface SkillDef {
  id: SkillId;
  name: string;
  desc: string;
}

export interface TraitDef {
  id: TraitId;
  name: string;
  desc: string;
  special?: boolean; // special-unlock only (never purchasable / not in the catalog)
  effects: Partial<{
    agingMod: number; // <1 slows aging
    happyDecayMod: number; // additive to happiness decay
    businessGrowthMod: number;
    priceMod: number; // <1 cheaper purchases/upkeep
    eventLuck: number; // >0 skews the event roll positive
  }>;
}

export const SKILLS: Record<SkillId, SkillDef> = {
  discipline: { id: 'discipline', name: 'Discipline', desc: 'Consistency and focus.' },
  charisma: { id: 'charisma', name: 'Charisma', desc: 'Winning people over.' },
  negotiation: { id: 'negotiation', name: 'Negotiation', desc: 'Getting the better deal.' },
  fitness: { id: 'fitness', name: 'Fitness', desc: 'Physical conditioning.' },
  coding: { id: 'coding', name: 'Coding', desc: 'Engineering craft.' },
  finance: { id: 'finance', name: 'Finance', desc: 'Reading the money.' },
  'market-sense': { id: 'market-sense', name: 'Market Sense', desc: 'Feel for volatility.' },
  'street-smarts': { id: 'street-smarts', name: 'Street Smarts', desc: 'Reading the room.' },
  leadership: { id: 'leadership', name: 'Leadership', desc: 'Directing a team.' },
};

export const TRAITS: Record<TraitId, TraitDef> = {
  hustler: {
    id: 'hustler',
    name: 'Hustler',
    desc: 'Businesses grow faster.',
    effects: { businessGrowthMod: 0.2 },
  },
  'iron-constitution': {
    id: 'iron-constitution',
    name: 'Iron Constitution',
    desc: 'Slower health decay.',
    effects: { agingMod: 0.85 },
  },
  frugality: {
    id: 'frugality',
    name: 'Frugality',
    desc: 'Cheaper purchases and upkeep.',
    effects: { priceMod: 0.9 },
  },
  anxious: {
    id: 'anxious',
    name: 'Anxious',
    desc: 'Faster happiness decay.',
    effects: { happyDecayMod: 0.15 },
  },
  lucky: {
    id: 'lucky',
    name: 'Lucky',
    desc: 'The dice favor you.',
    special: true,
    effects: { eventLuck: 0.5 },
  },
};
