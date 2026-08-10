/**
 * meets() — evaluates a Requirement against the current run. The single predicate
 * behind career gates, program/job eligibility, and event conditions. Its
 * composability (allOf/anyOf) is what lets every role carry a unique gate.
 *
 * Returns { ok, reason? } — reason is a short, player-facing explanation of the
 * first unmet requirement, for the "what's blocking this" UI.
 */
import { netWorth } from './selectors';
import { hasProfitableBusiness } from './business';
import { SKILLS } from '../content/skills';
import { TRAITS } from '../content/skills';
import { ROLE_BY_ID } from '../content/careers';
import type { GameState, Requirement } from '../state/types';

export interface MeetsResult {
  ok: boolean;
  reason?: string;
}

const OK: MeetsResult = { ok: true };

function credentialLabel(id: string): string {
  if (id.startsWith('degree:')) return `a ${id.slice(7).toUpperCase()} degree`;
  if (id.startsWith('master:')) return `a ${id.slice(7).toUpperCase()} master's`;
  if (id.startsWith('phd:')) return `a ${id.slice(4).toUpperCase()} PhD`;
  return id;
}

export function meets(state: GameState, req?: Requirement): MeetsResult {
  if (!req) return OK;

  switch (req.kind) {
    case 'always':
      return OK;

    case 'credential':
      return state.education.credentials.includes(req.id)
        ? OK
        : { ok: false, reason: `Requires ${credentialLabel(req.id)}` };

    case 'fieldExp': {
      const have = state.career.fieldExp[req.field] ?? 0;
      return have >= req.weeks
        ? OK
        : { ok: false, reason: `Requires ${req.weeks} wks in ${req.field}` };
    }

    case 'roleTenure': {
      const have = state.career.roleId === req.roleId ? state.career.roleTenure : 0;
      const title = ROLE_BY_ID[req.roleId]?.title ?? req.roleId;
      return have >= req.weeks
        ? OK
        : { ok: false, reason: `Requires ${req.weeks} wks as ${title}` };
    }

    case 'skill': {
      const have = state.skills[req.id] ?? 0;
      const name = SKILLS[req.id]?.name ?? req.id;
      return have >= req.min ? OK : { ok: false, reason: `Requires ${name} ${req.min}` };
    }

    case 'trait':
      return state.traits.includes(req.id)
        ? OK
        : { ok: false, reason: `Requires the ${TRAITS[req.id]?.name ?? req.id} trait` };

    case 'achievement':
      return state.progress.runAchievements.includes(req.id)
        ? OK
        : { ok: false, reason: `Requires the achievement "${req.id}"` };

    case 'businessProfit':
      return hasProfitableBusiness(state, req.field)
        ? OK
        : { ok: false, reason: 'Requires a business turning a profit' };

    case 'netWorth':
      return netWorth(state) >= req.min
        ? OK
        : { ok: false, reason: `Requires net worth ≥ ${req.min}` };

    case 'allOf': {
      for (const r of req.reqs) {
        const res = meets(state, r);
        if (!res.ok) return res;
      }
      return OK;
    }

    case 'anyOf': {
      const results = req.reqs.map((r) => meets(state, r));
      if (results.some((r) => r.ok)) return OK;
      return { ok: false, reason: results[0]?.reason ?? 'Requirements not met' };
    }
  }
}

const frac = (have: number, need: number): number =>
  need <= 0 ? 1 : Math.max(0, Math.min(1, have / need));

/**
 * How close the player is to satisfying a requirement, in [0, 1] — drives the
 * promotion progress bar. Composite gates average (allOf) or take the best
 * (anyOf) of their parts; binary requirements are simply 0 or 1.
 */
export function requirementProgress(state: GameState, req?: Requirement): number {
  if (!req) return 1;
  switch (req.kind) {
    case 'always':
      return 1;
    case 'credential':
      return state.education.credentials.includes(req.id) ? 1 : 0;
    case 'fieldExp':
      return frac(state.career.fieldExp[req.field] ?? 0, req.weeks);
    case 'roleTenure':
      return frac(state.career.roleId === req.roleId ? state.career.roleTenure : 0, req.weeks);
    case 'skill':
      return frac(state.skills[req.id] ?? 0, req.min);
    case 'trait':
      return state.traits.includes(req.id) ? 1 : 0;
    case 'achievement':
      return state.progress.runAchievements.includes(req.id) ? 1 : 0;
    case 'businessProfit':
      return hasProfitableBusiness(state, req.field) ? 1 : 0;
    case 'netWorth':
      return frac(netWorth(state), req.min);
    case 'allOf':
      return req.reqs.length === 0
        ? 1
        : req.reqs.reduce((sum, r) => sum + requirementProgress(state, r), 0) / req.reqs.length;
    case 'anyOf':
      return req.reqs.length === 0
        ? 1
        : Math.max(...req.reqs.map((r) => requirementProgress(state, r)));
  }
}
