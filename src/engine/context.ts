/**
 * The context threaded through every tick step: the RNG cursor, the merged run
 * modifiers, and the week's action.
 */
import type { Rng } from './rng';
import type { RunMods } from './economy';
import type { Action } from './actions';

export interface TickCtx {
  rng: Rng;
  mods: RunMods;
  action: Action;
}
