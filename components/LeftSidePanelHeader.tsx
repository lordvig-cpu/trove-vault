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
  
  // Passed down to display the "Active" badge like the old dropdown
  activeCollectionId?: number | null;

  // Multi-Select Array Props
  filterCollectionIds: number[];
  onToggleFilterCollection: (collectionId: number) => void;
  onClearCollectionFilters: () => void;
  
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
  activeCollectionId = null,
  filterCollectionIds = [],
  onToggleFilterCollection,
  onClearCollectionFilters,
}: LeftSidePanelHeaderProps) {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAppliedFilters, setShowAppliedFilters] = useState(false); // Controls pill section visibility
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);

  const isFilterActive = filterCollectionIds.length > 0;
  const activeIsExpanded = isAnyCategoryExpanded ?? isAnyFolderExpanded;
  const activeToggleAll = onToggleAllCategories ?? onToggleAllFolders;

  const handleToggleAdvancedSearch = () => {
    if (!showAdvancedSearch && triggerBtnRef.current) {
      const rect = triggerBtnRef.current.getBoundingClientRect();

      setMenuCoords({
        top: Math.round(rect.top - 4),
        left: Math.round(rect.right - 4),
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
          
          {/* Left Magnifying Glass */}
          <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center select-none">
            <SearchGlassIcon
              className={`w-3.5 h-3.5 transition-colors duration-200 ${
                isSearchFocused ? 'text-white' : 'text-content-muted'
              }`}
              isFocused={isSearchFocused}
            />
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
              'explorer-search-input w-full !pl-8',
              isFilterActive && searchQuery ? '!pr-14' : (isFilterActive || searchQuery ? '!pr-8' : '!pr-3'),
              searchQuery.length > 0 ? 'explorer-search-input-active' : '',
            ].join(' ')}
          />

          {/* Right-aligned Actions inside Search Input */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {/* 1. Clear Search Text Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-content-muted hover:text-content-primary transition-colors text-xs cursor-pointer p-0.5"
                title="Clear search text"
              >
                <span className="inline-block origin-center transition-transform duration-200 hover:scale-115">
                  ✕
                </span>
              </button>
            )}

            {/* 2. Filter Funnel Toggle Icon (Only shows when a filter is applied) */}
            {isFilterActive && (
              <button
                type="button"
                onClick={() => setShowAppliedFilters((prev) => !prev)}
                className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center ${
                  showAppliedFilters
                    ? 'text-accent-secondary drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                    : 'text-white hover:text-accent-secondary'
                }`}
                title={showAppliedFilters ? 'Hide applied filters' : 'Show applied filters'}
              >
                <FilterIcon
                  className="w-3.5 h-3.5"
                  isActive={showAppliedFilters}
                />
              </button>
            )}
          </div>
        </div>

        {/* Sliders Button for Advanced Search Popup */}
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
          ROW 3: COLLAPSIBLE FILTERS APPLIED SECTION
          ------------------------------------------------------------------ */}
      {isFilterActive && showAppliedFilters && (
        <div className="w-full flex flex-col gap-1.5 pt-1 animate-mount-fade">
          
          {/* Header row: Title on left, Clear all on right */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-content-muted uppercase">
                Filters Applied
              </span>
              <span className="text-[10px] font-mono font-bold text-accent-secondary">
                ({filterCollectionIds.length})
              </span>
            </div>

            <button
              type="button"
              onClick={onClearCollectionFilters}
              className="text-[10px] font-medium text-content-muted hover:text-rose-400 transition-colors cursor-pointer"
              title="Clear all collection filters"
            >
              Clear all
            </button>
          </div>

          {/* Subtle divider */}
          <div className="border-t border-border-subtle/50 mx-0.5" />

          {/* Darker Recessed Panel Container for Pills (matching Image 2) */}
          <div className="bg-[#040811] border border-border-subtle/60 shadow-inner rounded-lg p-1.5 flex flex-wrap items-center gap-1.5 min-h-[36px] max-h-36 overflow-y-auto left-panel-scroll">
            {filterCollectionIds.map((id) => {
              const col = collections.find((c) => c.id === id);
              if (!col) return null;

              return (
                <span
                  key={id}
                  className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface/90 border border-border-subtle hover:border-accent-secondary/60 text-content-primary text-[11px] select-none transition-all shadow-sm"
                >
                  {/* '✕' Dismiss Button on Left */}
                  <button
                    type="button"
                    onClick={() => onToggleFilterCollection(id)}
                    className="text-accent-secondary hover:text-rose-400 font-bold text-[10px] leading-none cursor-pointer pr-0.5 transition-colors"
                    title={`Remove filter: ${col.name}`}
                  >
                    ✕
                  </button>

                  {/* Icon & Name */}
                  <span className="text-[11px] opacity-80">{col.icon || '📁'}</span>
                  <span className="max-w-[110px] truncate font-medium text-white group-hover:text-accent-secondary transition-colors">
                    {col.name}
                  </span>
                </span>
              );
            })}
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------
          ADVANCED SEARCH ACTION MENU PORTAL
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
          
          {/* 1. Header Row: "Collection(s):" + Amber Number Count Badge */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <span className="w-4 shrink-0 flex items-center justify-center text-sm">
                📁
              </span>
              <span className="text-xs font-medium text-white">Collection(s):</span>
            </div>
            
            <span
              title={`${collections.length} ${collections.length === 1 ? 'collection' : 'collections'}`}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-accent-secondary bg-surface-hover/60 border border-border-subtle/50 shrink-0 select-none"
            >
              {collections.length}
            </span>
          </div>

          {/* 2. Horizontal Divider */}
          <div className="my-1 mx-2 tree-menu-divider" />

          {/* 3. Select All / None Quick Toggle Row */}
          {collections.length > 0 && (() => {
            const allSelected =
              collections.length > 0 &&
              collections.every((col) => filterCollectionIds.includes(col.id));
            const hasSome = collections.some((col) =>
              filterCollectionIds.includes(col.id)
            );
            const isIndeterminate = hasSome && !allSelected;

            return (
              <div className="mx-2 px-1 py-1 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={collections.length > 0 && allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isIndeterminate;
                      }
                    }}
                    onChange={() => {
                      // If ALL are selected OR SOME are selected (indeterminate),
                      // clicking it clears them all.
                      if (allSelected || isIndeterminate) {
                        onClearCollectionFilters();
                      } else {
                        // If NONE are selected, select all available
                        collections.forEach((col) => {
                          if (!filterCollectionIds.includes(col.id)) {
                            onToggleFilterCollection(col.id);
                          }
                        });
                      }
                    }}
                    className="w-3.5 h-3.5 rounded border-border-strong text-accent-secondary bg-surface focus:ring-1 focus:ring-accent-secondary/50 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] font-semibold text-content-secondary hover:text-content-primary transition-colors">
                    {allSelected || isIndeterminate ? 'Deselect All' : 'Select All'}
                  </span>
                </label>

                {isFilterActive && (
                  <span className="text-[10px] font-mono text-accent-secondary">
                    {filterCollectionIds.length}/{collections.length}
                  </span>
                )}
              </div>
            );
          })()}
          
          {/* 4. Collection List with Nested Groups in Unified Cards */}
          <div className="flex flex-col mx-2 mb-1 bg-[#040811] border border-[var(--explorer-menu-divider,rgba(245,158,11,0.2))] shadow-inner rounded-md max-h-60 overflow-y-auto overflow-x-hidden left-panel-scroll p-1.5 space-y-1.5">
            {(() => {
              const allSelected =
                collections.length > 0 &&
                collections.every((col) => filterCollectionIds.includes(col.id));

              // Build recursive hierarchy tree
              const buildCollectionTree = (
                items: CollectionRecord[],
                parentId: number | null = null
              ): Array<CollectionRecord & { children?: CollectionRecord[] }> => {
                return items
                  .filter((c) => (c.parent_id ?? null) === parentId)
                  .map((c) => ({
                    ...c,
                    children: buildCollectionTree(items, c.id),
                  }));
              };

              const rootTrees = buildCollectionTree(collections, null);

              // Catch any orphan collections whose parent_id doesn't exist
              const rootIds = new Set(rootTrees.map((r) => r.id));
              collections.forEach((col) => {
                if (col.parent_id && !collections.some((p) => p.id === col.parent_id) && !rootIds.has(col.id)) {
                  rootTrees.push({ ...col, children: [] });
                }
              });

              // Recursive node renderer within the same card bubble
              const renderNodeRow = (
                node: CollectionRecord & { children?: CollectionRecord[] },
                depth = 0
              ) => {
                const isChecked = filterCollectionIds.includes(node.id);
                const hasChildren = node.children && node.children.length > 0;

                return (
                  <div key={node.id} className="flex flex-col">
                    <label
                      style={{ paddingLeft: `${depth * 14 + 8}px` }}
                      className={`group py-1.5 pr-2.5 rounded-md transition flex items-center justify-between cursor-pointer hover:bg-surface-hover/60 ${
                        isChecked ? 'text-accent-secondary' : 'text-content-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Checkbox: visible when checked, hovered, or All Selected */}
                        <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleFilterCollection(node.id)}
                            className={`w-3.5 h-3.5 rounded border-border-strong text-accent-secondary bg-surface focus:ring-1 focus:ring-accent-secondary/50 cursor-pointer transition-opacity duration-150 ${
                              allSelected || isChecked
                                ? 'opacity-100 pointer-events-auto'
                                : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                            }`}
                          />
                        </div>

                        {/* Sub-item tree branch indicator */}
                        {depth > 0 && (
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-3.5 h-3.5 text-content-muted/60 shrink-0 select-none -ml-1 mr-0.5"
                          >
                            {/* L-shaped corner branch line pointing right towards the folder */}
                            <path d="M 5 2 L 5 9 L 13 9" />
                            <polyline points="10 6 13 9 10 12" />
                          </svg>
                        )}

                        {/* Folder Icon */}
                        <span className="text-sm shrink-0 select-none">
                          {node.icon || '📁'}
                        </span>

                        {/* Name & Description Stack */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold truncate">
                            {node.name}
                          </span>
                          {node.description && (
                            <p className="text-[10px] text-content-muted truncate mt-0.5">
                              {node.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </label>

                    {/* Render sub-collection children nested inside the SAME bubble card */}
                    {hasChildren && (
                      <div className="border-t border-border-subtle/30 pt-0.5 flex flex-col">
                        {node.children!.map((child) => renderNodeRow(child, depth + 1))}
                      </div>
                    )}
                  </div>
                );
              };

              return rootTrees.map((rootNode) => (
                /* SINGLE UNIFIED CARD BUBBLE PER ROOT COLLECTION TREE */
                <div
                  key={rootNode.id}
                  className="rounded-lg border border-border-subtle/50 bg-surface/30 hover:border-border-subtle transition flex flex-col overflow-hidden"
                >
                  {renderNodeRow(rootNode, 0)}
                </div>
              ));
            })()}
          </div>

          {/* 5. Clear Filters Reset Action */}
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