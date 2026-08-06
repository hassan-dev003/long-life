/**
 * The Action union — one action advances exactly one week through `tick`
 * (RESOLVE_EVENT is instant; see engine/instant.ts). Instant transactions
 * (enroll, take job, deposit, buy elixir…) are separate updaters, not actions.
 */
export type Action =
  | { type: 'WORK' }
  | { type: 'STUDY' }
  | { type: 'ACTIVITY'; id: string };

export const work = (): Action => ({ type: 'WORK' });
export const study = (): Action => ({ type: 'STUDY' });
export const activity = (id: string): Action => ({ type: 'ACTIVITY', id });
