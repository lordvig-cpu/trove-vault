'use client';

import React, { createContext, useContext } from 'react';
import { ItemRecord } from '@/types/item';
import type { ExplorerSearchHighlight } from '@/lib/explorerUtils';

export interface ExplorerSelectionContextValue {
  searchHighlight?: ExplorerSearchHighlight | null;
  activeCollectionId: number | null;
  selectedItemId: number | null;
  expandedCategoryIds?: Set<number>;
  onToggleCategory?: (id: number, expand: boolean) => void;
  onSelectCollection: (id: number) => void;
  onSelectItem: (item: ItemRecord, collectionId: number | null) => void;
  position?: 'left' | 'right';
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
