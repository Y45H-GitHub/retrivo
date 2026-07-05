import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Settings, X } from 'lucide-react';
import { ipc } from '../shared/ipc-client';
import { CategoryTabs } from './CategoryTabs';
import { FieldList } from './FieldList';
import { ProfileSwitcher } from './ProfileSwitcher';
import { SearchBar } from './SearchBar';
import type { Category, Field, Profile } from '../shared/types';

export function Popup() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);

  const loadProfiles = useCallback(async () => {
    const [fetchedProfiles, settings] = await Promise.all([ipc.getProfiles(), ipc.getSettings()]);
    setProfiles(fetchedProfiles);
    const settingsProfileId = (settings as { activeProfileId?: string }).activeProfileId;
    setActiveProfileId((current) => current ?? settingsProfileId ?? fetchedProfiles[0]?.id ?? null);
  }, []);

  const loadFields = useCallback(async (profileId: string) => {
    const fetched = await ipc.getAllFields(profileId);
    setFields(fetched);
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (activeProfileId) void loadFields(activeProfileId);
  }, [activeProfileId, loadFields]);

  useEffect(() => {
    const offHotkey = ipc.onHotkeyTriggered(() => {
      setQuery('');
      setCategory('all');
      setSelectedIndex(0);
      void loadProfiles();
      searchRef.current?.focus();
    });
    const offUpdated = ipc.onVaultDataUpdated(() => {
      void loadProfiles();
      if (activeProfileId) void loadFields(activeProfileId);
    });
    return () => {
      offHotkey();
      offUpdated();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableCategories = useMemo(() => new Set(fields.map((f) => f.category)), [fields]);

  const filteredFields = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fields
      .filter((f) => category === 'all' || f.category === category)
      .filter((f) => {
        if (!q) return true;
        return (
          f.label.toLowerCase().includes(q) ||
          f.value.toLowerCase().includes(q) ||
          (f.shortcut ?? '').toLowerCase().includes(q)
        );
      });
  }, [fields, category, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, category]);

  async function handleSelectField(field: Field) {
    await ipc.copyField(field.id, true);
    setTimeout(() => void ipc.closePopup(), 550);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      void ipc.closePopup();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredFields.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const field = filteredFields[selectedIndex];
      if (field) void handleSelectField(field);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const tabs: (Category | 'all')[] = ['all', ...Array.from(availableCategories)];
      const currentIndex = tabs.indexOf(category);
      const nextIndex = e.shiftKey
        ? (currentIndex - 1 + tabs.length) % tabs.length
        : (currentIndex + 1) % tabs.length;
      setCategory(tabs[nextIndex]);
    }
  }

  return (
    <div className="h-screen w-screen p-2">
      <div className="flex h-full animate-slide-fade-in flex-col overflow-hidden rounded-xl border border-border bg-bg-card/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <ProfileSwitcher profiles={profiles} activeProfileId={activeProfileId} onSelect={setActiveProfileId} />
          <div className="flex items-center gap-1">
            <button
              onClick={() => void ipc.openSettings()}
              className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={() => void ipc.closePopup()}
              className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <SearchBar ref={searchRef} value={query} onChange={setQuery} onKeyDown={handleSearchKeyDown} />

        <CategoryTabs activeCategory={category} availableCategories={availableCategories} onSelect={setCategory} />

        <FieldList fields={filteredFields} selectedIndex={selectedIndex} onSelect={handleSelectField} />

        <div className="border-t border-border px-2 py-1.5">
          <button
            onClick={() => void ipc.openVaultManager()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          >
            <Plus size={16} />
            Add new field
          </button>
        </div>
      </div>
    </div>
  );
}
