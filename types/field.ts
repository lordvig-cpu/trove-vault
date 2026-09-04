export interface FieldDefinition {
  id: number;
  collection_id: number;
  name: string;
  label: string;
  field_type: 'text' | 'number' | 'boolean' | 'select' | 'date';
  options: string[] | null;
  is_required: boolean;
  display_order: number;
}