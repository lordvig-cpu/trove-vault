'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

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

  const hasInitialized = useRef(false);
  const prevIdsRef = useRef<number[]>([]);

  // Automatically expand all tree nodes on initial load or when view transitions across forests
  useEffect(() => {
    if (allNodeIds.length === 0) return;

    const prevIds = prevIdsRef.current;
    const isNewForest = prevIds.length === 0 || !allNodeIds.some((id) => prevIds.includes(id));

    if (!hasInitialized.current || isNewForest) {
      setExpandedCategoryIds(new Set(allNodeIds));
      hasInitialized.current = true;
    }
    prevIdsRef.current = allNodeIds;
  }, [allNodeIds]);

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