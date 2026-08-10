/**
 * Local-first persistence. Autosave the run on every change (debounced), plus the
 * Profile. Versioned + migrated; corruption-safe (a bad parse is backed up, not
 * fatal). TECH-ARCH §8.
 */
import { SCHEMA_VERSION } from './initial';
import { freshProfile } from './profile';
import { ROLE_BY_ID } from '../content/careers';
import type { GameState, Profile } from './types';

export const RUN_KEY = 'longlife.run';
export const PROFILE_KEY = 'longlife.profile';
const RUN_BACKUP_KEY = 'longlife.run.corrupt';
const PROFILE_BACKUP_KEY = 'longlife.profile.corrupt';

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

// ── Migrations ────────────────────────────────────────────────────────────────
// Ordered upgrades keyed by the version they migrate *from*. v1 is current, so the
// map is empty; each future schema bump adds a step and never silently drops a save.
type Migration = (save: Record<string, unknown>) => Record<string, unknown>;
const RUN_MIGRATIONS: Record<number, Migration> = {
  // v1 → v2: add the bankruptcy fields (debt counter + pending warning).
  1: (save) => {
    const money = save.money as Record<string, unknown> | undefined;
    if (money && money.weeksInDebt === undefined) money.weeksInDebt = 0;
    if (save.pendingBankruptcyWarning === undefined) save.pendingBankruptcyWarning = false;
    const meta = save.meta as Record<string, unknown> | undefined;
    if (meta) meta.schemaVersion = 2;
    return save;
  },
  // v2 → v3: per-role tenure + per-field standing (so switching fields no longer
  // wipes your progress). Old `roleTenure` was a single number for the active role;
  // fold it into a { roleId: weeks } map and seed the active field's resume point.
  2: (save) => {
    const career = save.career as Record<string, unknown> | undefined;
    if (career) {
      const roleId = typeof career.roleId === 'string' ? career.roleId : null;
      const oldTenure = typeof career.roleTenure === 'number' ? career.roleTenure : 0;
      if (typeof career.roleTenure !== 'object' || career.roleTenure === null) {
        career.roleTenure = roleId && oldTenure > 0 ? { [roleId]: oldTenure } : {};
      }
      if (typeof career.fieldRole !== 'object' || career.fieldRole === null) {
        const field = roleId ? ROLE_BY_ID[roleId]?.field : undefined;
        career.fieldRole = field && roleId ? { [field]: roleId } : {};
      }
    }
    const meta = save.meta as Record<string, unknown> | undefined;
    if (meta) meta.schemaVersion = 3;
    return save;
  },
};

function migrateRun(raw: Record<string, unknown>): GameState | null {
  let save = raw;
  const version =
    typeof save.meta === 'object' && save.meta !== null
      ? (save.meta as Record<string, unknown>).schemaVersion
      : undefined;
  let v = typeof version === 'number' ? version : 0;

  while (v < SCHEMA_VERSION) {
    const step = RUN_MIGRATIONS[v];
    if (!step) return null; // no path — treat as unloadable rather than corrupt state
    save = step(save);
    v += 1;
  }
  return save as unknown as GameState;
}

// ── Run ─────────────────────────────────────────────────────────────────────—

export function saveRun(state: GameState): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(RUN_KEY, JSON.stringify(state));
  } catch {
    /* quota or serialization failure — ignore (state stays in memory) */
  }
}

export function loadRun(): GameState | null {
  const s = storage();
  if (!s) return null;
  const rawStr = s.getItem(RUN_KEY);
  if (!rawStr) return null;
  try {
    const parsed = JSON.parse(rawStr) as Record<string, unknown>;
    const migrated = migrateRun(parsed);
    if (!migrated) return null;
    return migrated;
  } catch {
    // Corrupt save: keep a backup for diagnosis, surface "no save" rather than crash.
    try {
      s.setItem(RUN_BACKUP_KEY, rawStr);
      s.removeItem(RUN_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function clearRun(): void {
  storage()?.removeItem(RUN_KEY);
}

// ── Profile ─────────────────────────────────────────────────────────────────—

export function saveProfile(profile: Profile): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function loadProfile(): Profile {
  const s = storage();
  if (!s) return freshProfile();
  const rawStr = s.getItem(PROFILE_KEY);
  if (!rawStr) return freshProfile();
  try {
    const parsed = JSON.parse(rawStr) as Profile;
    // Shallow shape guard; a full migration ladder mirrors the run's if needed.
    if (typeof parsed.schemaVersion !== 'number') return freshProfile();
    return { ...freshProfile(), ...parsed };
  } catch {
    try {
      s.setItem(PROFILE_BACKUP_KEY, rawStr);
    } catch {
      /* ignore */
    }
    return freshProfile();
  }
}
