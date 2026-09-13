'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';
import { SearchScope } from '@/components/NavigationHeader';
import {
  itemMatchesQuery,
  buildItemHierarchy,
  buildFilteredUnifiedForest,
} from '@/lib/explorerUtils';
import { UniversalSearchResultItem } from '@/app/page';
import { CollectionTemplate } from '@/types/template';

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
  const [templates, setTemplates] = useState<CollectionTemplate[]>([]);

  /* ------------------------------------------------------------------------
     2. ACTIVE SELECTION STATE
     Tracks which collection or category is active and which item is on canvas.
     ------------------------------------------------------------------------ */
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);

  /* ------------------------------------------------------------------------
     3. SEARCH & FILTER STATE
     ------------------------------------------------------------------------ */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('current');
  const [universalResults, setUniversalResults] = useState<UniversalSearchResultItem[]>([]);

  /* ------------------------------------------------------------------------
     4. UI FEEDBACK STATE
     ------------------------------------------------------------------------ */
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* ==========================================================================
     DATA FETCHING & SYNCING
     ========================================================================== */

  /**
   * Fetches all collections, items, and taxonomy templates concurrently.
   */
  const fetchAllData = useCallback(
    async (preferredActiveCollectionId?: number | null) => {
      try {
        setLoading(true);
        setError(null);

        const [colsRes, itemsRes, tmplsRes] = await Promise.all([
          supabase.from('collections').select('*').order('id', { ascending: true }),
          supabase.from('items').select('*').order('id', { ascending: true }),
          supabase.from('collection_templates').select('*').order('id', { ascending: true }),
        ]);

        if (colsRes.error) throw colsRes.error;
        if (itemsRes.error) throw itemsRes.error;
        if (tmplsRes.error) throw tmplsRes.error;

        const fetchedCollections = (colsRes.data as CollectionRecord[]) || [];
        const fetchedItems = (itemsRes.data as ItemRecord[]) || [];
        const fetchedTemplates = (tmplsRes.data as CollectionTemplate[]) || [];

        setAllCollections(fetchedCollections);
        setAllItems(fetchedItems);
        setTemplates(fetchedTemplates);

        // Auto-resolve active collection pointer using fresh data
        if (fetchedCollections.length > 0) {
          const targetId =
            preferredActiveCollectionId !== undefined
              ? preferredActiveCollectionId
              : activeCollectionId;

          const exists = fetchedCollections.some((c) => c.id === targetId);
          const nextValidId = exists && targetId ? targetId : fetchedCollections[0].id;

          setActiveCollectionId(nextValidId);

          // Restore deeply-nested item selection using fresh data
          if (selectedItem) {
            const found = fetchedItems.find((i) => i.id === selectedItem.id);
            if (found) {
              setSelectedItem({
                ...found,
                children: buildItemHierarchy(fetchedItems, found.id),
              });
            }
          }
        } else {
          setActiveCollectionId(null);
          setSelectedItem(null);
        }
      } catch (err: any) {
        console.error('Failed to load explorer data:', err);
        setError(err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    },
    [activeCollectionId, selectedItem]
  );

  // Initial mount fetch
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==========================================================================
     SEARCH & TREE MEMOIZATION
     ========================================================================== */

  /**
   * Universal Search Resolution across all items
   */
  useEffect(() => {
    if (searchScope === 'all' && searchQuery.trim()) {
      const matches: UniversalSearchResultItem[] = allItems
        .filter((it) => itemMatchesQuery(it, searchQuery))
        .map((it) => ({
          ...it,
          collection_name:
            allCollections.find((c) => c.id === it.collection_id)?.name || 'Standalone Item',
        }));
      setUniversalResults(matches);
    } else {
      setUniversalResults([]);
    }
  }, [searchQuery, searchScope, allItems, allCollections]);

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
      searchQuery,
      searchScope,
      templates
    );
  }, [allCollections, allItems, activeCollectionId, searchQuery, searchScope, templates]);

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
    searchQuery,
    setSearchQuery,
    searchScope,
    setSearchScope,
    universalResults,
    unifiedForest,
    loading,
    error,
    fetchAllData,
  };
}