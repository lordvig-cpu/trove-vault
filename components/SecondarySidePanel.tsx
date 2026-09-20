'use client';

import React, { ReactNode } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ResetWidthIcon,
  ResetWidthRightIcon,
} from '@/components/icons/PanelIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { SecondarySidebarPosition } from '@/types/layout';
import EmptyPanelDropZone from '@/components/EmptyPanelDropZone';
import PanelContentTransition from '@/components/PanelContentTransition';
import PrimarySidePanelHeader from '@/components/PrimarySidePanelHeader';
import { ExplorerTab } from '@/lib/filterExplorerForest';
import { CollectionRecord } from '@/types/collection';
import { DockContent, TabReorderInfo } from '@/hooks/usePanelDockDrag';

/* ==========================================================================
   1. TYPE DEFINITIONS & CONSTANTS
   ========================================================================== */

/**
 * Props for SecondarySidePanel utility & inspector drawer.
 */
interface SecondarySidePanelProps {
  isContentSliding?: boolean;
  hasDockedContent?: boolean;
  reservedWidth?: number;
  onWidthChange?: (width: number) => void;
  children?: ReactNode;
  onHandlePointerDown?: (e: React.PointerEvent) => void;
  isOpen: boolean;
  isPinned?: boolean;
  position?: SecondarySidebarPosition;
  onTogglePosition?: () => void;
  moveTooltip?: string;
  canMove?: boolean;
  onOpen?: () => void;
  onClose: () => void;
  onTogglePin?: () => void;
  title?: string;
  showSearchFilter?: boolean;

  // Header and Search Filter Props (active when Explorer is docked)
  treeView?: ExplorerTab;
  activeTab?: ExplorerTab | DockContent;
  onTabChange?: (tab: any) => void;
  tabs?: DockContent[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isAnyCategoryExpanded?: boolean;
  onToggleAllCategories?: () => void;
  isAnyFolderExpanded?: boolean;
  onToggleAllFolders?: () => void;
  onAddNewItem?: () => void;
  onAddNewCollection?: () => void;
  onAddNewTemplate?: () => void;
  collections?: CollectionRecord[];
  filterCollectionIds?: number[];
  onToggleFilterCollection?: (collectionId: number) => void;
  onClearCollectionFilters?: () => void;
  filterFieldTypes?: import('@/types/field').FieldType[];
  onToggleFilterFieldType?: (type: import('@/types/field').FieldType) => void;
  onClearFieldTypeFilters?: () => void;
  fieldTypeCounts?: Record<string, number>;
  onAddNewField?: () => void;
  onStartTabDrag?: (tab: Exclude<DockContent, 'empty'>, e: React.PointerEvent) => void;
  isDragging?: boolean;
  reorderInfo?: TabReorderInfo | null;
  hierarchyNodeCount?: number;
}

const MIN_WIDTH = 260;
const DEFAULT_WIDTH = 304;
const MIN_WORKSPACE_GAP = 48;

/* ==========================================================================
   2. MAIN COMPONENT: SecondarySidePanel
   Collapsible drawer positioned along the right or left seam of the workspace.
   Features an animated pull-tab, tactile drag-to-resize seam, and width reset.
   Supports both unpinned floating drawer and pinned layout docking.
   ========================================================================== */

export default function SecondarySidePanel({
  isContentSliding = false,
  hasDockedContent = false,
  isOpen,
  isPinned = false,
  position = 'right',
  onTogglePosition,
  moveTooltip,
  canMove = true,
  onOpen,
  onClose,
  onTogglePin,
  title = 'Secondary Side Bar',
  showSearchFilter = false,
  reservedWidth = 0,
  onWidthChange,
  children,
  onHandlePointerDown,
  treeView,
  activeTab,
  onTabChange,
  tabs,
  searchQuery,
  onSearchChange,
  isAnyCategoryExpanded,
  onToggleAllCategories,
  isAnyFolderExpanded,
  onToggleAllFolders,
  onAddNewItem,
  onAddNewCollection,
  onAddNewTemplate,
  collections = [],
  filterCollectionIds = [],
  onToggleFilterCollection,
  onClearCollectionFilters,
  filterFieldTypes,
  onToggleFilterFieldType,
  onClearFieldTypeFilters,
  fieldTypeCounts,
  onAddNewField,
  onStartTabDrag,
  isDragging: isDockDragging = false,
  reorderInfo = null,
  hierarchyNodeCount,
}: SecondarySidePanelProps) {
  /* ------------------------------------------------------------------------
     2.1 USER PREFERENCES & RESIZING HOOK
     ------------------------------------------------------------------------ */
  const { animationsEnabled } = useUIPreferences();

  const isUnpinnedOpen = isOpen && !isPinned;

  const {
    panelWidth,
    maxWidth,
    isDragging,
    handlePointerDown,
    handleKeyDown,
    handleResetWidth,
  } = useResizablePanel({
    initialWidth: DEFAULT_WIDTH,
    minWidth: MIN_WIDTH,
    minGap: MIN_WORKSPACE_GAP,
    reservedWidth,
    direction: position === 'left' ? 'left' : 'right',
    onWidthChange,
  });

  const transitionClass =
    !isDragging && animationsEnabled
      ? 'transition-[width,left,transform,opacity,border-color] duration-500 ease-in-out'
      : 'transition-none';

  const positionClass = position === 'left' ? 'secondary-side-panel-left' : 'secondary-side-panel-right';
  const tabHiddenClass = position === 'left' ? 'secondary-panel-tab-hidden-left' : 'secondary-panel-tab-hidden-right';
  const tabPositionClass = position === 'left' ? 'secondary-panel-expand-tab-left' : 'secondary-panel-expand-tab-right';
  const dockedClosedClass = position === 'left' ? 'secondary-panel-docked-closed-left' : 'secondary-panel-docked-closed-right';
  const asideZIndex = isUnpinnedOpen ? 50 : 40;

  return (
    <>
      {/* --------------------------------------------------------------------
          2.2 FLOATING EXPAND TAB (Visible When Collapsed)
          -------------------------------------------------------------------- */}
      <button
        type="button"
        inert={isOpen}
        aria-hidden={isOpen}
        onClick={onOpen}
        style={{
          left: position === 'left' ? '0px' : 'calc(100% - 1.75rem)',
        }}
        className={[
          'secondary-panel-expand-tab group',
          tabPositionClass,
          transitionClass,
          isOpen ? tabHiddenClass : 'secondary-panel-tab-visible',
        ]
          .filter(Boolean)
          .join(' ')}
        title="Open Side Panel"
      >
        {position === 'right' ? (
          <ChevronLeftIcon className="w-3.5 h-3.5 origin-center transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-hover:scale-115" />
        ) : (
          <ChevronRightIcon className="w-3.5 h-3.5 origin-center transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:scale-115" />
        )}
      </button>

      {/* --------------------------------------------------------------------
          2.3 DOCKED SECONDARY INSPECTOR PANEL CONTAINER
          -------------------------------------------------------------------- */}
      <aside
        inert={!isOpen}
        aria-hidden={!isOpen}
        style={{
          width: `${panelWidth}px`,
          left: position === 'left' ? '0px' : `calc(100% - ${panelWidth}px)`,
          zIndex: asideZIndex,
        }}
        className={[
          'secondary-side-panel absolute top-0 bottom-0 flex flex-col',
          positionClass,
          transitionClass,
          isOpen ? 'secondary-panel-docked-open' : `${dockedClosedClass} pointer-events-none`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Seam Resize Handle (Isolated to vertical center) */}
        {isOpen && (
          <div
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
            role="separator"
            tabIndex={0}
            aria-label="Secondary panel width"
            aria-orientation="vertical"
            aria-valuemin={260}
            aria-valuenow={panelWidth}
            aria-valuemax={maxWidth}
            onDoubleClick={handleResetWidth}
            className={`panel-resize-handle absolute top-1/2 -translate-y-1/2 ${
              position === 'right' ? '-left-2' : '-right-2'
            } w-4 h-32 select-none group/resize ${
              isDragging ? 'panel-resize-handle-active' : ''
            }`}
            title="Drag to resize panel (double-click to reset)"
          >
            <div className="panel-resize-pill flex items-center justify-center">
              {/* 3 tactile grip dots inside the pill */}
              <div className="flex flex-col gap-1 items-center justify-center opacity-70">
                <span className="w-1 h-1 rounded-full bg-black/60 dark:bg-black/80" />
                <span className="w-1 h-1 rounded-full bg-black/60 dark:bg-black/80" />
                <span className="w-1 h-1 rounded-full bg-black/60 dark:bg-black/80" />
              </div>
            </div>
          </div>
        )}

        {/* Reset Width Button */}
        {isOpen && panelWidth !== DEFAULT_WIDTH && (
          <button
            type="button"
            onClick={handleResetWidth}
            className={[
              `group absolute top-16 ${
                position === 'right'
                  ? '-left-7 border-r-0 rounded-l-md'
                  : '-right-7 border-l-0 rounded-r-md'
              } w-7 h-8 z-40`,
              'flex items-center justify-center',
              'panel-reset-button border transition-colors',
              animationsEnabled ? 'animate-mount-fade' : '',
            ].join(' ')}
            title="Reset to default width"
          >
            {position === 'right' ? (
              <ResetWidthRightIcon className="w-3.5 h-3.5 panel-reset-icon" />
            ) : (
              <ResetWidthIcon className="w-3.5 h-3.5 panel-reset-icon" />
            )}
          </button>
        )}

        {/* Top Header with Draggable Grip, Search and Controls */}
        <PrimarySidePanelHeader
          hasDockedContent={hasDockedContent}
          title={title}
          showSearchFilter={showSearchFilter}
          variant="sidebar"
          isPinned={isPinned}
          position={position}
          onTogglePosition={onTogglePosition}
          moveTooltip={moveTooltip}
          canMove={canMove}
          treeView={treeView}
          activeTab={activeTab}
          onTabChange={onTabChange}
          tabs={tabs}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          isAnyCategoryExpanded={isAnyCategoryExpanded}
          onToggleAllCategories={onToggleAllCategories}
          isAnyFolderExpanded={isAnyFolderExpanded}
          onToggleAllFolders={onToggleAllFolders}
          onTogglePin={onTogglePin ?? onClose}
          onClose={onClose}
          onAddNewItem={onAddNewItem}
          onAddNewCollection={onAddNewCollection}
          onAddNewTemplate={onAddNewTemplate}
          collections={collections}
          filterCollectionIds={filterCollectionIds}
          onToggleFilterCollection={onToggleFilterCollection}
          onClearCollectionFilters={onClearCollectionFilters}
          filterFieldTypes={filterFieldTypes}
          onToggleFilterFieldType={onToggleFilterFieldType}
          onClearFieldTypeFilters={onClearFieldTypeFilters}
          fieldTypeCounts={fieldTypeCounts}
          onAddNewField={onAddNewField}
          onHandlePointerDown={onHandlePointerDown}
          onStartTabDrag={onStartTabDrag}
          isDragging={isDockDragging}
          reorderInfo={reorderInfo}
          hierarchyNodeCount={hierarchyNodeCount}
        />

        {/* Panel Scrollable Body */}
        <PanelContentTransition contentKey={children ? title : 'empty'} suppressTransition={isContentSliding}>
        <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${children ? 'px-2.5 pt-0 pb-3' : 'p-0'} min-w-0 primary-panel-scroll relative z-10 flex flex-col`}>
          {children ? (
            children
          ) : (
            <EmptyPanelDropZone panelTitle={title} position={position} />
          )}
        </div>
        </PanelContentTransition>

        {/* Mirrored Bottom Topper */}
        <div
          className={`panel-bottom-topper ${
            hasDockedContent ? 'panel-bottom-topper-occupied' : 'panel-bottom-topper-empty'
          } shrink-0 select-none pointer-events-none`}
          aria-hidden="true"
        />
      </aside>
    </>
  );
}
