'use client';

import { useState, useCallback } from 'react';
import { CollectionRecord } from '@/types/collection2';
import { STANDALONE_COLLECTION_ID } from '@/lib/explorerUtils2';

/* ==========================================================================
   CUSTOM HOOK: useExplorerFolders2
   Manages local search filtering and expanded folder IDs for the V2 tree.
   Separating this from useCollections2 keeps the data layer lean.
   ========================================================================== */

export function useExplorerFolders2(allCollections: CollectionRecord[]) {
  /* ------------------------------------------------------------------------
     1. LOCAL SEARCH STATE
     Bound to LeftSidePanelHeader2 to filter the unified tree.
     ------------------------------------------------------------------------ */
  const [searchQuery, setSearchQuery] = useState<string>('');

  /* ------------------------------------------------------------------------
     2. EXPLICIT EXPANSION STATE
     Tracks open folder IDs using a Set for O(1) lookups during rendering.
     ------------------------------------------------------------------------ */
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());

  /* ------------------------------------------------------------------------
     3. DERIVED UI FLAGS
     ------------------------------------------------------------------------ */
  const isAnyFolderExpanded = expandedFolderIds.size > 0;

  /* ------------------------------------------------------------------------
     4. EVENT HANDLERS
     ------------------------------------------------------------------------ */

  /**
   * Bulk Toggle:
   * Collapses all folders if any are open, or expands every collection plus
   * the standalone root container if all are closed.
   */
  const handleToggleAllFolders = useCallback(() => {
    if (expandedFolderIds.size > 0) {
      setExpandedFolderIds(new Set());
    } else {
      const allIds = new Set([
        ...allCollections.map((c) => c.id),
        STANDALONE_COLLECTION_ID,
      ]);
      setExpandedFolderIds(allIds);
    }
  }, [expandedFolderIds.size, allCollections]);

  /**
   * Single Folder Toggle:
   * Adds or removes a specific collection ID from the expansion Set.
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

export const useExplorerFolders = useExplorerFolders2;