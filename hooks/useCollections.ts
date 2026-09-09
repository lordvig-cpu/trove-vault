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

export function useCollections() {
  const [allCollections, setAllCollections] = useState<CollectionRecord[]>([]);
  const [allItems, setAllItems] = useState<ItemRecord[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);

  // Search state & scope
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('current');
  const [universalResults, setUniversalResults] = useState<UniversalSearchResultItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(
    async (preferredActiveCollectionId?: number | null) => {
      try {
        setLoading(true);
        setError(null);

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

        if (collections.length > 0) {
          const targetId =
            preferredActiveCollectionId !== undefined
              ? preferredActiveCollectionId
              : activeCollectionId;
          const exists = collections.some((c) => c.id === targetId);
          const nextValidId = exists && targetId ? targetId : collections[0].id;

          setActiveCollectionId(nextValidId);

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

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Universal Search Resolution
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

  // Memoized Unified Forest
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

  // Direct Rename Mutations
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