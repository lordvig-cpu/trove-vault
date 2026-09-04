export interface CollectionRecord {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  created_at?: string;
  children?: CollectionRecord[];
}