import { supabase } from '@/lib/supabase';
import { fetchAllPages } from '@/lib/fetchAllPages';
import { toFieldDefinition, toItemRecord, toItemTemplate } from '@/lib/data/mappers';
import type { CollectionRecord } from '@/types/collection';
import type { ItemRecord } from '@/types/item';
import type { ItemTemplate } from '@/types/template';
import type { TableRow } from '@/types/database';

export interface WorkspaceData {
  collections: CollectionRecord[];
  items: ItemRecord[];
  templates: ItemTemplate[];
  /** Which item belongs to which collection (the junction table). */
  itemLinks: { item_id: number; collection_id: number }[];
}

/** Loads everything the workspace shows, all pages of every table. Pass a signal to cancel. */
export async function fetchWorkspaceData(signal: AbortSignal): Promise<WorkspaceData> {
  const [collections, items, templates, templateFields, itemLinks] = await Promise.all([
    fetchAllPages<TableRow<'collections'>>((from, to) => supabase.from('collections').select('*').order('id').range(from, to).abortSignal(signal), signal),
    fetchAllPages<TableRow<'items'>>((from, to) => supabase.from('items').select('*').order('id').range(from, to).abortSignal(signal), signal),
    fetchAllPages<TableRow<'item_templates'>>((from, to) => supabase.from('item_templates').select('*').order('id').range(from, to).abortSignal(signal), signal),
    fetchAllPages<TableRow<'item_template_fields'>>((from, to) => supabase.from('item_template_fields').select('*').order('display_order').order('id').range(from, to).abortSignal(signal), signal),
    fetchAllPages<{ item_id: number; collection_id: number }>((from, to) => supabase.from('item_collections').select('item_id, collection_id').order('item_id').order('collection_id').range(from, to).abortSignal(signal), signal),
  ]);

  return {
    collections,
    items: items.map(toItemRecord),
    // Each template carries its fields (in display order): an item drawn through its template's layout
    // needs them to know which attribute each field element reads and what it is called.
    templates: templates.map((template) =>
      toItemTemplate(
        template,
        templateFields.filter((field) => field.template_id === template.id).map(toFieldDefinition)
      )
    ),
    itemLinks,
  };
}

/** Resolves when the database answers a trivial query; throws its error otherwise. */
export async function checkDatabaseConnection(signal: AbortSignal): Promise<void> {
  const { error } = await supabase.from('collections').select('id').limit(1).abortSignal(signal);
  if (error) throw new Error(error.message);
}
