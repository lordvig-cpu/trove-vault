/* ==========================================================================
   TYPE DEFINITIONS: FieldDefinition
   Defines schema attributes mapped to JSONB custom attributes across
   items and item templates.
   ========================================================================== */

export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'date';

export interface FieldDefinition {
  id: number;
  template_id?: number | null;
  collection_id?: number | null;
  name: string;
  label: string;
  field_type: FieldType;
  options: string[] | null;
  is_required: boolean;
  display_order: number;
}
