/**
 * Step 8b (STUDY) — advance the active enrollment one week; graduate on completion.
 * Study weeks were already scaled by the run's studyWeeksMult at enroll time.
 */
import { addHappy, pushLog } from '../../state/mutations';
import { TUNING } from '../../config/tuning';
import { ALL_PROGRAMS } from '../../content/education';
import type { CredentialId, GameState } from '../../state/types';
import type { TickCtx } from '../context';

function programName(id: CredentialId): string {
  // 'degree:cs' → base 'degree'
  const base = id.split(':')[0];
  return ALL_PROGRAMS.find((p) => p.id === base || p.id === id)?.name ?? id;
}

export function stepStudy(s: GameState, ctx: TickCtx): void {
  if (ctx.action.type !== 'STUDY') return;
  const enrolled = s.education.enrolled;
  if (!enrolled) return;

  enrolled.progress += 1;
  addHappy(s, -TUNING.STUDY_HAPPY_COST);

  if (enrolled.progress >= enrolled.weeks) {
    if (!s.education.credentials.includes(enrolled.id)) {
      s.education.credentials.push(enrolled.id);
    }
    s.education.enrolled = null;
    pushLog(s, 'milestone', `🎓 Graduated: ${programName(enrolled.id)}.`);
  }
}
