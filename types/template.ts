import { FieldDefinition } from './field';
import { TemplateFlexLayoutConfig } from './layout';

/* ==========================================================================
   TYPE DEFINITIONS: ItemTemplate
   Blueprint contract for reusable schema definitions, categories, and presets.
   ========================================================================== */

/** The icon a template shows until its user picks one. */
export const DEFAULT_TEMPLATE_ICON = '📦';

export interface ItemTemplate {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  is_system_preset: boolean;
  fields?: FieldDefinition[];
  layout_config?: TemplateFlexLayoutConfig | null;
}
