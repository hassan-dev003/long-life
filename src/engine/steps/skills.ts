/**
 * Step 9 — lightweight skill accrual + career-achievement grants (M1).
 *
 * Skills grow by use so the finalized Tech ladder's skill/achievement gates are
 * genuinely reachable without the full M4 skills system. The four career-gate
 * achievements are granted here (they're flagged `manual` in the registry), each
 * on a milestone that is monotonic and lands *before* the role that requires it —
 * so every promotion stays reachable and uniquely gated.
 */
import { TUNING } from '../../config/tuning';
import { pushLog } from '../../state/mutations';
import { ACHIEVEMENT_BY_ID } from '../../content/achievements';
import { TECH } from '../../content/careers';
import { currentRole } from '../selectors';
import type { GameState, SkillId } from '../../state/types';
import type { TickCtx } from '../context';

const clampSkill = (n: number) => Math.min(TUNING.SKILL_MAX, n);

function bump(s: GameState, id: SkillId, by: number): void {
  s.skills[id] = clampSkill((s.skills[id] ?? 0) + by);
}

function grant(s: GameState, achId: string): void {
  if (s.progress.runAchievements.includes(achId)) return;
  s.progress.runAchievements.push(achId);
  const def = ACHIEVEMENT_BY_ID[achId];
  pushLog(s, 'milestone', `${def?.emoji ?? '🏆'} Achievement: ${def?.name ?? achId}`);
}

/** Index of a role within the Tech ladder, or -1 if not a Tech-ladder role. */
function techIndex(roleId: string | null): number {
  if (!roleId) return -1;
  return TECH.roles.findIndex((r) => r.id === roleId);
}

const LEAD_IDX = TECH.roles.findIndex((r) => r.id === 'tech-lead');
const SENIOR_IDX = TECH.roles.findIndex((r) => r.id === 'tech-senior');
const MANAGER_IDX = TECH.roles.findIndex((r) => r.id === 'eng-manager');

export function stepSkills(s: GameState, ctx: TickCtx): void {
  if (ctx.action.type === 'WORK') {
    const role = currentRole(s);
    if (role?.field === 'tech') {
      const idx = techIndex(role.id);
      bump(s, 'coding', TUNING.CODING_PER_WORK_WEEK);
      if (idx >= SENIOR_IDX) bump(s, 'finance', TUNING.FINANCE_PER_SENIOR_WEEK);
      if (idx >= LEAD_IDX) bump(s, 'leadership', TUNING.LEADERSHIP_PER_LEAD_WEEK);
      if (idx >= MANAGER_IDX) bump(s, 'negotiation', TUNING.NEGOTIATION_PER_MGMT_WEEK);
    }
  }

  // Career-gate achievements — monotonic milestones, each earnable before its role.
  const coding = s.skills.coding ?? 0;
  const leadership = s.skills.leadership ?? 0;
  const role = currentRole(s);

  if (coding >= 30) grant(s, 'shipped-a-feature');
  if (coding >= 55) grant(s, 'owned-a-system');
  if (role?.id === 'tech-lead' && s.career.roleTenure >= 48) grant(s, 'managed-a-team');
  if (leadership >= 80 && (s.career.fieldExp.tech ?? 0) >= 240) grant(s, 'shipped-10m-product');
}
