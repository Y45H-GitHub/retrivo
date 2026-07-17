import { useState } from 'react';
import { Plus, Gear } from '@phosphor-icons/react';
import { cn } from '../shared/cn';
import { ipc } from '../shared/ipc-client';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { InlineConfirm } from '../shared/ui/InlineConfirm';
import { ProfileCompletionIndicator } from '../shared/ui/ProfileCompletionIndicator';
import type { Field, Profile } from '../shared/types';

interface ProfileManagerProps {
  profiles: Profile[];
  activeProfileId: string | null;
  profileFields: Record<string, Field[]>;
  onSelect: (profileId: string) => void;
  onAdd: (name: string) => Promise<void>;
  onDelete: (profileId: string) => Promise<void>;
}

function InitialsAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-bold"
      style={{ backgroundColor: color || 'rgb(var(--fv-accent))', color: '#fff' }}
    >
      {initials}
    </span>
  );
}

export function ProfileManager({ profiles, activeProfileId, profileFields, onSelect, onAdd, onDelete }: ProfileManagerProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd(name.trim());
    setName('');
    setAdding(false);
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-stroke-subtle bg-surface">
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <span className="font-display text-heading font-semibold text-ink">FormVault</span>
      </div>

      <div className="px-4 pb-1 pt-2 text-caption font-semibold uppercase tracking-wide text-ink-muted">Profiles</div>

      <nav className="flex-1 overflow-y-auto px-2">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          const fields = profileFields[profile.id] ?? [];
          return (
            <div
              key={profile.id}
              className={cn(
                'group relative rounded-control transition-colors duration-fast',
                isActive ? 'bg-active text-ink' : 'text-ink-secondary hover:bg-hover hover:text-ink'
              )}
            >
              {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-accent" />}
              <div className="flex items-center gap-2 pl-2.5 pr-1.5">
                <button onClick={() => onSelect(profile.id)} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left">
                  <InitialsAvatar name={profile.name} color={profile.color} />
                  <span className="truncate text-body font-medium">{profile.name}</span>
                </button>
                {!profile.isDefault && (
                  <div className="opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-within:opacity-100">
                    <InlineConfirm triggerAriaLabel={`Delete profile ${profile.name}`} onConfirm={() => void onDelete(profile.id)} />
                  </div>
                )}
              </div>
              <ProfileCompletionIndicator fields={fields} />
            </div>
          );
        })}

        {adding ? (
          <form onSubmit={handleAdd} className="mt-1 flex flex-col gap-1.5 px-1 py-1">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Profile name"
              onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
            />
            <div className="flex gap-1.5">
              <Button type="submit" size="sm" className="flex-1">
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-1 flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-body text-ink-muted transition-colors duration-fast hover:bg-hover hover:text-ink"
          >
            <Plus weight="regular" className="h-4 w-4" /> New profile
          </button>
        )}
      </nav>

      <div className="border-t border-stroke-subtle p-2">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void ipc.openSettings()}>
          <Gear weight="regular" className="h-4 w-4" /> Settings
        </Button>
      </div>
    </aside>
  );
}
