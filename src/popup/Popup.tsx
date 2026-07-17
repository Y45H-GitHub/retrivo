import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Gear } from '@phosphor-icons/react';
import { ipc } from '../shared/ipc-client';
import { CATEGORIES } from '../shared/constants';
import { Kbd } from '../shared/ui/Kbd';
import { CategoryTabs } from './CategoryTabs';
import { CopyFeedbackController, type CopyFeedbackState } from './copyFeedbackController';
import { FieldList } from './FieldList';
import { computeAvailableCategories, computePopupItems } from './popupUtils';
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
  const [copyState, setCopyState] = useState<CopyFeedbackState>('idle');
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const [autoPaste, setAutoPaste] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const copyControllerRef = useRef(
    new CopyFeedbackController({
      onStateChange: (s) => setCopyState(s),
      onClose: () => void ipc.closePopup()
    })
  );

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
    void ipc.getCapabilities().then((c) => setAutoPaste(c.autoPaste));
  }, [loadProfiles]);

  useEffect(() => {
    if (activeProfileId) void loadFields(activeProfileId);
  }, [activeProfileId, loadFields]);

  useEffect(() => {
    const offHotkey = ipc.onHotkeyTriggered(() => {
      setQuery('');
      setCategory('all');
      setSelectedIndex(0);
      copyControllerRef.current.reset();
      setCopyState('idle');
      setCopiedFieldId(null);
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

  useEffect(() => {
    const controller = copyControllerRef.current;
    return () => controller.dispose();
  }, []);

  const availableCategories = useMemo(() => computeAvailableCategories(fields), [fields]);
  const hasAnyValuedFields = useMemo(() => fields.some((f) => f.value !== ''), [fields]);

  const items = useMemo(() => computePopupItems(fields, category, query), [fields, category, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, category]);

  async function handleSelectField(field: Field) {
    if (!copyControllerRef.current.start()) return;
    setCopiedFieldId(field.id);
    await ipc.copyField(field.id, true);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      if (copyControllerRef.current.escape()) return;
      if (query) {
        setQuery('');
        return;
      }
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
      const nextIndex = e.shiftKey ? (currentIndex - 1 + tabs.length) % tabs.length : (currentIndex + 1) % tabs.length;
      setCategory(tabs[nextIndex]);
    }
  }

  return (
    <div className="h-screen w-screen p-2.5">
      <div
        data-closing={copyState === 'closing' || undefined}
        className="flex h-full flex-col overflow-hidden rounded-float border animate-float-in data-[closing]:animate-fade-out"
        style={{
          background: 'var(--fv-popup-bg)',
          borderColor: 'var(--fv-popup-border)',
          // Electron can't blur real desktop content behind a transparent window (backdrop-filter
          // only sees the page's own DOM, and native Acrylic needs Windows 11 22H2+), so the "glass"
          // read comes from an opaque-enough tint + this edge highlight rather than a real blur.
          boxShadow:
            '0 16px 48px rgb(var(--fv-shadow) / 0.28), 0 6px 16px rgb(var(--fv-shadow) / 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
        }}
      >
        <SearchBar
          ref={searchRef}
          value={query}
          onChange={setQuery}
          onKeyDown={handleSearchKeyDown}
          trailing={<ProfileSwitcher profiles={profiles} activeProfileId={activeProfileId} onSelect={setActiveProfileId} />}
        />

        <CategoryTabs activeCategory={category} availableCategories={availableCategories} onSelect={setCategory} />

        <div className="border-t border-stroke-subtle" />

        <div className="flex-1 overflow-hidden pt-1">
          <FieldList
            items={items}
            selectedIndex={selectedIndex}
            hasAnyFields={hasAnyValuedFields}
            copiedFieldId={copyState !== 'idle' ? copiedFieldId : null}
            pasteLabel={autoPaste}
            onSelect={(field) => void handleSelectField(field)}
            onHoverIndex={setSelectedIndex}
            onOpenVault={() => void ipc.openVaultManager()}
          />
        </div>

        {fields.length > 0 && (
          <div className="flex items-center justify-between border-t border-stroke-subtle px-3 py-2">
            <div className="flex items-center gap-2.5 text-caption text-ink-muted">
              <span className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
              </span>
              <span className="flex items-center gap-1">
                <Kbd>↵</Kbd> {autoPaste ? 'Paste' : 'Copy'}
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
                className="flex items-center gap-1 rounded-control px-1.5 py-1 text-caption font-medium text-ink-secondary transition-colors duration-fast hover:bg-hover hover:text-ink"
              >
                <Plus weight="regular" className="h-3.5 w-3.5" /> Add field
              </button>
              <button
                onClick={() => void ipc.openSettings()}
                tabIndex={-1}
                aria-label="Settings"
                title="Settings"
                className="rounded-control p-1 text-ink-secondary transition-colors duration-fast hover:bg-hover hover:text-ink"
              >
                <Gear weight="regular" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
