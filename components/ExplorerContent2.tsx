'use client';

import React, { useMemo } from 'react';
import UnifiedExplorerTree, { UnifiedCollectionNode } from '@/components/UnifiedExplorerTree2';
import { ItemRecord } from '@/types/item2';
import { CollectionRecord } from '@/types/collection2';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

/**
 * Props for the ExplorerContent2 tree container.
 * @property unifiedForest - Hierarchical tree data combining collections and nested/standalone items
 * @property searchQuery - Filter string supplied from the parent LeftSidePanel search bar
 * @property activeCollectionId - ID of the currently selected collection folder (or 0 for standalone)
 * @property selectedItemId - ID of the currently active item record displayed on canvas
 * @property expandedFolderIds - Set tracking open folder IDs from useExplorerFolders hook
 * @property onToggleFolder - Callback toggling accordion expansion state for a specific folder
 * @property onSelectCollection - Callback selecting an active root or sub-collection folder
 * @property onSelectItem - Callback selecting an item (accepts nullable collectionId for standalone items)
 * @property onAddSubItem - Triggers create-item modal under a specific parent folder/item
 * @property onAddSubCollection - Optional callback to create a nested sub-folder
 * @property onEditCollection - Optional callback to open collection editing dialog
 * @property onDeleteCollection - Callback prompting collection deletion modal confirmation
 * @property onRenameCollection - Inline folder rename handler executed from action popover
 * @property onEditItem - Callback opening edit-item modal dialog
 * @property onRenameItem - Inline item rename handler executed from action popover
 * @property onDeleteItem - Callback prompting item deletion modal confirmation
 */
export interface ExplorerContentProps {
  unifiedForest: UnifiedCollectionNode[];
  searchQuery?: string;
  activeCollectionId: number | null;
  selectedItemId: number | null;
  expandedFolderIds?: Set<number>;
  onToggleFolder?: (folderId: number, expand: boolean) => void;
  onSelectCollection: (id: number) => void;
  onSelectItem: (item: ItemRecord, collectionId: number | null) => void;
  onAddSubItem: (collectionId: number | null, parentItemId?: number | null) => void;
  onEditTemplate?: (categoryId: number) => void;
  onEditItem: (item: ItemRecord, collectionId: number | null) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number | null) => void;
  onRenameCollection?: (id: number, nextName: string) => Promise<void> | void;
  onDeleteCollection?: (collection: CollectionRecord) => void;
  onEditCollection?: (collection: CollectionRecord) => void;
  onRenameItem?: (id: number, nextName: string) => Promise<void> | void;
}

/* ==========================================================================
   2. RECURSIVE SEARCH & FILTERING UTILITIES
   ========================================================================== */

/**
 * Recursively filters items and their nested child records against the active search query.
 * Checks both item title and any custom attribute values.
 * Preserves the ancestor chain if any descendant record matches the search query.
 */
function filterItem(
  item: ItemRecord,
  query: string
): { item: ItemRecord; hasMatch: boolean } {
  const nameMatches = item.name.toLowerCase().includes(query);

  let attributeMatches = false;
  if (item.attributes) {
    for (const [key, value] of Object.entries(item.attributes)) {
      if (
        key.toLowerCase().includes(query) ||
        String(value).toLowerCase().includes(query)
      ) {
        attributeMatches = true;
        break;
      }
    }
  }

  let matchingChildren: ItemRecord[] = [];

  // Recurse into child items
  if (item.children && item.children.length > 0) {
    const childResults = item.children.map((child) => filterItem(child, query));
    matchingChildren = childResults
      .filter((r) => r.hasMatch)
      .map((r) => r.item);
  }

  const hasMatch = nameMatches || attributeMatches || matchingChildren.length > 0;

  return {
    item: {
      ...item,
      children: matchingChildren.length > 0 ? matchingChildren : item.children,
    },
    hasMatch,
  };
}

/**
 * Recursively filters a collection node, its sub-collections, and contained items.
 * Populates autoExpandSet with IDs of every folder enclosing a match so search results
 * are automatically revealed in the tree without requiring manual expansion clicks.
 */
function filterCollection(
  node: UnifiedCollectionNode,
  query: string,
  autoExpandSet: Set<number>
): UnifiedCollectionNode | null {
  const folderMatches = node.name.toLowerCase().includes(query);

  // 1. Filter direct items
  const matchingItems: ItemRecord[] = [];
  for (const item of node.items || []) {
    const result = filterItem(item, query);
    if (folderMatches || result.hasMatch) {
      // If the parent folder matches, include all items; otherwise include matching subtree
      matchingItems.push(folderMatches ? item : result.item);
    }
  }

  // 2. Filter nested sub-folders
  const matchingSubCollections: UnifiedCollectionNode[] = [];
  for (const subCol of node.subCollections || []) {
    const filteredSub = filterCollection(subCol, query, autoExpandSet);
    if (filteredSub) matchingSubCollections.push(filteredSub);
  }

  const hasMatch =
    folderMatches ||
    matchingItems.length > 0 ||
    matchingSubCollections.length > 0;

  if (hasMatch) {
    // Record folder ID to force expansion while search is active
    autoExpandSet.add(node.id);
    return {
      ...node,
      items: matchingItems,
      subCollections: matchingSubCollections,
    };
  }

  return null;
}

/* ==========================================================================
   3. MAIN COMPONENT: ExplorerContent
   ========================================================================== */

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
  onEditTemplate,
  onEditItem,
  onDeleteItem,
  onDeleteCollection,
  onRenameCollection,
  onEditCollection,
  onRenameItem,
}: ExplorerContentProps) {
  /* ------------------------------------------------------------------------
     3.1 SEARCH MEMOIZATION & AUTO-EXPAND CALCULATION
     Filters forest nodes whenever tree data or search text changes.
     Constructs searchExpandedIds containing all parent paths leading to matches.
     ------------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------------
     3.2 MERGED ACCORDION EXPANSION STATE
     When actively filtering, merges user-expanded folders with auto-expanded
     search result paths so existing user state is restored when search clears.
     ------------------------------------------------------------------------ */
  const effectiveExpandedIds = searchExpandedIds
    ? new Set([...(expandedFolderIds || []), ...searchExpandedIds])
    : expandedFolderIds;

  /* ------------------------------------------------------------------------
     3.3 TREE HIERARCHY RENDERING & EMPTY STATES
     ------------------------------------------------------------------------ */
  return (
    <div className="flex flex-col h-full w-full min-w-0">
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        {/* Zero Results Feedback State */}
        {filteredForest.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4 select-none">
            <span className="text-xl mb-1">🔍</span>
            <p className="text-xs text-content-muted">No folders or items found</p>
          </div>
        ) : (
          /* Forest Root Nodes */
          unifiedForest.map((colNode) => (
            <UnifiedExplorerTree
              key={`root-col-${colNode.id}`}
              collection={colNode}
              activeCollectionId={activeCollectionId}
              selectedItemId={selectedItemId}
              expandedFolderIds={expandedFolderIds}
              onToggleFolder={onToggleFolder}
              onSelectCollection={onSelectCollection}
              onSelectItem={onSelectItem}
              onAddSubItem={onAddSubItem}
              onEditTemplate={onEditTemplate}
              onEditItem={onEditItem}
              onRenameItem={onRenameItem}
              onDeleteItem={onDeleteItem}
              onRenameCollection={onRenameCollection}
              onDeleteCollection={onDeleteCollection}
              onEditCollection={onEditCollection}
            />
          ))
        )}
      </div>
    </div>
  );
}