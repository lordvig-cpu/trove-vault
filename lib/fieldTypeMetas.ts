import { FieldType } from '@/types/field';

/** Display metadata (label, icon) for each field type, used by the field-type filter menu. */
export const FIELD_TYPE_METAS: { type: FieldType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'select', label: 'Dropdown / Select' },
  { type: 'boolean', label: 'Boolean (Yes/No)' },
  { type: 'date', label: 'Date' },
];
