'use client';

import React from 'react';
import { CollectionRecord } from './CollectionDropdown';
import { ItemRecord } from './TreeNode';
import { PinOutlineIcon, PinFilledIcon } from '@/components/icons/PinIcons';

interface SidebarProps {
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

export default function Sidebar({
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
}: SidebarProps) {
  // Dynamic transition class based on toggle
  const transitionClass = animationsEnabled ? 'transition-all duration-700 ease-in-out' : 'transition-none';

  return (
    <aside
      className={`absolute left-0 top-[1px] bottom-0 bg-surface/80 flex flex-col gap-2.5 overflow-x-hidden overflow-y-auto shrink-0 ${transitionClass} z-50 ${isPinned
          ? 'w-76 max-w-76 border-r border-[rgba(81,155,255,0.85)] p-3 opacity-100 shadow-[14px_0_35px_-4px_rgba(0,0,0,0.85)] translate-x-0'
          : 'w-76 max-w-76 translate-x-46 border-r-0 p-3 opacity-0 pointer-events-none'
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2 shrink-0">
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
            className="group p-1.5 rounded-lg border border-transparent hover:border-border-subtle hover:bg-surface-hover transition cursor-pointer flex items-center justify-center shrink-0"
            title={isPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}
          >
            <PinFilledIcon className="w-3.5 h-3.5 text-content-primary" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-xs text-amber-400 p-2.5 bg-surface border border-border-subtle rounded-lg animate-pulse shrink-0">
          ⏳ Syncing hierarchy...
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-300 p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg shrink-0">
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