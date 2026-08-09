/**
 * Scenarios (CONTENT_DATA_SPEC §12): a starting condition + a headline goal.
 * M1 ships Normal Life; the rest arrive in M5. The goal is non-terminal — meeting
 * it fires a blocking celebration and play continues (GDD §11.2).
 */
import type { CredentialId, GameState, PerkId, ResidenceRef, TraitId } from '../state/types';

export interface ScenarioGoal {
  id: string;
  description: string;
  test: (s: GameState) => boolean;
  reward?: PerkId;
}

export interface ScenarioDef {
  id: string;
  name: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  description: string;
  start: {
    age: number;
    cash: number;
    bank: number;
    credentials: CredentialId[];
    residence: ResidenceRef;
    food: string;
    subscriptions: string[];
    traits: TraitId[];
    flags: string[];
  };
  goal?: ScenarioGoal;
}

export const NORMAL_LIFE: ScenarioDef = {
  id: 'normal-life',
  name: 'Normal Life',
  difficulty: 'normal',
  description:
    'Eighteen, a high-school certificate, and a little parental cash. An ordinary start — make of it what you will.',
  start: {
    age: 18,
    cash: 3_000,
    bank: 0,
    credentials: ['school'],
    residence: { kind: 'rented', tier: 'parents' },
    food: 'basic',
    subscriptions: [],
    traits: [],
    flags: [],
  },
  goal: {
    id: 'first-million',
    description: 'Reach $1,000,000 net worth.',
    test: (s) => s.progress.peakNet >= 1_000_000,
  },
};

export const SCENARIOS: ScenarioDef[] = [NORMAL_LIFE];

export const SCENARIO_BY_ID: Record<string, ScenarioDef> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);
