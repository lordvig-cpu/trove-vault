import { FieldDefinition } from './field2';

/* ==========================================================================
   TYPE DEFINITIONS: CollectionTemplate (V2)
   Blueprint contract for reusable schema definitions and system presets.
   ========================================================================== */

export interface CollectionTemplate {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  is_system_preset: boolean;
  fields?: FieldDefinition[];
}

// Alias export to support either naming convention across V2 components
export type CollectionTemplate2 = CollectionTemplate;