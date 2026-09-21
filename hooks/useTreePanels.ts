'use client';

import { useState, useMemo } from 'react';
import { useTreeCategories } from '@/hooks/useTreeCategories';
import { filterTreeForest, TreeTab } from '@/lib/filterTreeForest';
import type { CollectionRecord } from '@/types/collection';
import type { ItemRecord } from '@/types/item';
import type { ItemTemplate } from '@/types/template';

/* ==========================================================================
   The Items, Collections and Templates tree panels: their filters, the filtered forests, and the
   expand/collapse and search state of each. Moved out of app/page.tsx without changing behavior.
   ========================================================================== */

interface TreeData {
  unifiedForest: Parameters<typeof filterTreeForest>[0];
  allItems: ItemRecord[];
  allCollections: CollectionRecord[];
  templates: ItemTemplate[];
}

export function useTreePanels({ unifiedForest, allItems, allCollections, templates }: TreeData) {
  const activeTreeTab: TreeTab = 'items';
  const [activeSearchPanel, setActiveSearchPanel] = useState<'items' | 'collections' | 'templates'>('items');
  const [collectionsFilterIds, setCollectionsFilterIds] = useState<number[]>([]);
  const [templatesFilterIds, setTemplatesFilterIds] = useState<number[]>([]);
  const [filterCollectionIds, setFilterCollectionIds] = useState<number[]>([]);

  const handleToggleFilterCollection = (id: number) => {
    setFilterCollectionIds((prev) => 
      prev.includes(id) ? prev.filter((colId) => colId !== id) : [...prev, id]
    );
  };

  const handleClearCollectionFilters = () => {
    setFilterCollectionIds([]);
  };

  const filteredForest = useMemo(() => filterTreeForest(
    unifiedForest,
    filterCollectionIds,
    activeTreeTab,
    allItems,
    allCollections,
    templates
  ), [unifiedForest, filterCollectionIds, activeTreeTab, allItems, allCollections, templates]);

  const {
    searchQuery,
    setSearchQuery,
    expandedCategoryIds,
    isAnyCategoryExpanded,
    handleToggleCategory,
    handleToggleAllCategories,
  } = useTreeCategories(filteredForest);

  const collectionsForest = useMemo(() => filterTreeForest(
    unifiedForest, collectionsFilterIds, 'collections', allItems, allCollections, templates
  ), [unifiedForest, collectionsFilterIds, allItems, allCollections, templates]);
  const collectionsTree = useTreeCategories(collectionsForest);
  const handleToggleCollectionsFilter = (id: number) => {
    setCollectionsFilterIds(prev => prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]);
  };

  const templatesForest = useMemo(() => filterTreeForest(
    unifiedForest, templatesFilterIds, 'templates', allItems, allCollections, templates
  ), [unifiedForest, templatesFilterIds, allItems, allCollections, templates]);
  const templatesTree = useTreeCategories(templatesForest, false);
  const handleToggleTemplatesFilter = (id: number) => {
    setTemplatesFilterIds(prev => prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]);
  };

  return {
    activeSearchPanel,
    setActiveSearchPanel,
    collectionsFilterIds,
    setCollectionsFilterIds,
    templatesFilterIds,
    setTemplatesFilterIds,
    filterCollectionIds,
    handleToggleFilterCollection,
    handleClearCollectionFilters,
    filteredForest,
    collectionsForest,
    collectionsTree,
    handleToggleCollectionsFilter,
    templatesForest,
    templatesTree,
    handleToggleTemplatesFilter,
    searchQuery,
    setSearchQuery,
    expandedCategoryIds,
    isAnyCategoryExpanded,
    handleToggleCategory,
    handleToggleAllCategories,
  };
}
