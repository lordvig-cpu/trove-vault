/* ==========================================================================
   TYPE DEFINITIONS: ItemRecord
   Represents physical records, collectibles, components, and nested children.
   ========================================================================== */

export interface ItemRecord {
  id: number;
  collection_id: number | null;
  template_id?: number | null;
  parent_id: number | null;
  image_url?: string | null;
  name: string;
  attributes: Record<string, any>;
  created_at?: string;
  children?: ItemRecord[];
}