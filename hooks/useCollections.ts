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

/* ==========================================================================
   CUSTOM HOOK: useCollections
   The primary data layer for TroveVault. Handles remote Supabase fetching,
   local state mutation, tree traversal, and search filtering.
   ========================================================================== */
export function useCollections() {
  /* ------------------------------------------------------------------------
     1. RAW DATA STATE
     Stores the flat arrays of records exactly as they arrive from the database.
     ------------------------------------------------------------------------ */
  const [allCollections, setAllCollections] = useState<CollectionRecord[]>([]);
  const [allItems, setAllItems] = useState<ItemRecord[]>([]);

  /* ------------------------------------------------------------------------
     2. ACTIVE SELECTION STATE
     Tracks which folder is open and which item is actively displayed on the canvas.
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
   * Fetches all collections and items from Supabase concurrently.
   * Gracefully restores the active collection and selected item pointers if they
   * still exist in the newly fetched data.
   */
  const fetchAllData = useCallback(
    async (preferredActiveCollectionId?: number | null) => {
      try {
        setLoading(true);
        setError(null);

        // Fetch folders and items in parallel for faster load times
        const [colsRes, itemsRes] = await Promise.all([
          supabase.from('collections').select('*').order('id', { ascending: true }),
          supabase.from('items').select('*').order('id', { ascending: true }),
        ]);

        if (colsRes.error) throw colsRes.error;
        if (itemsRes.error) throw itemsRes.error;

        const collections = (colsRes.data as CollectionRecord[]) || [];
        const items = (itemsRes.data as ItemRecord[]) || [];

        setAllCollections(collections);
        setAllItems(items);

        // Auto-resolve active pointers
        if (collections.length > 0) {
          const targetId =
            preferredActiveCollectionId !== undefined
              ? preferredActiveCollectionId
              : activeCollectionId;
          
          const exists = collections.some((c) => c.id === targetId);
          const nextValidId = exists && targetId ? targetId : collections[0].id;

          setActiveCollectionId(nextValidId);

          // Restore deeply-nested item selection
          if (selectedItem) {
            const found = items.find((i) => i.id === selectedItem.id);
            if (found) {
              setSelectedItem({
                ...found,
                children: buildItemHierarchy(items, found.id),
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
   * Universal Search Resolution
   * Triggers only when searching "All Collections". Generates a flat list
   * of matches across the entire database.
   */
  useEffect(() => {
    if (searchScope === 'all' && searchQuery.trim()) {
      const matches: UniversalSearchResultItem[] = allItems
        .filter((it) => itemMatchesQuery(it, searchQuery))
        .map((it) => ({
          ...it,
          collection_name:
            allCollections.find((c) => c.id === it.collection_id)?.name || 'Collection',
        }));
      setUniversalResults(matches);
    } else {
      setUniversalResults([]);
    }
  }, [searchQuery, searchScope, allItems, allCollections]);

  /**
   * Memoized Unified Forest
   * Rebuilds the nested folder/item tree only when raw data or search queries change.
   * This prevents expensive recursive recalculations on every render.
   */
  const unifiedForest = useMemo(() => {
    return buildFilteredUnifiedForest(
      allCollections,
      allItems,
      null,
      activeCollectionId,
      searchQuery,
      searchScope
    );
  }, [allCollections, allItems, activeCollectionId, searchQuery, searchScope]);

  // Convenience pointer for the active folder record
  const activeCollection = allCollections.find((c) => c.id === activeCollectionId) || null;

  /* ==========================================================================
     LOCAL MUTATIONS & ACTIONS
     ========================================================================== */

  /**
   * Selects an item for the main canvas and hydrates its immediate children.
   */
  const selectItemWithChildren = useCallback(
    (item: ItemRecord, collectionId: number) => {
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
   * Awaits Supabase confirmation, then updates local state to avoid a full refetch.
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
   * Awaits Supabase confirmation, then updates both the flat list and the active selection.
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