import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlusIcon, Cog6ToothIcon } from '@heroicons/react/20/solid';
import { ipc } from '../shared/ipc-client';
import { CATEGORIES } from '../shared/constants';
import { Kbd } from '../shared/ui/Kbd';
import { CategoryTabs } from './CategoryTabs';
import { FieldList, type ListedField } from './FieldList';
import { ProfileSwitcher } from './ProfileSwitcher';
import { SearchBar } from './SearchBar';
import type { Category, Field, Profile } from '../shared/types';

const CATEGORY_LABELS = new Map(CATEGORIES.map((c) => [c.id, c.label]));

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

  const items = useMemo<ListedField[]>(() => {
    const q = query.trim().toLowerCase();
    const filtered = fields
      .filter((f) => category === 'all' || f.category === category)
      .filter((f) => {
        if (!q) return true;
        return (
          f.label.toLowerCase().includes(q) ||
          f.value.toLowerCase().includes(q) ||
          (f.shortcut ?? '').toLowerCase().includes(q)
        );
      });

    // In the "All" view, group rows under compact category headers.
    let lastCategory: Category | null = null;
    return filtered.map((field) => {
      const showHeader = category === 'all' && field.category !== lastCategory;
      lastCategory = field.category;
      return showHeader ? { field, groupLabel: CATEGORY_LABELS.get(field.category) } : { field };
    });
  }, [fields, category, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, category]);

  async function handleSelectField(field: Field) {
    await ipc.copyField(field.id, true);
    setTimeout(() => void ipc.closePopup(), 500);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      void ipc.closePopup();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const item = items[selectedIndex];
      if (item) void handleSelectField(item.field);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const tabs: (Category | 'all')[] = ['all', ...CATEGORIES.filter((c) => availableCategories.has(c.id)).map((c) => c.id)];
      const currentIndex = tabs.indexOf(category);
      const nextIndex = e.shiftKey
        ? (currentIndex - 1 + tabs.length) % tabs.length
        : (currentIndex + 1) % tabs.length;
      setCategory(tabs[nextIndex]);
    }
  }

  return (
    <div className="h-screen w-screen p-2.5">
      <div className="flex h-full animate-float-in flex-col overflow-hidden rounded-float border border-stroke bg-card/90 shadow-elevation-3 backdrop-blur-xl">
        <SearchBar
          ref={searchRef}
          value={query}
          onChange={setQuery}
          onKeyDown={handleSearchKeyDown}
          trailing={
            <ProfileSwitcher profiles={profiles} activeProfileId={activeProfileId} onSelect={setActiveProfileId} />
          }
        />

        <CategoryTabs activeCategory={category} availableCategories={availableCategories} onSelect={setCategory} />

        <div className="border-t border-stroke-subtle" />

        <div className="flex-1 overflow-hidden pt-1">
          <FieldList
            items={items}
            selectedIndex={selectedIndex}
            hasAnyFields={fields.length > 0}
            onSelect={handleSelectField}
            onHoverIndex={setSelectedIndex}
            onOpenVault={() => void ipc.openVaultManager()}
          />
        </div>

        <div className="flex items-center justify-between border-t border-stroke-subtle px-3 py-2">
          <div className="flex items-center gap-2.5 text-caption text-ink-muted">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> Copy
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Tab</Kbd> Category
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Esc</Kbd>
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => void ipc.openVaultManager()}
              tabIndex={-1}
              className="flex items-center gap-1 rounded-control px-1.5 py-1 text-caption font-medium text-ink-secondary transition-colors hover:bg-hover hover:text-ink"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Add field
            </button>
            <button
              onClick={() => void ipc.openSettings()}
              tabIndex={-1}
              aria-label="Settings"
              title="Settings"
              className="rounded-control p-1 text-ink-secondary transition-colors hover:bg-hover hover:text-ink"
            >
              <Cog6ToothIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
