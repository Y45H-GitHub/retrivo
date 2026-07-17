import { useState } from 'react';
import { FIELD_ICONS } from '../constants';
import { FieldIcon } from './FieldIcon';
import { cn } from '../cn';

interface IconPickerProps {
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

/** Inline expanding icon grid — replaces the free-text emoji input in FieldForm. */
export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(FIELD_ICONS);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Choose icon"
        className="flex h-10 w-10 items-center justify-center rounded-card border border-stroke bg-surface transition-colors duration-fast hover:bg-hover"
      >
        <FieldIcon icon={value} size="lg" />
      </button>
      {open && (
        <div className="mt-1 animate-float-in rounded-card border border-stroke bg-card p-2 shadow-elevation-2">
          <div className="grid grid-cols-8 gap-1">
            {keys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                aria-label={key}
                aria-pressed={key === value}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-control transition-colors duration-fast hover:bg-hover',
                  key === value && 'bg-accent-subtle ring-1 ring-accent'
                )}
              >
                <FieldIcon icon={key} size="md" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
