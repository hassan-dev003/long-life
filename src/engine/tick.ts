/**
 * The authoritative reducer: tick(state, action) → state. Pure — it clones the
 * state once and threads that draft through the 13-step order (GDD §2: steps 1–3,
 * 5–13; no market/rent step 4 until M3), threading the RNG through
 * state.meta.rngState. One action advances exactly one week.
 *
 * If the event roll opens a *choice*, the tick pauses before finalization: it
 * returns with `pendingEvent` set and the week's settlement (clamp, death check,
 * goals) is deferred to resolveEvent() so the choice's effects are included.
 */
import { Rng } from './rng';
import { computeRunMods } from './economy';
import { finalize } from './finalize';
import { stepInterest } from './steps/interest';
import { stepBusiness } from './steps/business';
import { stepIncome } from './steps/income';
import { stepUpkeep } from './steps/upkeep';
import { stepDecay } from './steps/decay';
import { stepWork } from './steps/work';
import { stepStudy } from './steps/study';
import { stepActivity } from './steps/activity';
import { stepSkills } from './steps/skills';
import { stepEvents } from './events/roll';
import type { Action } from './actions';
import type { TickCtx } from './context';
import type { GameState } from '../state/types';

export function tick(state: GameState, action: Action): GameState {
  // No advancing a finished life, or one waiting on a decision/warning.
  if (state.status !== 'alive') return state;
  if (state.pendingEvent) return state;
  if (state.pendingGoal) return state;
  if (state.pendingBankruptcyWarning) return state;

  const s: GameState = structuredClone(state);
  const rng = new Rng(s.meta.rngState);
  const ctx: TickCtx = { rng, mods: computeRunMods(s), action };

  s.clock.totalWeeks += 1; // 1
  stepInterest(s); // 2
  stepBusiness(s, ctx); // 3  per-business net, growth, morale, attrition
  stepIncome(s, ctx); // 5
  stepUpkeep(s, ctx); // 6
  stepDecay(s, ctx); // 7–8a  passives + decay
  stepWork(s, ctx); // 8b  action effects…
  stepStudy(s, ctx);
  stepActivity(s, ctx);
  stepSkills(s, ctx); // 9
  stepEvents(s, ctx); // 10

  s.meta.rngState = rng.state; // persist the RNG advance

  // 11–13 — deferred if a choice event paused the tick.
  if (!s.pendingEvent) finalize(s);

  return s;
}
