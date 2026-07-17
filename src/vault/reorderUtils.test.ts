// Feature: formvault-ui-redesign, Property 4: Drag-to-reorder sort invariant
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyReorder } from './reorderUtils';

interface TestField {
  id: string;
  sortOrder: number;
}

function shuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const fieldsArb = fc
  .uniqueArray(fc.uuid(), { minLength: 2, maxLength: 20 })
  .map((ids) => ids.map((id, i): TestField => ({ id, sortOrder: i })));

describe('P4: reorder preserves the field set and produces a strictly increasing sortOrder', () => {
  it('for any permutation of a category, the id set is unchanged and sortOrder strictly increases', () => {
    fc.assert(
      fc.property(fieldsArb, fc.integer({ min: 0, max: 1_000_000 }), (fields, seed) => {
        const permutedIds = shuffle(
          fields.map((f) => f.id),
          seed
        );
        const result = applyReorder(fields, permutedIds);

        const originalIds = new Set(fields.map((f) => f.id));
        const resultIds = new Set(result.map((f) => f.id));
        expect(resultIds).toEqual(originalIds);
        expect(result.map((f) => f.id)).toEqual(permutedIds);

        for (let i = 1; i < result.length; i++) {
          expect(result[i].sortOrder).toBeGreaterThan(result[i - 1].sortOrder);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('fields in other categories are untouched (function only ever receives one category)', () => {
    const categoryA = [
      { id: 'a1', sortOrder: 0 },
      { id: 'a2', sortOrder: 1 }
    ];
    const result = applyReorder(categoryA, ['a2', 'a1']);
    expect(result.map((f) => f.id)).toEqual(['a2', 'a1']);
    expect(result.map((f) => f.sortOrder)).toEqual([0, 10]);
  });
});
