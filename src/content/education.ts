/**
 * Education catalog — the sequential spine (Diploma → Degree → Master's → PhD),
 * M1-relevant auxiliaries, and the major list. Data from CONTENT_DATA_SPEC §3.
 * Pure data; no logic.
 */
import type { CredentialId, Major, Requirement } from '../state/types';

export interface EducationProgram {
  id: CredentialId | 'degree' | 'master' | 'phd'; // spine templates use the bare stem; major appended at enroll
  name: string;
  weeks: number;
  cost: number;
  req?: Requirement;
  grantsMajorChoice?: boolean; // 'degree' asks the player to pick a Major → degree:<major>
}

export const MAJORS: Major[] = [
  'cs',
  'law',
  'business',
  'medicine',
  'engineering',
  'arts',
  'science',
  'education',
];

export const MAJOR_LABEL: Record<Major, string> = {
  cs: 'Computer Science',
  law: 'Law',
  business: 'Business',
  medicine: 'Medicine',
  engineering: 'Engineering',
  arts: 'Arts',
  science: 'Science',
  education: 'Education',
};

/**
 * The spine. `degree`/`master`/`phd` are major-parameterized: enrolling in
 * `degree` with major `cs` yields the credential `degree:cs`. `master`/`phd`
 * require the matching lower credential in the same major (checked in the engine).
 */
export const SPINE: EducationProgram[] = [
  {
    id: 'diploma',
    name: 'Diploma / Associate',
    weeks: 24,
    cost: 25_000,
    req: { kind: 'credential', id: 'school' },
  },
  {
    id: 'degree',
    name: "Bachelor's Degree",
    weeks: 96,
    cost: 120_000,
    req: { kind: 'credential', id: 'diploma' },
    grantsMajorChoice: true,
  },
  {
    id: 'master',
    name: "Master's Degree",
    weeks: 48,
    cost: 70_000,
    grantsMajorChoice: true, // must match an owned degree in that major (engine-checked)
  },
  {
    id: 'phd',
    name: 'Doctorate (PhD)',
    weeks: 96,
    cost: 45_000,
    grantsMajorChoice: true, // must match an owned master's in that major
  },
];

/** Off-spine auxiliaries relevant to M1's Tech slice (others fill in during M2). */
export const AUXILIARIES: EducationProgram[] = [
  {
    id: 'community-college',
    name: 'Community College',
    weeks: 32,
    cost: 12_000,
    req: { kind: 'credential', id: 'school' },
  },
];

export const ALL_PROGRAMS: EducationProgram[] = [...SPINE, ...AUXILIARIES];
