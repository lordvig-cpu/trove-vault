'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { useFlyoutLifecycle } from '@/hooks/useFlyoutLifecycle';
import LeftSidePanelHeader from '@/components/LeftSidePanelHeader';
import { CollectionRecord } from '@/types/collection';
import { ResetWidthIcon } from '@/components/icons/SystemIcons';

/* ==========================================================================
   1. TYPE DEFINITIONS & CONSTANTS
   ========================================================================== */

interface LeftSidePanelProps {
  variant: 'flyout' | 'sidebar';
  isOpen: boolean;
  onClose: () => void;
  onTogglePin: () => void;
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
    ? 'transition-all duration-700 ease-in-out'
    : 'transition-none';

  const handlePinAction = () => (onTogglePin ? onTogglePin() : togglePin());

  /* ------------------------------------------------------------------------
     2.4 UNIFIED INTERNAL CONTENT CHASSIS
     ------------------------------------------------------------------------ */
  const innerContent = (
    <>
      {/* Seam Resize Handle (Pinned mode only) */}
      {isPinned && (
        <div
          onPointerDown={handlePointerDown}
          onDoubleClick={handleResetWidth}
          className="group/handle absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-50 flex items-center justify-center select-none"
          title="Drag to resize panel"
        >
          <div
            className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[5px] transition-all duration-150 pointer-events-none ${
              isDragging
                ? 'panel-grip-active'
                : 'panel-grip-idle'
            }`}
          />
          <div
            className={`relative z-10 w-1 h-12 rounded-full transition-all duration-200 pointer-events-none ${
              isDragging
                ? 'panel-grip-active w-1.5 h-20'
                : 'panel-grip-idle group-hover/handle:h-16'
            }`}
          />
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
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        isAnyCategoryExpanded={activeIsExpanded}
        onToggleAllCategories={activeToggleAll}
        onTogglePin={handlePinAction}
        onClose={onClose}
        onAddNewItem={onAddNewItem}
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
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 pb-6 min-w-0 left-panel-scroll">
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
            'nav-flyout-menu relative transform',
            transitionClass,
            animationsEnabled && !isPinned
              ? isClosing
                ? 'animate-unmount-fade'
                : 'animate-mount-fade'
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
      style={{ width: isPinned ? `${panelWidth}px` : 0 }}
      className={[
        'left-side-panel absolute top-0 bottom-0 left-0 z-50',
        'panel-shell',
        transitionClass,
        // Force transform to none in all states to prevent GPU layer popping
        '!transform-none',
        isPinned ? 'left-side-panel-pinned' : 'left-side-panel-unpinned pointer-events-none',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {innerContent}
    </aside>
  );
}