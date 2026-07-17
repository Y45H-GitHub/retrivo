import { useEffect, useRef } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { cn } from '../shared/cn';
import { isSensitiveField, maskValue } from '../shared/mask';
import { FieldIcon } from '../shared/ui/FieldIcon';
import { Kbd } from '../shared/ui/Kbd';
import type { Field } from '../shared/types';

interface FieldItemProps {
  field: Field;
  active: boolean;
  copied?: boolean;
  pasteLabel?: boolean;
  onSelect: (field: Field) => void;
  onHover: () => void;
}

/** Popup field row. Only ever renders fields with a non-empty value — filtering happens upstream in popupUtils. */
export function FieldItem({ field, active, copied = false, pasteLabel = false, onSelect, onHover }: FieldItemProps) {
  const rowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) rowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const sensitive = isSensitiveField(field.shortcut);
  const display = sensitive ? maskValue(field.value) : field.value;

  return (
    <button
      ref={rowRef}
      onClick={() => onSelect(field)}
      onMouseMove={onHover}
      tabIndex={-1}
      className={cn(
        'relative flex w-full items-center gap-2.5 rounded-control px-2 py-1.5 text-left transition-colors duration-fast',
        active && !copied && 'bg-active',
        copied && 'bg-success/15'
      )}
    >
      {active && <span aria-hidden className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-accent" />}

      <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-hover">
        <FieldIcon icon={field.icon} size="md" className="text-ink-secondary" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-medium text-ink">{field.label}</span>
        <span className={cn('block truncate text-label', sensitive ? 'font-mono text-ink-secondary' : 'text-ink-secondary')}>
          {display}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-1.5">
        {copied ? (
          <span className="flex items-center gap-1 text-label font-medium text-success">
            <CheckCircle weight="bold" className="h-3.5 w-3.5" /> {pasteLabel ? 'Pasted' : 'Copied'}
          </span>
        ) : (
          <>
            {field.shortcut && <Kbd>{field.shortcut}</Kbd>}
            {active && (
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
