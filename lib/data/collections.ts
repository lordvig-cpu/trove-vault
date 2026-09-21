import { supabase } from '@/lib/supabase';
import { toItemRecord } from '@/lib/data/mappers';
import type { CollectionRecord } from '@/types/collection';
import type { ItemRecord } from '@/types/item';

export interface NewCollectionInput {
  name: string;
  description: string | null;
  parentId: number | null;
}

export async function createCollection(input: NewCollectionInput): Promise<CollectionRecord> {
  const { data, error } = await supabase
    .from('collections')
    .insert({ name: input.name, description: input.description, parent_id: input.parentId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Deleting a collection removes its links; the items themselves remain (as standalone items). */
export async function deleteCollection(id: number): Promise<void> {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}

/** Every item linked to the collection (flat), for showing what a delete affects. */
export async function fetchCollectionItems(collectionId: number): Promise<ItemRecord[]> {
  const { data: links, error: linkError } = await supabase
    .from('item_collections')
    .select('item_id')
    .eq('collection_id', collectionId);
  if (linkError) throw linkError;

  const itemIds = (links || []).map((link) => link.item_id);
  if (itemIds.length === 0) return [];

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .in('id', itemIds)
    .order('id', { ascending: true });
  if (error) throw error;
  return (data || []).map(toItemRecord);
}
