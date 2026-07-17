import type { Field } from '../shared/types';

const SORT_ORDER_GAP = 10;

/**
 * Reorders `fields` (all from a single category) so their order matches `orderedIds`, and assigns
 * new `sortOrder` values with gaps of 10 to leave room for future insertions. Fields whose id isn't
 * in `orderedIds` are left untouched and appended in their original relative order.
 */
export function applyReorder<T extends Pick<Field, 'id' | 'sortOrder'>>(fields: T[], orderedIds: string[]): T[] {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((f): f is T => f !== undefined);
  const remaining = fields.filter((f) => !orderedIds.includes(f.id));
  return [...ordered, ...remaining].map((field, index) => ({ ...field, sortOrder: index * SORT_ORDER_GAP }));
}
