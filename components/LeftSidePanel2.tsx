'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useUIPreferences } from '@/context/UIPreferencesContext2';
import { useResizablePanel } from '@/hooks/useResizablePanel2';
import { useFlyoutLifecycle } from '@/hooks/useFlyoutLifecycle2';
import LeftSidePanelHeader from '@/components/LeftSidePanelHeader2';

/* ==========================================================================
   1. TYPE DEFINITIONS & CONSTANTS
   ========================================================================== */

/**
 * Props for the LeftSidePanel2 container.
 * @property variant - Layout rendering strategy: floating popover ('flyout') or docked split column ('sidebar')
 * @property isOpen - Controls visibility and mount lifecycle for the unpinned flyout
 * @property onClose - Dismissal handler invoked by backdrop clicks, escape keys, or close triggers
 * @property onTogglePin - Toggles between docked sidebar and floating flyout presentation modes
 * @property isAnyFolderExpanded - Determines whether accordion toggle displays Expand All or Collapse All
 * @property onToggleAllFolders - Bulk accordion expansion handler
 * @property searchQuery - Filter string used to filter tree nodes
 * @property onSearchChange - Callback updating active search text
 * @property reservedWidth - Footprint of the opposite panel used to prevent viewport overlap during resizing
 * @property onWidthChange - Callback notifying root page of user-dragged dimension changes
 * @property loading - Renders hierarchy syncing progress indicators
 * @property error - Displays tree-load or persistence error notices
 * @property children - ExplorerContent tree node elements rendered inside the scroll chassis
 */
interface LeftSidePanelProps {
  variant: 'flyout' | 'sidebar';
  isOpen: boolean;
  onClose: () => void;
  onTogglePin: () => void;
  isAnyFolderExpanded: boolean;
  onToggleAllFolders: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  reservedWidth?: number;
  onWidthChange?: (width: number) => void;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  onAddNewItem?: () => void; // <-- Add prop
}

const DEFAULT_WIDTH = 304;

/* ==========================================================================
   2. MAIN COMPONENT: LeftSidePanel2
   ========================================================================== */

export default function LeftSidePanel2({
  variant,
  isOpen,
  onClose,
  onTogglePin,
  isAnyFolderExpanded = false,
  onToggleAllFolders,
  searchQuery,
  onSearchChange,
  reservedWidth = 0,
  onWidthChange,
  loading,
  error,
  children,
  onAddNewItem,
}: LeftSidePanelProps) {
  /* ------------------------------------------------------------------------
     2.1 CONTEXT & PREFERENCES
     Reads user preferences to manage docking, animations, and SSR hydration.
     ------------------------------------------------------------------------ */
  const { isPinned, togglePin, animationsEnabled, isHydrated } = useUIPreferences();

  /* ------------------------------------------------------------------------
     2.2 RESIZING CONTROLLER HOOK
     Manages mouse drag physics, opposite-panel clamping, and default resets.
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
     2.3 FLYOUT LIFECYCLE & ANIMATION HOOK
     Coordinates entrance and exit timers so unmounting transitions complete.
     ------------------------------------------------------------------------ */
  const { renderMenu, isClosing } = useFlyoutLifecycle(
    isOpen,
    isPinned,
    animationsEnabled,
    variant
  );

  // Suppress CSS transitions during drag resizing for instantaneous 60+ FPS tracking
  const transitionClass = (!isDragging && animationsEnabled && isHydrated)
    ? 'transition-all duration-700 ease-in-out'
    : 'transition-none';

  const handlePinAction = () => (onTogglePin ? onTogglePin() : togglePin());

  /* ------------------------------------------------------------------------
     2.4 UNIFIED INTERNAL CONTENT CHASSIS
     Shared structure rendered within both flyout and docked sidebar shells.
     ------------------------------------------------------------------------ */
  const innerContent = (
    <>
      {/* 
        Resize Drag Handle:
        Anchored to the right seam when pinned. Displays a 5px amber glow line on hover/drag.
      */}
      {isPinned && (
        <div
          onPointerDown={handlePointerDown}
          onDoubleClick={handleResetWidth}
          className="group/handle absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-50 flex items-center justify-center select-none"
          title="Drag to resize panel"
        >
          {/* Full-height amber seam line */}
          <div
            className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[5px] transition-all duration-150 pointer-events-none ${
              isDragging
                ? 'bg-accent-secondary opacity-100'
                : 'opacity-0 group-hover/handle:opacity-100 group-hover/handle:bg-accent-secondary'
            }`}
          />
          {/* Central tactile grab handle pill */}
          <div
            className={`relative z-10 w-1 h-12 rounded-full transition-all duration-200 pointer-events-none ${
              isDragging
                ? 'bg-accent-secondary w-1.5 h-20 opacity-100'
                : 'bg-accent-secondary/60 group-hover/handle:bg-accent-secondary group-hover/handle:h-16 group-hover/handle:opacity-100 opacity-0'
            }`}
          />
        </div>
      )}

      {/* 
        Reset Width Floating Pull-Tab:
        Appears along the outer seam when dragged away from the default width.
      */}
      {isPinned && panelWidth !== DEFAULT_WIDTH && (
        <button
          type="button"
          onClick={handleResetWidth}
          className={[
            'group absolute top-16 -right-7 w-7 h-8 z-40',
            'flex items-center justify-center',
            'bg-[var(--panel-surface-bg)] border border-accent-secondary border-l-0 rounded-r-md',
            'hover:bg-surface-hover',
            'shadow-[4px_0_12px_rgba(0,0,0,0.6)] transition-colors',
            animationsEnabled ? 'animate-mount-fade' : '',
          ].join(' ')}
          title="Reset to default width"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-secondary group-hover:text-white transition-colors"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      )}

      {/* Top Header: Search bar, shortcuts, accordion controls, and pin toggles */}
      <LeftSidePanelHeader
        variant={variant}
        isPinned={isPinned}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        isAnyFolderExpanded={isAnyFolderExpanded}
        onToggleAllFolders={onToggleAllFolders}
        onTogglePin={handlePinAction}
        onClose={onClose}
        onAddNewItem={onAddNewItem}
      />

      {/* Syncing Progress Banner */}
      {loading && (
        <div className="left-side-panel-notice-loading animate-pulse shrink-0 px-3 py-1 text-xs text-content-muted mt-2 mx-2">
          ⏳ Syncing hierarchy...
        </div>
      )}

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
     3. FLYOUT VARIANT (Unpinned Floating Dropdown Popover)
     Renders into document body via React Portal with a click-outside backdrop.
     ------------------------------------------------------------------------ */
  if (variant === 'flyout') {
    if (!renderMenu && !isPinned) return null;

    return (
      <>
        {/* Transparent Click-Outside Dismissal Backdrop */}
        {isHydrated &&
          createPortal(
            <div
              onClick={onClose}
              className={[
                'fixed inset-0 top-14 z-[60] bg-transparent',
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

        {/* Floating Flyout Menu Shell */}
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
     4. SIDEBAR VARIANT (Pinned Desktop-Docked Split Column)
     Occupies physical layout space in the main workspace flex container.
     ------------------------------------------------------------------------ */
  return (
    <aside
      style={{ width: isPinned ? `${panelWidth}px` : 0 }}
      className={[
        'left-side-panel absolute top-0 bottom-0 left-0 z-30',
        'backdrop-blur-md shadow-2xl',
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