import type { Field } from './types';

/** Percentage of fields with a non-empty value, rounded to the nearest integer. Returns 0 for an empty array. */
export function computeCompletionPct(fields: Pick<Field, 'value'>[]): number {
  if (fields.length === 0) return 0;
  const filled = fields.filter((f) => f.value !== '').length;
  return Math.round((filled / fields.length) * 100);
}
