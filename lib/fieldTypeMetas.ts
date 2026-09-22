import { FieldType } from '@/types/field';

/** Display metadata (label, icon) for each field type, used by the field-type filter menu. */
export const FIELD_TYPE_METAS: { type: FieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'number', label: 'Number', icon: '🔢' },
  { type: 'select', label: 'Dropdown / Select', icon: '📋' },
  { type: 'boolean', label: 'Boolean (Yes/No)', icon: '🔘' },
  { type: 'date', label: 'Date', icon: '📅' },
];
