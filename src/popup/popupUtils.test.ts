// Feature: formvault-ui-redesign, Property 1: Empty field filtering
// Feature: formvault-ui-redesign, Property 2: Category tab visibility
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { computeAvailableCategories, computePopupItems } from './popupUtils';
import type { Category, Field } from '../shared/types';

const categoryArb = fc.constantFrom<Category>('personal', 'financial', 'business', 'documents', 'custom');

const fieldArb: fc.Arbitrary<Field> = fc.record({
  id: fc.uuid(),
  profileId: fc.uuid(),
  category: categoryArb,
  label: fc.string({ minLength: 1 }),
  value: fc.oneof(fc.constant(''), fc.string({ minLength: 1 })),
  fieldType: fc.constant('text'),
  shortcut: fc.option(fc.string(), { nil: null }),
  icon: fc.constant('tag'),
  sortOrder: fc.integer({ min: 0 }),
  createdAt: fc.constant(new Date(0).toISOString()),
  updatedAt: fc.constant(new Date(0).toISOString())
});

describe('P1: popup items never contain empty fields', () => {
  it('for any field list, result contains only non-empty fields', () => {
    fc.assert(
      fc.property(
        fc.array(fieldArb, { minLength: 0, maxLength: 50 }),
        fc.constantFrom<Category | 'all'>('all', 'personal', 'financial', 'business', 'documents', 'custom'),
        fc.string(),
        (fields, category, query) => {
          const items = computePopupItems(fields, category, query);
          expect(items.every((item) => item.field.value !== '')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('if all fields are empty, result is empty', () => {
    fc.assert(
      fc.property(fc.array(fieldArb, { minLength: 1, maxLength: 30 }).map((fs) => fs.map((f) => ({ ...f, value: '' }))), (fields) => {
        expect(computePopupItems(fields, 'all', '')).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });
});

describe('P2: visible categories match categories with non-empty fields', () => {
  it('for any field list, visible categories === categories with value !== ""', () => {
    fc.assert(
      fc.property(fc.array(fieldArb, { minLength: 0, maxLength: 50 }), (fields) => {
        const expected = new Set(fields.filter((f) => f.value !== '').map((f) => f.category));
        const actual = computeAvailableCategories(fields);
        expect(actual).toEqual(expected);
      }),
      { numRuns: 100 }
    );
  });
});
