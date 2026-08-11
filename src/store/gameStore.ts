/**
 * The single Zustand store: holds GameState + Profile, exposes typed action
 * methods that run the pure engine (tick / instant updaters) and then commit —
 * syncing the Profile and autosaving (debounced). Components subscribe to slices
 * via selector hooks so a change re-renders only what depends on it.
 */
import { create } from 'zustand';
import { tick } from '../engine/tick';
import {
  enroll,
  takeJob,
  quitJob,
  deposit,
  withdraw,
  setBanking,
  buyElixir,
  setResidenceTier,
  setFood,
  setClothes,
  toggleSubscription,
  buyBusiness,
  hireStaff,
  layoffStaff,
  openBranch,
  setBusinessWage,
  sellBusiness,
  resolveEvent,
  acknowledgeGoal,
  acknowledgeWarning,
} from '../engine/instant';
import type { Action } from '../engine/actions';
import { ageYears } from '../engine/selectors';
import { freshLife } from '../state/initial';
import { absorbRun } from '../state/profile';
import {
  loadRun,
  saveRun,
  loadProfile,
  saveProfile,
  clearRun,
} from '../state/persistence';
import { SCENARIO_BY_ID } from '../content/scenarios';
import type { GameState, Major, PerkId, Profile } from '../state/types';

export type TabId =
  | 'live'
  | 'work'
  | 'learn'
  | 'business'
  | 'bank'
  | 'finances'
  | 'lifestyle'
  | 'legacy';

interface GameStore {
  game: GameState | null;
  profile: Profile;
  tab: TabId;

  // lifecycle
  newGame: (scenarioId: string) => void;
  endRunToMenu: () => void;
  setTab: (tab: TabId) => void;
  togglePerk: (perkId: PerkId) => void;

  // week-advancing
  advance: (action: Action) => void;

  // instant transactions
  enrollProgram: (programId: string, major?: Major) => void;
  applyForJob: (roleId: string) => void;
  resign: () => void;
  bankDeposit: (amount: number) => void;
  bankWithdraw: (amount: number) => void;
  updateBanking: (patch: Partial<GameState['banking']>) => void;
  purchaseElixir: () => void;
  chooseResidence: (tier: string) => void;
  chooseFood: (foodId: string) => void;
  chooseClothes: (clothesId: string) => void;
  toggleSub: (subId: string) => void;
  openBusiness: (defId: string) => void;
  hireBiz: (bizId: string) => void;
  layoffBiz: (bizId: string) => void;
  openBizBranch: (bizId: string) => void;
  setBizWage: (bizId: string, wage: number) => void;
  sellBiz: (bizId: string) => void;
  chooseEvent: (choiceId: string) => void;
  ackGoal: () => void;
  ackWarning: () => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  /** Commit a new run state: sync the Profile, persist both, update the store.
   *  Saves are synchronous — the game is turn-based (a few writes/second at most),
   *  so nothing is ever lost on a refresh (success criterion: closing loses nothing). */
  function commit(next: GameState): void {
    const prevProfile = get().profile;
    const profile = absorbRun(prevProfile, next, ageYears(next));
    if (profile !== prevProfile) saveProfile(profile);
    saveRun(next);
    set({ game: next, profile });
  }

  return {
    game: loadRun(),
    profile: loadProfile(),
    tab: 'live',

    newGame(scenarioId) {
      const profile = get().profile;
      const game = freshLife(scenarioId, profile.activePerks);
      const nextProfile: Profile = {
        ...profile,
        stats: { ...profile.stats, livesLived: profile.stats.livesLived + 1 },
      };
      saveProfile(nextProfile);
      saveRun(game);
      set({ game, profile: nextProfile, tab: 'live' });
    },

    endRunToMenu() {
      clearRun();
      set({ game: null });
    },

    setTab(tab) {
      set({ tab });
    },

    togglePerk(perkId) {
      const p = get().profile;
      // Only toggle perks the account has actually unlocked.
      if (!p.unlockedPerks.includes(perkId)) return;
      const active = p.activePerks.includes(perkId)
        ? p.activePerks.filter((id) => id !== perkId)
        : [...p.activePerks, perkId];
      const next = { ...p, activePerks: active };
      saveProfile(next);
      set({ profile: next });
    },

    advance(action) {
      const game = get().game;
      if (!game) return;
      commit(tick(game, action));
    },

    enrollProgram(programId, major) {
      const game = get().game;
      if (!game) return;
      commit(enroll(game, programId, major).state);
    },

    applyForJob(roleId) {
      const game = get().game;
      if (!game) return;
      commit(takeJob(game, roleId).state);
    },

    resign() {
      const game = get().game;
      if (!game) return;
      commit(quitJob(game));
    },

    bankDeposit(amount) {
      const game = get().game;
      if (!game) return;
      commit(deposit(game, amount));
    },

    bankWithdraw(amount) {
      const game = get().game;
      if (!game) return;
      commit(withdraw(game, amount));
    },

    updateBanking(patch) {
      const game = get().game;
      if (!game) return;
      commit(setBanking(game, patch));
    },

    purchaseElixir() {
      const game = get().game;
      if (!game) return;
      commit(buyElixir(game).state);
    },

    chooseResidence(tier) {
      const game = get().game;
      if (!game) return;
      commit(setResidenceTier(game, tier));
    },

    chooseFood(foodId) {
      const game = get().game;
      if (!game) return;
      commit(setFood(game, foodId));
    },

    chooseClothes(clothesId) {
      const game = get().game;
      if (!game) return;
      commit(setClothes(game, clothesId));
    },

    toggleSub(subId) {
      const game = get().game;
      if (!game) return;
      commit(toggleSubscription(game, subId));
    },

    openBusiness(defId) {
      const game = get().game;
      if (!game) return;
      commit(buyBusiness(game, defId));
    },

    hireBiz(bizId) {
      const game = get().game;
      if (!game) return;
      commit(hireStaff(game, bizId));
    },

    layoffBiz(bizId) {
      const game = get().game;
      if (!game) return;
      commit(layoffStaff(game, bizId));
    },

    openBizBranch(bizId) {
      const game = get().game;
      if (!game) return;
      commit(openBranch(game, bizId));
    },

    setBizWage(bizId, wage) {
      const game = get().game;
      if (!game) return;
      commit(setBusinessWage(game, bizId, wage));
    },

    sellBiz(bizId) {
      const game = get().game;
      if (!game) return;
      commit(sellBusiness(game, bizId));
    },

    chooseEvent(choiceId) {
      const game = get().game;
      if (!game) return;
      commit(resolveEvent(game, choiceId));
    },

    ackGoal() {
      const game = get().game;
      if (!game || !game.pendingGoal) return;
      const goalId = game.pendingGoal.goalId;
      const acked = acknowledgeGoal(game);

      // A goal may award a perk — unlock it on the account.
      const scenario = SCENARIO_BY_ID[game.meta.scenarioId];
      const reward = scenario?.goal?.reward;
      if (reward && scenario?.goal?.id === goalId) {
        const p = get().profile;
        if (!p.unlockedPerks.includes(reward)) {
          const next = { ...p, unlockedPerks: [...p.unlockedPerks, reward] };
          saveProfile(next);
          set({ profile: next });
        }
      }
      commit(acked);
    },

    ackWarning() {
      const game = get().game;
      if (!game) return;
      commit(acknowledgeWarning(game));
    },
  };
});
