/**
 * Achievements (CONTENT_DATA_SPEC §14). Passive badges. Most are evaluated each
 * tick via `test(state, profile)`. The four career-gate achievements are `manual`:
 * the skills step grants them on milestone conditions, so the generic evaluator
 * skips them (they still appear here for UI + gate resolution).
 */
import { TUNING } from '../config/tuning';
import type { GameState, Profile } from '../state/types';

export interface AchievementDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  manual?: boolean; // granted by engine logic, not by test()
  test: (s: GameState, p: Profile) => boolean;
}

const ageYears = (s: GameState): number =>
  s.meta.startAge + Math.floor(s.clock.totalWeeks / TUNING.WEEKS_PER_YEAR);

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-job', name: 'First Paycheck', emoji: '💼', desc: 'Land your first job.', test: (s) => s.career.roleId !== null },
  {
    id: 'graduate',
    name: 'Graduate',
    emoji: '🎓',
    desc: 'Earn a Bachelor’s degree.',
    test: (s) => s.education.credentials.some((c) => c.startsWith('degree:')),
  },
  {
    id: 'phd',
    name: 'Doctor',
    emoji: '👨‍🔬',
    desc: 'Earn a PhD.',
    test: (s) => s.education.credentials.some((c) => c.startsWith('phd:')),
  },
  {
    id: 'homeowner',
    name: 'Homeowner',
    emoji: '🏡',
    desc: 'Own the home you live in.',
    test: (s) => s.lifestyle.residence.kind === 'owned',
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    emoji: '🏪',
    desc: 'Open your first business.',
    test: (s) => s.businesses.length >= 1,
  },
  {
    id: 'mogul',
    name: 'Mogul',
    emoji: '🏢',
    desc: 'Run three businesses at once.',
    test: (s) => s.businesses.length >= 3,
  },
  { id: 'six-figures', name: 'Six Figures', emoji: '💵', desc: 'Reach $100k net worth.', test: (s) => s.progress.peakNet >= 100_000 },
  { id: 'millionaire', name: 'Millionaire', emoji: '💰', desc: 'Reach $1M net worth.', test: (s) => s.progress.peakNet >= 1_000_000 },
  { id: 'deca', name: 'Deca-Millionaire', emoji: '🤑', desc: 'Reach $10M net worth.', test: (s) => s.progress.peakNet >= 10_000_000 },
  { id: 'billionaire', name: 'Billionaire', emoji: '🏦', desc: 'Reach $1B net worth.', test: (s) => s.progress.peakNet >= 1_000_000_000 },
  { id: 'trillionaire', name: 'Trillionaire', emoji: '🌍', desc: 'Reach $1T net worth.', test: (s) => s.progress.peakNet >= 1_000_000_000_000 },
  { id: 'first-elixir', name: 'Cheating Death', emoji: '⏳', desc: 'Drink your first Elixir.', test: (s) => s.elixir.count >= 1 },
  { id: 'ageless', name: 'Ageless', emoji: '♾️', desc: 'Drink 5 Elixirs.', test: (s) => s.elixir.count >= 5 },
  { id: 'centenarian', name: 'Centenarian', emoji: '🎂', desc: 'Live to 100.', test: (s) => ageYears(s) >= 100 },
  { id: 'methuselah', name: 'Methuselah', emoji: '🕰️', desc: 'Live to 150.', test: (s) => ageYears(s) >= 150 },
  {
    id: 'zen',
    name: 'Zen',
    emoji: '🧘',
    desc: 'Health and happiness both at 100.',
    test: (s) => s.stats.health >= 100 && s.stats.happiness >= 100,
  },

  // Career-gate achievements — granted by engine/steps/skills.ts (manual).
  { id: 'shipped-a-feature', name: 'Shipped a Feature', emoji: '🚀', desc: 'Ship your first feature.', manual: true, test: () => false },
  { id: 'owned-a-system', name: 'Owned a System', emoji: '🛠️', desc: 'Take ownership of a system.', manual: true, test: () => false },
  { id: 'managed-a-team', name: 'Managed a Team', emoji: '👥', desc: 'Manage a team for a year.', manual: true, test: () => false },
  { id: 'shipped-10m-product', name: 'Shipped a $10M Product', emoji: '📦', desc: 'Ship a product worth $10M.', manual: true, test: () => false },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);
