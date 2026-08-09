/**
 * Steps 11–12 — the once-per-week settlement, run after all effects (including a
 * resolved choice event). Clamp, death check, peak net worth, goals, achievements.
 * Runs exactly once per week: at the end of a tick, or at event resolution if a
 * choice paused the tick.
 */
import { clampStat } from '../util/clamp';
import { clampMoney } from '../util/money';
import { TUNING } from '../config/tuning';
import { pushLog } from '../state/mutations';
import { netWorth } from './selectors';
import { stepDeath } from './steps/death';
import { ACHIEVEMENTS } from '../content/achievements';
import { SCENARIO_BY_ID } from '../content/scenarios';
import type { GameState, Profile } from '../state/types';

// M1 achievements don't read the Profile; a stub keeps the (s, p) signature honest.
const STUB_PROFILE: Profile = {
  schemaVersion: 1,
  unlockedPerks: [],
  activePerks: [],
  unlockedTraits: [],
  achievements: [],
  unlockedScenarios: [],
  stats: { livesLived: 0, bestNetWorth: 0, oldestAge: 0 },
};

function evaluateAchievements(s: GameState): void {
  for (const ach of ACHIEVEMENTS) {
    if (ach.manual) continue; // granted by engine logic elsewhere
    if (s.progress.runAchievements.includes(ach.id)) continue;
    if (ach.test(s, STUB_PROFILE)) {
      s.progress.runAchievements.push(ach.id);
      pushLog(s, 'milestone', `${ach.emoji} Achievement: ${ach.name}`);
    }
  }
}

function evaluateGoal(s: GameState): void {
  const scenario = SCENARIO_BY_ID[s.meta.scenarioId];
  const goal = scenario?.goal;
  if (!goal) return;
  if (s.progress.goalsMet.includes(goal.id)) return;
  if (goal.test(s)) {
    s.progress.goalsMet.push(goal.id);
    s.pendingGoal = { goalId: goal.id, description: goal.description };
    pushLog(s, 'milestone', `🎉 Goal reached: ${goal.description}`);
  }
}

/**
 * Bankruptcy: cash below zero for consecutive weeks. The first negative week
 * fires a blocking warning; if cash is still negative the next week, the run ends.
 */
function evaluateBankruptcy(s: GameState): void {
  if (s.status !== 'alive') return;

  if (s.money.cash < 0) {
    const wasInDebt = s.money.weeksInDebt > 0;
    s.money.weeksInDebt += 1;

    if (s.money.weeksInDebt >= TUNING.BANKRUPTCY_GRACE_WEEKS) {
      s.status = 'bankrupt';
      s.pendingBankruptcyWarning = false;
      pushLog(s, 'death', '💸 Bankrupt — the debts came due and there was nothing left.');
    } else if (!wasInDebt) {
      // First week in the red — warn the player, once per debt spell.
      s.pendingBankruptcyWarning = true;
      pushLog(
        s,
        'money',
        '⚠️ Your balance is severely low. Get back in the black by next week or you go bankrupt.',
      );
    }
  } else {
    s.money.weeksInDebt = 0;
    s.pendingBankruptcyWarning = false;
  }
}

export function finalize(s: GameState): void {
  // Clamp (helpers already clamp, but settle any direct writes).
  s.stats.health = clampStat(s.stats.health);
  s.stats.happiness = clampStat(s.stats.happiness);
  s.money.cash = clampMoney(s.money.cash);
  s.money.bank = clampMoney(s.money.bank);

  stepDeath(s);
  evaluateBankruptcy(s);

  s.progress.peakNet = Math.max(s.progress.peakNet, netWorth(s));

  evaluateGoal(s);
  evaluateAchievements(s);
}
