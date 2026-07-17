import { CATEGORIES } from '../shared/constants';
import type { Category, Field } from '../shared/types';

const CATEGORY_LABELS = new Map(CATEGORIES.map((c) => [c.id, c.label]));

export interface ListedField {
  field: Field;
  /** Rendered as a section header above this row ("All" view groups by category). */
  groupLabel?: string;
}

/** Categories that contain at least one field with a non-empty value. */
export function computeAvailableCategories(fields: Field[]): Set<Category> {
  return new Set(fields.filter((f) => f.value !== '').map((f) => f.category));
}

/** Popup field list: empty-valued fields are always excluded, then category/search filters apply. */
export function computePopupItems(fields: Field[], category: Category | 'all', query: string): ListedField[] {
  const q = query.trim().toLowerCase();
  const filtered = fields
    .filter((f) => f.value !== '')
    .filter((f) => category === 'all' || f.category === category)
    .filter((f) => {
      if (!q) return true;
      return (
        f.label.toLowerCase().includes(q) ||
        f.value.toLowerCase().includes(q) ||
        (f.shortcut ?? '').toLowerCase().includes(q)
      );
    });

  let lastCategory: Category | null = null;
  return filtered.map((field) => {
    const showHeader = category === 'all' && field.category !== lastCategory;
    lastCategory = field.category;
    return showHeader ? { field, groupLabel: CATEGORY_LABELS.get(field.category) } : { field };
  });
}
