'use client';

import React from 'react';
import { CollectionRecord } from '@/types/collection';
import { TreeBranchIcon } from '@/components/icons/TreeIcons';

type CollectionTreeNode = CollectionRecord & {
  children?: CollectionTreeNode[];
};

interface CollectionFilterTreeProps {
  collections: CollectionRecord[];
  filterCollectionIds: number[];
  onToggleFilterCollection: (collectionId: number) => void;
}

function buildCollectionTree(
  collections: CollectionRecord[],
  parentId: number | null = null
): CollectionTreeNode[] {
  return collections
    .filter((collection) => (collection.parent_id ?? null) === parentId)
    .map((collection) => ({
      ...collection,
      children: buildCollectionTree(collections, collection.id),
    }));
}

function addOrphanCollections(
  roots: CollectionTreeNode[],
  collections: CollectionRecord[]
) {
  const rootIds = new Set(roots.map((root) => root.id));

  collections.forEach((collection) => {
    const hasMissingParent =
      collection.parent_id !== null &&
      collection.parent_id !== undefined &&
      !collections.some((parent) => parent.id === collection.parent_id);

    if (hasMissingParent && !rootIds.has(collection.id)) {
      roots.push({ ...collection, children: [] });
    }
  });
}

export default function CollectionFilterTree({
  collections,
  filterCollectionIds,
  onToggleFilterCollection,
}: CollectionFilterTreeProps) {
  // An empty filter means "nothing excluded" -- shown as every box checked, not every box
  // unchecked, since that's what it actually matches (every collection). See useTreePanels.ts's
  // toggle handlers for the matching "empty means everything" logic on the write side.
  const hasFilters = filterCollectionIds.length > 0;
  const roots = buildCollectionTree(collections);
  addOrphanCollections(roots, collections);

  const renderNode = (node: CollectionTreeNode, depth = 0): React.ReactNode => {
    const isChecked = !hasFilters || filterCollectionIds.includes(node.id);
    const hasChildren = Boolean(node.children && node.children.length > 0);

    return (
      <div key={node.id} className="flex flex-col">
        <label
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`group tree-filter-row py-1.5 pr-2.5 rounded-md flex items-center justify-between cursor-pointer ${
            isChecked ? 'tree-filter-row-selected' : ''
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleFilterCollection(node.id)}
                className="tree-filter-checkbox w-3.5 h-3.5 rounded cursor-pointer"
              />
            </div>

            {depth > 0 && (
              <TreeBranchIcon className="w-3.5 h-3.5 -ml-1 mr-0.5" />
            )}

            <span className="text-sm tree-filter-icon shrink-0 select-none">{node.icon || '📁'}</span>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold tree-panel-primary truncate">{node.name}</span>
              {node.description && (
                <p className="text-[10px] tree-panel-muted truncate mt-0.5">
                  {node.description}
                </p>
              )}
            </div>
          </div>
        </label>

        {hasChildren && (
          <div className="tree-filter-nested border-t pt-0.5 flex flex-col">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tree-filter-shell flex flex-col mx-2 mb-1 rounded-md max-h-60 overflow-y-auto overflow-x-hidden left-panel-scroll p-1.5 space-y-1.5">
      {roots.map((root) => (
        <div
          key={root.id}
          className="tree-filter-root-card rounded-lg transition flex flex-col overflow-hidden"
        >
          {renderNode(root)}
        </div>
      ))}
    </div>
  );
}
