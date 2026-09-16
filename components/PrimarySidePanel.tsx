'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { useFlyoutLifecycle } from '@/hooks/useFlyoutLifecycle';
import PrimarySidePanelHeader from '@/components/PrimarySidePanelHeader';
import { CollectionRecord } from '@/types/collection';
import { ResetWidthIcon, ResetWidthRightIcon } from '@/components/icons/SystemIcons';
import { ExplorerTab } from '@/lib/filterExplorerForest';
import { PrimarySidebarPosition } from '@/types/layout';

/* ==========================================================================
   1. TYPE DEFINITIONS & CONSTANTS
   ========================================================================== */

interface PrimarySidePanelProps {
  variant: 'flyout' | 'sidebar';
  position?: PrimarySidebarPosition;
  onTogglePosition?: () => void;
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

  // Multi-Select Array Props
  filterCollectionIds: number[];
  onToggleFilterCollection: (collectionId: number) => void;
  onClearCollectionFilters: () => void;

  onHandlePointerDown?: (e: React.PointerEvent) => void;
}

const DEFAULT_WIDTH = 304;

/* ==========================================================================
   2. MAIN COMPONENT: PrimarySidePanel
   ========================================================================== */

export default function PrimarySidePanel({
  variant,
  position = 'left',
  onTogglePosition,
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
      {isPinned && panelWidth !== DEFAULT_WIDTH && (
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
        variant={variant}
        isPinned={isPinned}
        position={position}
        onTogglePosition={onTogglePosition}
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

      {/* Dedicated Scrollable Explorer Tree Viewport */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 pt-0 pb-6 min-w-0 primary-panel-scroll">
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
  const positionClass = position === 'right' ? 'primary-side-panel-right' : 'primary-side-panel-left';
  const stateClass = isPinned
    ? position === 'right'
      ? 'primary-side-panel-pinned-right'
      : 'primary-side-panel-pinned-left'
    : position === 'right'
    ? 'primary-side-panel-unpinned-right pointer-events-none'
    : 'primary-side-panel-unpinned-left pointer-events-none';

  return (
    <aside
      style={{ width: `${panelWidth}px` }}
      className={[
        'primary-side-panel absolute top-0 bottom-0 z-50',
        positionClass,
        'panel-shell',
        transitionClass,
        stateClass,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {innerContent}
    </aside>
  );
}

