'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { useFlyoutLifecycle } from '@/hooks/useFlyoutLifecycle';
import PrimarySidePanelHeader from '@/components/PrimarySidePanelHeader';
import { CollectionRecord } from '@/types/collection';
import { 
  ResetWidthIcon, 
  ResetWidthRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons/SystemIcons';
import { ExplorerTab } from '@/lib/filterExplorerForest';
import { PrimarySidebarPosition } from '@/types/layout';
import EmptyPanelDropZone from '@/components/EmptyPanelDropZone';
import PanelContentTransition from '@/components/PanelContentTransition';

/* ==========================================================================
   1. TYPE DEFINITIONS & CONSTANTS
   ========================================================================== */

interface PrimarySidePanelProps {
  isContentSliding?: boolean;
  hasDockedContent?: boolean;
  title?: string;
  showSearchFilter?: boolean;
  variant: 'flyout' | 'sidebar';
  position?: PrimarySidebarPosition;
  onTogglePosition?: () => void;
  moveTooltip?: string;
  canMove?: boolean;
  onDock?: (position: 'left' | 'right') => void;
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  onTogglePin?: () => void;
  activeTab?: ExplorerTab;
  onTabChange?: (tab: ExplorerTab) => void;
  isAnyCategoryExpanded?: boolean;
  onToggleAllCategories?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  reservedWidth?: number;
  onWidthChange?: (width: number) => void;
  loading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
  onAddNewItem?: () => void;
  onAddNewCollection?: () => void;
  collections?: CollectionRecord[];

  // Multi-Select Array Props
  filterCollectionIds?: number[];
  onToggleFilterCollection?: (collectionId: number) => void;
  onClearCollectionFilters?: () => void;

  onHandlePointerDown?: (e: React.PointerEvent) => void;
}

const DEFAULT_WIDTH = 304;

/* ==========================================================================
   2. MAIN COMPONENT: PrimarySidePanel
   ========================================================================== */

export default function PrimarySidePanel({
  isContentSliding = false,
  hasDockedContent = false,
  title,
  showSearchFilter,
  variant,
  position = 'left',
  onTogglePosition,
  moveTooltip,
  canMove = true,
  onDock,
  isOpen,
  onOpen,
  onClose,
  onTogglePin,
  activeTab,
  onTabChange,
  isAnyCategoryExpanded,
  onToggleAllCategories,
  searchQuery,
  onSearchChange,
  reservedWidth = 0,
  onWidthChange,
  loading,
  error,
  children,
  onAddNewItem,
  onAddNewCollection,
  collections = [],
  filterCollectionIds = [],
  onToggleFilterCollection,
  onClearCollectionFilters,
  onHandlePointerDown,
}: PrimarySidePanelProps) {
  const activeIsExpanded = isAnyCategoryExpanded;
  const activeToggleAll = onToggleAllCategories;

  /* ------------------------------------------------------------------------
     2.1 CONTEXT & PREFERENCES
     ------------------------------------------------------------------------ */
  const { isPinned, togglePin, animationsEnabled, isHydrated } = useUIPreferences();

  /* ------------------------------------------------------------------------
     2.2 RESIZING CONTROLLER HOOK
     Direction dynamically matches docking side ('left' or 'right')
     ------------------------------------------------------------------------ */
  const {
    panelWidth,
    isDragging,
    handlePointerDown,
    handleResetWidth,
  } = useResizablePanel({
    initialWidth: DEFAULT_WIDTH,
    minWidth: 304,
    minGap: 48,
    reservedWidth,
    direction: position === 'right' ? 'right' : 'left',
    onWidthChange,
  });

  /* ------------------------------------------------------------------------
     2.3 FLYOUT LIFECYCLE HOOK
     ------------------------------------------------------------------------ */
  const { renderMenu, isClosing } = useFlyoutLifecycle(
    isOpen,
    isPinned,
    animationsEnabled,
    variant
  );

  const transitionClass =
    !isDragging && animationsEnabled && isHydrated
      ? 'transition-[width,left,transform,opacity,border-color] duration-500 ease-in-out'
      : 'transition-none';

  const handlePinAction = () => (onTogglePin ? onTogglePin() : togglePin());

  /* ------------------------------------------------------------------------
     2.4 UNIFIED INTERNAL CONTENT CHASSIS
     ------------------------------------------------------------------------ */
  const innerContent = (
    <>
      {/* Seam Resize Handle (Open sidebar, whether pinned or unpinned) */}
      {variant === 'sidebar' && isOpen && (
        <div
          onPointerDown={handlePointerDown}
          onDoubleClick={handleResetWidth}
          className={`panel-resize-handle absolute top-1/2 -translate-y-1/2 ${
            position === 'left' ? '-right-2' : '-left-2'
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
      {variant === 'sidebar' && isOpen && panelWidth !== DEFAULT_WIDTH && (
        <button
          type="button"
          onClick={handleResetWidth}
          className={[
            `group absolute top-16 ${
              position === 'left'
                ? '-right-7 border-l-0 rounded-r-md'
                : '-left-7 border-r-0 rounded-l-md'
            } w-7 h-8 z-40`,
            'flex items-center justify-center',
            'panel-reset-button border transition-colors',
            animationsEnabled ? 'animate-mount-fade' : '',
          ].join(' ')}
          title="Reset to default width"
        >
          {position === 'left' ? (
            <ResetWidthIcon className="w-3.5 h-3.5 panel-reset-icon" />
          ) : (
            <ResetWidthRightIcon className="w-3.5 h-3.5 panel-reset-icon" />
          )}
        </button>
      )}

      {/* Header with Search, Filter Button & Filter Tray */}
      <PrimarySidePanelHeader
        hasDockedContent={hasDockedContent}
        title={title}
        showSearchFilter={showSearchFilter ?? (Boolean(children) || variant === 'flyout')}
        variant={variant}
        isPinned={isPinned}
        position={position}
        onTogglePosition={onTogglePosition}
        moveTooltip={moveTooltip}
        canMove={canMove}
        onDock={onDock}
        activeTab={activeTab}
        onTabChange={onTabChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        isAnyCategoryExpanded={activeIsExpanded}
        onToggleAllCategories={activeToggleAll}
        onTogglePin={handlePinAction}
        onClose={onClose}
        onAddNewItem={onAddNewItem}
        onAddNewCollection={onAddNewCollection}
        collections={collections}
        filterCollectionIds={filterCollectionIds}
        onToggleFilterCollection={onToggleFilterCollection}
        onClearCollectionFilters={onClearCollectionFilters}
        onHandlePointerDown={onHandlePointerDown}
      />

      {/* Syncing Progress Banner */}
      {loading && (
        <div className="primary-side-panel-notice-loading panel-notice-text animate-pulse shrink-0 px-3 py-1 text-xs mt-2 mx-2">
          ⏳ Syncing hierarchy...
        </div>
      )}

      {/* Error Feedback Notice */}
      {error && <div className="primary-side-panel-notice-error mt-2 mx-2">{error}</div>}

      {/* Dedicated Scrollable Viewport or Empty Drop Zone Shell */}
      <PanelContentTransition contentKey={children ? title || 'content' : 'empty'} suppressTransition={isContentSliding}>
      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${children ? 'px-2.5 pt-0 pb-6' : 'p-0'} min-w-0 primary-panel-scroll flex flex-col`}>
        {children ? (
          children
        ) : (
          <EmptyPanelDropZone
            panelTitle={title || (variant === 'sidebar' ? 'Primary Side Panel' : 'Explorer')}
            position={position}
          />
        )}
      </div>
      </PanelContentTransition>
    </>
  );

  /* ------------------------------------------------------------------------
     3. FLYOUT VARIANT
     ------------------------------------------------------------------------ */
  if (variant === 'flyout') {
    if (!renderMenu) return null;

    return (
      <>
        {isHydrated &&
          createPortal(
            <div
              onClick={onClose}
              className={[
                'fixed inset-0 top-14 z-[60] panel-overlay',
                animationsEnabled
                  ? isClosing
                    ? 'animate-unmount-fade'
                    : 'animate-mount-fade'
                  : '',
              ].join(' ')}
              aria-hidden="true"
            />,
            document.body
          )}

        <aside
          style={{ zIndex: 80 }}
          className={[
            'nav-flyout-menu',
            transitionClass,
            animationsEnabled
              ? isClosing
                ? 'animate-flyout-slide-out'
                : 'animate-flyout-slide-in'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {innerContent}
        </aside>
      </>
    );
  }

  /* ------------------------------------------------------------------------
     4. SIDEBAR VARIANT
     ------------------------------------------------------------------------ */
  const isUnpinnedOpen = isOpen && !isPinned;
  const asideZIndex = isUnpinnedOpen ? 50 : 40;

  const positionClass = position === 'right' ? 'primary-side-panel-right primary-side-panel-docked-right' : 'primary-side-panel-left primary-side-panel-docked-left';
  const dockedClosedClass = position === 'right' ? 'primary-panel-docked-closed-right' : 'primary-panel-docked-closed-left';
  const tabPositionClass = position === 'left' ? 'primary-panel-expand-tab-left' : 'primary-panel-expand-tab-right';
  const tabHiddenClass = position === 'left' ? 'primary-panel-tab-hidden-left' : 'primary-panel-tab-hidden-right';

  return (
    <>
      {/* --------------------------------------------------------------------
          4.1 FLOATING EXPAND TAB (Visible When Primary Sidebar is Collapsed)
          -------------------------------------------------------------------- */}
      <button
        type="button"
        onClick={onOpen ?? handlePinAction}
        style={{
          left: position === 'left' ? '0px' : 'calc(100% - 1.75rem)',
        }}
        className={[
          'primary-panel-expand-tab group',
          tabPositionClass,
          transitionClass,
          isOpen ? tabHiddenClass : 'primary-panel-tab-visible',
        ]
          .filter(Boolean)
          .join(' ')}
        title={`Open Primary Side Bar (${position === 'left' ? 'Left' : 'Right'})`}
        aria-label="Open Primary Side Bar"
      >
        {position === 'left' ? (
          <ChevronRightIcon className="w-3.5 h-3.5 origin-center transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:scale-115" />
        ) : (
          <ChevronLeftIcon className="w-3.5 h-3.5 origin-center transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-hover:scale-115" />
        )}
      </button>

      {/* --------------------------------------------------------------------
          4.3 DOCKED PRIMARY EXPLORER PANEL CONTAINER
          -------------------------------------------------------------------- */}
      <aside
        style={{
          width: `${panelWidth}px`,
          left: position === 'left' ? '0px' : `calc(100% - ${panelWidth}px)`,
          zIndex: asideZIndex,
        }}
        className={[
          'primary-side-panel absolute top-0 bottom-0 flex flex-col',
          positionClass,
          transitionClass,
          isOpen ? 'primary-panel-docked-open' : `${dockedClosedClass} pointer-events-none`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {innerContent}
      </aside>
    </>
  );
}
