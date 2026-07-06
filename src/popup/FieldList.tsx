import { MagnifyingGlassIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { FieldItem } from './FieldItem';
import { EmptyState } from '../shared/ui/EmptyState';
import { Button } from '../shared/ui/Button';
import type { Field } from '../shared/types';

export interface ListedField {
  field: Field;
  /** Rendered as a section header above this row ("All" view groups by category). */
  groupLabel?: string;
}

interface FieldListProps {
  items: ListedField[];
  selectedIndex: number;
  hasAnyFields: boolean;
  onSelect: (field: Field) => void;
  onHoverIndex: (index: number) => void;
  onOpenVault: () => void;
}

export function FieldList({ items, selectedIndex, hasAnyFields, onSelect, onHoverIndex, onOpenVault }: FieldListProps) {
  if (items.length === 0) {
    return hasAnyFields ? (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title="No results"
        description="Try a different search or category."
      />
    ) : (
      <EmptyState
        icon={ArchiveBoxIcon}
        title="Your vault is empty"
        description="Add your details once, paste them anywhere."
        action={
          <Button size="sm" onClick={onOpenVault}>
            Open Vault
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto px-2 pb-1" style={{ maxHeight: 344 }}>
      {items.map(({ field, groupLabel }, index) => (
        <div key={field.id}>
          {groupLabel && (
            <div className="px-2 pb-1 pt-2.5 text-caption font-semibold uppercase tracking-wide text-ink-muted">
              {groupLabel}
            </div>
          )}
          <FieldItem
            field={field}
            active={index === selectedIndex}
            onSelect={onSelect}
            onHover={() => onHoverIndex(index)}
          />
        </div>
      ))}
    </div>
  );
}
