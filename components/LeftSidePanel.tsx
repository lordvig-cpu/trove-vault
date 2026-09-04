'use client';

import React from 'react';
import { PinFilledIcon } from '@/components/icons/PinIcons';

interface LeftSidePanelProps {
  isPinned: boolean;
  onTogglePin: () => void;
  allCollectionsCount: number;
  allItemsCount: number;
  activeCollectionId: number | null;
  onAddNewItem: () => void;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  animationsEnabled: boolean;
}

export default function LeftSidePanel({
  isPinned,
  onTogglePin,
  allCollectionsCount,
  allItemsCount,
  activeCollectionId,
  onAddNewItem,
  loading,
  error,
  animationsEnabled,
  children,
}: LeftSidePanelProps) {
  const transitionClass = animationsEnabled ? 'transition-all duration-700 ease-in-out' : 'transition-none';

  return (
    <aside
      className={`left-side-panel ${transitionClass} ${
        isPinned ? 'left-side-panel-pinned' : 'left-side-panel-unpinned'
      }`}
    >
      {/* Header */}
      <div className="left-side-panel-header">
        <div>
          <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
            Explorer
          </span>
          <span className="text-[10px] text-content-muted font-mono">
            {allCollectionsCount} Folders • {allItemsCount} Items
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {activeCollectionId && (
            <button
              type="button"
              onClick={onAddNewItem}
              className="text-[11px] font-semibold text-accent-secondary hover:text-accent-primary shrink-0 cursor-pointer"
            >
              + New Item
            </button>
          )}

          {/* PIN / UNPIN BUTTON */}
          <button
            type="button"
            onClick={onTogglePin}
            className="left-side-panel-pin-btn"
            title={isPinned ? 'Unpin LeftSidePanel' : 'Pin LeftSidePanel'}
          >
            <PinFilledIcon className="w-3.5 h-3.5 text-content-primary" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="left-side-panel-notice-loading animate-pulse">
          ⏳ Syncing hierarchy...
        </div>
      )}

      {error && (
        <div className="left-side-panel-notice-error">
          {error}
        </div>
      )}

      {/* Explorer Tree Body */}
      <div className="flex-1 pb-4 min-w-0">
        {children}
      </div>
    </aside>
  );
}