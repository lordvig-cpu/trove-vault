'use client';

import { useState, useMemo, useCallback } from 'react';

/* ==========================================================================
   NODE CONTRACT
   Represents any expandable structural node in the tree hierarchy
   (categories, collections, sub-collections).
   ========================================================================== */
export interface ExplorerNodeLike {
  id: number;
  subCollections?: ExplorerNodeLike[];
}

/* ==========================================================================
   CUSTOM HOOK: useExplorerCategories
   Manages tree node expansion state, bulk expand/collapse operations,
   and local query state for the explorer sidebar.
   ========================================================================== */
export function useExplorerCategories(nodes: ExplorerNodeLike[] = []) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());

  // Recursively extract all IDs from the forest (virtual categories, collections, sub-collections)
  const allNodeIds = useMemo(() => {
    const extractIds = (items: ExplorerNodeLike[]): number[] => {
      return items.flatMap((node) => [
        node.id,
        ...(node.subCollections ? extractIds(node.subCollections) : []),
      ]);
    };
    return extractIds(nodes);
  }, [nodes]);

  const isAnyCategoryExpanded = useMemo(() => {
    return expandedCategoryIds.size > 0;
  }, [expandedCategoryIds]);

  const handleToggleCategory = useCallback((categoryId: number) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleToggleAllCategories = useCallback(() => {
    setExpandedCategoryIds((prev) => {
      if (prev.size > 0) {
        return new Set();
      }
      return new Set(allNodeIds);
    });
  }, [allNodeIds]);

  return {
    searchQuery,
    setSearchQuery,
    expandedCategoryIds,
    isAnyCategoryExpanded,
    handleToggleCategory,
    handleToggleAllCategories,

    // Backward-compatibility aliases for smooth transition across remaining components
    expandedFolderIds: expandedCategoryIds,
    isAnyFolderExpanded: isAnyCategoryExpanded,
    handleToggleFolder: handleToggleCategory,
    handleToggleAllFolders: handleToggleAllCategories,
  };
}