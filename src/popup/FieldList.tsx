import { FieldItem } from './FieldItem';
import type { Field } from '../shared/types';

interface FieldListProps {
  fields: Field[];
  selectedIndex: number;
  onSelect: (field: Field) => void;
}

export function FieldList({ fields, selectedIndex, onSelect }: FieldListProps) {
  if (fields.length === 0) {
    return <div className="px-4 py-10 text-center text-sm text-text-muted">No matching fields found.</div>;
  }

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto px-2 py-2" style={{ maxHeight: 320 }}>
      {fields.map((field, index) => (
        <FieldItem key={field.id} field={field} active={index === selectedIndex} onSelect={onSelect} />
      ))}
    </div>
  );
}
