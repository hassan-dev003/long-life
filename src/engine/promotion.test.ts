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
    s.career.roleTenure['tech-intern'] = 12;
    expect(promotionProgress(s)).toBeCloseTo(0.5);

    // Meet the intern→junior gate (24 wks in role + Coding 20) and promote.
    s.career.roleTenure['tech-intern'] = 24;
    s.skills.coding = 20;
    expect(promotionProgress(s)).toBeCloseTo(1);
    s = takeJob(s, 'tech-junior').state;
    expect(s.career.roleId).toBe('tech-junior');

    // The bar has reset — zero weeks toward the next rung.
    expect(promotionProgress(s)).toBe(0);
  });

  it('keeps rank and per-role tenure when switching fields, and resumes on return', () => {
    let s = freshLife('normal-life', [], 1);

    // Climb Labor: laborer → tradesperson (cert + 48 wks served).
    s = takeJob(s, 'laborer').state;
    s.career.roleTenure['laborer'] = 48;
    s.education.credentials.push('cert:trade');
    s = takeJob(s, 'tradesperson').state;
    expect(s.career.roleId).toBe('tradesperson');
    s.career.roleTenure['tradesperson'] = 20; // partway to Foreman

    // Switch to another field entirely.
    s = takeJob(s, 'service-worker').state;
    expect(s.career.roleId).toBe('service-worker');
    // Labor rank and time served are preserved, not wiped.
    expect(s.career.fieldRole.labor).toBe('tradesperson');
    expect(s.career.roleTenure['tradesperson']).toBe(20);

    // Return to Labor: resume at the highest role reached, with tenure intact —
    // even though the Tradesperson gate wouldn't re-pass from scratch here.
    s = takeJob(s, s.career.fieldRole.labor!).state;
    expect(s.career.roleId).toBe('tradesperson');
    expect(s.career.roleTenure['tradesperson']).toBe(20);
  });
});
