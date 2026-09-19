/* ==========================================================================
   TYPE DEFINITIONS: ItemRecord & ItemCollectionRecord
   Represents physical records, collectibles, components, and junction mappings.
   ========================================================================== */

export interface ItemRecord {
  id: number;
  collection_ids?: number[];
  collection_id?: number | null;
  template_id?: number | null;
  parent_id: number | null;
  image_url?: string | null;
  name: string;
  attributes: Record<string, unknown>;
  created_at?: string;
  children?: ItemRecord[];
}

export interface ItemCollectionRecord {
  item_id: number;
  collection_id: number;
  sys_created_by?: string | null;
  sys_created_at?: string;
}
