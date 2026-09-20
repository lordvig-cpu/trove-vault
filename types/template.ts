import { FieldDefinition } from './field';
import { TemplateLayoutConfig } from './layout';

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
  layout_config?: TemplateLayoutConfig | null;
}

/**
 * Backward compatibility alias during migration from collection_templates.
 */
export type CollectionTemplate = ItemTemplate;
