/**
 * Careers — field ladders of named roles. Each role's `gate` is its FULL,
 * UNIQUE requirement (no strictly-dominated roles, GDD §4.1). The Tech ladder is
 * fully authored for M1; entry jobs need no education. Data from CONTENT_DATA_SPEC §4.
 */
import type { Field, Requirement } from '../state/types';

export interface RoleDef {
  id: string;
  field: Field;
  title: string;
  salaryPerWeek: number; // fixed for the role; changes only on promotion
  stress: { h: number; hp: number }; // weekly health/happiness cost
  gate: Requirement; // full requirement to hold this role (unique per role)
}

export interface FieldLadder {
  field: Field;
  name: string;
  roles: RoleDef[]; // ordered entry → top
}

const ALWAYS: Requirement = { kind: 'always' };

/** Tech ladder — the M1 reference field. Every gate is a distinct requirement set. */
export const TECH: FieldLadder = {
  field: 'tech',
  name: 'Technology',
  roles: [
    {
      id: 'tech-intern',
      field: 'tech',
      title: 'Intern',
      salaryPerWeek: 1000,
      stress: { h: 0.3, hp: 0.8 },
      gate: { kind: 'credential', id: 'degree:cs' },
    },
    {
      id: 'tech-junior',
      field: 'tech',
      title: 'Junior Developer',
      salaryPerWeek: 2100,
      stress: { h: 0.3, hp: 1.0 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'tech-intern', weeks: 24 },
          { kind: 'skill', id: 'coding', min: 20 },
        ],
      },
    },
    {
      id: 'swe',
      field: 'tech',
      title: 'Software Engineer',
      salaryPerWeek: 3300,
      stress: { h: 0.3, hp: 1.2 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'fieldExp', field: 'tech', weeks: 48 },
          { kind: 'skill', id: 'coding', min: 40 },
          { kind: 'achievement', id: 'shipped-a-feature' },
        ],
      },
    },
    {
      id: 'tech-senior',
      field: 'tech',
      title: 'Senior Engineer',
      salaryPerWeek: 4800,
      stress: { h: 0.3, hp: 1.4 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'fieldExp', field: 'tech', weeks: 96 },
          { kind: 'skill', id: 'coding', min: 65 },
          { kind: 'achievement', id: 'owned-a-system' },
        ],
      },
    },
    {
      id: 'tech-lead',
      field: 'tech',
      title: 'Team Lead',
      salaryPerWeek: 6300,
      stress: { h: 0.4, hp: 1.6 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'credential', id: 'master:cs' },
          { kind: 'skill', id: 'leadership', min: 40 },
          { kind: 'roleTenure', roleId: 'tech-senior', weeks: 24 },
        ],
      },
    },
    {
      id: 'eng-manager',
      field: 'tech',
      title: 'Engineering Manager',
      salaryPerWeek: 8300,
      stress: { h: 0.4, hp: 1.8 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'skill', id: 'leadership', min: 60 },
          { kind: 'skill', id: 'negotiation', min: 40 },
          { kind: 'achievement', id: 'managed-a-team' },
        ],
      },
    },
    {
      id: 'eng-director',
      field: 'tech',
      title: 'Director of Eng',
      salaryPerWeek: 11500,
      stress: { h: 0.5, hp: 2.0 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'fieldExp', field: 'tech', weeks: 192 },
          { kind: 'skill', id: 'leadership', min: 75 },
          { kind: 'skill', id: 'finance', min: 40 },
        ],
      },
    },
    {
      id: 'vp-eng',
      field: 'tech',
      title: 'VP Engineering',
      salaryPerWeek: 16000,
      stress: { h: 0.6, hp: 2.2 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'skill', id: 'leadership', min: 85 },
          { kind: 'achievement', id: 'shipped-10m-product' },
        ],
      },
    },
    {
      id: 'cto',
      field: 'tech',
      title: 'CTO',
      salaryPerWeek: 25000,
      stress: { h: 0.7, hp: 2.4 },
      gate: {
        kind: 'allOf',
        reqs: [
          {
            kind: 'anyOf',
            reqs: [
              { kind: 'credential', id: 'phd:cs' },
              { kind: 'businessProfit', field: 'tech' },
            ],
          },
          { kind: 'skill', id: 'finance', min: 70 },
        ],
      },
    },
  ],
};

/** Entry-tier fallback jobs — no education; always available (the universal fallback). */
export const ENTRY_JOBS: RoleDef[] = [
  { id: 'dishwasher', field: 'service', title: 'Dishwasher', salaryPerWeek: 500, stress: { h: 0.5, hp: 1.0 }, gate: ALWAYS },
  { id: 'cashier', field: 'service', title: 'Retail Cashier', salaryPerWeek: 560, stress: { h: 0.3, hp: 1.1 }, gate: ALWAYS },
  { id: 'packer', field: 'labor', title: 'Warehouse Packer', salaryPerWeek: 640, stress: { h: 1.0, hp: 0.8 }, gate: ALWAYS },
  { id: 'driver', field: 'labor', title: 'Rideshare Driver', salaryPerWeek: 700, stress: { h: 0.6, hp: 0.9 }, gate: ALWAYS },
  { id: 'barista', field: 'service', title: 'Barista', salaryPerWeek: 560, stress: { h: 0.4, hp: 0.8 }, gate: ALWAYS },
];

export const LADDERS: FieldLadder[] = [TECH];

/** Flat map of every role in the game (ladders + entry jobs), keyed by id. */
export const ROLE_BY_ID: Record<string, RoleDef> = (() => {
  const map: Record<string, RoleDef> = {};
  for (const ladder of LADDERS) for (const role of ladder.roles) map[role.id] = role;
  for (const job of ENTRY_JOBS) map[job.id] = job;
  return map;
})();

/** The ladder a role belongs to (undefined for standalone entry jobs). */
export function ladderOfRole(roleId: string): FieldLadder | undefined {
  return LADDERS.find((l) => l.roles.some((r) => r.id === roleId));
}
