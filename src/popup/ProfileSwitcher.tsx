import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../shared/cn';
import type { Profile } from '../shared/types';

interface ProfileSwitcherProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelect: (profileId: string) => void;
}

export function ProfileSwitcher({ profiles, activeProfileId, onSelect }: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false);
  const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  if (!active) return <div className="text-sm text-text-secondary">No profile</div>;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-text-primary hover:bg-bg-hover"
      >
        <span>{active.icon}</span>
        <span>{active.name}</span>
        <ChevronDown size={14} className="text-text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-md border border-border bg-bg-card py-1 shadow-lg">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  onSelect(profile.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-bg-hover',
                  profile.id === active.id ? 'text-accent' : 'text-text-primary'
                )}
              >
                <span>{profile.icon}</span>
                <span className="truncate">{profile.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
