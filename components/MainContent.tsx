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
  rightPanelWidth?: number;
}

export default function MainContent({
  selectedItem,
  activeCollectionId,
  isBlurred,
  onAddSubItem,
  onEditItem,
  onDeleteItem,
  rightPanelWidth = 0,
}: MainContentProps) {
  return (
    <div className="flex-1 h-full min-h-0 relative z-20 flex flex-col">
      {/* 
        SCROLL CONTAINER: 
        Uses margin-right to pull the native scrollbar out from under the floating right panel.
        flex-1 and min-h-0 ensure it strictly fills the vertical space without height collapsing.
      */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden main-content-scroll"
        style={{ marginRight: `${rightPanelWidth}px` }}
      >
        {/* 
          RESTORATION WRAPPER: 
          Recalculates width to act as if the right margin does not exist. 
          Because it is wider than the scroll container, overflow-x-hidden hides the excess,
          but the mx-auto center point remains perfectly locked to the true screen width.
        */}
        <div 
          className="min-h-full flex flex-col"
          style={{ width: `calc(100% + ${rightPanelWidth}px)` }}
        >
          <main
            className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
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
      </div>
    </div>
  );
}