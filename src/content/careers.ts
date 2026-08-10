/**
 * Careers — field ladders of named roles. Each role's `gate` is its FULL,
 * UNIQUE requirement (no strictly-dominated roles, GDD §4.1): a higher role always
 * demands something the one below does not. Every professional ladder is entered
 * through a strict education lock; entry jobs need none. Data from CONTENT_DATA_SPEC §4.
 *
 * `skillGain` is the per-role weekly skill accrual applied by engine/steps/skills.ts
 * when the player works. A ladder only ever gates on skills its own roles grow, so
 * every promotion is reachable by working that field.
 */
import { TUNING } from '../config/tuning';
import type { CredentialId, Field, Major, Requirement, SkillId } from '../state/types';

export interface RoleDef {
  id: string;
  field: Field;
  title: string;
  salaryPerWeek: number; // fixed for the role; changes only on promotion
  stress: { h: number; hp: number }; // weekly health/happiness cost
  gate: Requirement; // full requirement to hold this role (unique per role)
  skillGain?: Partial<Record<SkillId, number>>; // weekly skill accrual while working
}

export interface FieldLadder {
  field: Field;
  name: string;
  roles: RoleDef[]; // ordered entry → top
}

const ALWAYS: Requirement = { kind: 'always' };

// Weekly skill-accrual rates (from tuning). P = a field's core skill; S = a supporting one.
const P = TUNING.SKILL_PRIMARY_PER_WEEK;
const S = TUNING.SKILL_SECONDARY_PER_WEEK;

// Tech keeps its own rates so the M1 ladder's accrual is byte-identical.
const C = TUNING.CODING_PER_WORK_WEEK;
const FN = TUNING.FINANCE_PER_SENIOR_WEEK;
const LD = TUNING.LEADERSHIP_PER_LEAD_WEEK;
const NG = TUNING.NEGOTIATION_PER_MGMT_WEEK;

const ALL_MAJORS: Major[] = [
  'cs',
  'law',
  'business',
  'medicine',
  'engineering',
  'arts',
  'science',
  'education',
];

/** "Any PhD" — academia's field-entry lock (accepts a doctorate in any major). */
const ANY_PHD: Requirement = {
  kind: 'anyOf',
  reqs: ALL_MAJORS.map((m) => ({ kind: 'credential', id: `phd:${m}` as CredentialId })),
};

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
      skillGain: { coding: C },
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
      skillGain: { coding: C },
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
          { kind: 'roleTenure', roleId: 'tech-junior', weeks: 36 },
          { kind: 'skill', id: 'coding', min: 40 },
          { kind: 'achievement', id: 'shipped-a-feature' },
        ],
      },
      skillGain: { coding: C },
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
          { kind: 'roleTenure', roleId: 'swe', weeks: 48 },
          { kind: 'skill', id: 'coding', min: 65 },
          { kind: 'achievement', id: 'owned-a-system' },
        ],
      },
      skillGain: { coding: C, finance: FN },
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
      skillGain: { coding: C, finance: FN, leadership: LD },
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
      skillGain: { coding: C, finance: FN, leadership: LD, negotiation: NG },
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
          { kind: 'roleTenure', roleId: 'eng-manager', weeks: 72 },
          { kind: 'skill', id: 'leadership', min: 75 },
          { kind: 'skill', id: 'finance', min: 40 },
        ],
      },
      skillGain: { coding: C, finance: FN, leadership: LD, negotiation: NG },
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
      skillGain: { coding: C, finance: FN, leadership: LD, negotiation: NG },
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
      skillGain: { coding: C, finance: FN, leadership: LD, negotiation: NG },
    },
  ],
};

/** Medical — entered with a medical license (Med School, which implies a medicine degree). */
export const MEDICAL: FieldLadder = {
  field: 'medical',
  name: 'Medicine',
  roles: [
    {
      id: 'med-resident',
      field: 'medical',
      title: 'Resident',
      salaryPerWeek: 1800,
      stress: { h: 0.6, hp: 1.6 },
      gate: { kind: 'credential', id: 'med-school' },
      skillGain: { discipline: P },
    },
    {
      id: 'physician',
      field: 'medical',
      title: 'Physician',
      salaryPerWeek: 4800,
      stress: { h: 0.5, hp: 1.6 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'med-resident', weeks: 96 },
          { kind: 'skill', id: 'discipline', min: 30 },
        ],
      },
      skillGain: { discipline: P },
    },
    {
      id: 'hospitalist',
      field: 'medical',
      title: 'Hospitalist',
      salaryPerWeek: 7200,
      stress: { h: 0.5, hp: 1.8 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'physician', weeks: 60 },
          { kind: 'skill', id: 'discipline', min: 50 },
        ],
      },
      skillGain: { discipline: P, finance: S },
    },
    {
      id: 'specialist',
      field: 'medical',
      title: 'Specialist',
      salaryPerWeek: 10500,
      stress: { h: 0.5, hp: 2.0 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'credential', id: 'master:medicine' },
          { kind: 'roleTenure', roleId: 'hospitalist', weeks: 72 },
          { kind: 'skill', id: 'discipline', min: 65 },
        ],
      },
      skillGain: { discipline: P, finance: S },
    },
    {
      id: 'chief-medicine',
      field: 'medical',
      title: 'Chief of Medicine',
      salaryPerWeek: 15000,
      stress: { h: 0.6, hp: 2.2 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'specialist', weeks: 96 },
          { kind: 'skill', id: 'discipline', min: 80 },
          { kind: 'skill', id: 'finance', min: 40 },
        ],
      },
      skillGain: { discipline: P, finance: S },
    },
  ],
};

/** Legal — entered with a law degree; the Bar unlocks practising attorney roles. */
export const LEGAL: FieldLadder = {
  field: 'legal',
  name: 'Law',
  roles: [
    {
      id: 'paralegal',
      field: 'legal',
      title: 'Paralegal',
      salaryPerWeek: 1600,
      stress: { h: 0.3, hp: 1.2 },
      gate: { kind: 'credential', id: 'degree:law' },
      skillGain: { negotiation: P },
    },
    {
      id: 'associate-attorney',
      field: 'legal',
      title: 'Associate Attorney',
      salaryPerWeek: 4200,
      stress: { h: 0.3, hp: 1.6 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'credential', id: 'bar' },
          { kind: 'roleTenure', roleId: 'paralegal', weeks: 48 },
        ],
      },
      skillGain: { negotiation: P, charisma: S },
    },
    {
      id: 'attorney',
      field: 'legal',
      title: 'Attorney',
      salaryPerWeek: 6800,
      stress: { h: 0.3, hp: 1.8 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'associate-attorney', weeks: 48 },
          { kind: 'skill', id: 'negotiation', min: 45 },
        ],
      },
      skillGain: { negotiation: P, charisma: S },
    },
    {
      id: 'senior-counsel',
      field: 'legal',
      title: 'Senior Counsel',
      salaryPerWeek: 9500,
      stress: { h: 0.4, hp: 2.0 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'attorney', weeks: 72 },
          { kind: 'skill', id: 'negotiation', min: 60 },
          { kind: 'skill', id: 'charisma', min: 40 },
        ],
      },
      skillGain: { negotiation: P, charisma: S },
    },
    {
      id: 'partner',
      field: 'legal',
      title: 'Partner',
      salaryPerWeek: 14000,
      stress: { h: 0.4, hp: 2.2 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'senior-counsel', weeks: 96 },
          { kind: 'skill', id: 'negotiation', min: 78 },
          { kind: 'skill', id: 'charisma', min: 55 },
        ],
      },
      skillGain: { negotiation: P, charisma: S },
    },
  ],
};

/** Business & Finance — entered with a business degree; tops out in the C-suite. */
export const BUSINESS: FieldLadder = {
  field: 'business',
  name: 'Business & Finance',
  roles: [
    {
      id: 'analyst',
      field: 'business',
      title: 'Analyst',
      salaryPerWeek: 2000,
      stress: { h: 0.3, hp: 1.2 },
      gate: { kind: 'credential', id: 'degree:business' },
      skillGain: { finance: P },
    },
    {
      id: 'associate',
      field: 'business',
      title: 'Associate',
      salaryPerWeek: 3600,
      stress: { h: 0.3, hp: 1.4 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'analyst', weeks: 48 },
          { kind: 'skill', id: 'finance', min: 25 },
        ],
      },
      skillGain: { finance: P, negotiation: S },
    },
    {
      id: 'manager-fin',
      field: 'business',
      title: 'Manager',
      salaryPerWeek: 5600,
      stress: { h: 0.4, hp: 1.6 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'associate', weeks: 48 },
          { kind: 'skill', id: 'finance', min: 45 },
          { kind: 'skill', id: 'negotiation', min: 35 },
        ],
      },
      skillGain: { finance: P, negotiation: S, leadership: S },
    },
    {
      id: 'director-fin',
      field: 'business',
      title: 'Director',
      salaryPerWeek: 9000,
      stress: { h: 0.4, hp: 1.8 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'credential', id: 'master:business' },
          { kind: 'skill', id: 'finance', min: 62 },
          { kind: 'skill', id: 'leadership', min: 45 },
        ],
      },
      skillGain: { finance: P, negotiation: S, leadership: S },
    },
    {
      id: 'vp-fin',
      field: 'business',
      title: 'Vice President',
      salaryPerWeek: 14000,
      stress: { h: 0.5, hp: 2.0 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'director-fin', weeks: 84 },
          { kind: 'skill', id: 'finance', min: 78 },
          { kind: 'skill', id: 'leadership', min: 62 },
        ],
      },
      skillGain: { finance: P, leadership: S },
    },
    {
      id: 'ceo',
      field: 'business',
      title: 'CEO',
      salaryPerWeek: 24000,
      stress: { h: 0.6, hp: 2.4 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'skill', id: 'finance', min: 88 },
          { kind: 'skill', id: 'leadership', min: 78 },
          {
            kind: 'anyOf',
            reqs: [{ kind: 'credential', id: 'phd:business' }, { kind: 'businessProfit' }],
          },
        ],
      },
      skillGain: { finance: P, leadership: S },
    },
  ],
};

/** Creative — entered with an arts degree; culminates in running a studio. */
export const CREATIVE: FieldLadder = {
  field: 'creative',
  name: 'Creative',
  roles: [
    {
      id: 'junior-creative',
      field: 'creative',
      title: 'Junior Creative',
      salaryPerWeek: 1200,
      stress: { h: 0.2, hp: 0.9 },
      gate: { kind: 'credential', id: 'degree:arts' },
      skillGain: { charisma: P },
    },
    {
      id: 'designer',
      field: 'creative',
      title: 'Designer',
      salaryPerWeek: 2600,
      stress: { h: 0.2, hp: 1.1 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'junior-creative', weeks: 48 },
          { kind: 'skill', id: 'charisma', min: 25 },
        ],
      },
      skillGain: { charisma: P, discipline: S },
    },
    {
      id: 'art-director',
      field: 'creative',
      title: 'Art Director',
      salaryPerWeek: 4500,
      stress: { h: 0.3, hp: 1.3 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'designer', weeks: 48 },
          { kind: 'skill', id: 'charisma', min: 48 },
          { kind: 'skill', id: 'discipline', min: 35 },
        ],
      },
      skillGain: { charisma: P, discipline: S },
    },
    {
      id: 'creative-lead',
      field: 'creative',
      title: 'Creative Lead',
      salaryPerWeek: 7000,
      stress: { h: 0.3, hp: 1.5 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'art-director', weeks: 72 },
          { kind: 'skill', id: 'charisma', min: 65 },
          { kind: 'skill', id: 'discipline', min: 50 },
        ],
      },
      skillGain: { charisma: P, discipline: S },
    },
    {
      id: 'studio-head',
      field: 'creative',
      title: 'Studio Head',
      salaryPerWeek: 11000,
      stress: { h: 0.4, hp: 1.7 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'creative-lead', weeks: 96 },
          { kind: 'skill', id: 'charisma', min: 80 },
          { kind: 'skill', id: 'discipline', min: 62 },
        ],
      },
      skillGain: { charisma: P, discipline: S },
    },
  ],
};

/** Public service — entered via a Police/Military Academy or an education degree. */
export const PUBLIC: FieldLadder = {
  field: 'public',
  name: 'Public Service',
  roles: [
    {
      id: 'public-servant',
      field: 'public',
      title: 'Public Servant',
      salaryPerWeek: 1400,
      stress: { h: 0.6, hp: 1.1 },
      gate: {
        kind: 'anyOf',
        reqs: [
          { kind: 'credential', id: 'police-academy' },
          { kind: 'credential', id: 'military-academy' },
          { kind: 'credential', id: 'degree:education' },
        ],
      },
      skillGain: { discipline: P, fitness: S },
    },
    {
      id: 'public-supervisor',
      field: 'public',
      title: 'Supervisor',
      salaryPerWeek: 2400,
      stress: { h: 0.6, hp: 1.3 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'public-servant', weeks: 72 },
          { kind: 'skill', id: 'discipline', min: 25 },
        ],
      },
      skillGain: { discipline: P, fitness: S },
    },
    {
      id: 'public-manager',
      field: 'public',
      title: 'Manager',
      salaryPerWeek: 3800,
      stress: { h: 0.5, hp: 1.5 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'public-supervisor', weeks: 48 },
          { kind: 'skill', id: 'discipline', min: 45 },
          { kind: 'skill', id: 'fitness', min: 30 },
        ],
      },
      skillGain: { discipline: P, fitness: S },
    },
    {
      id: 'senior-official',
      field: 'public',
      title: 'Senior Official',
      salaryPerWeek: 5600,
      stress: { h: 0.5, hp: 1.7 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'public-manager', weeks: 72 },
          { kind: 'skill', id: 'discipline', min: 62 },
          { kind: 'skill', id: 'fitness', min: 45 },
        ],
      },
      skillGain: { discipline: P, fitness: S },
    },
    {
      id: 'commissioner',
      field: 'public',
      title: 'Commissioner',
      salaryPerWeek: 8500,
      stress: { h: 0.5, hp: 1.9 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'senior-official', weeks: 96 },
          { kind: 'skill', id: 'discipline', min: 80 },
          { kind: 'skill', id: 'fitness', min: 60 },
        ],
      },
      skillGain: { discipline: P, fitness: S },
    },
  ],
};

/** Academia — entered with a doctorate in any field; the long tenure track. */
export const ACADEMIA: FieldLadder = {
  field: 'academia',
  name: 'Academia',
  roles: [
    {
      id: 'adjunct',
      field: 'academia',
      title: 'Adjunct Lecturer',
      salaryPerWeek: 1300,
      stress: { h: 0.2, hp: 1.0 },
      gate: ANY_PHD,
      skillGain: { discipline: P, charisma: S },
    },
    {
      id: 'lecturer',
      field: 'academia',
      title: 'Lecturer',
      salaryPerWeek: 2400,
      stress: { h: 0.2, hp: 1.2 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'adjunct', weeks: 96 },
          { kind: 'skill', id: 'charisma', min: 25 },
        ],
      },
      skillGain: { discipline: P, charisma: S },
    },
    {
      id: 'assistant-prof',
      field: 'academia',
      title: 'Assistant Professor',
      salaryPerWeek: 3800,
      stress: { h: 0.3, hp: 1.4 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'lecturer', weeks: 60 },
          { kind: 'skill', id: 'discipline', min: 45 },
          { kind: 'skill', id: 'charisma', min: 40 },
        ],
      },
      skillGain: { discipline: P, charisma: S },
    },
    {
      id: 'associate-prof',
      field: 'academia',
      title: 'Associate Professor',
      salaryPerWeek: 5600,
      stress: { h: 0.3, hp: 1.6 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'assistant-prof', weeks: 84 },
          { kind: 'skill', id: 'discipline', min: 62 },
          { kind: 'skill', id: 'charisma', min: 52 },
        ],
      },
      skillGain: { discipline: P, charisma: S },
    },
    {
      id: 'professor',
      field: 'academia',
      title: 'Full Professor',
      salaryPerWeek: 8000,
      stress: { h: 0.3, hp: 1.8 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'associate-prof', weeks: 96 },
          { kind: 'skill', id: 'discipline', min: 80 },
          { kind: 'skill', id: 'charisma', min: 68 },
        ],
      },
      skillGain: { discipline: P, charisma: S },
    },
  ],
};

/** Service — an always-open entry job rising into hospitality/retail management. */
export const SERVICE: FieldLadder = {
  field: 'service',
  name: 'Service & Hospitality',
  roles: [
    {
      id: 'service-worker',
      field: 'service',
      title: 'Service Worker',
      salaryPerWeek: 560,
      stress: { h: 0.4, hp: 1.0 },
      gate: ALWAYS, // the universal no-education entry job
      skillGain: { charisma: S },
    },
    {
      id: 'shift-lead',
      field: 'service',
      title: 'Shift Lead',
      salaryPerWeek: 900,
      stress: { h: 0.4, hp: 1.0 },
      gate: { kind: 'roleTenure', roleId: 'service-worker', weeks: 24 },
      skillGain: { charisma: P, discipline: S },
    },
    {
      id: 'service-supervisor',
      field: 'service',
      title: 'Supervisor',
      salaryPerWeek: 1300,
      stress: { h: 0.4, hp: 1.1 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'shift-lead', weeks: 48 },
          { kind: 'skill', id: 'charisma', min: 20 },
        ],
      },
      skillGain: { charisma: P, discipline: S },
    },
    {
      id: 'store-manager',
      field: 'service',
      title: 'Store Manager',
      salaryPerWeek: 2100,
      stress: { h: 0.4, hp: 1.3 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'service-supervisor', weeks: 48 },
          { kind: 'skill', id: 'charisma', min: 40 },
          { kind: 'skill', id: 'discipline', min: 30 },
        ],
      },
      skillGain: { charisma: P, discipline: S },
    },
    {
      id: 'regional-manager',
      field: 'service',
      title: 'Regional Manager',
      salaryPerWeek: 3600,
      stress: { h: 0.5, hp: 1.5 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'store-manager', weeks: 72 },
          { kind: 'skill', id: 'charisma', min: 58 },
          { kind: 'skill', id: 'discipline', min: 45 },
        ],
      },
      skillGain: { charisma: P, discipline: S },
    },
    {
      id: 'operations-director',
      field: 'service',
      title: 'Operations Director',
      salaryPerWeek: 5800,
      stress: { h: 0.5, hp: 1.7 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'regional-manager', weeks: 96 },
          { kind: 'skill', id: 'charisma', min: 74 },
          { kind: 'skill', id: 'discipline', min: 60 },
        ],
      },
      skillGain: { charisma: P, discipline: S },
    },
  ],
};

/** Labor — an always-open entry job rising through the skilled trades. */
export const LABOR: FieldLadder = {
  field: 'labor',
  name: 'Skilled Trades',
  roles: [
    {
      id: 'laborer',
      field: 'labor',
      title: 'Laborer',
      salaryPerWeek: 640,
      stress: { h: 0.9, hp: 0.8 },
      gate: ALWAYS, // the universal no-education entry job
      skillGain: { fitness: S },
    },
    {
      id: 'tradesperson',
      field: 'labor',
      title: 'Tradesperson',
      salaryPerWeek: 1400,
      stress: { h: 1.0, hp: 0.8 },
      gate: {
        kind: 'anyOf',
        reqs: [
          { kind: 'credential', id: 'cert:trade' },
          { kind: 'roleTenure', roleId: 'laborer', weeks: 48 },
        ],
      },
      skillGain: { fitness: P, discipline: S },
    },
    {
      id: 'foreman',
      field: 'labor',
      title: 'Foreman',
      salaryPerWeek: 2200,
      stress: { h: 1.0, hp: 0.9 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'tradesperson', weeks: 72 },
          { kind: 'skill', id: 'fitness', min: 25 },
        ],
      },
      skillGain: { fitness: P, discipline: S },
    },
    {
      id: 'site-supervisor',
      field: 'labor',
      title: 'Site Supervisor',
      salaryPerWeek: 3400,
      stress: { h: 0.9, hp: 1.1 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'foreman', weeks: 48 },
          { kind: 'skill', id: 'fitness', min: 45 },
          { kind: 'skill', id: 'discipline', min: 30 },
        ],
      },
      skillGain: { fitness: P, discipline: S },
    },
    {
      id: 'contractor',
      field: 'labor',
      title: 'General Contractor',
      salaryPerWeek: 5200,
      stress: { h: 0.8, hp: 1.3 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'site-supervisor', weeks: 72 },
          { kind: 'skill', id: 'fitness', min: 60 },
          { kind: 'skill', id: 'discipline', min: 45 },
        ],
      },
      skillGain: { fitness: P, discipline: S },
    },
    {
      id: 'construction-exec',
      field: 'labor',
      title: 'Construction Executive',
      salaryPerWeek: 8000,
      stress: { h: 0.7, hp: 1.5 },
      gate: {
        kind: 'allOf',
        reqs: [
          { kind: 'roleTenure', roleId: 'contractor', weeks: 96 },
          { kind: 'skill', id: 'fitness', min: 76 },
          { kind: 'skill', id: 'discipline', min: 60 },
        ],
      },
      skillGain: { fitness: P, discipline: S },
    },
  ],
};

/**
 * Every field ladder, ordered for the job board. Service and Labor open with an
 * always-available entry job; the professional fields open with an education lock.
 * The Work tab shows exactly one card per field: your current role there, or the
 * field's entry rung if you don't hold one.
 */
export const LADDERS: FieldLadder[] = [
  TECH,
  MEDICAL,
  LEGAL,
  BUSINESS,
  CREATIVE,
  PUBLIC,
  ACADEMIA,
  SERVICE,
  LABOR,
];

/** Flat map of every role in the game, keyed by id. */
export const ROLE_BY_ID: Record<string, RoleDef> = (() => {
  const map: Record<string, RoleDef> = {};
  for (const ladder of LADDERS) for (const role of ladder.roles) map[role.id] = role;
  return map;
})();

/** The ladder a role belongs to (undefined for standalone entry jobs). */
export function ladderOfRole(roleId: string): FieldLadder | undefined {
  return LADDERS.find((l) => l.roles.some((r) => r.id === roleId));
}
