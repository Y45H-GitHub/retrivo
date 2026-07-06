import { forwardRef, type ReactNode } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Right-aligned slot (profile switcher chip). */
  trailing?: ReactNode;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onChange, onKeyDown, trailing }, ref) => (
    <div className="flex items-center gap-2.5 px-4 pb-3 pt-3.5">
      <MagnifyingGlassIcon className="h-[18px] w-[18px] shrink-0 text-ink-muted" />
      <input
        ref={ref}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search your vault…"
        aria-label="Search your vault"
        className="w-full bg-transparent text-body-lg text-ink placeholder:text-ink-muted focus:outline-none"
        style={{ outline: 'none' }}
      />
      {trailing}
    </div>
  )
);
SearchBar.displayName = 'SearchBar';
