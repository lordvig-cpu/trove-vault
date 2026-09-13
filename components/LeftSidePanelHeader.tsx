'use client';

import React, { useState } from 'react';
import {
  FolderCollapseIcon,
  FolderExpandIcon,
  PinFilledIcon,
  PinOutlineIcon,
  FilterIcon,
  SlidersHorizontalIcon,
  SearchGlassIcon,
} from '@/components/icons/ExplorerIcons';
import { CollectionRecord } from '@/types/collection';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

interface LeftSidePanelHeaderProps {
  variant: 'flyout' | 'sidebar';
  isPinned: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  isAnyCategoryExpanded?: boolean;
  onToggleAllCategories?: () => void;
  onTogglePin: () => void;
  onClose: () => void;
  onAddNewItem?: () => void;
  collections: CollectionRecord[];
  filterCollectionId: number | null;
  onSelectFilterCollection: (collectionId: number | null) => void;
  // Backward compatibility aliases
  isAnyFolderExpanded?: boolean;
  onToggleAllFolders?: () => void;
}

/* ==========================================================================
   2. MAIN COMPONENT: LeftSidePanelHeader
   ========================================================================== */

export default function LeftSidePanelHeader({
  variant,
  isPinned,
  searchQuery,
  onSearchChange,
  isAnyCategoryExpanded,
  onToggleAllCategories,
  isAnyFolderExpanded = false,
  onToggleAllFolders,
  onTogglePin,
  onClose,
  onAddNewItem,
  collections = [],
  filterCollectionId,
  onSelectFilterCollection,
}: LeftSidePanelHeaderProps) {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isFilterActive = filterCollectionId !== null;

  const activeIsExpanded = isAnyCategoryExpanded ?? isAnyFolderExpanded;
  const activeToggleAll = onToggleAllCategories ?? onToggleAllFolders;

  return (
    <div className="left-side-panel-header px-2.5 py-2 flex flex-col gap-2 border-b border-border-subtle shrink-0">
      
      {/* ------------------------------------------------------------------
          ROW 1: Top Actions (Right Aligned)
          ------------------------------------------------------------------ */}
      <div className="flex items-center justify-end gap-1 w-full shrink-0">
        
        {/* Create Standalone Item (+) */}
        {onAddNewItem && (
          <button
            type="button"
            onClick={onAddNewItem}
            className="left-side-panel-pin-btn group"
            title="Create New Item"
          >
            <svg
              className="w-3.5 h-3.5 text-accent-secondary group-hover:text-white transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}

        {/* Bulk Expand / Collapse Toggle */}
        {activeToggleAll && (
          <button
            type="button"
            onClick={activeToggleAll}
            disabled={searchQuery.trim().length > 0}
            className="left-side-panel-pin-btn group disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed"
            title={
              searchQuery.trim().length > 0
                ? 'Tree expansion disabled during search'
                : activeIsExpanded
                ? 'Collapse all'
                : 'Expand all'
            }
          >
            {activeIsExpanded ? (
              <FolderCollapseIcon className="w-3.5 h-3.5 text-content-muted" />
            ) : (
              <FolderExpandIcon className="w-3.5 h-3.5 text-content-muted" />
            )}
          </button>
        )}

        {/* Pin / Dock Toggle */}
        <button
          type="button"
          onClick={onTogglePin}
          className="left-side-panel-pin-btn group"
          title={isPinned ? 'Unpin LeftSidePanel' : 'Pin LeftSidePanel'}
        >
          {variant === 'flyout' || !isPinned ? (
            <PinOutlineIcon className="w-3.5 h-3.5 text-content-muted" />
          ) : (
            <PinFilledIcon className="w-3.5 h-3.5 text-content-primary" />
          )}
        </button>

        {/* Close Button (Flyout Mode Only) */}
        {variant === 'flyout' && (
          <button
            type="button"
            onClick={onClose}
            className="left-side-panel-pin-btn group"
            title="Close Explorer"
          >
            <span className="inline-block origin-center transition-transform duration-200 ease-out group-hover:scale-115 text-xs text-content-primary px-1 select-none">
              ✕
            </span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------
          ROW 2: Search Bar + External Advanced Search Slider Button
          ------------------------------------------------------------------ */}
      <div className="flex items-center gap-1.5 w-full">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-0 flex items-center">
          {/* Leading Icon: Amber filter when typed; SVG Magnifying Glass with focus-fill when empty */}
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center select-none">
            {searchQuery.trim().length > 0 ? (
              <FilterIcon className="w-3.5 h-3.5 text-accent-secondary" isActive={true} />
            ) : (
              <SearchGlassIcon
                className={`w-3.5 h-3.5 transition-colors duration-200 ${
                  isSearchFocused ? 'text-white' : 'text-content-muted'
                }`}
                isFocused={isSearchFocused}
              />
            )}
          </span>

          {/* Input Target */}
          <input
            id={`explorer-search-input-${variant}`}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            title="Enter search [shortcut: Ctrl-K]"
            placeholder={isFilterActive ? 'Search filtered collection...' : 'Search...'}
            className={[
              'explorer-search-input w-full !pl-8 !pr-8',
              searchQuery.length > 0 ? 'explorer-search-input-active' : '',
            ].join(' ')}
          />

          {/* Clear Search ✕ Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="group absolute right-2 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary transition-colors text-xs cursor-pointer p-0.5"
              title="Clear search"
            >
              <span className="inline-block origin-center transition-transform duration-200 group-hover:scale-115">
                ✕
              </span>
            </button>
          )}
        </div>

        {/* Advanced Search Sliders Button */}
        <button
          type="button"
          onClick={() => setShowAdvancedSearch((prev) => !prev)}
          className={`p-1.5 rounded-lg border transition cursor-pointer relative shrink-0 flex items-center justify-center ${
            showAdvancedSearch || isFilterActive
              ? 'bg-accent-primary/20 border-accent-primary/50 text-accent-secondary'
              : 'bg-surface border-border-subtle text-content-muted hover:text-content-primary hover:border-border-strong'
          }`}
          title="Advanced Search & Filters"
        >
          <SlidersHorizontalIcon
            className="w-3.5 h-3.5"
            isActive={showAdvancedSearch || isFilterActive}
          />
          {isFilterActive && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" />
          )}
        </button>
      </div>

      {/* ------------------------------------------------------------------
          ROW 3: Advanced Search / Filter Drawer
          ------------------------------------------------------------------ */}
      {(showAdvancedSearch || isFilterActive) && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface/80 border border-border-subtle text-xs animate-mount-fade">
          <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider shrink-0">
            Collection:
          </span>
          <select
            value={filterCollectionId ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              onSelectFilterCollection(val);
            }}
            className="w-full bg-canvas border border-border-subtle rounded px-2 py-1 text-xs text-content-primary focus:outline-none focus:border-accent-secondary"
          >
            <option value="">-- All Items (No Filter) --</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.icon || '📁'} {col.name}
              </option>
            ))}
          </select>
          {isFilterActive && (
            <button
              type="button"
              onClick={() => onSelectFilterCollection(null)}
              className="text-xs text-content-muted hover:text-rose-400 p-0.5 cursor-pointer"
              title="Reset collection filter"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}