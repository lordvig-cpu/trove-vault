import { FieldDefinition } from './field';

/* ==========================================================================
   TYPE DEFINITIONS: ItemTemplate
   Blueprint contract for reusable schema definitions, categories, and presets.
   ========================================================================== */

export interface ItemTemplate {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  is_system_preset: boolean;
  fields?: FieldDefinition[];
}

/**
 * Backward compatibility alias during migration from collection_templates.
 */
export type CollectionTemplate = ItemTemplate;
