import { supabase } from '@/lib/supabase';
import { removeItemImage, uploadItemImage, type UploadedImage } from '@/lib/storage';
import { toItemRecord, toJson } from '@/lib/data/mappers';
import type { ItemRecord } from '@/types/item';

/* ==========================================================================
   Item writes. A save either fully succeeds or leaves nothing behind: an uploaded photo or a
   half-created item is cleaned up when a later step fails, and the original error is rethrown.
   ========================================================================== */

export interface NewItemInput {
  name: string;
  templateId: number | null;
  parentId: number | null;
  /** Collection to link the item to; null or a non-positive id (virtual category) means standalone. */
  collectionId: number | null;
  /** Template and ad-hoc attribute values (the photo URL is added here). */
  attributes: Record<string, unknown>;
  imageFile: File | null;
}

export async function createItem(input: NewItemInput): Promise<ItemRecord> {
  const uploaded: UploadedImage | null = input.imageFile ? await uploadItemImage(input.imageFile) : null;
  let createdItemId: number | null = null;

  try {
    const attributes = { ...input.attributes, ...(uploaded ? { image_url: uploaded.url } : {}) };

    const { data, error } = await supabase
      .from('items')
      .insert({
        template_id: input.templateId,
        parent_id: input.parentId,
        name: input.name,
        attributes: toJson(attributes),
      })
      .select()
      .single();
    if (error) throw error;
    createdItemId = data.id;

    if (input.collectionId && input.collectionId > 0) {
      const { error: linkError } = await supabase
        .from('item_collections')
        .insert({ item_id: data.id, collection_id: input.collectionId });
      if (linkError) throw linkError;
    }

    return toItemRecord(data);
  } catch (err) {
    // Undo whatever was already saved so a failed create leaves nothing behind
    if (createdItemId !== null) {
      const { error: undoError } = await supabase.from('items').delete().eq('id', createdItemId);
      if (undoError) console.error('Could not undo the new item after a failed save:', undoError);
    }
    if (uploaded) await removeItemImage(uploaded.path);
    throw err;
  }
}

export interface ItemUpdateInput {
  id: number;
  name: string;
  templateId: number | null;
  attributes: Record<string, unknown>;
  /** A newly chosen photo, uploaded on save. */
  imageFile: File | null;
  /** The photo already on the item; null when it was removed. Ignored when imageFile is given. */
  existingImageUrl: string | null;
}

export async function updateItem(input: ItemUpdateInput): Promise<void> {
  const uploaded = input.imageFile ? await uploadItemImage(input.imageFile) : null;
  const imageUrl = uploaded?.url ?? input.existingImageUrl;

  try {
    const attributes = { ...input.attributes, ...(imageUrl ? { image_url: imageUrl } : {}) };
    const { error } = await supabase
      .from('items')
      .update({
        name: input.name,
        template_id: input.templateId,
        attributes: toJson(attributes),
      })
      .eq('id', input.id);
    if (error) throw error;
  } catch (err) {
    if (uploaded) await removeItemImage(uploaded.path);
    throw err;
  }
}

export async function deleteItem(id: number): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}
