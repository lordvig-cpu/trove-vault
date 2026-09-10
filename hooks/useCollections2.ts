'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CollectionRecord } from '@/types/collection2';
import { ItemRecord } from '@/types/item2';
import { SearchScope } from '@/components/NavigationHeader2';
import {
  itemMatchesQuery,
  buildItemHierarchy,
  buildFilteredUnifiedForest,
} from '@/lib/explorerUtils2';
import { UniversalSearchResultItem } from '@/app/page2/page';

/* ==========================================================================
   CUSTOM HOOK: useCollections2
   The primary data layer for TroveVault V2. Handles remote Supabase fetching
   from collections2/items2, local mutations, tree traversal, and search filtering.
   ========================================================================== */
export function useCollections2() {
  /* ------------------------------------------------------------------------
     1. RAW DATA STATE
     Stores flat arrays of records exactly as they arrive from Supabase V2.
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
   * Fetches all collections and items from Supabase V2 concurrently.
   */
  const fetchAllData = useCallback(
    async (preferredActiveCollectionId?: number | null) => {
      try {
        setLoading(true);
        setError(null);

        // Query collections2 and items2 in parallel
        const [colsRes, itemsRes] = await Promise.all([
          supabase.from('collections2').select('*').order('id', { ascending: true }),
          supabase.from('items2').select('*').order('id', { ascending: true }),
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
   * Universal Search Resolution across items2
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

  const activeCollection = allCollections.find((c) => c.id === activeCollectionId) || null;

  /* ==========================================================================
     LOCAL MUTATIONS & ACTIONS
     ========================================================================== */

  /**
   * Selects an item for the main canvas and hydrates its immediate children.
   * collectionId is nullable to support independent items.
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
   * Inline Collection Rename on collections2
   */
  const renameCollection = useCallback(
    async (id: number, nextName: string) => {
      const trimmed = nextName.trim();
      if (!trimmed) return;

      const { error: updateError } = await supabase
        .from('collections2')
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
   * Inline Item Rename on items2
   */
  const renameItem = useCallback(
    async (id: number, nextName: string) => {
      const trimmed = nextName.trim();
      if (!trimmed) return;

      const { error: updateError } = await supabase
        .from('items2')
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