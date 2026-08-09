/**
 * Small pure helpers that mutate a GameState *draft*. The tick clones state once
 * and threads that draft through steps and event apply-functions, which mutate it
 * in place (an Immer-like pattern, without the dependency). Living in state/ means
 * both engine/ and content/ can use them without importing engine.
 */
import { clampMoney } from '../util/money';
import { clampStat } from '../util/clamp';
import { TUNING } from '../config/tuning';
import type { GameState, LogEntry } from './types';

export function addCash(s: GameState, delta: number): void {
  s.money.cash = clampMoney(s.money.cash + delta);
}

export function addBank(s: GameState, delta: number): void {
  s.money.bank = clampMoney(s.money.bank + delta);
}

/** Income: adds to cash and to the lifetime-earned counter (positive deltas only count). */
export function earn(s: GameState, delta: number): void {
  addCash(s, delta);
  if (delta > 0) s.money.lifetimeEarned = clampMoney(s.money.lifetimeEarned + delta);
}

export function addHealth(s: GameState, delta: number): void {
  s.stats.health = clampStat(s.stats.health + delta);
}

export function addHappy(s: GameState, delta: number): void {
  s.stats.happiness = clampStat(s.stats.happiness + delta);
}

/** Append a log line stamped with the current week; the ring buffer is capped here. */
export function pushLog(s: GameState, kind: LogEntry['kind'], text: string): void {
  s.log.push({ week: s.clock.totalWeeks, kind, text });
  if (s.log.length > TUNING.LOG_CAP) s.log.splice(0, s.log.length - TUNING.LOG_CAP);
}
