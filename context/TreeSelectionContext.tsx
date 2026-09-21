'use client';

import React, { createContext, useContext } from 'react';
import { ItemRecord } from '@/types/item';
import type { TreeSearchHighlight } from '@/lib/treeUtils';

export interface TreeSelectionContextValue {
  searchHighlight?: TreeSearchHighlight | null;
  activeCollectionId: number | null;
  selectedItemId: number | null;
  expandedCategoryIds?: Set<number>;
  onToggleCategory?: (id: number, expand: boolean) => void;
  onSelectCollection: (id: number) => void;
  onSelectItem: (item: ItemRecord, collectionId: number | null) => void;
  position?: 'left' | 'right';
}

const TreeSelectionContext = createContext<TreeSelectionContextValue | null>(null);

export function TreeSelectionProvider({
  value,
  children,
}: {
  value: TreeSelectionContextValue;
  children: React.ReactNode;
}) {
  return (
    <TreeSelectionContext.Provider value={value}>
      {children}
    </TreeSelectionContext.Provider>
  );
}

export function useTreeSelection() {
  const context = useContext(TreeSelectionContext);
  if (!context) {
    throw new Error('useTreeSelection must be used within an TreeSelectionProvider');
  }
  return context;
}
