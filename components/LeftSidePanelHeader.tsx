'use client';

import React, { useState, useRef } from 'react';
import {
  FolderCollapseIcon,
  FolderExpandIcon,
  PinFilledIcon,
  PinOutlineIcon,
  FilterIcon,
  SlidersHorizontalIcon,
  SearchGlassIcon,
} from '@/components/icons/ExplorerIcons';
import ExplorerSearchMenu from '@/components/ExplorerSearchMenu';
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
  
  // Multi-Select Array Props
  filterCollectionIds: number[];
  onToggleFilterCollection: (collectionId: number) => void;
  onClearCollectionFilters: () => void;  
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
  onTogglePin,
  onClose,
  onAddNewItem,
  collections = [],
  filterCollectionIds = [],
  onToggleFilterCollection,
  onClearCollectionFilters,
}: LeftSidePanelHeaderProps) {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);

  const isFilterActive = filterCollectionIds.length > 0;
  const activeIsExpanded = isAnyCategoryExpanded;
  const activeToggleAll = onToggleAllCategories;

  const handleToggleAdvancedSearch = () => {
    if (!showAdvancedSearch && triggerBtnRef.current) {
      const rect = triggerBtnRef.current.getBoundingClientRect();

      setMenuCoords({
        // Aligns the top of the menu with the slider button
        top: Math.round(rect.top - 4),
        // Pushes it outside the panel's right border (clearing the scrollbar/seam)
        left: Math.round(rect.right + 10),
      });
      setShowAdvancedSearch(true);
    } else {
      setShowAdvancedSearch(false);
    }
  };

  return (
    <div className="left-side-panel-header px-2.5 py-2 flex flex-col gap-2 border-b border-border-subtle shrink-0">
      
      {/* ------------------------------------------------------------------
          ROW 1: Top Actions (Right Aligned)
          ------------------------------------------------------------------ */}
      <div className="flex items-center justify-end gap-1 w-full shrink-0">
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
          ROW 2: Search Bar + Advanced Search Sliders Button
          ------------------------------------------------------------------ */}
      <div className="flex items-center gap-1.5 w-full">
        <div className="relative flex-1 min-w-0 flex items-center">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center select-none">
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

        <button
          ref={triggerBtnRef}
          type="button"
          onClick={handleToggleAdvancedSearch}
          className={`p-1.5 rounded-lg border transition cursor-pointer relative shrink-0 flex items-center justify-center ${
            showAdvancedSearch
              ? 'bg-surface-hover border-border-strong text-white'
              : isFilterActive
              ? 'bg-accent-primary/20 border-accent-primary/50 text-accent-secondary'
              : 'bg-surface border-border-subtle text-content-muted hover:text-content-primary hover:border-border-strong'
          }`}
          title="Advanced Search & Filters"
        >
          <SlidersHorizontalIcon
            className="w-3.5 h-3.5"
            isActive={showAdvancedSearch || isFilterActive}
          />
          {isFilterActive && !showAdvancedSearch && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" />
          )}
        </button>
      </div>

      {/* ------------------------------------------------------------------
          ADVANCED SEARCH MENU PORTAL (Checkbox List)
          ------------------------------------------------------------------ */}
      <ExplorerSearchMenu
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        top={menuCoords.top}
        left={menuCoords.left}
        isPinned={isPinned}
        triggerRef={triggerBtnRef}
        title="Advanced Search"
        titleIcon={
          <SlidersHorizontalIcon className="w-3.5 h-3.5 text-accent-secondary" isActive={true} />
        }
      >
        <div className="flex flex-col gap-1.5 px-1 py-1">
          
          {/* 1. Action-Menu Style Label */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <span className="w-5 shrink-0 flex items-center justify-center text-sm">
              📁
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-medium text-white">Collection(s):</span>
            </div>
          </div>
          
          {/* 2. Darker Inner Box for Checkboxes */}
          <div className="flex flex-col mx-2 mb-1 bg-[#040811] border border-[var(--explorer-menu-divider,rgba(245,158,11,0.2))] shadow-inner rounded-md max-h-52 overflow-y-auto overflow-x-hidden left-panel-scroll p-1">
            {collections.map((col) => {
              const isChecked = filterCollectionIds.includes(col.id);
              return (
                <label
                  key={col.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-surface-hover/60 rounded transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleFilterCollection(col.id)}
                    className="w-3.5 h-3.5 rounded border-border-strong text-accent-secondary bg-surface focus:ring-1 focus:ring-accent-secondary/50 cursor-pointer shrink-0"
                  />
                  {/* Folder Icon removed; displaying name only */}
                  <span className="text-xs text-content-primary font-medium truncate min-w-0">
                    {col.name}
                  </span>
                </label>
              );
            })}
          </div>

          {/* 3. Clear Filters Action */}
          {isFilterActive && (
            <div className="border-t border-[var(--explorer-menu-divider,rgba(245,158,11,0.2))] mt-0.5 pt-1.5 px-2 pb-0.5">
              <button
                type="button"
                onClick={() => {
                  onClearCollectionFilters();
                  setShowAdvancedSearch(false);
                }}
                className="text-[10px] w-full font-semibold text-rose-400 hover:text-rose-300 transition text-right cursor-pointer"
              >
                ✕ Clear Filters
              </button>
            </div>
          )}
          
        </div>
      </ExplorerSearchMenu>
    </div>
  );
}