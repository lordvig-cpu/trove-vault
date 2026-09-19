'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';
import {
  buildItemHierarchy,
  buildFilteredUnifiedForest,
} from '@/lib/explorerUtils';
import { fetchAllPages } from '@/lib/fetchAllPages';
import { ItemTemplate } from '@/types/template';

/* ==========================================================================
   CUSTOM HOOK: useCollections
   The primary data layer for TroveVault. Handles remote Supabase fetching,
   local mutations, taxonomy template linking, tree traversal, and search.
   ========================================================================== */
export function useCollections() {
  /* ------------------------------------------------------------------------
     1. RAW DATA STATE
     Stores flat arrays of database records and category templates.
     ------------------------------------------------------------------------ */
  const [allCollections, setAllCollections] = useState<CollectionRecord[]>([]);
  const [allItems, setAllItems] = useState<ItemRecord[]>([]);
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);

  /* ------------------------------------------------------------------------
     2. ACTIVE SELECTION STATE
     Tracks which collection or category is active and which item is on canvas.
     ------------------------------------------------------------------------ */
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);

  /* ------------------------------------------------------------------------
     4. UI FEEDBACK STATE
     Tracks loading and error states during async remote Supabase mutations.
     ------------------------------------------------------------------------ */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ==========================================================================
     DATA FETCHING & SYNCING
     ========================================================================== */

  /**
   * Fetches all collections, items, and taxonomy templates concurrently.
   */
  const requestRef = useRef<AbortController | null>(null);

  const fetchAllData = useCallback(
    async (preferredActiveCollectionId?: number | null) => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      const signal = controller.signal;
      try {
        setLoading(true);
        setError(null);

        const [fetchedCollections, rawItems, fetchedTemplates, itemLinks] = await Promise.all([
          fetchAllPages<CollectionRecord>((from, to) => supabase.from('collections').select('*').order('id').range(from, to).abortSignal(signal), signal),
          fetchAllPages<ItemRecord>((from, to) => supabase.from('items').select('*').order('id').range(from, to).abortSignal(signal), signal),
          fetchAllPages<ItemTemplate>((from, to) => supabase.from('item_templates').select('*').order('id').range(from, to).abortSignal(signal), signal),
          fetchAllPages<{ item_id: number; collection_id: number }>((from, to) => supabase.from('item_collections').select('item_id, collection_id').order('item_id').order('collection_id').range(from, to).abortSignal(signal), signal),
        ]);

        const itemCollectionsMap = new Map<number, number[]>();
        itemLinks.forEach(
          ({ item_id, collection_id }) => {
            if (!itemCollectionsMap.has(item_id)) itemCollectionsMap.set(item_id, []);
            itemCollectionsMap.get(item_id)!.push(collection_id);
          }
        );

        const fetchedItems: ItemRecord[] = rawItems.map((it) => {
          const colIds = itemCollectionsMap.get(it.id) || [];
          return {
            ...it,
            collection_ids: colIds,
            collection_id: colIds.length > 0 ? colIds[0] : null,
          };
        });

        setAllCollections(fetchedCollections);
        setAllItems(fetchedItems);
        setTemplates(fetchedTemplates);


        setActiveCollectionId(current => {
          const target = preferredActiveCollectionId === undefined ? current : preferredActiveCollectionId;
          return fetchedCollections.some(collection => collection.id === target) ? target : fetchedCollections[0]?.id ?? null;
        });
        setSelectedItem(current => {
          if (!current) return null;
          const found = fetchedItems.find(item => item.id === current.id);
          return found ? { ...found, children: buildItemHierarchy(fetchedItems, found.id) } : null;
        });
      } catch (error: unknown) {
        if (signal.aborted) return;
        controller.abort();
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        if (requestRef.current === controller) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // Defer startup so Strict Mode can cancel its throwaway mount before fetching.
    const timer = setTimeout(() => { void fetchAllData(); }, 0);
    return () => {
      clearTimeout(timer);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [fetchAllData]);

  /* ==========================================================================
     SEARCH & TREE MEMOIZATION
     ========================================================================== */

  /**
   * Memoized Unified Forest
   * Combines user-curated collections and dynamic taxonomy categories.
   */
  const unifiedForest = useMemo(() => {
    return buildFilteredUnifiedForest(
      allCollections,
      allItems,
      null,
      activeCollectionId,
      '',
      'current',
      templates
    );
  }, [allCollections, allItems, activeCollectionId, templates]);

  const activeCollection = allCollections.find((c) => c.id === activeCollectionId) || null;

  /* ==========================================================================
     LOCAL MUTATIONS & ACTIONS
     ========================================================================== */

  /**
   * Selects an item for the main canvas and hydrates its immediate children.
   * collectionId is nullable to support standalone category-managed items.
   */
  const selectItemWithChildren = useCallback(
    (item: ItemRecord, collectionId: number | null) => {
      setActiveCollectionId(collectionId);
      setSelectedItem({
        ...item,
        children: buildItemHierarchy(allItems, item.id),
      });
    },
    [allItems]
  );

  /**
   * Inline Collection Rename
   */
  const renameCollection = useCallback(
    async (id: number, nextName: string) => {
      const trimmed = nextName.trim();
      if (!trimmed) return;

      const { error: updateError } = await supabase
        .from('collections')
        .update({ name: trimmed })
        .eq('id', id);

      if (updateError) {
        console.error('Failed to rename collection:', updateError);
        throw updateError;
      }

      setAllCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      );
    },
    []
  );

  /**
   * Inline Item Rename
   */
  const renameItem = useCallback(
    async (id: number, nextName: string) => {
      const trimmed = nextName.trim();
      if (!trimmed) return;

      const { error: updateError } = await supabase
        .from('items')
        .update({ name: trimmed })
        .eq('id', id);

      if (updateError) {
        console.error('Failed to rename item:', updateError);
        throw updateError;
      }

      setAllItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, name: trimmed } : i))
      );

      setSelectedItem((prev) =>
        prev && prev.id === id ? { ...prev, name: trimmed } : prev
      );
    },
    []
  );

  /**
   * Inline Template Rename
   */
  const renameTemplate = useCallback(
    async (id: number, nextName: string) => {
      const trimmed = nextName.trim();
      if (!trimmed) return;

      const { error: updateError } = await supabase
        .from('item_templates')
        .update({ name: trimmed })
        .eq('id', id);

      if (updateError) {
        console.error('Failed to rename template:', updateError);
        throw updateError;
      }

      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name: trimmed } : t))
      );
    },
    []
  );

  /**
   * Delete Template
   */
  const deleteTemplate = useCallback(
    async (id: number) => {
      const { error: deleteError } = await supabase
        .from('item_templates')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Failed to delete template:', deleteError);
        throw deleteError;
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id));
    },
    []
  );

  return {
    allCollections,
    allItems,
    templates,
    activeCollectionId,
    setActiveCollectionId,
    activeCollection,
    selectedItem,
    setSelectedItem,
    selectItemWithChildren,
    renameCollection,
    renameItem,
    renameTemplate,
    deleteTemplate,
    unifiedForest,
    loading,
    error,
    fetchAllData,
  };
}
