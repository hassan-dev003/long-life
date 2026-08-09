/**
 * Step 9 — skill accrual + career-achievement grants.
 *
 * Skills grow by use so every ladder's skill gates are genuinely reachable by
 * working that field: each role carries a `skillGain` map (content/careers.ts),
 * applied here on a working week. A ladder only gates on skills its own roles
 * grow, so no promotion is ever unreachable.
 *
 * The four Tech career-gate achievements are granted here (they're flagged
 * `manual` in the registry), each on a milestone that lands *before* the role
 * that requires it — so every Tech promotion stays reachable and uniquely gated.
 */
import { TUNING } from '../../config/tuning';
import { pushLog } from '../../state/mutations';
import { ACHIEVEMENT_BY_ID } from '../../content/achievements';
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

export function stepSkills(s: GameState, ctx: TickCtx): void {
  if (ctx.action.type === 'WORK') {
    const role = currentRole(s);
    if (role?.skillGain) {
      for (const [id, by] of Object.entries(role.skillGain)) {
        if (by) bump(s, id as SkillId, by);
      }
    }
  }

  // Tech career-gate achievements — monotonic milestones, each earnable before its role.
  const coding = s.skills.coding ?? 0;
  const leadership = s.skills.leadership ?? 0;
  const role = currentRole(s);

  if (coding >= 30) grant(s, 'shipped-a-feature');
  if (coding >= 55) grant(s, 'owned-a-system');
  if (role?.id === 'tech-lead' && s.career.roleTenure >= 48) grant(s, 'managed-a-team');
  if (leadership >= 80 && (s.career.fieldExp.tech ?? 0) >= 240) grant(s, 'shipped-10m-product');
}
