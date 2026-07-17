import { useState } from 'react';
import { Button } from '../shared/ui/Button';
import { Dialog } from '../shared/ui/Dialog';
import { Input, Select, Textarea, FieldLabel } from '../shared/ui/Input';
import { IconPicker } from '../shared/ui/IconPicker';
import { CATEGORIES, DEFAULT_FIELD_ICON } from '../shared/constants';
import type { Category, Field, FieldType, NewField, UpdateField } from '../shared/types';

interface FieldFormProps {
  profileId: string;
  field: Field | null;
  onClose: () => void;
  onSave: (field: NewField | UpdateField) => Promise<void>;
}

const FIELD_TYPES: { id: FieldType; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'number', label: 'Number' },
  { id: 'date', label: 'Date' },
  { id: 'multiline', label: 'Multiline' },
  { id: 'file_path', label: 'File path' }
];

export function FieldForm({ profileId, field, onClose, onSave }: FieldFormProps) {
  const [label, setLabel] = useState(field?.label ?? '');
  const [value, setValue] = useState(field?.value ?? '');
  const [category, setCategory] = useState<Category>(field?.category ?? 'personal');
  const [fieldType, setFieldType] = useState<FieldType>(field?.fieldType ?? 'text');
  const [shortcut, setShortcut] = useState(field?.shortcut ?? '');
  const [icon, setIcon] = useState(field?.icon ?? DEFAULT_FIELD_ICON);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      const trimmed = shortcut.trim();
      const normalizedShortcut = trimmed ? (trimmed.startsWith('!') ? trimmed : `!${trimmed}`) : null;
      const common = { label: label.trim(), value, category, fieldType, shortcut: normalizedShortcut, icon };
      if (field) {
        await onSave({ id: field.id, ...common } satisfies UpdateField);
      } else {
        await onSave({ profileId, ...common } satisfies NewField);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog title={field ? 'Edit field' : 'Add field'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex gap-3">
          <div>
            <FieldLabel>Icon</FieldLabel>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div className="flex-1">
            <FieldLabel>Label</FieldLabel>
            <Input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. PAN Number"
              required
            />
          </div>
        </div>

        <div>
          <FieldLabel>Value</FieldLabel>
          {fieldType === 'multiline' ? (
            <Textarea value={value} onChange={(e) => setValue(e.target.value)} />
          ) : (
            <Input
              type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Category</FieldLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Type</FieldLabel>
            <Select value={fieldType} onChange={(e) => setFieldType(e.target.value as FieldType)}>
              {FIELD_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <FieldLabel>Text-expansion shortcut (optional)</FieldLabel>
          <Input value={shortcut} onChange={(e) => setShortcut(e.target.value)} placeholder="!pan" className="font-mono" />
          <p className="mt-1 text-caption text-ink-muted">Type this anywhere followed by Space to paste the value.</p>
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !label.trim()}>
            {saving ? 'Saving…' : field ? 'Save changes' : 'Add field'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
