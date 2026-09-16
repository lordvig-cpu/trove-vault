'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { useFlyoutLifecycle } from '@/hooks/useFlyoutLifecycle';
import LeftSidePanelHeader from '@/components/LeftSidePanelHeader';
import { CollectionRecord } from '@/types/collection';
import { ResetWidthIcon } from '@/components/icons/SystemIcons';
import { ExplorerTab } from '@/lib/filterExplorerForest';

/* ==========================================================================
   1. TYPE DEFINITIONS & CONSTANTS
   ========================================================================== */

interface LeftSidePanelProps {
  variant: 'flyout' | 'sidebar';
  isOpen: boolean;
  onClose: () => void;
  onTogglePin: () => void;
  activeTab?: ExplorerTab;
  onTabChange?: (tab: ExplorerTab) => void;
  isAnyCategoryExpanded?: boolean;
  onToggleAllCategories?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  reservedWidth?: number;
  onWidthChange?: (width: number) => void;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  onAddNewItem?: () => void;
  onAddNewCollection?: () => void;
  collections: CollectionRecord[];

  // New Multi-Select Array Props
  filterCollectionIds: number[];
  onToggleFilterCollection: (collectionId: number) => void;
  onClearCollectionFilters: () => void;
}

const DEFAULT_WIDTH = 304;

/* ==========================================================================
   2. MAIN COMPONENT: LeftSidePanel
   ========================================================================== */

export default function LeftSidePanel({
  variant,
  isOpen,
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
}: LeftSidePanelProps) {
  // Resolve canonical category terminology
  const activeIsExpanded = isAnyCategoryExpanded;
  const activeToggleAll = onToggleAllCategories;

  /* ------------------------------------------------------------------------
     2.1 CONTEXT & PREFERENCES
     ------------------------------------------------------------------------ */
  const { isPinned, togglePin, animationsEnabled, isHydrated } = useUIPreferences();

  /* ------------------------------------------------------------------------
     2.2 RESIZING CONTROLLER HOOK
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
    direction: 'left',
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

  const transitionClass = (!isDragging && animationsEnabled && isHydrated)
    ? 'transition-[width,transform,opacity] duration-500 ease-in-out'
    : 'transition-none';

  const handlePinAction = () => (onTogglePin ? onTogglePin() : togglePin());

  /* ------------------------------------------------------------------------
     2.4 UNIFIED INTERNAL CONTENT CHASSIS
     ------------------------------------------------------------------------ */
  const innerContent = (
    <>
      {/* Seam Resize Handle (Pinned mode only: isolated to vertical center) */}
      {isPinned && (
        <div
          onPointerDown={handlePointerDown}
          onDoubleClick={handleResetWidth}
          className={`panel-resize-handle absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-32 select-none group/resize ${
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
      {isPinned && panelWidth !== DEFAULT_WIDTH && (
        <button
          type="button"
          onClick={handleResetWidth}
          className={[
            'group absolute top-16 -right-7 w-7 h-8 z-40',
            'flex items-center justify-center',
            'panel-reset-button border border-l-0 rounded-r-md transition-colors',
            animationsEnabled ? 'animate-mount-fade' : '',
          ].join(' ')}
          title="Reset to default width"
        >
          <ResetWidthIcon className="w-3.5 h-3.5 panel-reset-icon" />
        </button>
      )}

      {/* Header with Search, Filter Button & Filter Tray */}
      <LeftSidePanelHeader
        variant={variant}
        isPinned={isPinned}
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
      />

      {/* Syncing Progress Banner */}
      {loading && (
        <div className="left-side-panel-notice-loading panel-notice-text animate-pulse shrink-0 px-3 py-1 text-xs mt-2 mx-2">
          ⏳ Syncing hierarchy...
        </div>
      )}

      {/* Error Feedback Notice */}
      {error && (
        <div className="left-side-panel-notice-error mt-2 mx-2">
          {error}
        </div>
      )}

      {/* Dedicated Scrollable Explorer Tree Viewport */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 pt-0 pb-6 min-w-0 left-panel-scroll">
        {children}
      </div>
    </>
  );

  /* ------------------------------------------------------------------------
     3. FLYOUT VARIANT
     ------------------------------------------------------------------------ */
  if (variant === 'flyout') {
    if (!renderMenu && !isPinned) return null;

    return (
      <>
        {isHydrated &&
          createPortal(
            <div
              onClick={onClose}
              className={[
                'fixed inset-0 top-14 z-[60] panel-overlay',
                animationsEnabled
                  ? isClosing && !isPinned
                    ? 'animate-unmount-fade'
                    : 'animate-mount-fade'
                  : '',
                isPinned ? 'nav-overlay-pinned' : 'nav-overlay-unpinned',
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
            animationsEnabled && !isPinned
              ? isClosing
                ? 'animate-flyout-slide-out'
                : 'animate-flyout-slide-in'
              : '',
            isPinned ? 'nav-flyout-pinned' : 'nav-flyout-unpinned',
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
  return (
    <aside
      style={{ width: `${panelWidth}px` }}
      className={[
        'left-side-panel absolute top-0 bottom-0 left-0 z-50',
        'panel-shell',
        transitionClass,
        isPinned ? 'left-side-panel-pinned' : 'left-side-panel-unpinned pointer-events-none',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {innerContent}
    </aside>
  );
}