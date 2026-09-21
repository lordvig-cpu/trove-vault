'use client';

import React, { createContext, useContext } from 'react';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';

export interface TreeActionsContextValue {
  onAddSubItem: (collectionId: number | null, parentItemId?: number | null) => void;
  onEditTemplate?: (categoryId: number) => void;
  onEditItem: (item: ItemRecord, collectionId: number | null) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number | null) => void;
  onRenameItem?: (id: number, nextName: string) => Promise<void> | void;
  onRenameCollection?: (id: number, nextName: string) => Promise<void> | void;
  onRenameTemplate?: (id: number, nextName: string) => Promise<void> | void;
  onDeleteCollection?: (collection: CollectionRecord) => void;
  onDeleteTemplate?: (id: number) => Promise<void> | void;
  onEditCollection?: (collection: CollectionRecord) => void;
  onAddSubCollection?: (parentCollectionId: number) => void;
}

const TreeActionsContext = createContext<TreeActionsContextValue | null>(null);

export function TreeActionsProvider({
  value,
  children,
}: {
  value: TreeActionsContextValue;
  children: React.ReactNode;
}) {
  return (
    <TreeActionsContext.Provider value={value}>
      {children}
    </TreeActionsContext.Provider>
  );
}

export function useTreeActions() {
  const context = useContext(TreeActionsContext);
  if (!context) {
    throw new Error('useTreeActions must be used within an TreeActionsProvider');
  }
  return context;
}
