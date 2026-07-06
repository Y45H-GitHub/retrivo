import { useState } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { cn } from '../shared/cn';
import type { Profile } from '../shared/types';

interface ProfileSwitcherProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelect: (profileId: string) => void;
}

/** Compact chip + dropdown; lives inside the popup's search row. */
export function ProfileSwitcher({ profiles, activeProfileId, onSelect }: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false);
  const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  if (!active || profiles.length === 0) return null;

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={-1}
        className="flex items-center gap-1 rounded-full border border-stroke bg-surface py-[3px] pl-2 pr-1.5 text-label font-medium text-ink-secondary transition-colors hover:bg-hover hover:text-ink"
      >
        <span aria-hidden>{active.icon}</span>
        <span className="max-w-[80px] truncate">{active.name}</span>
        <ChevronDownIcon className="h-3.5 w-3.5 text-ink-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute right-0 top-full z-20 mt-1 min-w-[170px] animate-float-in rounded-card border border-stroke bg-card py-1 shadow-elevation-2"
          >
            {profiles.map((profile) => (
              <button
                key={profile.id}
                role="option"
                aria-selected={profile.id === active.id}
                onClick={() => {
                  onSelect(profile.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-body transition-colors hover:bg-hover',
                  profile.id === active.id ? 'text-ink' : 'text-ink-secondary'
                )}
              >
                <span aria-hidden>{profile.icon}</span>
                <span className="flex-1 truncate">{profile.name}</span>
                {profile.id === active.id && <CheckIcon className="h-3.5 w-3.5 text-accent" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
