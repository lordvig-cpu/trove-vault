'use client';

import React, { useState, useRef, useId } from 'react';
import {
  FolderCollapseIcon,
  FolderExpandIcon,
  PinFilledIcon,
  PinOutlineIcon,
  FilterIcon,
  SlidersHorizontalIcon,
  SearchGlassIcon,
  SearchClearIcon,
} from '@/components/icons/ExplorerIcons';
import {
  DockLeftPanelIcon,
  DockRightPanelIcon,
} from '@/components/icons/SystemIcons';
import ExplorerSearchMenu from '@/components/ExplorerSearchMenu';
import CollectionFilterTree from '@/components/CollectionFilterTree';
import { CollectionRecord } from '@/types/collection';
import { ExplorerTab } from '@/lib/filterExplorerForest';
import { PrimarySidebarPosition } from '@/types/layout';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { DockContent, TabReorderInfo } from '@/hooks/usePanelDockDrag';
import { FieldType } from '@/types/field';

export const FIELD_TYPE_METAS: { type: FieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'number', label: 'Number', icon: '🔢' },
  { type: 'select', label: 'Dropdown / Select', icon: '📋' },
  { type: 'boolean', label: 'Boolean (Yes/No)', icon: '🔘' },
  { type: 'date', label: 'Date', icon: '📅' },
];

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

export interface PrimarySidePanelHeaderProps {
  hasDockedContent?: boolean;
  title?: string;
  showSearchFilter?: boolean;
  variant: 'flyout' | 'sidebar';
  isPinned?: boolean;
  position?: PrimarySidebarPosition;
  onTogglePosition?: () => void;
  moveTooltip?: string;
  canMove?: boolean;
  onDock?: (position: 'left' | 'right') => void;
  treeView?: ExplorerTab;
  activeTab?: ExplorerTab | DockContent;
  onTabChange?: (tab: any) => void;
  tabs?: DockContent[];
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  isAnyCategoryExpanded?: boolean;
  onToggleAllCategories?: () => void;
  onTogglePin?: () => void;
  onClose: () => void;
  onAddNewItem?: () => void;
  onAddNewCollection?: () => void;
  onAddNewTemplate?: () => void;
  collections?: CollectionRecord[];

  // Multi-Select Array Props
  filterCollectionIds?: number[];
  onToggleFilterCollection?: (collectionId: number) => void;
  onClearCollectionFilters?: () => void;

  // Field Type Filter Props (Template Inspector Mode)
  filterFieldTypes?: FieldType[];
  onToggleFilterFieldType?: (type: FieldType) => void;
  onClearFieldTypeFilters?: () => void;
  fieldTypeCounts?: Record<string, number>;
  onAddNewField?: () => void;

  onHandlePointerDown?: (e: React.PointerEvent) => void;
  onStartTabDrag?: (tab: Exclude<DockContent, 'empty'>, e: React.PointerEvent) => void;
  isDragging?: boolean;
  reorderInfo?: TabReorderInfo | null;

  isAnyFolderExpanded?: boolean;
  onToggleAllFolders?: () => void;
}

/* ==========================================================================
   2. MAIN COMPONENT: PrimarySidePanelHeader
   ========================================================================== */

export default function PrimarySidePanelHeader({
  hasDockedContent = false,
  title,
  showSearchFilter = true,
  variant,
  isPinned,
  position = 'left',
  onTogglePosition,
  moveTooltip,
  canMove = true,
  onDock,
  treeView,
  activeTab = 'items',
  onTabChange,
  tabs,
  searchQuery = '',
  onSearchChange = () => {},
  isAnyCategoryExpanded,
  onToggleAllCategories,
  isAnyFolderExpanded = false,
  onToggleAllFolders,
  onTogglePin,
  onClose,
  onAddNewItem,
  onAddNewCollection,
  onAddNewTemplate,
  collections = [],
  filterCollectionIds = [],
  onToggleFilterCollection = () => {},
  onClearCollectionFilters = () => {},
  filterFieldTypes = [],
  onToggleFilterFieldType = () => {},
  onClearFieldTypeFilters = () => {},
  fieldTypeCounts = {},
  onAddNewField,
  onHandlePointerDown,
  onStartTabDrag,
  isDragging = false,
  reorderInfo = null,
}: PrimarySidePanelHeaderProps) {
  const headerId = useId();
  const isCollections = treeView === 'collections' || activeTab === 'collections' || title === 'COLLECTIONS';
  const isTemplates = treeView === 'templates' || activeTab === 'templates' || title === 'TEMPLATES';
  const isGrabbed = activeTab === 'grabbed_content' || title === 'GRABBED CONTENT';
  const isInspector = activeTab === 'template_editor' || title === 'TEMPLATE INSPECTOR';
  const isBuilder = activeTab === 'template_builder' || title === 'LAYOUT BUILDER';
  const panelName = isCollections
    ? 'Collections'
    : isTemplates
    ? 'Templates'
    : isGrabbed
    ? 'Grabbed Content'
    : isInspector
    ? 'Template Inspector'
    : isBuilder
    ? 'Layout Builder'
    : 'Items';
  const isRight = position === 'right';
  const { animationsEnabled } = useUIPreferences();

  const displayedTabs: DockContent[] = tabs && tabs.length > 0
    ? tabs
    : treeView === 'collections'
    ? ['collections']
    : treeView === 'templates'
    ? ['templates']
    : treeView === 'items'
    ? ['explorer']
    : ['explorer', 'collections'];
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showAppliedFilters, setShowAppliedFilters] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerContainerRef = useRef<HTMLDivElement>(null);

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
  const activeIsExpanded = isAnyCategoryExpanded ?? isAnyFolderExpanded;
  const activeToggleAll = onToggleAllCategories ?? onToggleAllFolders;

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
    <div
      ref={headerContainerRef}
      className={`primary-side-panel-header px-2.5 pt-2 pb-0 flex flex-col gap-2 shrink-0 ${
        hasDockedContent ? 'explorer-header-occupied' : 'explorer-header-empty'
      }`}
    >
      {/* --------------------------------------------------------------------
          2.1 TOP TOOLBAR ROW: Drag Grip, Title, and Action Controls
          -------------------------------------------------------------------- */}
      <div className="explorer-header-toolbar flex items-center justify-between gap-1 w-full shrink-0 select-none">
        {/* Draggable Header Grip & Title */}
        <div
          onPointerDown={hasDockedContent ? onHandlePointerDown : undefined}
          className={`flex items-center gap-1.5 flex-1 min-w-0 py-0.5 ${
            hasDockedContent ? 'cursor-grab active:cursor-grabbing hover:opacity-90' : ''
          }`}
          title={hasDockedContent ? 'Drag to dock panel' : undefined}
        >
          <span className="text-[10px] text-muted opacity-60 tracking-tighter" aria-hidden="true">
            ⋮⋮
          </span>
          <span className="explorer-header-title text-xs font-bold uppercase tracking-wider px-0.5 truncate">
            {title || (variant === 'sidebar' ? 'PRIMARY SIDE PANEL' : 'ITEMS')}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Close the sidebar with the same control used in the footer. */}
          {variant === 'sidebar' && (
            <button
              type="button"
              onClick={onClose}
              title={position === 'left' ? 'Hide Primary Side Bar' : 'Hide Secondary Side Bar'}
              aria-label={position === 'left' ? 'Hide Primary Side Bar' : 'Hide Secondary Side Bar'}
              className="p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center nav-footer-dock-btn-open"
            >
              {position === 'left' ? (
                <DockLeftPanelIcon className="w-4 h-4" isOpen={true} />
              ) : (
                <DockRightPanelIcon className="w-4 h-4" isOpen={true} />
              )}
            </button>
          )}

          {/* Move to Opposite Side Toggle Button */}
          {(variant === 'sidebar' || onTogglePosition) && (
            <button
              type="button"
              onClick={onTogglePosition}
              disabled={variant === 'sidebar' && (!hasDockedContent || !onTogglePosition || !canMove)}
              className={`primary-side-panel-position-btn group disabled:opacity-35 disabled:cursor-not-allowed ${variant === 'sidebar' && position === 'right' ? '-order-1' : ''}`}
              title={
                variant === 'sidebar' && !hasDockedContent
                  ? 'Content must be docked first'
                  : moveTooltip ||
                    (position === 'left'
                      ? `Move ${title || (variant === 'sidebar' ? 'Side Bar' : 'Items')} to Right`
                      : `Move ${title || (variant === 'sidebar' ? 'Side Bar' : 'Items')} to Left`)
              }
              aria-label={
                variant === 'sidebar' && !hasDockedContent
                  ? 'Content must be docked first'
                  : moveTooltip ||
                    (position === 'left'
                      ? `Move ${title || (variant === 'sidebar' ? 'Side Bar' : 'Items')} to Right`
                      : `Move ${title || (variant === 'sidebar' ? 'Side Bar' : 'Items')} to Left`)
              }
            >
              {position === 'left' ? (
                <DockRightPanelIcon className="w-3.5 h-3.5 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" isOpen={true} />
              ) : (
                <DockLeftPanelIcon className="w-3.5 h-3.5 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" isOpen={true} />
              )}
            </button>
          )}

          {/* Explorer docks into either sidebar; pinning belongs to the sidebars. */}
          {variant === 'flyout' && onDock && (
            <>
              <button
                type="button"
                onClick={() => onDock('left')}
                className="primary-side-panel-position-btn group"
                title={`Dock ${panelName} to Left`}
                aria-label={`Dock ${panelName} to Left`}
              >
                <DockLeftPanelIcon className="w-3.5 h-3.5 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" isOpen={true} />
              </button>
              <button
                type="button"
                onClick={() => onDock('right')}
                className="primary-side-panel-position-btn group"
                title={`Dock ${panelName} to Right`}
                aria-label={`Dock ${panelName} to Right`}
              >
                <DockRightPanelIcon className="w-3.5 h-3.5 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" isOpen={true} />
              </button>
            </>
          )}

          {/* Pin / Unpin Button */}
          {variant === 'sidebar' && (
          <button
            type="button"
            onClick={onTogglePin}
            className="primary-side-panel-pin-btn group"
            title={isPinned ? 'Unpin Primary Side Bar' : 'Pin Primary Side Bar'}
          >
            {!isPinned ? (
              <PinOutlineIcon
                position={position}
                className="w-3.5 h-3.5 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white"
              />
            ) : (
              <PinFilledIcon
                position={position}
                className="w-3.5 h-3.5 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white"
              />
            )}
          </button>
          )}

          {/* Close Button (Flyout mode) */}
          {variant === 'flyout' && (
            <button
              type="button"
              onClick={onClose}
              className="primary-side-panel-pin-btn group"
              title={`Close ${panelName}`}
            >
              <span className="inline-block origin-center transition-all duration-200 ease-out group-hover:scale-115 text-xs text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white px-1 select-none">
                ✕
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="explorer-header-divider" />

      {/* ------------------------------------------------------------------
          ROW 2 & 3: Search Bar, Category Filters & Menus (Explorer Only)
          ------------------------------------------------------------------ */}
      {showSearchFilter && !isGrabbed && (
        <>
          <div className="explorer-section-heading">
            <hr aria-hidden="true" />
            <h3>Search and Filter ({isInspector ? 'Template Fields' : isCollections ? 'Collections' : isTemplates ? 'Templates' : 'Items'})</h3>
          </div>
      <div className="flex items-center gap-1.5 w-full">
        <div className={`explorer-search-input explorer-search-shell ${isRight ? 'explorer-search-shell-right' : ''} relative flex-1 min-w-0 flex items-center ${searchQuery.length > 0 ? 'explorer-search-input-active' : ''}`}>
          {isRight ? (
            <>
              {/* Advanced search sits on the left in right-docked layout */}
              <button
                ref={triggerBtnRef}
                type="button"
                onClick={handleToggleAdvancedSearch}
                className="explorer-search-advanced explorer-search-advanced-left relative shrink-0"
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
                      showAppliedFilters ? 'explorer-panel-accent' : 'explorer-panel-primary'
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
              <div className={searchQuery.length > 0 ? 'explorer-search-query explorer-search-query-pill' : 'explorer-search-query'}>
                <input
                  ref={searchInputRef}
                  id={`${headerId}-search`}
                  type="text"
                  data-tree-search={treeView ?? activeTab}
                  aria-keyshortcuts={isTemplates ? 'Control+; Meta+;' : isCollections ? 'Control+L Meta+L' : 'Control+K Meta+K'}
                  aria-label={isInspector ? 'Search template fields' : isTemplates ? 'Search templates and items' : isCollections ? 'Search collections and items' : 'Search items'}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  title={isInspector ? 'Search Template Fields' : isTemplates ? 'Search Templates & Items [shortcut: Ctrl-;]' : isCollections ? 'Search Collections & Items [shortcut: Ctrl-L]' : 'Search Items [shortcut: Ctrl-K]'}
                  placeholder={
                    isInspector
                      ? hasFieldTypeFilters
                        ? 'Search filtered types...'
                        : 'Search fields...'
                      : hasCollectionFilters
                      ? 'Search filtered collection...'
                      : 'Search...'
                  }
                  className="explorer-search-query-input"
                  style={searchQuery.length > 0 ? { width: `${searchQuery.length + 0.5}ch` } : undefined}
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { onSearchChange(''); searchInputRef.current?.focus(); }}
                    className="explorer-search-query-clear"
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
                    isSearchFocused ? 'explorer-panel-primary' : 'explorer-panel-muted'
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
                    isSearchFocused ? 'explorer-panel-primary' : 'explorer-panel-muted'
                  }`}
                  isFocused={isSearchFocused}
                />
              </span>

              <div className={searchQuery.length > 0 ? 'explorer-search-query explorer-search-query-pill' : 'explorer-search-query'}>
                <input
                  ref={searchInputRef}
                  id={`${headerId}-search`}
                  type="text"
                  data-tree-search={treeView ?? activeTab}
                  aria-keyshortcuts={isTemplates ? 'Control+; Meta+;' : isCollections ? 'Control+L Meta+L' : 'Control+K Meta+K'}
                  aria-label={isInspector ? 'Search template fields' : isTemplates ? 'Search templates and items' : isCollections ? 'Search collections and items' : 'Search items'}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  title={isInspector ? 'Search Template Fields' : isTemplates ? 'Search Templates & Items [shortcut: Ctrl-;]' : isCollections ? 'Search Collections & Items [shortcut: Ctrl-L]' : 'Search Items [shortcut: Ctrl-K]'}
                  placeholder={
                    isInspector
                      ? hasFieldTypeFilters
                        ? 'Search filtered types...'
                        : 'Search fields...'
                      : hasCollectionFilters
                      ? 'Search filtered collection...'
                      : 'Search...'
                  }
                  className="explorer-search-query-input"
                  style={searchQuery.length > 0 ? { width: `${searchQuery.length + 0.5}ch` } : undefined}
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { onSearchChange(''); searchInputRef.current?.focus(); }}
                    className="explorer-search-query-clear"
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
                      showAppliedFilters ? 'explorer-panel-accent' : 'explorer-panel-primary'
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
                className="explorer-search-advanced relative shrink-0"
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
          ROW 3: COLLAPSIBLE FILTERS APPLIED SECTION
          ------------------------------------------------------------------ */}
      {isFilterActive && showAppliedFilters && (
        <div className={`explorer-applied-filters w-full flex flex-col gap-1.5 ${animationsEnabled ? 'explorer-applied-filters-enter' : ''}`}>
          <div className="explorer-applied-filters-header flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase">
                Filters Applied
              </span>
              <span className="text-[10px] font-mono font-bold explorer-panel-accent">
                ({appliedFilterCount})
              </span>
            </div>

            <button
              type="button"
              onClick={clearAllFilters}
              className="explorer-applied-filters-clear text-[10px] font-medium transition-colors cursor-pointer shrink-0"
              title="Clear all search and filters"
            >
              Clear all
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 px-0.5 py-1 min-h-[36px] max-h-36 overflow-y-auto primary-panel-scroll">
            {hasSearchFilter && (
              <span
                className="group explorer-filter-pill inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] select-none transition-all min-w-0 max-w-full"
                title={`Name contains "${searchPattern}"`}
              >
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="explorer-filter-remove font-bold text-[10px] leading-none cursor-pointer pr-0.5 transition-colors shrink-0"
                  title="Remove search filter"
                  aria-label="Remove search filter"
                >
                  &#10005;
                </button>
                <FilterIcon className="w-3.5 h-3.5 explorer-filter-indicator shrink-0" />
                <span className="explorer-filter-name truncate font-medium transition-colors">
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
                    className="group explorer-filter-pill inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] select-none transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleFilterFieldType?.(ft)}
                      className="explorer-filter-remove font-bold text-[10px] leading-none cursor-pointer pr-0.5 transition-colors"
                      title={`Remove filter: ${meta.label}`}
                    >
                      ✕
                    </button>
                    <span className="text-[11px] explorer-filter-indicator">{meta.icon}</span>
                    <span className="explorer-filter-name max-w-[110px] truncate font-medium transition-colors">
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
                    className="group explorer-filter-pill inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] select-none transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleFilterCollection(id)}
                      className="explorer-filter-remove font-bold text-[10px] leading-none cursor-pointer pr-0.5 transition-colors"
                      title={`Remove filter: ${col.name}`}
                    >
                      ✕
                    </button>
                    <span className="text-[11px] explorer-filter-indicator">{col.icon || '📁'}</span>
                    <span className="explorer-filter-name max-w-[110px] truncate font-medium transition-colors">
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
          ROW 4: View Tabs & Contextual Create Action (Seated on baseline)
          ------------------------------------------------------------------ */}
      <div className="explorer-section-heading">
        <hr aria-hidden="true" />
        <h3>
          {isCollections
            ? 'Browse Collections'
            : isTemplates
            ? 'Browse Templates'
            : isGrabbed
            ? 'Grabbed Content'
            : isInspector
            ? 'Field Schema Hierarchy'
            : isBuilder
            ? 'Layout & Palette'
            : 'Browse Items'}
        </h3>
      </div>
      <div className="flex items-end justify-between gap-1 w-full shrink-0 -mb-[1px]">
        {/* Left: View Mode Paper Folder Tabs */}
        <div role="tablist" aria-label={`${panelName} views`} className="flex items-center relative">
          {displayedTabs.map((tab, idx) => {
            const isTabActive =
              activeTab === tab ||
              (activeTab === 'items' && tab === 'explorer') ||
              (activeTab === 'collections' && tab === 'collections') ||
              (activeTab === 'templates' && tab === 'templates') ||
              (activeTab === 'template_editor' && tab === 'template_editor') ||
              (activeTab === 'template_builder' && tab === 'template_builder');
            const tabLabel =
              tab === 'explorer'
                ? 'Items'
                : tab === 'collections'
                ? 'Collections'
                : tab === 'templates'
                ? 'Templates'
                : tab === 'template_editor'
                ? 'Inspector'
                : tab === 'template_builder'
                ? 'Builder'
                : 'Grabbed Content';
            const tabTitle =
              tab === 'explorer'
                ? 'Show Items organized by Category (drag to move tab)'
                : tab === 'collections'
                ? 'Show Collections hierarchy (drag to move tab)'
                : tab === 'templates'
                ? 'Show Templates blueprint tree (drag to move tab)'
                : tab === 'template_editor'
                ? 'Show Template Field Inspector (drag to move tab)'
                : tab === 'template_builder'
                ? 'Show Template Layout Builder (drag to move tab)'
                : 'Show Grabbed Content (drag to move tab)';

            const isThisTabDragging = isDragging && reorderInfo?.draggingTab === tab && reorderInfo?.side === position;
            const isThisTabTarget = isDragging && reorderInfo?.side === position && reorderInfo?.targetIndex === idx;
            const showInsertBefore = isThisTabTarget && !reorderInfo?.isAfter;
            const showInsertAfter = isThisTabTarget && reorderInfo?.isAfter;

            return (
              <div key={tab} className="relative flex items-center">
                {showInsertBefore && (
                  <div className="explorer-tab-insert-marker explorer-tab-insert-marker-left" />
                )}
                <button
                  data-tab-name={tab}
                  data-tab-index={idx}
                  data-panel-side={position}
                  type="button"
                  role="tab"
                  aria-selected={isTabActive}
                  onClick={() => onTabChange?.(tab as any)}
                  onPointerDown={(e) => {
                    if (tab !== 'empty') onStartTabDrag?.(tab, e);
                  }}
                  className={`explorer-folder-tab group/tab cursor-grab active:cursor-grabbing ${idx > 0 ? '-ml-3.5' : ''} ${
                    isThisTabTarget
                      ? 'explorer-folder-tab-reorder-target z-30'
                      : isTabActive
                      ? 'explorer-folder-tab-active z-20'
                      : 'explorer-folder-tab-idle z-10'
                  } ${isThisTabDragging ? 'explorer-folder-tab-dragging' : ''}`}
                  title={tabTitle}
                >
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 28"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id={`${headerId}-${tab}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--explorer-tab-active-top, rgba(18, 94, 158, 1))" className="tab-grad-top" />
                        <stop offset="45%" stopColor="var(--explorer-tab-active-mid, rgba(10, 64, 112, 1))" className="tab-grad-mid" />
                        <stop offset="100%" stopColor="var(--explorer-tab-active-bottom, rgba(5, 36, 70, 1))" className="tab-grad-bottom" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,28 L 8,3 C 9,1 11,0 14,0 L 86,0 C 89,0 91,1 92,3 L 100,28 Z"
                      className="explorer-tab-svg-fill"
                      style={isTabActive || isThisTabTarget ? { fill: `url(#${headerId}-${tab})` } : undefined}
                    />
                    <path
                      d="M 0,28 L 8,3 C 9,1 11,0 14,0 L 86,0 C 89,0 91,1 92,3 L 100,28"
                      className="explorer-tab-svg-stroke"
                      fill="none"
                      strokeWidth={isThisTabTarget ? '2' : '1.5'}
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <span className="relative z-10 flex items-center gap-1 px-0.5 select-none">
                    <span
                      className="text-[9px] opacity-40 group-hover/tab:opacity-90 transition-opacity tracking-tighter"
                      aria-hidden="true"
                    >
                      ⋮⋮
                    </span>
                    <span>{tabLabel}</span>
                  </span>
                </button>
                {showInsertAfter && (
                  <div className="explorer-tab-insert-marker explorer-tab-insert-marker-right" />
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Actions Cluster (Contextual Add + Expand/Collapse) */}
        {!isGrabbed && (
          <div className="flex items-center gap-1 shrink-0 mb-1">
            {isInspector ? (
              onAddNewField && (
                <button
                  type="button"
                  onClick={onAddNewField}
                  className="explorer-tab-action-btn group"
                  title="Create New Item Template Field"
                >
                  <svg
                    className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white"
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
              )
            ) : isTemplates ? (
              onAddNewTemplate && (
                <button
                  type="button"
                  onClick={onAddNewTemplate}
                  className="explorer-tab-action-btn group"
                  title="Create New Item Template"
                >
                  <svg
                    className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white"
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
              )
            ) : isCollections ? (
              onAddNewCollection && (
                <button
                  type="button"
                  onClick={onAddNewCollection}
                  className="explorer-tab-action-btn group"
                  title="Create New Collection"
                >
                  <svg
                    className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white"
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
              )
            ) : (
              onAddNewItem && (
                <button
                  type="button"
                  onClick={onAddNewItem}
                  className="explorer-tab-action-btn group"
                  title="Create New Item"
                >
                  <svg
                    className="w-2.5 h-2.5 origin-center transition-transform duration-150 ease-out group-hover:scale-110 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white"
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
              )
            )}

            {activeToggleAll && (
              <button
                type="button"
                onClick={activeToggleAll}
                disabled={searchQuery.trim().length > 0}
                className="explorer-tab-action-btn explorer-panel-disabled group disabled:pointer-events-none disabled:cursor-not-allowed"
                title={
                  searchQuery.trim().length > 0
                    ? 'Tree expansion disabled during search'
                    : activeIsExpanded
                    ? 'Collapse all'
                    : 'Expand all'
                }
              >
                {activeIsExpanded ? (
                  <FolderCollapseIcon className="w-3 h-3 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" />
                ) : (
                  <FolderExpandIcon className="w-3 h-3 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------
          ADVANCED SEARCH ACTION MENU PORTAL
          ------------------------------------------------------------------ */}
      <ExplorerSearchMenu
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
                <span className="text-xs font-medium explorer-panel-primary">Field Type(s):</span>
              </div>
              <span
                title={`${FIELD_TYPE_METAS.length} field types available`}
                className="explorer-filter-option px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 select-none"
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
                      className="explorer-filter-checkbox w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] font-semibold explorer-filter-option-label transition-colors">
                      {allSelected || isIndeterminate ? 'Deselect All' : 'Select All'}
                    </span>
                  </label>

                  {hasFieldTypeFilters && (
                    <span className="text-[10px] font-mono explorer-panel-accent">
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
                    className={`explorer-filter-row flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                      isChecked ? 'explorer-filter-row-selected' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div onClick
                        className="explorer-filter-checkbox w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                      />
                      <span className="text-sm shrink-0">{icon}</span>
                      <span className="font-medium text-xs truncate">{label}</span>
                    </div>
                    <span className="text-[10px] font-mono explorer-panel-muted shrink-0 ml-2">
                      ({count})
                    </span>
                  </div>
                );
              })}
            </div>

            {isFilterActive && (
              <div className="border-t border-[var(--explorer-menu-divider,rgba(245,158,11,0.2))] mt-0.5 pt-1.5 px-2 pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setShowAdvancedSearch(false);
                  }}
                  className="explorer-filter-clear text-[10px] w-full font-semibold transition text-right cursor-pointer"
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
                <span className="text-xs font-medium explorer-panel-primary">Collection(s):</span>
              </div>
              <span
                title={`${collections.length} ${collections.length === 1 ? 'collection' : 'collections'}`}
                className="explorer-filter-option px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 select-none"
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
                      className="explorer-filter-checkbox w-3.5 h-3.5 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] font-semibold explorer-filter-option-label transition-colors">
                      {allSelected || isIndeterminate ? 'Deselect All' : 'Select All'}
                    </span>
                  </label>

                  {hasCollectionFilters && (
                    <span className="text-[10px] font-mono explorer-panel-accent">
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
              <div className="border-t border-[var(--explorer-menu-divider,rgba(245,158,11,0.2))] mt-0.5 pt-1.5 px-2 pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setShowAdvancedSearch(false);
                  }}
                  className="explorer-filter-clear text-[10px] w-full font-semibold transition text-right cursor-pointer"
                >
                  ✕ Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </ExplorerSearchMenu>
        </>
      )}
    </div>
  );
}
