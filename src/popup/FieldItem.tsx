import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../shared/cn';
import { isSensitiveField, maskValue } from '../shared/mask';
import type { Field } from '../shared/types';

interface FieldItemProps {
  field: Field;
  active: boolean;
  onSelect: (field: Field) => void;
}

export function FieldItem({ field, active, onSelect }: FieldItemProps) {
  const [justCopied, setJustCopied] = useState(false);

  const display = field.value
    ? isSensitiveField(field.shortcut)
      ? maskValue(field.value)
      : field.value
    : '(empty — click to fill in)';

  function handleSelect() {
    if (!field.value) return;
    setJustCopied(true);
    onSelect(field);
    setTimeout(() => setJustCopied(false), 1500);
  }

  return (
    <button
      onClick={handleSelect}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150',
        active ? 'bg-bg-hover' : 'hover:bg-bg-hover',
        justCopied && 'animate-flash-success'
      )}
    >
      <span className="text-lg leading-none">{field.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-text-secondary">{field.label}</span>
        <span className={cn('block truncate text-sm', field.value ? 'text-text-primary' : 'italic text-text-muted')}>
          {display}
        </span>
      </span>
      <span className="shrink-0 text-xs font-medium text-accent">
        {justCopied ? (
          <span className="flex items-center gap-1 text-success">
            <Check size={14} /> Copied
          </span>
        ) : (
          <span
            className={cn(
              'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
              active && 'opacity-100'
            )}
          >
            <Copy size={14} /> Copy
          </span>
        )}
      </span>
    </button>
  );
}
