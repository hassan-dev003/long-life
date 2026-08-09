import { describe, it, expect } from 'vitest';
import { freshLife } from '../state/initial';
import { meets } from './eligibility';
import type { GameState } from '../state/types';

function base(): GameState {
  return freshLife('normal-life', [], 1);
}

describe('meets', () => {
  it('always passes the always gate and an undefined req', () => {
    const s = base();
    expect(meets(s, { kind: 'always' }).ok).toBe(true);
    expect(meets(s, undefined).ok).toBe(true);
  });

  it('checks credentials', () => {
    const s = base();
    expect(meets(s, { kind: 'credential', id: 'school' }).ok).toBe(true);
    const res = meets(s, { kind: 'credential', id: 'degree:cs' });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('CS');
  });

  it('checks skills and field experience', () => {
    const s = base();
    s.skills.coding = 25;
    s.career.fieldExp.tech = 50;
    expect(meets(s, { kind: 'skill', id: 'coding', min: 20 }).ok).toBe(true);
    expect(meets(s, { kind: 'skill', id: 'coding', min: 40 }).ok).toBe(false);
    expect(meets(s, { kind: 'fieldExp', field: 'tech', weeks: 48 }).ok).toBe(true);
  });

  it('allOf requires every sub-requirement; anyOf requires one', () => {
    const s = base();
    s.skills.coding = 45;
    s.education.credentials.push('degree:cs');

    const allOf = {
      kind: 'allOf' as const,
      reqs: [
        { kind: 'credential' as const, id: 'degree:cs' as const },
        { kind: 'skill' as const, id: 'coding' as const, min: 40 },
      ],
    };
    expect(meets(s, allOf).ok).toBe(true);

    const anyOf = {
      kind: 'anyOf' as const,
      reqs: [
        { kind: 'credential' as const, id: 'phd:cs' as const },
        { kind: 'skill' as const, id: 'coding' as const, min: 40 },
      ],
    };
    expect(meets(s, anyOf).ok).toBe(true);
  });

  it('reports the first unmet requirement in allOf', () => {
    const s = base();
    const res = meets(s, {
      kind: 'allOf',
      reqs: [
        { kind: 'credential', id: 'degree:cs' },
        { kind: 'skill', id: 'coding', min: 40 },
      ],
    });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('CS');
  });
});
