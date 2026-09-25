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

// Sentinel for the "select none" filter state: an id no real collection can ever have, so
// `.includes()` checks downstream naturally exclude every collection while the array stays
// non-empty (distinct from the reserved "empty = show all" state). See the handlers below.
const NONE_COLLECTION_FILTER_ID = -1;

export function useTreePanels({ unifiedForest, allItems, allCollections, templates }: TreeData) {
  const activeTreeTab: TreeTab = 'items';
  const [activeSearchPanel, setActiveSearchPanel] = useState<'items' | 'collections' | 'templates'>('items');
  const [collectionsFilterIds, setCollectionsFilterIds] = useState<number[]>([]);
  const [templatesFilterIds, setTemplatesFilterIds] = useState<number[]>([]);
  const [filterCollectionIds, setFilterCollectionIds] = useState<number[]>([]);

  // An empty filter array means "nothing excluded" -- shown as every box checked, not every box
  // unchecked, since that's what it actually does (matches every collection). Toggling treats
  // "empty" as "everything currently selected" and unchecking one; toggling back up to the full
  // set collapses back to empty rather than sitting at a redundant "all N listed" state, which
  // would needlessly show the "filter applied" indicator for a filter that changes nothing.
  const handleToggleFilterCollection = (id: number) => {
    setFilterCollectionIds((prev) => {
      const allIds = allCollections.map((c) => c.id);
      const effective = prev.length === 0 ? allIds : prev;
      const next = effective.includes(id) ? effective.filter((v) => v !== id) : [...effective, id];
      return next.length === allIds.length ? [] : next;
    });
  };

  const handleClearCollectionFilters = () => {
    setFilterCollectionIds([]);
  };

  const handleSelectNoneFilterCollection = () => {
    setFilterCollectionIds([NONE_COLLECTION_FILTER_ID]);
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
    setCollectionsFilterIds((prev) => {
      const allIds = allCollections.map((c) => c.id);
      const effective = prev.length === 0 ? allIds : prev;
      const next = effective.includes(id) ? effective.filter((v) => v !== id) : [...effective, id];
      return next.length === allIds.length ? [] : next;
    });
  };

  const handleSelectNoneCollectionsFilter = () => {
    setCollectionsFilterIds([NONE_COLLECTION_FILTER_ID]);
  };

  const templatesForest = useMemo(() => filterTreeForest(
    unifiedForest, templatesFilterIds, 'templates', allItems, allCollections, templates
  ), [unifiedForest, templatesFilterIds, allItems, allCollections, templates]);
  const templatesTree = useTreeCategories(templatesForest, false);
  const handleToggleTemplatesFilter = (id: number) => {
    setTemplatesFilterIds((prev) => {
      const allIds = allCollections.map((c) => c.id);
      const effective = prev.length === 0 ? allIds : prev;
      const next = effective.includes(id) ? effective.filter((v) => v !== id) : [...effective, id];
      return next.length === allIds.length ? [] : next;
    });
  };

  const handleSelectNoneTemplatesFilter = () => {
    setTemplatesFilterIds([NONE_COLLECTION_FILTER_ID]);
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
    handleSelectNoneFilterCollection,
    filteredForest,
    collectionsForest,
    collectionsTree,
    handleToggleCollectionsFilter,
    handleSelectNoneCollectionsFilter,
    templatesForest,
    templatesTree,
    handleToggleTemplatesFilter,
    handleSelectNoneTemplatesFilter,
    searchQuery,
    setSearchQuery,
    expandedCategoryIds,
    isAnyCategoryExpanded,
    handleToggleCategory,
    handleToggleAllCategories,
  };
}
