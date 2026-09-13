import { FieldDefinition } from './field';

/* ==========================================================================
   TYPE DEFINITIONS: CollectionTemplate
   Blueprint contract for reusable schema definitions, categories, and presets.
   ========================================================================== */

export interface CollectionTemplate {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  is_system_preset: boolean;
  fields?: FieldDefinition[];
}