/**
 * Steps 7–8a — residence/lifestyle passives, then age-driven decay (GDD §1.2).
 * Both deltas are computed from the pre-application stats so the cross-penalty
 * reads a consistent snapshot, then applied together.
 */
import { TUNING } from '../../config/tuning';
import { addHealth, addHappy } from '../../state/mutations';
import {
  HOME_TIER_BY_ID,
  FOOD_TIER_BY_ID,
  CLOTHES_TIER_BY_ID,
  SUBSCRIPTION_BY_ID,
} from '../../content/lifestyle';
import { ageYears } from '../selectors';
import type { GameState } from '../../state/types';
import type { TickCtx } from '../context';

export function stepDecay(s: GameState, ctx: TickCtx): void {
  const { health, happiness } = s.stats;

  // ── Passives from residence, food, subscriptions, and perks ──
  let passiveH = 0;
  let passiveHp = ctx.mods.happyPassivePerWeek;

  if (s.lifestyle.residence.kind === 'rented') {
    const tier = HOME_TIER_BY_ID[s.lifestyle.residence.tier];
    if (tier) {
      passiveH += tier.h;
      passiveHp += tier.hp;
    }
  }
  const food = FOOD_TIER_BY_ID[s.lifestyle.food];
  if (food) {
    passiveH += food.h;
    passiveHp += food.hp;
  }
  if (s.lifestyle.clothes) {
    const clothes = CLOTHES_TIER_BY_ID[s.lifestyle.clothes];
    if (clothes) passiveHp += clothes.hp;
  }
  for (const subId of s.lifestyle.subscriptions) {
    const sub = SUBSCRIPTION_BY_ID[subId];
    if (sub?.h) passiveH += sub.h;
    if (sub?.hp) passiveHp += sub.hp;
  }

  // ── Decay ──
  const age = ageYears(s);
  const ageDecay =
    Math.max(0, age - TUNING.AGE_DECAY_START) * TUNING.AGE_DECAY_RATE * ctx.mods.agingMod;

  const healthDecay =
    TUNING.BASE_H_DECAY +
    ageDecay +
    (happiness < TUNING.CROSS_PENALTY_THRESHOLD ? TUNING.CROSS_PENALTY : 0);

  const happyDecay =
    TUNING.BASE_HP_DECAY +
    ctx.mods.happyDecayMod +
    (health < TUNING.CROSS_PENALTY_THRESHOLD ? TUNING.CROSS_PENALTY : 0);

  addHealth(s, passiveH - healthDecay);
  addHappy(s, passiveHp - happyDecay);
}
