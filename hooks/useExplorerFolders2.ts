'use client';

import { useState, useMemo, useCallback } from 'react';

export interface FolderNodeLike {
  id: number;
  subCollections?: FolderNodeLike[];
}

export function useExplorerFolders2(nodes: FolderNodeLike[] = []) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());

  // Recursively extract all IDs from the forest (handles root folders, virtual folders, and sub-folders)
  const allFolderIds = useMemo(() => {
    const extractIds = (items: FolderNodeLike[]): number[] => {
      return items.flatMap((node) => [
        node.id,
        ...(node.subCollections ? extractIds(node.subCollections) : []),
      ]);
    };
    return extractIds(nodes);
  }, [nodes]);

  const isAnyFolderExpanded = useMemo(() => {
    return expandedFolderIds.size > 0;
  }, [expandedFolderIds]);

  const handleToggleFolder = useCallback((folderId: number) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleToggleAllFolders = useCallback(() => {
    setExpandedFolderIds((prev) => {
      if (prev.size > 0) {
        return new Set();
      }
      return new Set(allFolderIds);
    });
  }, [allFolderIds]);

  return {
    searchQuery,
    setSearchQuery,
    expandedFolderIds,
    isAnyFolderExpanded,
    handleToggleFolder,
    handleToggleAllFolders,
  };
}