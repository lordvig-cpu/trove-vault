'use client';

import React, { createContext, useContext } from 'react';
import { ItemRecord } from '@/types/item';

export interface ExplorerSelectionContextValue {
  activeCollectionId: number | null;
  selectedItemId: number | null;
  expandedCategoryIds?: Set<number>;
  onToggleCategory?: (id: number, expand: boolean) => void;
  onSelectCollection: (id: number) => void;
  onSelectItem: (item: ItemRecord, collectionId: number | null) => void;
}

const ExplorerSelectionContext = createContext<ExplorerSelectionContextValue | null>(null);

export function ExplorerSelectionProvider({
  value,
  children,
}: {
  value: ExplorerSelectionContextValue;
  children: React.ReactNode;
}) {
  return (
    <ExplorerSelectionContext.Provider value={value}>
      {children}
    </ExplorerSelectionContext.Provider>
  );
}

export function useExplorerSelection() {
  const context = useContext(ExplorerSelectionContext);
  if (!context) {
    throw new Error('useExplorerSelection must be used within an ExplorerSelectionProvider');
  }
  return context;
}
