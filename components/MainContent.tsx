'use client';

import React from 'react';
import ItemDetailView from './ItemDetailView';
import { ItemRecord } from '@/types/item';

interface MainContentProps {
  selectedItem: ItemRecord | null;
  activeCollectionId: number | null;
  isBlurred: boolean;
  onAddSubItem: (collectionId: number, parentItemId: number | null) => void;
  onEditItem: (item: ItemRecord, collectionId: number) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number) => void;
}

export default function MainContent({
  selectedItem,
  activeCollectionId,
  isBlurred,
  onAddSubItem,
  onEditItem,
  onDeleteItem,
}: MainContentProps) {
  return (
    <div className="flex-1 min-h-0 relative flex flex-col z-10">
      <main
        className={`flex-1 flex flex-col min-h-0 overflow-y-auto relative main-content-scroll transition-all duration-300 ease-in-out ${
          isBlurred
            ? 'filter blur-[var(--content-overlay-blur)] brightness-[var(--content-overlay-brightness-dim)] pointer-events-none select-none'
            : 'filter-none brightness-[var(--content-overlay-brightness-default)]'
        }`}
      >
        {/* Sticky Upper Shadow */}
        {selectedItem && <div className="sticky-shadow-top" aria-hidden="true" />}

        {/* Main Content Viewport */}
        <div className="max-w-5xl mx-auto p-6 w-full flex-1 pt-10 pb-10">
          <ItemDetailView
            item={selectedItem}
            onAddSubItem={(parent) => {
              if (activeCollectionId) onAddSubItem(activeCollectionId, parent.id);
            }}
            onEditItem={() => {
              if (selectedItem && activeCollectionId) onEditItem(selectedItem, activeCollectionId);
            }}
            onDeleteItem={() => {
              if (selectedItem && activeCollectionId) onDeleteItem(selectedItem, activeCollectionId);
            }}
          />
        </div>

        {/* Sticky Lower Shadow */}
        {selectedItem && <div className="sticky-shadow-bottom" aria-hidden="true" />}
      </main>
    </div>
  );
}