'use client';

import React from 'react';
import { CollectionRecord } from './CollectionDropdown';
import { ItemRecord } from './TreeNode';
import { PinFilledIcon } from '@/components/icons/PinIcons';

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
  children,
}: SidebarProps) {
  return (
    <aside
      className={`absolute left-0 top-[1px] bottom-0 bg-surface flex flex-col gap-2.5 overflow-x-hidden overflow-y-auto shrink-0 transition-all duration-300 ease-in-out z-50 ${
        isPinned
          ? 'w-76 max-w-76 border-r border-[rgba(81,155,255,0.85)] p-3 opacity-100 shadow-[14px_0_35px_-4px_rgba(0,0,0,0.85)] translate-x-0'
          : 'w-76 max-w-76 -translate-x-full border-r-0 p-0 opacity-0 pointer-events-none'
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
          <button
            type="button"
            onClick={onTogglePin}
            className="group p-1 rounded text-content-muted hover:text-content-primary hover:bg-surface-hover transition cursor-pointer"
            title="Unpin Sidebar"
          >
            <PinFilledIcon className="w-3.5 h-3.5" />
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