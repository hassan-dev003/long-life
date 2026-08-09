/**
 * Step 10 — the event roll: eligibility → minor-biased severity bucket →
 * weighted pick → apply (outcome) or open a decision (choice). Lucky tilts the
 * roll toward positive outcomes without disabling bad events (GDD §10.2).
 */
import { TUNING } from '../../config/tuning';
import { EVENTS, type EventDef } from '../../content/events';
import type { GameState, Severity } from '../../state/types';
import type { TickCtx } from '../context';

const POSITIVE_EVENTS = new Set(['found-cash', 'llama-inheritance']);
const SEVERITIES: Severity[] = ['minor', 'major', 'catastrophic'];

function severityWeight(sev: Severity, luck: number): number {
  let w = TUNING.SEVERITY_WEIGHTS[sev];
  if (sev === 'catastrophic') w /= 1 + luck;
  if (sev === 'minor') w *= 1 + luck * 0.5;
  return w;
}

function eventWeight(e: EventDef, s: GameState, luck: number): number {
  let w = Math.max(0, e.weight(s));
  if (luck > 0 && POSITIVE_EVENTS.has(e.id)) w *= 1 + luck;
  return w;
}

export function stepEvents(s: GameState, ctx: TickCtx): void {
  const { rng, mods } = ctx;
  const luck = mods.eventLuck;

  const pool = EVENTS.filter((e) => e.eligible(s));
  if (pool.length === 0) return;
  if (!rng.chance(TUNING.WEEKLY_EVENT_CHANCE)) return;

  // Pick a severity bucket that actually has eligible events (minor-biased).
  const available = SEVERITIES.filter((sev) => pool.some((e) => e.severity === sev));
  const severity = rng.weighted(available, (sev) => severityWeight(sev, luck));

  const bucket = pool.filter((e) => e.severity === severity);
  const event = rng.weighted(bucket, (e) => eventWeight(e, s, luck));

  if (event.kind === 'choice') {
    s.pendingEvent = { eventId: event.id };
  } else {
    event.apply?.(s, rng);
  }
}
