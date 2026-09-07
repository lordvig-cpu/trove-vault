'use client';

import React, { useState, useMemo } from 'react';
import UnifiedExplorerTree, { UnifiedCollectionNode } from '@/components/UnifiedExplorerTree';
import { ItemRecord } from '@/types/item';
import { CollectionRecord } from '@/types/collection';

export interface ExplorerContentProps {
  unifiedForest: UnifiedCollectionNode[];
  searchQuery?: string;
  activeCollectionId: number | null;
  selectedItemId: number | null;
  expandedFolderIds?: Set<number>;
  onToggleFolder?: (folderId: number, expand: boolean) => void;
  onSelectCollection: (id: number) => void;
  onSelectItem: (item: ItemRecord, collectionId: number) => void;
  onAddSubItem: (collectionId: number, parentItemId?: number | null) => void;
  onAddSubCollection?: (parentCollectionId: number) => void;
  onEditCollection?: (collection: CollectionRecord) => void;
  onDeleteCollection?: (collection: CollectionRecord) => void;
  onEditItem: (item: ItemRecord, collectionId: number) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number) => void;
}

// Helper: Recursively filter items by query
function filterItem(item: ItemRecord, query: string): { item: ItemRecord; hasMatch: boolean } {
  const nameMatches = item.name.toLowerCase().includes(query);
  let matchingChildren: ItemRecord[] = [];

  if (item.children && item.children.length > 0) {
    const childResults = item.children.map((child) => filterItem(child, query));
    matchingChildren = childResults.filter((r) => r.hasMatch).map((r) => r.item);
  }

  const hasMatch = nameMatches || matchingChildren.length > 0;
  return {
    item: {
      ...item,
      children: matchingChildren.length > 0 ? matchingChildren : item.children,
    },
    hasMatch,
  };
}

// Helper: Recursively filter collections and their items, tracking folders to auto-expand
function filterCollection(
  node: UnifiedCollectionNode,
  query: string,
  autoExpandSet: Set<number>
): UnifiedCollectionNode | null {
  const folderMatches = node.name.toLowerCase().includes(query);

  // Filter child items
  const matchingItems: ItemRecord[] = [];
  for (const item of node.items || []) {
    const result = filterItem(item, query);
    if (folderMatches || result.hasMatch) {
      matchingItems.push(folderMatches ? item : result.item);
    }
  }

  // Filter sub-folders
  const matchingSubCollections: UnifiedCollectionNode[] = [];
  for (const subCol of node.subCollections || []) {
    const filteredSub = filterCollection(subCol, query, autoExpandSet);
    if (filteredSub) matchingSubCollections.push(filteredSub);
  }

  const hasMatch = folderMatches || matchingItems.length > 0 || matchingSubCollections.length > 0;

  if (hasMatch) {
    autoExpandSet.add(node.id);
    return {
      ...node,
      items: matchingItems,
      subCollections: matchingSubCollections,
    };
  }

  return null;
}

export default function ExplorerContent({
  unifiedForest,
  searchQuery = '',
  activeCollectionId,
  selectedItemId,
  expandedFolderIds,
  onToggleFolder,
  onSelectCollection,
  onSelectItem,
  onAddSubItem,
  onAddSubCollection,
  onEditCollection,
  onDeleteCollection,
  onEditItem,
  onDeleteItem,
}: ExplorerContentProps) {
  // Filter forest and build set of folders to auto-expand during search
  const { filteredForest, searchExpandedIds } = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      return { filteredForest: unifiedForest, searchExpandedIds: null };
    }

    const autoExpand = new Set<number>();
    const results: UnifiedCollectionNode[] = [];

    for (const node of unifiedForest) {
      const filtered = filterCollection(node, trimmed, autoExpand);
      if (filtered) results.push(filtered);
    }

    return { filteredForest: results, searchExpandedIds: autoExpand };
  }, [unifiedForest, searchQuery]);

  const effectiveExpandedIds = searchExpandedIds
    ? new Set([...(expandedFolderIds || []), ...searchExpandedIds])
    : expandedFolderIds;

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      {/* TREE CONTENT / EMPTY RESULTS */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        {filteredForest.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <span className="text-xl mb-1 select-none">🔍</span>
            <p className="text-xs text-content-muted">No folders or items found</p>
          </div>
        ) : (
          filteredForest.map((node) => (
            <UnifiedExplorerTree
              key={`root-col-${node.id}`}
              collection={node}
              activeCollectionId={activeCollectionId}
              selectedItemId={selectedItemId}
              expandedFolderIds={effectiveExpandedIds}
              onToggleFolder={onToggleFolder}
              onSelectCollection={onSelectCollection}
              onSelectItem={onSelectItem}
              onAddSubCollection={onAddSubCollection}
              onAddSubItem={onAddSubItem}
              onEditCollection={onEditCollection}
              onDeleteCollection={onDeleteCollection}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          ))
        )}
      </div>
    </div>
  );
}