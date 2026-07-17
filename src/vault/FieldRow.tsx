import { Copy, CheckCircle, Eye, EyeSlash, PencilSimple } from '@phosphor-icons/react';
import { cn } from '../shared/cn';
import { isSensitiveField, maskValue } from '../shared/mask';
import { Button } from '../shared/ui/Button';
import { DragHandle } from '../shared/ui/DragHandle';
import { FieldIcon } from '../shared/ui/FieldIcon';
import { InlineConfirm } from '../shared/ui/InlineConfirm';
import { Kbd } from '../shared/ui/Kbd';
import type { Field } from '../shared/types';

interface FieldRowProps {
  field: Field;
  highlighted: boolean;
  revealed: boolean;
  copied: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleReveal: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FieldRow({
  field,
  highlighted,
  revealed,
  copied,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onToggleReveal,
  onCopy,
  onEdit,
  onDelete
}: FieldRowProps) {
  const sensitive = isSensitiveField(field.shortcut);
  const shown = revealed || !sensitive;
  const hasValue = field.value.length > 0;
  const displayValue = hasValue ? (shown ? field.value : maskValue(field.value)) : '—';

  return (
    <div
      data-field-id={field.id}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2.5 transition-all duration-fast',
        isDropTarget && 'border-t-2 border-accent',
        isDragging && 'scale-[1.02] shadow-elevation-2',
        highlighted && 'ring-2 ring-accent ring-offset-1 ring-offset-card'
      )}
    >
      <DragHandle onMoveUp={onMoveUp} onMoveDown={onMoveDown} />

      <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-hover">
        <FieldIcon icon={field.icon} size="md" className="text-ink-secondary" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-body font-medium text-ink">{field.label}</span>
          {field.shortcut && <Kbd>{field.shortcut}</Kbd>}
        </div>
        <span className={cn('block truncate text-label', hasValue ? 'font-mono text-ink-secondary' : 'italic text-ink-muted')}>
          {displayValue}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-within:opacity-100">
        {sensitive && hasValue && (
          <Button variant="ghost" size="icon" aria-label={shown ? 'Hide value' : 'Reveal value'} onClick={onToggleReveal}>
            {shown ? <EyeSlash weight="regular" className="h-4 w-4" /> : <Eye weight="regular" className="h-4 w-4" />}
          </Button>
        )}
        {hasValue && (
          <Button variant="ghost" size="icon" aria-label="Copy value" onClick={onCopy}>
            {copied ? <CheckCircle weight="bold" className="h-4 w-4 text-success" /> : <Copy weight="regular" className="h-4 w-4" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" aria-label="Edit field" onClick={onEdit}>
          <PencilSimple weight="regular" className="h-4 w-4" />
        </Button>
        <InlineConfirm triggerAriaLabel="Delete field" onConfirm={onDelete} />
      </div>
    </div>
  );
}
