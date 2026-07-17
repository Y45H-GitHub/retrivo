// Feature: formvault-ui-redesign, Property 3: Profile completion percentage invariant
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { computeCompletionPct } from './completionUtils';

const fieldArb = fc.record({ value: fc.oneof(fc.constant(''), fc.string({ minLength: 1 })) });

describe('P3: completion percentage formula and range', () => {
  it('matches the formula and stays in [0, 100] for any non-empty field list', () => {
    fc.assert(
      fc.property(fc.array(fieldArb, { minLength: 1, maxLength: 100 }), (fields) => {
        const pct = computeCompletionPct(fields);
        const expected = Math.round((fields.filter((f) => f.value !== '').length / fields.length) * 100);
        expect(pct).toBe(expected);
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it('returns 0 for an empty array', () => {
    expect(computeCompletionPct([])).toBe(0);
  });
});
