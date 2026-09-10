'use client';

import React, { ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext2';
import { useResizablePanel } from '@/hooks/useResizablePanel2';

/* ==========================================================================
   1. TYPE DEFINITIONS & CONSTANTS
   ========================================================================== */

/**
 * Props for the RightSidePanel2 utility & inspector drawer.
 * @property isOpen - Controls expansion state and width layout rendering
 * @property onOpen - Callback fired when clicking the floating expand tab
 * @property onClose - Dismissal callback fired when clicking the collapse chevron
 * @property title - Primary header title (defaults to "Details")
 * @property reservedWidth - Opposite panel's width used to dynamically clamp resizing
 * @property onWidthChange - Callback notifying root page of user-dragged dimension updates
 * @property children - Inspector content (or default diagnostic rows if empty)
 */
interface RightPanelProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  title?: string;
  reservedWidth?: number;
  onWidthChange?: (width: number) => void;
  children?: ReactNode;
}

const MIN_WIDTH = 260;
const DEFAULT_WIDTH = 360;
const MIN_WORKSPACE_GAP = 48;

/* ==========================================================================
   2. MAIN COMPONENT: RightSidePanel2
   Collapsible drawer positioned along the right seam of the main workspace.
   Features an animated pull-tab, tactile drag-to-resize seam, and width reset.
   ========================================================================== */

export default function RightPanel({
  isOpen,
  onOpen,
  onClose,
  title = "Details",
  reservedWidth = 0,
  onWidthChange,
  children,
}: RightPanelProps) {
  /* ------------------------------------------------------------------------
     2.1 USER PREFERENCES & SHARED RESIZING HOOK
     Reuses useResizablePanel with 'right' direction physics (window.innerWidth - clientX).
     ------------------------------------------------------------------------ */
  const { animationsEnabled } = useUIPreferences();

  const {
    panelWidth,
    isDragging,
    handlePointerDown,
    handleResetWidth,
  } = useResizablePanel({
    initialWidth: DEFAULT_WIDTH,
    minWidth: MIN_WIDTH,
    minGap: MIN_WORKSPACE_GAP,
    reservedWidth,
    direction: 'right',
    onWidthChange,
  });

  // Temporarily disable CSS width transitions during active drag for zero input latency
  const transitionClass = (!isDragging && animationsEnabled)
    ? 'transition-all duration-700 ease-in-out' 
    : 'transition-none';

  return (
    <>
      {/* --------------------------------------------------------------------
          2.2 FLOATING EXPAND TAB (Visible When Collapsed)
          Sticky pull-tab positioned on the right viewport edge.
          -------------------------------------------------------------------- */}
      <button
        type="button"
        onClick={onOpen}
        className={[
          'right-panel-expand-tab group',
          transitionClass,
          isOpen ? 'right-panel-tab-hidden' : 'right-panel-tab-visible',
        ].filter(Boolean).join(' ')}
        title="Open Side Panel"
      >
        <ChevronLeftIcon className="w-3.5 h-3.5 origin-center transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-hover:scale-115" />
      </button>

      {/* --------------------------------------------------------------------
          2.3 DOCKED UTILITY & INSPECTOR PANEL CONTAINER
          Slides smoothly into the workspace flex container from the right.
          -------------------------------------------------------------------- */}
      <aside
        style={{ width: isOpen ? `${panelWidth}px` : 0 }}
        className={[
          'right-side-panel absolute top-0 bottom-0 right-0 z-30 flex flex-col',
          transitionClass,
          isOpen ? 'right-panel-docked-open' : 'right-panel-docked-closed pointer-events-none',
        ].filter(Boolean).join(' ')}
      >
        {/* 
          Left-Edge Seam Resize Handle:
          Enables custom panel width resizing with a 5px amber glow highlight on drag.
        */}
        {isOpen && (
          <div
            onPointerDown={handlePointerDown}
            onDoubleClick={handleResetWidth}
            className="group/handle absolute top-0 -left-1.5 w-3 h-full cursor-col-resize z-50 flex items-center justify-center select-none"
            title="Drag to resize, double-click to reset"
          >
            {/* Full-height amber vertical glow line */}
            <div
              className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[5px] transition-all duration-150 pointer-events-none ${
                isDragging
                  ? 'bg-accent-secondary opacity-100'
                  : 'opacity-0 group-hover/handle:opacity-100 group-hover/handle:bg-accent-secondary'
              }`}
            />
            {/* Tactile central pill */}
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
          Appears on the outer seam when the panel is dragged away from DEFAULT_WIDTH (360px).
        */}
        {isOpen && panelWidth !== DEFAULT_WIDTH && (
          <button
            type="button"
            onClick={handleResetWidth}
            className={[
              'group absolute top-16 -left-7 w-7 h-8 z-40',
              'flex items-center justify-center',
              'bg-[var(--panel-surface-bg)] border border-accent-secondary border-r-0 rounded-l-md',
              'hover:bg-surface-hover',
              'shadow-[-4px_0_12px_rgba(0,0,0,0.6)] transition-colors',
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
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        )}

        {/* Top Header: Section title and collapse trigger button */}
        <div className="right-side-panel-header">
          <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
            {title}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="right-side-panel-btn group"
              title="Collapse Panel"
            >
              <ChevronRightIcon className="w-3.5 h-3.5 text-content-muted group-hover:text-content-primary origin-center transition-all duration-200 ease-out group-hover:translate-x-0.5 group-hover:scale-115" />
            </button>
          </div>
        </div>

        {/* Panel Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pl-3 pr-2 py-3">
          <div className="space-y-4 text-content-primary">
            {children ? (
              children
            ) : (
              <>
                {Array.from({ length: 80 }).map((_, i) => (
                  <div key={i} className="text-xs font-mono">
                    Test Row #{i + 1}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export const RightSidePanel = RightPanel;