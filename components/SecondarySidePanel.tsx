'use client';

import React, { ReactNode } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ResetWidthIcon,
  ResetWidthRightIcon,
  DockLeftPanelIcon,
  DockRightPanelIcon,
} from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { SecondarySidebarPosition } from '@/types/layout';

/* ==========================================================================
   1. TYPE DEFINITIONS & CONSTANTS
   ========================================================================== */

/**
 * Props for SecondarySidePanel utility & inspector drawer.
 */
interface SecondarySidePanelProps {
  isOpen: boolean;
  position?: SecondarySidebarPosition;
  onTogglePosition?: () => void;
  onOpen?: () => void;
  onClose: () => void;
  title?: string;
  reservedWidth?: number;
  onWidthChange?: (width: number) => void;
  children?: ReactNode;
  onHandlePointerDown?: (e: React.PointerEvent) => void;
}

const MIN_WIDTH = 260;
const DEFAULT_WIDTH = 304;
const MIN_WORKSPACE_GAP = 48;

/* ==========================================================================
   2. MAIN COMPONENT: SecondarySidePanel
   Collapsible drawer positioned along the right or left seam of the workspace.
   Features an animated pull-tab, tactile drag-to-resize seam, and width reset.
   ========================================================================== */

export default function SecondarySidePanel({
  isOpen,
  position = 'right',
  onTogglePosition,
  onOpen,
  onClose,
  title = "Secondary Side Bar",
  reservedWidth = 0,
  onWidthChange,
  children,
  onHandlePointerDown,
}: SecondarySidePanelProps) {
  /* ------------------------------------------------------------------------
     2.1 USER PREFERENCES & RESIZING HOOK
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

  return (
    <>
      {/* --------------------------------------------------------------------
          2.2 FLOATING EXPAND TAB (Visible When Collapsed)
          -------------------------------------------------------------------- */}
      <button
        type="button"
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
        style={{
          width: `${panelWidth}px`,
          left: position === 'left' ? '0px' : `calc(100% - ${panelWidth}px)`,
        }}
        className={[
          'secondary-side-panel absolute top-0 bottom-0 z-30 flex flex-col',
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

        {/* Top Header with Draggable Grip and Side Toggle */}
        <div className="secondary-side-panel-header px-2.5 pt-2 pb-2 flex items-center justify-between gap-1 w-full shrink-0 h-10 select-none">
          {/* Draggable Grip Handle & Title */}
          <div
            onPointerDown={isOpen ? onHandlePointerDown : undefined}
            className={`flex items-center gap-1.5 flex-1 min-w-0 py-0.5 ${
              isOpen ? 'cursor-grab active:cursor-grabbing hover:opacity-90' : ''
            }`}
            title={isOpen ? 'Drag to dock panel (Left, Right, Bottom)' : undefined}
          >
            <span className="text-[10px] text-muted opacity-60 flex gap-0.5 tracking-tighter shrink-0" aria-hidden="true">
              ⋮⋮
            </span>
            <span className="text-xs font-bold uppercase tracking-wider explorer-panel-muted px-0.5 truncate">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Move to Opposite Side Toggle Button */}
            {onTogglePosition && (
              <button
                type="button"
                onClick={onTogglePosition}
                className="secondary-side-panel-btn group"
                title={
                  position === 'right'
                    ? 'Move Secondary Side Bar to Left'
                    : 'Move Secondary Side Bar to Right'
                }
                aria-label="Toggle panel side"
              >
                {position === 'right' ? (
                  <DockLeftPanelIcon className="w-3.5 h-3.5 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" isOpen={true} />
                ) : (
                  <DockRightPanelIcon className="w-3.5 h-3.5 text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" isOpen={true} />
                )}
              </button>
            )}

            {/* Collapse Trigger */}
            <button
              type="button"
              onClick={onClose}
              className="secondary-side-panel-btn group"
              title="Close Secondary Side Bar"
            >
              <span className="inline-block origin-center transition-all duration-200 ease-out group-hover:scale-115 text-xs text-[var(--explorer-action-icon,rgba(109,170,209,0.85))] group-hover:text-white px-1 select-none">
                ✕
              </span>
            </button>
          </div>
        </div>

        {/* Panel Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pl-3 pr-2 py-3 relative z-10">
          <div className="space-y-4 ui-primary">
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
