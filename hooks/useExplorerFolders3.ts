'use client';

import { useState, useCallback } from 'react';
import { CollectionRecord } from '@/types/collection';

/* ==========================================================================
   CUSTOM HOOK: useExplorerFolders
   Manages the local search query and the exact set of expanded collection
   folders. Separating this from useCollections keeps the main data layer
   clean and prevents unnecessary data re-fetches when just toggling UI state.
   ========================================================================== */

export function useExplorerFolders(allCollections: CollectionRecord[]) {
  /* ------------------------------------------------------------------------
     1. LOCAL SEARCH STATE
     Bound to the LeftSidePanelHeader input. Passed down to ExplorerContent
     to recursively filter the unified tree.
     ------------------------------------------------------------------------ */
  const [searchQuery, setSearchQuery] = useState<string>('');

  /* ------------------------------------------------------------------------
     2. EXPLICIT EXPANSION STATE
     Using a Set of IDs guarantees O(1) lookups during tree rendering and 
     allows us to persist specific opened/closed folder paths across renders.
     ------------------------------------------------------------------------ */
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());

  /* ------------------------------------------------------------------------
     3. DERIVED UI FLAGS
     Determines whether the bulk toggle button in the header should display
     "Expand All" (+) or "Collapse All" (-).
     ------------------------------------------------------------------------ */
  const isAnyFolderExpanded = expandedFolderIds.size > 0;

  /* ------------------------------------------------------------------------
     4. EVENT HANDLERS
     ------------------------------------------------------------------------ */

  /**
   * Bulk Toggle:
   * If any folders are open, collapses everything back to the root level.
   * If all folders are closed, iterates through all known collections and expands them.
   */
  const handleToggleAllFolders = useCallback(() => {
    if (expandedFolderIds.size > 0) {
      // Collapse everything: reset to empty set
      setExpandedFolderIds(new Set());
    } else {
      // Expand everything: map all collection IDs into a new Set
      const allIds = new Set(allCollections.map((c) => c.id));
      setExpandedFolderIds(allIds);
    }
  }, [expandedFolderIds.size, allCollections]);

  /**
   * Single Folder Toggle:
   * Adds or removes a specific folder ID from the expansion Set.
   * Triggered by clicking the chevron or folder row in UnifiedExplorerTree.
   */
  const handleToggleFolder = useCallback((folderId: number, expand: boolean) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (expand) {
        next.add(folderId);
      } else {
        next.delete(folderId);
      }
      return next;
    });
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    expandedFolderIds,
    setExpandedFolderIds,
    isAnyFolderExpanded,
    handleToggleAllFolders,
    handleToggleFolder,
  };
}