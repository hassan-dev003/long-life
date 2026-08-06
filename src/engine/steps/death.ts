/**
 * Step 11 — zero-counters and the death/breakdown check (GDD §1.3).
 * Health at 0 for DEATH_GRACE_WEEKS consecutive weeks → death; happiness likewise
 * → breakdown. Hitting 0 is a warning with a grace window, not an instant end.
 */
import { TUNING } from '../../config/tuning';
import { pushLog } from '../../state/mutations';
import type { GameState } from '../../state/types';

export function stepDeath(s: GameState): void {
  if (s.status !== 'alive') return;

  s.stats.weeksAtZeroHealth = s.stats.health <= 0 ? s.stats.weeksAtZeroHealth + 1 : 0;
  s.stats.weeksAtZeroHappy = s.stats.happiness <= 0 ? s.stats.weeksAtZeroHappy + 1 : 0;

  if (s.stats.weeksAtZeroHealth >= TUNING.DEATH_GRACE_WEEKS) {
    s.status = 'dead';
    pushLog(s, 'death', '💀 Your body gave out. This life is over.');
  } else if (s.stats.weeksAtZeroHappy >= TUNING.DEATH_GRACE_WEEKS) {
    s.status = 'breakdown';
    pushLog(s, 'death', '🕯️ Your mind gave out. This life is over.');
  }
}
