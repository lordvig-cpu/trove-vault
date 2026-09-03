'use client';

import React from 'react';
import UnifiedExplorerTree, { UnifiedCollectionNode } from './UnifiedExplorerTree';
import { CollectionRecord } from './CollectionDropdown';
import { ItemRecord } from './TreeNode';
import { UniversalSearchResultItem } from '@/app/page';
import { SearchScope } from './NavigationHeader';

interface ExplorerContentProps {
  searchScope: SearchScope;
  searchQuery: string;
  universalResults: UniversalSearchResultItem[];
  unifiedForest: UnifiedCollectionNode[];
  activeCollectionId: number | null;
  activeCollectionName?: string;
  selectedItemId: number | null;
  loading: boolean;
  isPinned?: boolean;
  setIsLeftSidePanelOpen?: (open: boolean) => void;
  onSelectCollection: (id: number) => void;
  onSelectItem: (item: ItemRecord, collectionId: number) => void;
  onAddSubItem: (collectionId: number, parentItemId?: number | null) => void;
  onOpenFolderDropdown: () => void;
  onRequestDeleteCollection: (col: CollectionRecord) => void;
  onEditItem: (item: ItemRecord, collectionId: number) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number) => void;
}

export default function ExplorerContent({
  searchScope,
  searchQuery,
  universalResults,
  unifiedForest,
  activeCollectionId,
  activeCollectionName,
  selectedItemId,
  loading,
  isPinned = true,
  setIsLeftSidePanelOpen,
  onSelectCollection,
  onSelectItem,
  onAddSubItem,
  onOpenFolderDropdown,
  onRequestDeleteCollection,
  onEditItem,
  onDeleteItem,
}: ExplorerContentProps) {
  if (searchScope === 'all' && searchQuery) {
    return (
      <div className="space-y-1.5 w-full min-w-0">
        {universalResults.length === 0 ? (
          <div className="text-xs text-content-muted text-center py-6">
            No matches found across any collection.
          </div>
        ) : (
          universalResults.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item, item.collection_id)}
              className={`p-2 rounded-lg border transition cursor-pointer flex flex-col gap-0.5 ${
                selectedItemId === item.id
                  ? 'bg-accent-primary/20 border-accent-primary shadow-md'
                  : 'bg-surface border-border-subtle hover:border-border-strong'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-content-primary whitespace-nowrap truncate">
                  {item.name}
                </span>
                <span className="text-[10px] font-mono text-accent-secondary shrink-0">
                  #{item.id}
                </span>
              </div>
              <span className="text-[10px] text-content-muted truncate">
                🗂️ {item.collection_name}
              </span>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-0.5 w-full min-w-0">
      {unifiedForest.length === 0 && !loading ? (
        <div className="text-xs text-content-muted text-center py-6">
          {searchQuery
            ? `No matches in ${activeCollectionName || 'this folder'}.`
            : 'No collections created yet.'}
        </div>
      ) : (
        unifiedForest.map((colNode) => (
          <UnifiedExplorerTree
            key={`root-col-${colNode.id}`}
            collection={colNode}
            activeCollectionId={activeCollectionId}
            selectedItemId={selectedItemId}
            onSelectCollection={(colId) => {
              onSelectCollection(colId);
              if (!isPinned && setIsLeftSidePanelOpen) {
                setIsLeftSidePanelOpen(false);
              }
            }}
            onSelectItem={onSelectItem}
            onAddSubCollection={onOpenFolderDropdown}
            onAddSubItem={onAddSubItem}
            onEditCollection={onOpenFolderDropdown}
            onDeleteCollection={onRequestDeleteCollection}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
          />
        ))
      )}
    </div>
  );
}