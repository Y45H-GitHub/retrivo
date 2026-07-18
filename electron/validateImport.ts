import type { Category, Field, FieldType, Profile, VaultExport } from '../src/shared/types';

const CATEGORIES: Category[] = ['personal', 'financial', 'documents', 'business', 'custom'];
const FIELD_TYPES: FieldType[] = ['text', 'number', 'date', 'multiline', 'file_path'];

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isProfile(v: unknown): v is Profile {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    isString(p.id) &&
    isString(p.name) &&
    isString(p.icon) &&
    isString(p.color) &&
    typeof p.isDefault === 'boolean' &&
    isString(p.createdAt)
  );
}

function isField(v: unknown): v is Field {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  return (
    isString(f.id) &&
    isString(f.profileId) &&
    typeof f.category === 'string' &&
    CATEGORIES.includes(f.category as Category) &&
    isString(f.label) &&
    isString(f.value) &&
    typeof f.fieldType === 'string' &&
    FIELD_TYPES.includes(f.fieldType as FieldType) &&
    (f.shortcut === null || isString(f.shortcut)) &&
    isString(f.icon) &&
    typeof f.sortOrder === 'number' &&
    isString(f.createdAt) &&
    isString(f.updatedAt)
  );
}

/** Rejects malformed/tampered import files instead of feeding arbitrary JSON straight into the database. */
export function isValidVaultExport(value: unknown): value is VaultExport {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.version !== 'number') return false;
  if (!Array.isArray(v.profiles) || !v.profiles.every(isProfile)) return false;
  if (!Array.isArray(v.fields) || !v.fields.every(isField)) return false;

  const profileIds = new Set(v.profiles.map((p) => p.id));
  if (!v.fields.every((f) => profileIds.has(f.profileId))) return false;

  return true;
}
