import { describe, it, expect } from 'vitest';
import { fmt1 } from './format';

describe('fmt1', () => {
  it('tames floating-point artifacts', () => {
    expect(fmt1(0.3 + 1.1)).toBe('1.4'); // was 1.4000000000000001
    expect(fmt1(0.4 + 0.8)).toBe('1.2');
  });

  it('drops trailing zeros', () => {
    expect(fmt1(2)).toBe('2');
    expect(fmt1(2.0)).toBe('2');
    expect(fmt1(2.5)).toBe('2.5');
  });

  it('rounds to one decimal', () => {
    expect(fmt1(1.26)).toBe('1.3');
    expect(fmt1(1.24)).toBe('1.2');
  });
});
