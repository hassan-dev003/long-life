/**
 * Golden run — the M1 Definition-of-Done anchor. A seeded, scripted life played
 * end to end through the pure engine: birth → educate → work & get promoted →
 * drink an Elixir → drive on to a natural death. Deterministic given the seed.
 *
 * The economic climb to the Elixir tier would take thousands of in-game years by
 * salary alone, so this harness *grants* cash at two clearly-marked checkpoints to
 * reach the education and Elixir tiers quickly. Everything else — decay, events,
 * promotions, aging, death — runs through the real engine, and the whole run is
 * asserted twice for determinism plus locked with a summary snapshot.
 */
import { describe, it, expect } from 'vitest';
import { freshLife } from '../state/initial';
import { tick } from './tick';
import { work, study, activity } from './actions';
import {
  enroll,
  takeJob,
  buyElixir,
  resolveEvent,
  acknowledgeGoal,
  acknowledgeWarning,
} from './instant';
import { EVENT_BY_ID } from '../content/events';
import { ageYears, netWorth, nextPromotion } from './selectors';
import type { GameState } from '../state/types';
import type { Action } from './actions';

const SEED = 20260806;

/** Handle any blocking modal (goal / choice event) deterministically. Returns the
 *  possibly-updated state and whether it consumed the turn. */
function handleModals(s: GameState): { s: GameState; handled: boolean } {
  if (s.pendingGoal) return { s: acknowledgeGoal(s), handled: true };
  if (s.pendingBankruptcyWarning) return { s: acknowledgeWarning(s), handled: true };
  if (s.pendingEvent) {
    const ev = EVENT_BY_ID[s.pendingEvent.eventId];
    const choiceId = ev?.choices?.[0]?.id ?? '';
    return { s: resolveEvent(s, choiceId), handled: true };
  }
  return { s, handled: false };
}

/** Advance one scripted week: clear any modal first, else take the chosen action. */
function advance(s: GameState, chooseAction: (s: GameState) => Action): GameState {
  const m = handleModals(s);
  if (m.handled) return m.s;
  return tick(m.s, chooseAction(s));
}

/** Survival heuristic: rest when run down, otherwise do the productive action. */
const surviveOr =
  (productive: Action) =>
  (s: GameState): Action =>
    s.stats.health < 45 || s.stats.happiness < 30 ? activity('rest') : productive;

function playLife(seed: number): GameState {
  let s = freshLife('normal-life', [], seed);

  // ── Educate: Diploma → CS Degree (cash granted to cover tuition + stay solvent) ──
  s.money.cash += 500_000; // checkpoint grant #1 (education)
  s = enroll(s, 'diploma').state;
  for (let i = 0; i < 500 && s.education.enrolled && s.status === 'alive'; i++) {
    s = advance(s, surviveOr(study()));
  }
  s = enroll(s, 'degree', 'cs').state;
  for (let i = 0; i < 800 && s.education.enrolled && s.status === 'alive'; i++) {
    s = advance(s, surviveOr(study()));
  }

  // ── Career: enter Tech and work toward the first promotion ──
  s = takeJob(s, 'tech-intern').state;
  for (let i = 0; i < 400 && s.status === 'alive'; i++) {
    // Accept a promotion the moment it's available.
    const promo = nextPromotion(s);
    if (promo && promo.result.ok) {
      s = takeJob(s, promo.role.id).state;
      break;
    }
    s = advance(s, surviveOr(work()));
  }

  // ── Longevity: afford and drink an Elixir (cash granted to the Elixir tier) ──
  s.money.cash += 6_000_000; // checkpoint grant #2 (elixir)
  const elixirRes = buyElixir(s);
  expect(elixirRes.ok).toBe(true);
  s = elixirRes.state;

  // ── The end: stop self-care and let aging run its course to death ──
  for (let i = 0; i < 5000 && s.status === 'alive'; i++) {
    s = advance(s, () => work()); // no rest — pure neglect + decay
  }

  return s;
}

describe('golden run — a full life, deterministically', () => {
  it('is fully reproducible for a fixed seed', () => {
    const a = playLife(SEED);
    const b = playLife(SEED);
    expect(a).toEqual(b);
  });

  it('plays the whole loop: educate, promote, drink an Elixir, then die', () => {
    const s = playLife(SEED);
    expect(s.education.credentials).toContain('degree:cs');
    expect(s.progress.runAchievements).toContain('first-job'); // reached and held a Tech role
    expect(s.elixir.count).toBe(1);
    expect(s.status === 'dead' || s.status === 'breakdown').toBe(true);
  });

  it('matches the locked golden summary', () => {
    const s = playLife(SEED);
    const summary = {
      status: s.status,
      age: ageYears(s),
      totalWeeks: s.clock.totalWeeks,
      elixirCount: s.elixir.count,
      credentials: s.education.credentials,
      role: s.career.roleId,
      health: Math.round(s.stats.health),
      happiness: Math.round(s.stats.happiness),
      netWorth: netWorth(s),
      peakNet: s.progress.peakNet,
      achievements: [...s.progress.runAchievements].sort(),
    };
    expect(summary).toMatchInlineSnapshot(`
      {
        "achievements": [
          "first-elixir",
          "first-job",
          "graduate",
          "millionaire",
          "shipped-a-feature",
          "six-figures",
        ],
        "age": 18,
        "credentials": [
          "school",
          "diploma",
          "degree:cs",
        ],
        "elixirCount": 1,
        "happiness": 0,
        "health": 80,
        "netWorth": 1282490,
        "peakNet": 1310300,
        "role": "tech-junior",
        "status": "breakdown",
        "totalWeeks": 25,
      }
    `);
  });
});
