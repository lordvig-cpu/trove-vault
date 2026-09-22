'use client';

import React, { useState, useRef } from 'react';
import {
  FilterIcon,
  SlidersHorizontalIcon,
  SearchGlassIcon,
  SearchClearIcon,
} from '@/components/icons/TreeIcons';
import TreeSearchMenu from '@/components/TreeSearchMenu';
import CollectionFilterTree from '@/components/CollectionFilterTree';
import { CollectionRecord } from '@/types/collection';
import { PrimarySidebarPosition } from '@/types/layout';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { FieldType } from '@/types/field';
import { FIELD_TYPE_METAS } from '@/lib/fieldTypeMetas';

interface SearchAndFilterSectionProps {
  variant: 'flyout' | 'sidebar';
  position: PrimarySidebarPosition;
  isPinned?: boolean;
  headerId: string;
  headerContainerRef: React.RefObject<HTMLDivElement | null>;
  isInspector: boolean;
  isCollections: boolean;
  isTemplates: boolean;
  /** Debug marker on the search input: the tree view if set, else the active dock tab. */
  dataTreeSearchValue?: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchInputTitle: string;
  shortcutAria: string;
  filterFieldTypes: FieldType[];
  onToggleFilterFieldType: (type: FieldType) => void;
  onClearFieldTypeFilters: () => void;
  fieldTypeCounts: Record<string, number>;
  collections: CollectionRecord[];
  filterCollectionIds: number[];
  onToggleFilterCollection: (collectionId: number) => void;
  onClearCollectionFilters: () => void;
}

/**
 * The panel header's search bar, its collapsible "Filters Applied" chip list, and the Advanced
 * Search action-menu portal (field-type filters for the template inspector, collection filters
 * otherwise). Owns the menu's own open/closed and focus state.
 */
export default function SearchAndFilterSection({
  variant,
  position,
  isPinned,
  headerId,
  headerContainerRef,
  isInspector,
  isCollections,
  isTemplates,
  dataTreeSearchValue,
  searchQuery,
  onSearchChange,
  searchInputTitle,
  shortcutAria,
  filterFieldTypes,
  onToggleFilterFieldType,
  onClearFieldTypeFilters,
  fieldTypeCounts,
  collections,
  filterCollectionIds,
  onToggleFilterCollection,
  onClearCollectionFilters,
}: SearchAndFilterSectionProps) {
  const { animationsEnabled } = useUIPreferences();
  const isRight = position === 'right';

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAppliedFilters, setShowAppliedFilters] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchPattern = searchQuery.trim();
  const hasSearchFilter = searchPattern.length > 0;
  const hasCollectionFilters = filterCollectionIds.length > 0;
  const hasFieldTypeFilters = filterFieldTypes.length > 0;
  const appliedFilterCount = isInspector
    ? filterFieldTypes.length + (hasSearchFilter ? 1 : 0)
    : filterCollectionIds.length + (hasSearchFilter ? 1 : 0);
  const isFilterActive = appliedFilterCount > 0;
  const clearAllFilters = () => {
    if (isInspector) {
      onClearFieldTypeFilters();
    } else {
      onClearCollectionFilters();
    }
    onSearchChange('');
  };

  const handleToggleAdvancedSearch = () => {
    if (!showAdvancedSearch && triggerBtnRef.current) {
      const btnRect = triggerBtnRef.current.getBoundingClientRect();
      const panelRect = headerContainerRef.current
        ? headerContainerRef.current.getBoundingClientRect()
        : btnRect;
      const isRightDocked = position === 'right' || panelRect.left > window.innerWidth / 2;
      const SEARCH_MENU_WIDTH = 280; // 17.5rem = 280px

      // Left Dock: overlap = 14px (menu left starts 14px inside panel's right border)
      // Right Dock: overlap = 11px (menu right ends 11px inside panel's left border, moved out 3px as requested)
      const calculatedLeft = isRightDocked
        ? Math.round(panelRect.left + 11 - SEARCH_MENU_WIDTH)
        : Math.round(panelRect.right - 14);

      setMenuCoords({
        top: Math.round(btnRect.top - 4),
        left: calculatedLeft,
      });
      setShowAdvancedSearch(true);
    } else {
      setShowAdvancedSearch(false);
    }
  };

  return (
    <>
      <div className="tree-section-heading">
        <hr aria-hidden="true" />
        <h3>Search and Filter ({isInspector ? 'Template Fields' : isCollections ? 'Collections' : isTemplates ? 'Templates' : 'Items'})</h3>
      </div>
      <div className="flex items-center gap-1.5 w-full">
        <div className={`tree-search-input tree-search-shell ${isRight ? 'tree-search-shell-right' : ''} relative flex-1 min-w-0 flex items-center ${searchQuery.length > 0 ? 'tree-search-input-active' : ''}`}>
          {isRight ? (
            <>
              {/* Advanced search sits on the left in right-docked layout */}
              <button
                ref={triggerBtnRef}
                type="button"
                onClick={handleToggleAdvancedSearch}
                className="tree-search-advanced tree-search-advanced-left relative shrink-0"
                title="Advanced Search & Filters"
                aria-label="Advanced Search & Filters"
                aria-expanded={showAdvancedSearch}
                data-filter-active={isFilterActive}
              >
                <SlidersHorizontalIcon
                  className="w-3.5 h-3.5"
                  isActive={showAdvancedSearch || isFilterActive}
                />
                {isFilterActive && !showAdvancedSearch && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--brand-secondary-amber)] animate-pulse" />
                )}
              </button>

              {/* Applied-filter toggle beside advanced controls */}
              {isFilterActive && (
                <div className="shrink-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowAppliedFilters((prev) => !prev)}
                    className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center ${
                      showAppliedFilters ? 'tree-panel-accent' : 'tree-panel-primary'
                    }`}
                    title={showAppliedFilters ? 'Hide applied filters' : 'Show applied filters'}
                    aria-label={showAppliedFilters ? 'Hide applied filters' : 'Show applied filters'}
                    aria-expanded={showAppliedFilters}
                  >
                    <FilterIcon className="w-3.5 h-3.5" isActive={showAppliedFilters} />
                  </button>
                </div>
              )}

              {/* Search Query Input */}
              <div className={searchQuery.length > 0 ? 'tree-search-query tree-search-query-pill' : 'tree-search-query'}>
                <input
                  ref={searchInputRef}
                  id={`${headerId}-search`}
                  type="text"
                  data-tree-search={dataTreeSearchValue}
                  data-search-position={isRight ? 'right' : 'left'}
                  aria-keyshortcuts={shortcutAria}
                  aria-label={isInspector ? 'Search template fields' : isTemplates ? 'Search templates and items' : isCollections ? 'Search collections and items' : 'Search items'}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  title={searchInputTitle}
                  placeholder={
                    isInspector
                      ? hasFieldTypeFilters
                        ? 'Search filtered types...'
                        : 'Search fields...'
                      : hasCollectionFilters
                      ? 'Search filtered collection...'
                      : 'Search...'
                  }
                  className="tree-search-query-input"
                  style={searchQuery.length > 0 ? { width: `${searchQuery.length + 0.5}ch` } : undefined}
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { onSearchChange(''); searchInputRef.current?.focus(); }}
                    className="tree-search-query-clear"
                    aria-label="Clear search term"
                    title="Clear search term"
                  >
                    <SearchClearIcon />
                  </button>
                )}
              </div>

              {/* Right Magnifying Glass */}
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center select-none">
                <SearchGlassIcon
                  className={`w-3.5 h-3.5 transition-colors duration-200 ${
                    isSearchFocused ? 'tree-panel-primary' : 'tree-panel-muted'
                  }`}
                  isFocused={isSearchFocused}
                />
              </span>
            </>
          ) : (
            <>
              {/* Left Magnifying Glass */}
              <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center select-none">
                <SearchGlassIcon
                  className={`w-3.5 h-3.5 transition-colors duration-200 ${
                    isSearchFocused ? 'tree-panel-primary' : 'tree-panel-muted'
                  }`}
                  isFocused={isSearchFocused}
                />
              </span>

              <div className={searchQuery.length > 0 ? 'tree-search-query tree-search-query-pill' : 'tree-search-query'}>
                <input
                  ref={searchInputRef}
                  id={`${headerId}-search`}
                  type="text"
                  data-tree-search={dataTreeSearchValue}
                  data-search-position={isRight ? 'right' : 'left'}
                  aria-keyshortcuts={shortcutAria}
                  aria-label={isInspector ? 'Search template fields' : isTemplates ? 'Search templates and items' : isCollections ? 'Search collections and items' : 'Search items'}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  title={searchInputTitle}
                  placeholder={
                    isInspector
                      ? hasFieldTypeFilters
                        ? 'Search filtered types...'
                        : 'Search fields...'
                      : hasCollectionFilters
                      ? 'Search filtered collection...'
                      : 'Search...'
                  }
                  className="tree-search-query-input"
                  style={searchQuery.length > 0 ? { width: `${searchQuery.length + 0.5}ch` } : undefined}
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { onSearchChange(''); searchInputRef.current?.focus(); }}
                    className="tree-search-query-clear"
                    aria-label="Clear search term"
                    title="Clear search term"
                  >
                    <SearchClearIcon />
                  </button>
                )}
              </div>

              {/* Applied-filter toggle stays beside the divided advanced controls. */}
              <div className="ml-auto shrink-0 flex items-center">
                {/* Filter Funnel Toggle Icon */}
                {isFilterActive && (
                  <button
                    type="button"
                    onClick={() => setShowAppliedFilters((prev) => !prev)}
                    className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center ${
                      showAppliedFilters ? 'tree-panel-accent' : 'tree-panel-primary'
                    }`}
                    title={showAppliedFilters ? 'Hide applied filters' : 'Show applied filters'}
                    aria-label={showAppliedFilters ? 'Hide applied filters' : 'Show applied filters'}
                    aria-expanded={showAppliedFilters}
                  >
                    <FilterIcon className="w-3.5 h-3.5" isActive={showAppliedFilters} />
                  </button>
                )}
              </div>

              {/* Advanced search sits inside the bar, after a subtle divider. */}
              <button
                ref={triggerBtnRef}
                type="button"
                onClick={handleToggleAdvancedSearch}
                className="tree-search-advanced relative shrink-0"
                title="Advanced Search & Filters"
                aria-label="Advanced Search & Filters"
                aria-expanded={showAdvancedSearch}
                data-filter-active={isFilterActive}
              >
                <SlidersHorizontalIcon
                  className="w-3.5 h-3.5"
                  isActive={showAdvancedSearch || isFilterActive}
                />
                {isFilterActive && !showAdvancedSearch && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--brand-secondary-amber)] animate-pulse" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------
          COLLAPSIBLE FILTERS APPLIED SECTION
          ------------------------------------------------------------------ */}
      {isFilterActive && showAppliedFilters && (
        <div className={`tree-applied-filters w-full flex flex-col gap-1.5 ${animationsEnabled ? 'tree-applied-filters-enter' : ''}`}>
          <div className="tree-applied-filters-header flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase">
                Filters Applied
              </span>
              <span className="text-[10px] font-mono font-bold tree-panel-accent">
                ({appliedFilterCount})
              </span>
            </div>

            <button
              type="button"
              onClick={clearAllFilters}
              className="tree-applied-filters-clear text-[10px] font-medium transition-colors cursor-pointer shrink-0"
              title="Clear all search and filters"
            >
              Clear all
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 px-0.5 py-1 min-h-[36px] max-h-36 overflow-y-auto primary-panel-scroll">
            {hasSearchFilter && (
              <span
                className="group tree-filter-pill inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] select-none transition-all min-w-0 max-w-full"
                title={`Name contains "${searchPattern}"`}
              >
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="tree-filter-remove font-bold text-[10px] leading-none cursor-pointer pr-0.5 transition-colors shrink-0"
                  title="Remove search filter"
                  aria-label="Remove search filter"
                >
                  &#10005;
                </button>
                <FilterIcon className="w-3.5 h-3.5 tree-filter-indicator shrink-0" />
                <span className="tree-filter-name truncate font-medium transition-colors">
                  Name contains &quot;{searchPattern}&quot;
                </span>
              </span>
            )}
            {isInspector ? (
              filterFieldTypes.map((ft) => {
                const meta = FIELD_TYPE_METAS.find((m) => m.type === ft);
                if (!meta) return null;

                return (
                  <span
                    key={ft}
                    className="group tree-filter-pill inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] select-none transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleFilterFieldType?.(ft)}
                      className="tree-filter-remove font-bold text-[10px] leading-none cursor-pointer pr-0.5 transition-colors"
                      title={`Remove filter: ${meta.label}`}
                    >
                      ✕
                    </button>
                    <span className="text-[11px] tree-filter-indicator">{meta.icon}</span>
                    <span className="tree-filter-name max-w-[110px] truncate font-medium transition-colors">
                      {meta.label}
                    </span>
                  </span>
                );
              })
            ) : (
              filterCollectionIds.map((id) => {
                const col = collections.find((c) => c.id === id);
                if (!col) return null;

                return (
                  <span
                    key={id}
                    className="group tree-filter-pill inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] select-none transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleFilterCollection(id)}
                      className="tree-filter-remove font-bold text-[10px] leading-none cursor-pointer pr-0.5 transition-colors"
                      title={`Remove filter: ${col.name}`}
                    >
                      ✕
                    </button>
                    <span className="text-[11px] tree-filter-indicator">{col.icon || '📁'}</span>
                    <span className="tree-filter-name max-w-[110px] truncate font-medium transition-colors">
                      {col.name}
                    </span>
                  </span>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------
          ADVANCED SEARCH ACTION MENU PORTAL
          ------------------------------------------------------------------ */}
      <TreeSearchMenu
        isFlyout={variant === 'flyout'}
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        top={menuCoords.top}
        left={menuCoords.left}
        position={position}
        isPinned={isPinned}
        triggerRef={triggerBtnRef}
        title={isInspector ? 'Filter Field Types' : 'Advanced Search'}
        titleIcon={
          <SlidersHorizontalIcon className="w-3.5 h-3.5 text-[var(--brand-secondary-amber)]" isActive={true} />
        }
      >
        {isInspector ? (
          <div className="flex flex-col gap-1.5 px-1 py-1">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="w-4 shrink-0 flex items-center justify-center text-sm">🎛️</span>
                <span className="text-xs font-medium tree-panel-primary">Field Type(s):</span>
              </div>
              <span
                title={`${FIELD_TYPE_METAS.length} field types available`}
                className="tree-filter-option px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 select-none"
              >
                {FIELD_TYPE_METAS.length}
              </span>
            </div>

            <div className="my-1 mx-2 tree-menu-divider" />

            {/* Select All / Deselect All Toggle */}
            {(() => {
              const allSelected =
                FIELD_TYPE_METAS.length > 0 &&
                FIELD_TYPE_METAS.every((m) => filterFieldTypes.includes(m.type));
              const hasSome = filterFieldTypes.length > 0;
              const isIndeterminate = hasSome && !allSelected;

              return (
                <div className="mx-2 px-1 py-1 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={() => {
                        if (allSelected || isIndeterminate) {
                          onClearFieldTypeFilters();
                        } else {
                          FIELD_TYPE_METAS.forEach((m) => {
                            if (!filterFieldTypes.includes(m.type)) {
                              onToggleFilterFieldType(m.type);
                            }
                          });
                        }
                      }}
                      className="tree-filter-checkbox w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] font-semibold tree-filter-option-label transition-colors">
                      {allSelected || isIndeterminate ? 'Deselect All' : 'Select All'}
                    </span>
                  </label>

                  {hasFieldTypeFilters && (
                    <span className="text-[10px] font-mono tree-panel-accent">
                      {filterFieldTypes.length}/{FIELD_TYPE_METAS.length}
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Field Types List */}
            <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto px-1">
              {FIELD_TYPE_METAS.map(({ type, label, icon }) => {
                const isChecked = filterFieldTypes.includes(type);
                const count = fieldTypeCounts[type] ?? 0;

                return (
                  <div
                    key={type}
                    onClick={() => onToggleFilterFieldType(type)}
                    className={`tree-filter-row flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                      isChecked ? 'tree-filter-row-selected' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div onClick
                        className="tree-filter-checkbox w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                      />
                      <span className="text-sm shrink-0">{icon}</span>
                      <span className="font-medium text-xs truncate">{label}</span>
                    </div>
                    <span className="text-[10px] font-mono tree-panel-muted shrink-0 ml-2">
                      ({count})
                    </span>
                  </div>
                );
              })}
            </div>

            {isFilterActive && (
              <div className="border-t border-[var(--tree-menu-divider,rgba(245,158,11,0.2))] mt-0.5 pt-1.5 px-2 pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setShowAdvancedSearch(false);
                  }}
                  className="tree-filter-clear text-[10px] w-full font-semibold transition text-right cursor-pointer"
                >
                  ✕ Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 px-1 py-1">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="w-4 shrink-0 flex items-center justify-center text-sm">📁</span>
                <span className="text-xs font-medium tree-panel-primary">Collection(s):</span>
              </div>
              <span
                title={`${collections.length} ${collections.length === 1 ? 'collection' : 'collections'}`}
                className="tree-filter-option px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 select-none"
              >
                {collections.length}
              </span>
            </div>

            <div className="my-1 mx-2 tree-menu-divider" />

            {collections.length > 0 && (() => {
              const allSelected =
                collections.length > 0 &&
                collections.every((col) => filterCollectionIds.includes(col.id));
              const hasSome = collections.some((col) => filterCollectionIds.includes(col.id));
              const isIndeterminate = hasSome && !allSelected;

              return (
                <div className="mx-2 px-1 py-1 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={collections.length > 0 && allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={() => {
                        if (allSelected || isIndeterminate) {
                          onClearCollectionFilters();
                        } else {
                          collections.forEach((col) => {
                            if (!filterCollectionIds.includes(col.id)) {
                              onToggleFilterCollection(col.id);
                            }
                          });
                        }
                      }}
                      className="tree-filter-checkbox w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] font-semibold tree-filter-option-label transition-colors">
                      {allSelected || isIndeterminate ? 'Deselect All' : 'Select All'}
                    </span>
                  </label>

                  {hasCollectionFilters && (
                    <span className="text-[10px] font-mono tree-panel-accent">
                      {filterCollectionIds.length}/{collections.length}
                    </span>
                  )}
                </div>
              );
            })()}

            <CollectionFilterTree
              collections={collections}
              filterCollectionIds={filterCollectionIds}
              onToggleFilterCollection={onToggleFilterCollection}
            />

            {isFilterActive && (
              <div className="border-t border-[var(--tree-menu-divider,rgba(245,158,11,0.2))] mt-0.5 pt-1.5 px-2 pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setShowAdvancedSearch(false);
                  }}
                  className="tree-filter-clear text-[10px] w-full font-semibold transition text-right cursor-pointer"
                >
                  ✕ Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </TreeSearchMenu>
    </>
  );
}
