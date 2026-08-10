/**
 * Event registry (CONTENT_DATA_SPEC §11, GDD §10).
 *
 * Events are **decision events only** — each opens a blocking modal that asks the
 * player to make a call. There is no stream of small background outcomes; the tick
 * fires nothing unless it's a choice worth the player's attention. `apply` mutates
 * the tick's draft in place via the state/mutations helpers.
 *
 * `Rng` is imported type-only, so content carries no runtime dependency on engine.
 */
import type { GameState, Severity, TraitId } from '../../state/types';
import type { Rng } from '../../engine/rng';
import { addHealth, addHappy, addCash, pushLog } from '../../state/mutations';
import { SUBSCRIPTION_BY_ID } from '../lifestyle';

export type EventCategory = 'health' | 'finance' | 'career' | 'social' | 'absurd';

export interface EventChoice {
  id: string;
  label: string;
  successOdds?: (s: GameState) => number;
  apply: (s: GameState, rng: Rng) => void;
}

export interface EventDef {
  id: string;
  category: EventCategory;
  severity: Severity;
  eligible: (s: GameState) => boolean;
  weight: (s: GameState) => number;
  kind: 'outcome' | 'choice';
  prompt?: string; // shown in the decision modal for choice events
  apply?: (s: GameState, rng: Rng) => void;
  choices?: EventChoice[];
}

// ── shared eligibility/weight helpers ─────────────────────────────────────────

export function hasInsurance(s: GameState): boolean {
  return s.lifestyle.subscriptions.some((id) => SUBSCRIPTION_BY_ID[id]?.insurance);
}

function hasTrait(s: GameState, t: TraitId): boolean {
  return s.traits.includes(t);
}

// ── the registry (decision events only) ───────────────────────────────────────

export const EVENTS: EventDef[] = [
  {
    id: 'medical-scare',
    category: 'health',
    severity: 'major',
    eligible: () => true,
    // Worse (more likely) without insurance.
    weight: (s) => (hasInsurance(s) ? 0.6 : 1.4),
    kind: 'choice',
    prompt:
      'A worrying symptom sends you to the doctor. They recommend treatment — but it isn’t cheap. Pay up, or tough it out and hope it passes?',
    choices: [
      {
        id: 'treat',
        label: 'Pay for treatment',
        apply: (s) => {
          const bill = hasInsurance(s) ? 1_500 : 6_000;
          addCash(s, -bill);
          addHealth(s, 4);
          pushLog(s, 'health', `Medical scare — you paid for treatment and recovered.`);
        },
      },
      {
        id: 'gamble',
        label: 'Tough it out',
        // Better odds with insurance and higher current health.
        successOdds: (s) => Math.min(0.9, 0.35 + (hasInsurance(s) ? 0.2 : 0) + s.stats.health / 300),
        apply: (s, rng) => {
          const odds = Math.min(0.9, 0.35 + (hasInsurance(s) ? 0.2 : 0) + s.stats.health / 300);
          if (rng.chance(odds)) {
            addHappy(s, 3);
            pushLog(s, 'health', 'Medical scare — you toughed it out and it passed. Whew.');
          } else {
            addHealth(s, -22);
            addHappy(s, -6);
            pushLog(s, 'health', 'Medical scare — it got worse before it got better.');
          }
        },
      },
    ],
  },
  {
    id: 'serious-illness',
    category: 'health',
    severity: 'catastrophic',
    eligible: () => true,
    weight: (s) => (hasTrait(s, 'iron-constitution') ? 0.5 : 1),
    kind: 'choice',
    prompt:
      'A serious illness strikes. The best care would cost a fortune — but enduring it on your own could be devastating.',
    choices: [
      {
        id: 'pay',
        label: 'Pay for the best care',
        apply: (s) => {
          const bill = hasInsurance(s) ? 18_000 : 60_000;
          addCash(s, -bill);
          addHealth(s, -6);
          pushLog(s, 'health', 'Serious illness — expensive care pulled you through.');
        },
      },
      {
        id: 'endure',
        label: 'Endure it',
        apply: (s) => {
          addHealth(s, -40);
          addHappy(s, -10);
          pushLog(s, 'health', 'Serious illness — you endured it, but it took a heavy toll.');
        },
      },
    ],
  },
];

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);
