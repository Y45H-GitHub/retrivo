import path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { encrypt, decrypt } from './encryption';
import { DEFAULT_PROFILE_NAME } from '../src/shared/constants';
import type { Field, FileRef, NewField, NewProfile, Profile, UpdateField } from '../src/shared/types';

let db: Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '👤',
  color TEXT DEFAULT '#6366f1',
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fields (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('personal', 'financial', 'documents', 'business', 'custom')),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK(field_type IN ('text', 'number', 'date', 'multiline', 'file_path')),
  shortcut TEXT,
  icon TEXT DEFAULT '📋',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS file_refs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_log (
  id TEXT PRIMARY KEY,
  field_id TEXT,
  action TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

interface ProfileRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: number;
  created_at: string;
}

interface FieldRow {
  id: string;
  profile_id: string;
  category: Field['category'];
  label: string;
  value: string;
  field_type: Field['fieldType'];
  shortcut: string | null;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FileRefRow {
  id: string;
  profile_id: string;
  label: string;
  file_path: string;
  file_type: string | null;
  created_at: string;
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isDefault: row.is_default === 1,
    createdAt: row.created_at
  };
}

function toField(row: FieldRow): Field {
  return {
    id: row.id,
    profileId: row.profile_id,
    category: row.category,
    label: row.label,
    value: decrypt(row.value),
    fieldType: row.field_type,
    shortcut: row.shortcut,
    icon: row.icon,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toFileRef(row: FileRefRow): FileRef {
  return {
    id: row.id,
    profileId: row.profile_id,
    label: row.label,
    filePath: row.file_path,
    fileType: row.file_type,
    createdAt: row.created_at
  };
}

/**
 * Creates the one default profile every install needs, with zero fields — the Vault Manager
 * shows a template picker (see src/shared/fieldTemplates.ts) for any profile with no fields,
 * so the user chooses what to seed it with instead of a fixed set being forced on them.
 * Returns true if this was a first run (no profiles existed yet).
 */
function seedDefaultProfile(): boolean {
  const existing = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };
  if (existing.count > 0) return false;

  const profileId = uuid();
  db.prepare(
    `INSERT INTO profiles (id, name, icon, color, is_default) VALUES (?, ?, ?, ?, 1)`
  ).run(profileId, DEFAULT_PROFILE_NAME, '👤', '#6366f1');
  return true;
}

export function initDatabase(): boolean {
  const dbPath = path.join(app.getPath('userData'), 'formvault.sqlite3');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return seedDefaultProfile();
}

export function getDefaultProfileId(): string | null {
  const row = db.prepare('SELECT id FROM profiles WHERE is_default = 1 LIMIT 1').get() as
    | { id: string }
    | undefined;
  if (row) return row.id;
  const first = db.prepare('SELECT id FROM profiles LIMIT 1').get() as { id: string } | undefined;
  return first ? first.id : null;
}

export function getProfiles(): Profile[] {
  const rows = db.prepare('SELECT * FROM profiles ORDER BY created_at ASC').all() as ProfileRow[];
  return rows.map(toProfile);
}

export function addProfile(profile: NewProfile): Profile {
  const id = uuid();
  db.prepare(
    `INSERT INTO profiles (id, name, icon, color, is_default) VALUES (?, ?, ?, ?, 0)`
  ).run(id, profile.name, profile.icon ?? '👤', profile.color ?? '#6366f1');
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as ProfileRow;
  return toProfile(row);
}

export function deleteProfile(profileId: string): void {
  const wasDefaultRow = db.prepare('SELECT is_default FROM profiles WHERE id = ?').get(profileId) as
    | { is_default: number }
    | undefined;
  if (!wasDefaultRow) return;

  db.transaction(() => {
    db.prepare('DELETE FROM profiles WHERE id = ?').run(profileId);

    if (wasDefaultRow.is_default === 1) {
      const another = db.prepare('SELECT id FROM profiles LIMIT 1').get() as { id: string } | undefined;
      if (another) {
        db.prepare('UPDATE profiles SET is_default = 1 WHERE id = ?').run(another.id);
      }
    }
  })();
}

export function getFieldsForProfile(profileId: string): Field[] {
  if (!profileId) return [];
  const rows = db
    .prepare('SELECT * FROM fields WHERE profile_id = ? ORDER BY category ASC, sort_order ASC')
    .all(profileId) as FieldRow[];
  return rows.map(toField);
}

export function getAllShortcuts(): Map<string, { fieldId: string; value: string }> {
  const rows = db.prepare("SELECT id, value, shortcut FROM fields WHERE shortcut IS NOT NULL AND shortcut != ''").all() as Pick<
    FieldRow,
    'id' | 'value' | 'shortcut'
  >[];
  const map = new Map<string, { fieldId: string; value: string }>();
  for (const row of rows) {
    if (!row.shortcut) continue;
    map.set(row.shortcut, { fieldId: row.id, value: decrypt(row.value) });
  }
  return map;
}

export function addField(field: NewField): Field {
  const id = uuid();
  db.prepare(
    `INSERT INTO fields (id, profile_id, category, label, value, field_type, shortcut, icon, sort_order)
     VALUES (@id, @profileId, @category, @label, @value, @fieldType, @shortcut, @icon, @sortOrder)`
  ).run({
    id,
    profileId: field.profileId,
    category: field.category,
    label: field.label,
    value: encrypt(field.value),
    fieldType: field.fieldType,
    shortcut: field.shortcut ?? null,
    icon: field.icon ?? '📋',
    sortOrder: field.sortOrder ?? 0
  });
  const row = db.prepare('SELECT * FROM fields WHERE id = ?').get(id) as FieldRow;
  return toField(row);
}

export function updateField(field: UpdateField): Field {
  const existingRow = db.prepare('SELECT * FROM fields WHERE id = ?').get(field.id) as FieldRow | undefined;
  if (!existingRow) throw new Error(`Field not found: ${field.id}`);

  const merged: FieldRow = {
    ...existingRow,
    category: field.category ?? existingRow.category,
    label: field.label ?? existingRow.label,
    value: field.value !== undefined ? encrypt(field.value) : existingRow.value,
    field_type: field.fieldType ?? existingRow.field_type,
    shortcut: field.shortcut !== undefined ? field.shortcut : existingRow.shortcut,
    icon: field.icon ?? existingRow.icon,
    sort_order: field.sortOrder ?? existingRow.sort_order,
    updated_at: new Date().toISOString()
  };

  db.prepare(
    `UPDATE fields SET category = @category, label = @label, value = @value, field_type = @field_type,
     shortcut = @shortcut, icon = @icon, sort_order = @sort_order, updated_at = @updated_at WHERE id = @id`
  ).run(merged);

  const row = db.prepare('SELECT * FROM fields WHERE id = ?').get(field.id) as FieldRow;
  return toField(row);
}

export function deleteField(fieldId: string): void {
  db.prepare('DELETE FROM fields WHERE id = ?').run(fieldId);
}

export function getFieldValue(fieldId: string): string | null {
  const row = db.prepare('SELECT value FROM fields WHERE id = ?').get(fieldId) as { value: string } | undefined;
  return row ? decrypt(row.value) : null;
}

export function logUsage(fieldId: string, action: string): void {
  db.prepare('INSERT INTO usage_log (id, field_id, action) VALUES (?, ?, ?)').run(uuid(), fieldId, action);
}

export function getFilesForProfile(profileId: string): FileRef[] {
  if (!profileId) return [];
  const rows = db.prepare('SELECT * FROM file_refs WHERE profile_id = ? ORDER BY created_at DESC').all(
    profileId
  ) as FileRefRow[];
  return rows.map(toFileRef);
}

export function addFile(profileId: string, label: string, filePath: string): FileRef {
  const id = uuid();
  const fileType = path.extname(filePath).replace('.', '') || null;
  db.prepare('INSERT INTO file_refs (id, profile_id, label, file_path, file_type) VALUES (?, ?, ?, ?, ?)').run(
    id,
    profileId,
    label,
    filePath,
    fileType
  );
  const row = db.prepare('SELECT * FROM file_refs WHERE id = ?').get(id) as FileRefRow;
  return toFileRef(row);
}

export function deleteFile(fileId: string): void {
  db.prepare('DELETE FROM file_refs WHERE id = ?').run(fileId);
}

/** Guards shell.showItemInFolder — only reveal paths the vault actually references, not any string a renderer sends. */
export function isKnownFilePath(filePath: string): boolean {
  const row = db.prepare('SELECT 1 FROM file_refs WHERE file_path = ? LIMIT 1').get(filePath);
  return row !== undefined;
}

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function setSetting(key: string, value: string): void {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
    key,
    value
  );
}

export function exportAllProfilesAndFields(): { profiles: Profile[]; fields: Field[] } {
  const profiles = getProfiles();
  const fields = profiles.flatMap((p) => getFieldsForProfile(p.id));
  return { profiles, fields };
}

export function importProfilesAndFields(profiles: Profile[], fields: Field[]): void {
  const insertProfile = db.prepare(
    `INSERT OR REPLACE INTO profiles (id, name, icon, color, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertField = db.prepare(
    `INSERT OR REPLACE INTO fields (id, profile_id, category, label, value, field_type, shortcut, icon, sort_order, created_at, updated_at)
     VALUES (@id, @profileId, @category, @label, @value, @fieldType, @shortcut, @icon, @sortOrder, @createdAt, @updatedAt)`
  );

  const run = db.transaction(() => {
    for (const p of profiles) {
      insertProfile.run(p.id, p.name, p.icon, p.color, p.isDefault ? 1 : 0, p.createdAt);
    }
    for (const f of fields) {
      insertField.run({
        id: f.id,
        profileId: f.profileId,
        category: f.category,
        label: f.label,
        value: encrypt(f.value),
        fieldType: f.fieldType,
        shortcut: f.shortcut,
        icon: f.icon,
        sortOrder: f.sortOrder,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      });
    }
  });
  run();
}
