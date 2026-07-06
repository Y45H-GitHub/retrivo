import { useEffect, useRef, useState } from 'react';
import { CheckIcon } from '@heroicons/react/20/solid';
import { cn } from '../shared/cn';
import { isSensitiveField, maskValue } from '../shared/mask';
import { Kbd } from '../shared/ui/Kbd';
import type { Field } from '../shared/types';

interface FieldItemProps {
  field: Field;
  active: boolean;
  onSelect: (field: Field) => void;
  onHover: () => void;
}

export function FieldItem({ field, active, onSelect, onHover }: FieldItemProps) {
  const [justCopied, setJustCopied] = useState(false);
  const rowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) rowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const sensitive = isSensitiveField(field.shortcut);
  const hasValue = field.value.length > 0;
  const display = hasValue ? (sensitive ? maskValue(field.value) : field.value) : 'Empty — add a value in the vault';

  function handleSelect() {
    if (!hasValue) return;
    setJustCopied(true);
    onSelect(field);
    setTimeout(() => setJustCopied(false), 1200);
  }

  return (
    <button
      ref={rowRef}
      onClick={handleSelect}
      onMouseMove={onHover}
      tabIndex={-1}
      disabled={!hasValue}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-control px-2 py-1.5 text-left transition-colors',
        active && !justCopied && 'bg-active',
        justCopied && 'bg-success/15',
        !hasValue && 'opacity-55'
      )}
    >
      <span
        aria-hidden
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-hover text-[15px] leading-none"
      >
        {field.icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-medium text-ink">{field.label}</span>
        <span
          className={cn(
            'block truncate text-label',
            sensitive && hasValue ? 'font-mono text-ink-secondary' : 'text-ink-secondary',
            !hasValue && 'italic text-ink-muted'
          )}
        >
          {display}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-1.5">
        {justCopied ? (
          <span className="flex items-center gap-1 text-label font-medium text-success">
            <CheckIcon className="h-3.5 w-3.5" /> Copied
          </span>
        ) : (
          <>
            {field.shortcut && <Kbd>{field.shortcut}</Kbd>}
            {active && hasValue && (
              <span className="flex items-center gap-1 text-label text-ink-muted">
                <Kbd>↵</Kbd>
              </span>
            )}
          </>
        )}
      </span>
    </button>
  );
}
