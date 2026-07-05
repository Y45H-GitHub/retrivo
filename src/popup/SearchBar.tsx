import { forwardRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onChange, onKeyDown }, ref) => (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
      <Search size={16} className="shrink-0 text-text-muted" />
      <input
        ref={ref}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search your data..."
        className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
      />
    </div>
  )
);
SearchBar.displayName = 'SearchBar';
