// types/item.ts
export interface ItemRecord {
  id: number;
  collection_id: number;
  parent_id: number | null;
  image_url?: string | null;
  name: string;
  attributes: Record<string, any>;
  created_at: string;
  children?: ItemRecord[];
}