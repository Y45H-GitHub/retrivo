import { forwardRef, type ReactNode } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

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
      <MagnifyingGlass weight="regular" className="h-4 w-4 shrink-0 text-ink-muted" />
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
      {value && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="shrink-0 rounded-control p-0.5 text-ink-muted transition-colors duration-fast hover:bg-hover hover:text-ink"
        >
          <X weight="bold" className="h-3.5 w-3.5" />
        </button>
      )}
      {trailing}
    </div>
  )
);
SearchBar.displayName = 'SearchBar';
