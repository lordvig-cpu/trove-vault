/* ==========================================================================
   TYPE DEFINITIONS: FieldDefinition (V2)
   Defines schema attributes mapped to JSONB custom attributes across
   collections, standalone items, and templates.
   ========================================================================== */

export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'date';

export interface FieldDefinition {
  id: number;
  collection_id?: number | null;
  name: string;
  label: string;
  field_type: FieldType;
  options: string[] | null;
  is_required: boolean;
  display_order: number;
}

// Alias export to support either naming convention across V2 components
export type FieldDefinition2 = FieldDefinition;