import { CATEGORY_COLORS } from '../shared/constants';
import { FieldRow } from './FieldRow';
import { useDragToReorder } from './useDragToReorder';
import type { Category, Field } from '../shared/types';

interface CategorySectionProps {
  category: Category;
  label: string;
  fields: Field[];
  revealed: Set<string>;
  copiedId: string | null;
  highlightedFieldId: string | null;
  onReorder: (orderedIds: string[]) => void;
  onToggleReveal: (fieldId: string) => void;
  onCopy: (fieldId: string) => void;
  onEdit: (field: Field) => void;
  onDelete: (fieldId: string) => void;
}

export function CategorySection({
  category,
  label,
  fields,
  revealed,
  copiedId,
  highlightedFieldId,
  onReorder,
  onToggleReveal,
  onCopy,
  onEdit,
  onDelete
}: CategorySectionProps) {
  const { dragIndex, overIndex, onDragStart, onDragOver, onDrop, onDragEnd, moveField } = useDragToReorder(fields, onReorder);

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] }} />
        <h3 className="text-caption font-semibold uppercase tracking-wide text-ink-muted">{label}</h3>
        <span className="text-caption text-ink-muted">{fields.length}</span>
      </div>

      <div className="overflow-hidden rounded-card border border-stroke bg-card shadow-elevation-1">
        {fields.map((field, i) => (
          <div key={field.id} className={i < fields.length - 1 ? 'border-b border-stroke-subtle' : undefined}>
            <FieldRow
              field={field}
              highlighted={highlightedFieldId === field.id}
              revealed={revealed.has(field.id)}
              copied={copiedId === field.id}
              isDragging={dragIndex === i}
              isDropTarget={overIndex === i && dragIndex !== i}
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              onMoveUp={() => moveField(i, 'up')}
              onMoveDown={() => moveField(i, 'down')}
              onToggleReveal={() => onToggleReveal(field.id)}
              onCopy={() => onCopy(field.id)}
              onEdit={() => onEdit(field)}
              onDelete={() => onDelete(field.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
