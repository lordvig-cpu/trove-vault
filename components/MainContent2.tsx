'use client';

import React from 'react';
import ItemDetailView from './ItemDetailView2';
import { ItemRecord } from '@/types/item2';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

/**
 * Props for the MainContent2 viewport component.
 * @property selectedItem - Currently active item record to display inside ItemDetailView2 (or null)
 * @property activeCollectionId - ID of the collection enclosing the selected item (or null for standalone items)
 * @property isBlurred - Whether the canvas should apply backdrop blur (active when unpinned flyout is open)
 * @property onAddSubItem - Callback invoking modal creation for a child item
 * @property onEditItem - Callback opening edit modal dialog for the selected record
 * @property onDeleteItem - Callback opening deletion confirmation dialog for the selected record
 * @property rightPanelWidth - Footprint of the right utility drawer in pixels (used for scroll clearance)
 */
interface MainContentProps {
  selectedItem: ItemRecord | null;
  activeCollectionId: number | null;
  isBlurred: boolean;
  onAddSubItem: (collectionId: number | null, parentItemId: number | null) => void;
  onEditItem: (item: ItemRecord, collectionId: number | null) => void;
  onDeleteItem: (item: ItemRecord, collectionId: number | null) => void;
  rightPanelWidth?: number;
}

/* ==========================================================================
   2. MAIN COMPONENT: MainContent2
   ========================================================================== */

export default function MainContent2({
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
      {/* --------------------------------------------------------------------
          2.1 PRIMARY VERTICAL SCROLL CHASSIS
          Uses marginRight to pull the native scrollbar inward so it never sits
          trapped under the right side panel.
          flex-1 and min-h-0 guarantee strict vertical bounds without collapsing.
          -------------------------------------------------------------------- */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden main-content-scroll"
        style={{ marginRight: `${rightPanelWidth}px` }}
      >
        {/* ------------------------------------------------------------------
            2.2 CENTER RESTORATION WRAPPER
            Expands width by (100% + rightPanelWidth) to compensate for the margin.
            This ensures that mx-auto child blocks remain locked to the true
            horizontal center of the viewport, even while panels resize.
            ------------------------------------------------------------------ */}
        <div 
          className="min-h-full flex flex-col"
          style={{ width: `calc(100% + ${rightPanelWidth}px)` }}
        >
          {/* Main Stage Presentation Shell with Backdrop Filter Fades */}
          <main
            className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
              isBlurred
                ? 'filter blur-[var(--content-overlay-blur)] brightness-[var(--content-overlay-brightness-dim)] pointer-events-none select-none'
                : 'filter-none brightness-[var(--content-overlay-brightness-default)]'
            }`}
          >
            {/* Sticky Upper Atmosphere Vignette */}
            {selectedItem && <div className="sticky-shadow-top" aria-hidden="true" />}

            {/* Main Stage Record Canvas */}
            <div className="max-w-5xl mx-auto p-6 w-full flex-1 pt-10 pb-10">
              <ItemDetailView
                item={selectedItem}
                onAddSubItem={(parent) => {
                  onAddSubItem(activeCollectionId, parent.id);
                }}
                onEditItem={() => {
                  if (selectedItem) onEditItem(selectedItem, activeCollectionId);
                }}
                onDeleteItem={() => {
                  if (selectedItem) onDeleteItem(selectedItem, activeCollectionId);
                }}
              />
            </div>

            {/* Sticky Lower Atmosphere Vignette */}
            {selectedItem && <div className="sticky-shadow-bottom" aria-hidden="true" />}
          </main>
        </div>
      </div>
    </div>
  );
}

export const MainContent = MainContent2;