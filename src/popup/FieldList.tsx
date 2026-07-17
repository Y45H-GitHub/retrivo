import { MagnifyingGlass, Lock } from '@phosphor-icons/react';
import { FieldItem } from './FieldItem';
import { EmptyState } from '../shared/ui/EmptyState';
import { Button } from '../shared/ui/Button';
import type { ListedField } from './popupUtils';
import type { Field } from '../shared/types';

interface FieldListProps {
  items: ListedField[];
  selectedIndex: number;
  hasAnyFields: boolean;
  copiedFieldId?: string | null;
  pasteLabel?: boolean;
  onSelect: (field: Field) => void;
  onHoverIndex: (index: number) => void;
  onOpenVault: () => void;
}

export function FieldList({
  items,
  selectedIndex,
  hasAnyFields,
  copiedFieldId,
  pasteLabel,
  onSelect,
  onHoverIndex,
  onOpenVault
}: FieldListProps) {
  if (items.length === 0) {
    return hasAnyFields ? (
      <EmptyState icon={MagnifyingGlass} title="No results" description="Try a different search or category." />
    ) : (
      <EmptyState
        icon={Lock}
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
            <div className="px-2 pb-1 pt-2.5 text-caption font-semibold uppercase tracking-wide text-ink-muted">{groupLabel}</div>
          )}
          <FieldItem
            field={field}
            active={index === selectedIndex}
            copied={copiedFieldId === field.id}
            pasteLabel={pasteLabel}
            onSelect={onSelect}
            onHover={() => onHoverIndex(index)}
          />
        </div>
      ))}
    </div>
  );
}
