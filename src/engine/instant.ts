/**
 * Instant transactions — mutate state without advancing the clock or consuming
 * the RNG (except RESOLVE_EVENT, whose gamble draws from it). Plain pure updaters,
 * separate from `tick` (TECH-ARCH §5.3). Each returns a new GameState; invalid
 * requests return the state unchanged (callers gate on the eligibility helpers).
 */
import { clampStat } from '../util/clamp';
import { TUNING } from '../config/tuning';
import { Rng } from './rng';
import { meets } from './eligibility';
import { nextElixirPrice } from './economy';
import { buildRunConfig } from '../content/perks';
import { finalize } from './finalize';
import { pushLog } from '../state/mutations';
import { moneyShort, clampMoney } from '../util/money';
import { ALL_PROGRAMS, type EducationProgram } from '../content/education';
import { ROLE_BY_ID } from '../content/careers';
import { EVENT_BY_ID } from '../content/events';
import { SUBSCRIPTION_BY_ID } from '../content/lifestyle';
import type { CredentialId, GameState, Major, Requirement } from '../state/types';

const clone = (s: GameState): GameState => structuredClone(s);

/**
 * Purchases are paid from cash-in-hand only — bank savings are a separate vault
 * you must withdraw from first. (The opt-in "pay upkeep from bank" automation is
 * the only path that touches the bank for costs, and only for recurring upkeep.)
 */
function pay(s: GameState, amount: number): void {
  s.money.cash = clampMoney(s.money.cash - amount);
}

const affordable = (s: GameState, amount: number): boolean => s.money.cash >= amount;

// ── Education ─────────────────────────────────────────────────────────────────

/** Compose the target credential for a program + optional major. */
export function targetCredential(program: EducationProgram, major?: Major): CredentialId {
  if (program.grantsMajorChoice && major) {
    return `${program.id}:${major}` as CredentialId;
  }
  return program.id as CredentialId;
}

/** The full prerequisite for a program, including major-matched spine steps. */
function enrollmentReq(program: EducationProgram, major?: Major): Requirement | undefined {
  if (program.id === 'master' && major) return { kind: 'credential', id: `degree:${major}` };
  if (program.id === 'phd' && major) return { kind: 'credential', id: `master:${major}` };
  return program.req;
}

export interface EnrollResult {
  state: GameState;
  ok: boolean;
  reason?: string;
}

export function enroll(state: GameState, programId: string, major?: Major): EnrollResult {
  const program = ALL_PROGRAMS.find((p) => p.id === programId);
  if (!program) return { state, ok: false, reason: 'Unknown program' };
  if (state.education.enrolled) return { state, ok: false, reason: 'Already enrolled in a program' };
  if (program.grantsMajorChoice && !major) return { state, ok: false, reason: 'Choose a major' };

  const credId = targetCredential(program, major);
  if (state.education.credentials.includes(credId)) {
    return { state, ok: false, reason: 'Already earned' };
  }

  const req = enrollmentReq(program, major);
  const gate = meets(state, req);
  if (!gate.ok) return { state, ok: false, reason: gate.reason };

  if (!affordable(state, program.cost)) return { state, ok: false, reason: 'Can’t afford tuition' };

  const s = clone(state);
  pay(s, program.cost);
  const mult = buildRunConfig(s.meta.activePerks).studyWeeksMult;
  const weeks = Math.max(1, Math.ceil(program.weeks * mult));
  s.education.enrolled = { id: credId, progress: 0, weeks };
  pushLog(s, 'info', `Enrolled in ${program.name} (−${moneyShort(program.cost)}).`);
  return { state: s, ok: true };
}

// ── Careers ───────────────────────────────────────────────────────────────────

export interface JobResult {
  state: GameState;
  ok: boolean;
  reason?: string;
}

export function takeJob(state: GameState, roleId: string): JobResult {
  const role = ROLE_BY_ID[roleId];
  if (!role) return { state, ok: false, reason: 'Unknown role' };
  if (state.career.roleId === roleId) return { state, ok: false, reason: 'Already in this role' };

  const gate = meets(state, role.gate);
  if (!gate.ok) return { state, ok: false, reason: gate.reason };

  const s = clone(state);
  const isPromotion = !!s.career.roleId;
  s.career.roleId = roleId;
  s.career.roleTenure = 0;
  pushLog(
    s,
    'career',
    `${isPromotion ? 'Promoted to' : 'Took a job as'} ${role.title} (${moneyShort(role.salaryPerWeek)}/wk).`,
  );
  return { state: s, ok: true };
}

export function quitJob(state: GameState): GameState {
  if (!state.career.roleId) return state;
  const s = clone(state);
  s.career.roleId = null;
  s.career.roleTenure = 0;
  pushLog(s, 'career', 'You quit your job.');
  return s;
}

// ── Bank ──────────────────────────────────────────────────────────────────────

export function deposit(state: GameState, amount: number): GameState {
  const move = Math.min(Math.max(0, Math.floor(amount)), Math.max(0, state.money.cash));
  if (move <= 0) return state;
  const s = clone(state);
  s.money.cash = clampMoney(s.money.cash - move);
  s.money.bank = clampMoney(s.money.bank + move);
  return s;
}

export function withdraw(state: GameState, amount: number): GameState {
  const move = Math.min(Math.max(0, Math.floor(amount)), Math.max(0, state.money.bank));
  if (move <= 0) return state;
  const s = clone(state);
  s.money.bank = clampMoney(s.money.bank - move);
  s.money.cash = clampMoney(s.money.cash + move);
  return s;
}

export function setBanking(
  state: GameState,
  patch: Partial<GameState['banking']>,
): GameState {
  const s = clone(state);
  s.banking = { ...s.banking, ...patch };
  return s;
}

// ── Elixir ────────────────────────────────────────────────────────────────────

export interface ElixirResult {
  state: GameState;
  ok: boolean;
  reason?: string;
}

export function buyElixir(state: GameState): ElixirResult {
  if (state.status !== 'alive') return { state, ok: false, reason: 'Not alive' };
  if (!affordable(state, state.elixir.price)) {
    return { state, ok: false, reason: 'Can’t afford the Elixir' };
  }
  const s = clone(state);
  pay(s, s.elixir.price);
  s.clock.totalWeeks = Math.max(0, s.clock.totalWeeks - TUNING.ELIXIR_REWIND_WEEKS);
  s.stats.health = clampStat(s.stats.health + TUNING.ELIXIR_HEAL);
  s.stats.weeksAtZeroHealth = 0;
  s.stats.weeksAtZeroHappy = 0;
  s.elixir.count += 1;
  const drankPrice = s.elixir.price;
  s.elixir.price = nextElixirPrice(s.elixir.price);
  pushLog(
    s,
    'milestone',
    `⏳ Drank an Elixir (−${moneyShort(drankPrice)}). The clock turns back ten years.`,
  );
  return { state: s, ok: true };
}

// ── Lifestyle ─────────────────────────────────────────────────────────────────

export function setResidenceTier(state: GameState, tier: string): GameState {
  const s = clone(state);
  s.lifestyle.residence = { kind: 'rented', tier };
  return s;
}

export function setFood(state: GameState, foodId: string): GameState {
  const s = clone(state);
  s.lifestyle.food = foodId;
  return s;
}

/** Toggle a subscription. Adding charges its one-time signup cost from cash. */
export function toggleSubscription(state: GameState, subId: string): GameState {
  const sub = SUBSCRIPTION_BY_ID[subId];
  if (!sub) return state;
  const isActive = state.lifestyle.subscriptions.includes(subId);
  // Can't sign up for something you can't cover in cash.
  if (!isActive && sub.cost > 0 && !affordable(state, sub.cost)) return state;

  const s = clone(state);
  if (isActive) {
    s.lifestyle.subscriptions.splice(s.lifestyle.subscriptions.indexOf(subId), 1);
    pushLog(s, 'info', `Cancelled ${sub.name}.`);
  } else {
    if (sub.cost > 0) pay(s, sub.cost);
    s.lifestyle.subscriptions.push(subId);
    pushLog(s, 'info', `Subscribed to ${sub.name}${sub.cost ? ` (−${moneyShort(sub.cost)})` : ''}.`);
  }
  return s;
}

// ── Events & goals ──────────────────────────────────────────────────────────────

/** Resolve the pending choice event by applying the chosen option, then settle the week. */
export function resolveEvent(state: GameState, choiceId: string): GameState {
  if (!state.pendingEvent) return state;
  const event = EVENT_BY_ID[state.pendingEvent.eventId];
  const choice = event?.choices?.find((c) => c.id === choiceId);
  if (!event || !choice) return state;

  const s = clone(state);
  const rng = new Rng(s.meta.rngState);
  choice.apply(s, rng);
  s.meta.rngState = rng.state;
  s.pendingEvent = null;
  finalize(s); // the deferred once-per-week settlement now includes the choice's effects
  return s;
}

export function acknowledgeGoal(state: GameState): GameState {
  if (!state.pendingGoal) return state;
  const s = clone(state);
  s.pendingGoal = null;
  return s;
}
