import { useCallback, useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass, Plus, Lock } from '@phosphor-icons/react';
import { ipc } from '../shared/ipc-client';
import { CATEGORIES } from '../shared/constants';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { EmptyState } from '../shared/ui/EmptyState';
import { useToast } from '../shared/ui/useToast';
import { applyReorder } from './reorderUtils';
import { CategorySection } from './CategorySection';
import { ProfileManager } from './ProfileManager';
import { FieldForm } from './FieldForm';
import { FileVault } from './FileVault';
import type { Field, FileRef, NewField, Profile, UpdateField } from '../shared/types';

export function VaultManager() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [profileFields, setProfileFields] = useState<Record<string, Field[]>>({});
  const [files, setFiles] = useState<FileRef[]>([]);
  const [filter, setFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [highlightedFieldId, setHighlightedFieldId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    const fetched = await ipc.getProfiles();
    setProfiles(fetched);
    setActiveProfileId((current) => current ?? fetched[0]?.id ?? null);
  }, []);

  const loadProfileData = useCallback(async (profileId: string) => {
    const [fetchedFields, fetchedFiles] = await Promise.all([ipc.getAllFields(profileId), ipc.getFiles(profileId)]);
    setFields(fetchedFields);
    setFiles(fetchedFiles);
  }, []);

  const loadAllProfileFields = useCallback(async (profileList: Profile[]) => {
    const entries = await Promise.all(profileList.map(async (p) => [p.id, await ipc.getAllFields(p.id)] as const));
    setProfileFields(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (profiles.length > 0) void loadAllProfileFields(profiles);
  }, [profiles, loadAllProfileFields]);

  useEffect(() => {
    if (activeProfileId) void loadProfileData(activeProfileId);
  }, [activeProfileId, loadProfileData]);

  useEffect(() => {
    const off = ipc.onVaultDataUpdated(() => {
      void loadProfiles();
      if (activeProfileId) void loadProfileData(activeProfileId);
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId]);

  const filteredFields = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter(
      (f) => f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q) || (f.shortcut ?? '').toLowerCase().includes(q)
    );
  }, [fields, filter]);

  const fieldsByCategory = useMemo(() => {
    const map = new Map<string, Field[]>();
    for (const field of filteredFields) {
      const list = map.get(field.category) ?? [];
      list.push(field);
      map.set(field.category, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);
    return map;
  }, [filteredFields]);

  const isOnboarding = fields.length > 0 && fields.every((f) => f.value === '') && !filter;

  async function handleAddProfile(name: string) {
    try {
      const created = await ipc.addProfile({ name });
      setActiveProfileId(created.id);
    } catch {
      toast('error', 'Failed to create profile. Please try again.');
    }
  }

  async function handleDeleteProfile(profileId: string) {
    try {
      await ipc.deleteProfile(profileId);
      if (activeProfileId === profileId) setActiveProfileId(null);
    } catch {
      toast('error', 'Failed to delete profile. Please try again.');
    }
  }

  async function handleSaveField(field: NewField | UpdateField) {
    try {
      if ('id' in field) {
        await ipc.updateField(field);
      } else {
        await ipc.addField(field);
      }
    } catch {
      toast('error', 'Failed to save field. Please try again.');
    }
  }

  async function handleDeleteField(fieldId: string) {
    try {
      await ipc.deleteField(fieldId);
    } catch {
      toast('error', 'Failed to delete field. Please try again.');
    }
  }

  async function handleCopyField(fieldId: string) {
    await ipc.copyField(fieldId, false);
    setCopiedId(fieldId);
    setTimeout(() => setCopiedId((id) => (id === fieldId ? null : id)), 1200);
  }

  async function handleReorder(categoryFields: Field[], orderedIds: string[]) {
    const reordered = applyReorder(categoryFields, orderedIds);
    const changed = reordered.filter((field, i) => field.sortOrder !== categoryFields[i]?.sortOrder || field.id !== categoryFields[i]?.id);

    setFields((prev) => {
      const byId = new Map(reordered.map((f) => [f.id, f]));
      return prev.map((f) => byId.get(f.id) ?? f);
    });

    try {
      await Promise.all(changed.map((field) => ipc.updateField({ id: field.id, sortOrder: field.sortOrder })));
    } catch {
      toast('error', 'Failed to save the new order. Reloading…');
      if (activeProfileId) await loadProfileData(activeProfileId);
    }
  }

  function toggleReveal(fieldId: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  }

  function handleStartFillingIn() {
    const firstEmpty = [...fields].sort((a, b) => a.sortOrder - b.sortOrder).find((f) => f.value === '');
    if (!firstEmpty) return;
    const row = document.querySelector<HTMLElement>(`[data-field-id="${firstEmpty.id}"]`);
    row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setHighlightedFieldId(firstEmpty.id);
    setTimeout(() => setHighlightedFieldId((id) => (id === firstEmpty.id ? null : id)), 1500);
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return (
    <div className="flex h-screen w-screen bg-canvas text-ink">
      <ProfileManager
        profiles={profiles}
        activeProfileId={activeProfileId}
        profileFields={profileFields}
        onSelect={setActiveProfileId}
        onAdd={handleAddProfile}
        onDelete={handleDeleteProfile}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-stroke-subtle bg-canvas px-6 py-3.5">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-display text-ink">{activeProfile ? activeProfile.name : 'Vault'}</h1>
            <p className="text-label text-ink-muted">
              {fields.length} {fields.length === 1 ? 'field' : 'fields'} · {files.length} {files.length === 1 ? 'file' : 'files'}
            </p>
          </div>
          <div className="relative w-52">
            <MagnifyingGlass weight="regular" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter fields…"
              className="pl-8"
              aria-label="Filter fields"
            />
          </div>
          <Button
            onClick={() => {
              setEditingField(null);
              setFormOpen(true);
            }}
            disabled={!activeProfileId}
          >
            <Plus weight="regular" className="h-4 w-4" /> Add field
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isOnboarding ? (
            <div className="rounded-card border border-dashed border-stroke">
              <EmptyState
                icon={Lock}
                title="Your vault is ready — fill it in"
                description="Add your details to the fields below. Once filled, press your hotkey anywhere to paste them instantly."
                action={
                  <Button size="sm" onClick={handleStartFillingIn}>
                    Start filling in fields
                  </Button>
                }
              />
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="rounded-card border border-dashed border-stroke">
              {fields.length === 0 ? (
                <EmptyState
                  icon={Lock}
                  title="No fields in this profile"
                  description="Add your first field — a name, PAN, bank account — and paste it anywhere with one shortcut."
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingField(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus weight="regular" className="h-3.5 w-3.5" /> Add field
                    </Button>
                  }
                />
              ) : (
                <EmptyState icon={MagnifyingGlass} title="No matches" description="Try a different filter." />
              )}
            </div>
          ) : (
            CATEGORIES.map((cat) => {
              const list = fieldsByCategory.get(cat.id);
              if (!list || list.length === 0) return null;
              return (
                <CategorySection
                  key={cat.id}
                  category={cat.id}
                  label={cat.label}
                  fields={list}
                  revealed={revealed}
                  copiedId={copiedId}
                  highlightedFieldId={highlightedFieldId}
                  onReorder={(orderedIds) => void handleReorder(list, orderedIds)}
                  onToggleReveal={toggleReveal}
                  onCopy={(fieldId) => void handleCopyField(fieldId)}
                  onEdit={(field) => {
                    setEditingField(field);
                    setFormOpen(true);
                  }}
                  onDelete={(fieldId) => void handleDeleteField(fieldId)}
                />
              );
            })
          )}

          {activeProfileId && !isOnboarding && (
            <FileVault profileId={activeProfileId} files={files} onChanged={() => loadProfileData(activeProfileId)} />
          )}
        </div>
      </main>

      {formOpen && activeProfileId && (
        <FieldForm profileId={activeProfileId} field={editingField} onClose={() => setFormOpen(false)} onSave={handleSaveField} />
      )}
    </div>
  );
}
