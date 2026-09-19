'use client';

import React, { createContext, useContext } from 'react';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';

export interface ExplorerActionsContextValue {
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

const ExplorerActionsContext = createContext<ExplorerActionsContextValue | null>(null);

export function ExplorerActionsProvider({
  value,
  children,
}: {
  value: ExplorerActionsContextValue;
  children: React.ReactNode;
}) {
  return (
    <ExplorerActionsContext.Provider value={value}>
      {children}
    </ExplorerActionsContext.Provider>
  );
}

export function useExplorerActions() {
  const context = useContext(ExplorerActionsContext);
  if (!context) {
    throw new Error('useExplorerActions must be used within an ExplorerActionsProvider');
  }
  return context;
}
