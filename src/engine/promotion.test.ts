/**
 * promotionProgress — the Work card's bar tracks time served in the *current*
 * role and resets to zero on promotion (not cumulative field experience).
 */
import { describe, it, expect } from 'vitest';
import { freshLife } from '../state/initial';
import { takeJob } from './instant';
import { promotionProgress } from './selectors';

describe('promotionProgress', () => {
  it('measures current-role tenure and resets when you’re promoted', () => {
    let s = freshLife('normal-life', [], 1);
    s.education.credentials.push('degree:cs');
    s = takeJob(s, 'tech-intern').state;

    // Halfway through the 24 weeks the next promotion demands in this role.
    s.career.roleTenure = 12;
    expect(promotionProgress(s)).toBeCloseTo(0.5);

    // Meet the intern→junior gate (24 wks in role + Coding 20) and promote.
    s.career.roleTenure = 24;
    s.skills.coding = 20;
    expect(promotionProgress(s)).toBeCloseTo(1);
    s = takeJob(s, 'tech-junior').state;
    expect(s.career.roleId).toBe('tech-junior');

    // The bar has reset — zero weeks toward the next rung.
    expect(promotionProgress(s)).toBe(0);
  });
});
