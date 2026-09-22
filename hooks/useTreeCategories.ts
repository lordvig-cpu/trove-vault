'use client';

import { useState, useMemo, useCallback } from 'react';

/* ==========================================================================
   NODE CONTRACT
   Represents any expandable structural node in the tree hierarchy
   (categories, collections, sub-collections).
   ========================================================================== */
export interface TreeNodeLike {
  id: number;
  subCollections?: TreeNodeLike[];
}

/* ==========================================================================
   CUSTOM HOOK: useTreeCategories
   Manages tree node expansion state, bulk expand/collapse operations,
   and local query state for the tree sidebar.
   ========================================================================== */
export function useTreeCategories(nodes: TreeNodeLike[] = [], initialExpanded: boolean = true) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());

  // Recursively extract all IDs from the forest (virtual categories, collections, sub-collections)
  const allNodeIds = useMemo(() => {
    const extractIds = (items: TreeNodeLike[]): number[] => {
      return items.flatMap((node) => [
        node.id,
        ...(node.subCollections ? extractIds(node.subCollections) : []),
      ]);
    };
    return extractIds(nodes);
  }, [nodes]);

  const [hasInitialized, setHasInitialized] = useState(false);
  const [prevNodeIds, setPrevNodeIds] = useState<number[]>([]);

  // Automatically expand all tree nodes on initial load or when view transitions across forests
  // (unless initialExpanded is false). Adjusted during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (allNodeIds.length > 0 && allNodeIds !== prevNodeIds) {
    const isNewForest = prevNodeIds.length === 0 || !allNodeIds.some((id) => prevNodeIds.includes(id));

    if (!hasInitialized || isNewForest) {
      setExpandedCategoryIds(initialExpanded ? new Set(allNodeIds) : new Set());
      setHasInitialized(true);
    }
    setPrevNodeIds(allNodeIds);
  }

  const isAnyCategoryExpanded = useMemo(() => {
    return expandedCategoryIds.size > 0;
  }, [expandedCategoryIds]);

  const handleToggleCategory = useCallback((categoryId: number, forceState?: boolean) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      const shouldExpand = forceState !== undefined ? forceState : !next.has(categoryId);
      if (shouldExpand) {
        next.add(categoryId);
      } else {
        next.delete(categoryId);
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
  };
}