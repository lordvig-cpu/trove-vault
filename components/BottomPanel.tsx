'use client';

import React from 'react';
import {
  DockLeftPanelIcon,
  DockRightPanelIcon,
  DockBottomPanelIcon,
  ResetHeightIcon,
  PinFilledIcon,
  PinOutlineIcon,
  PanelFolderTabSvg,
} from '@/components/icons/PanelIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useResizableHeight } from '@/hooks/useResizableHeight';
import EmptyPanelDropZone from '@/components/EmptyPanelDropZone';
import PanelContentTransition from '@/components/PanelContentTransition';

export const DEFAULT_BOTTOM_PANEL_HEIGHT = 220;

interface BottomPanelProps {
  isOpen: boolean;
  isPinned?: boolean;
  title?: string;
  tabLabel?: string;
  tabTitle?: string;
  /** Shown in place of tabLabel's text when set (tabLabel still backs the tab's aria-label and
      default title). */
  tabIcon?: React.ReactNode;
  onClose: () => void;
  onTogglePin?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  reservedLeft?: number;
  reservedRight?: number;
  children?: React.ReactNode;
  onHandlePointerDown?: (e: React.PointerEvent) => void;
  onStartTabDrag?: (e: React.PointerEvent) => void;
  onHeightChange?: (height: number) => void;
}

export default function BottomPanel({
  isOpen,
  isPinned = false,
  title,
  tabLabel,
  tabTitle,
  tabIcon,
  onClose,
  onTogglePin,
  onMoveLeft,
  onMoveRight,
  canMoveLeft = false,
  canMoveRight = false,
  reservedLeft = 0,
  reservedRight = 0,
  children,
  onHandlePointerDown,
  onStartTabDrag,
  onHeightChange,
}: BottomPanelProps) {
  const { animationsEnabled, isHydrated } = useUIPreferences();
  const occupied = Boolean(children);

  const {
    panelHeight,
    maxHeight,
    isDragging,
    handlePointerDown,
    handleKeyDown,
    handleResetHeight,
    panelElementRef,
  } = useResizableHeight({
    initialHeight: DEFAULT_BOTTOM_PANEL_HEIGHT,
    minHeight: 140,
    minGap: 48,
    onHeightChange,
  });

  const transitionClass =
    !isDragging && animationsEnabled && isHydrated
      ? 'transition-[transform,opacity,height,left,right] duration-500 ease-in-out'
      : 'transition-none';

  const panelHeading = title || (occupied ? 'Grabbed Content' : 'Bottom Panel');

  return (
    <aside
      ref={panelElementRef}
      style={{
        height: `${panelHeight}px`,
        left: reservedLeft,
        right: reservedRight,
      }}
      className={[
        'bottom-side-panel',
        transitionClass,
        isOpen ? 'bottom-panel-docked-open' : 'bottom-panel-docked-closed',
      ].join(' ')}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      {/* Seam Resize Handle (Top border) */}
      {isOpen && (
        <div
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          role="separator"
          tabIndex={0}
          aria-label="Bottom panel height"
          aria-orientation="horizontal"
          aria-valuemin={140}
          aria-valuenow={panelHeight}
          aria-valuemax={maxHeight}
          onDoubleClick={handleResetHeight}
          className={`panel-resize-handle-horizontal absolute -top-2 left-1/2 -translate-x-1/2 w-32 h-4 select-none group/resize ${
            isDragging ? 'panel-resize-handle-active' : ''
          }`}
          title="Drag to resize panel (double-click to reset)"
        >
          <div className="panel-resize-pill-horizontal flex items-center justify-center">
            {/* 3 tactile grip dots inside the pill */}
            <div className="flex flex-row gap-1 items-center justify-center opacity-70">
              <span className="w-1 h-1 rounded-full bg-black/60 dark:bg-black/80" />
              <span className="w-1 h-1 rounded-full bg-black/60 dark:bg-black/80" />
              <span className="w-1 h-1 rounded-full bg-black/60 dark:bg-black/80" />
            </div>
          </div>
        </div>
      )}

      {/* Reset Height Button (Left) */}
      {isOpen && panelHeight !== DEFAULT_BOTTOM_PANEL_HEIGHT && (
        <button
          type="button"
          onClick={handleResetHeight}
          className={[
            'group absolute -top-7 left-6 h-7 w-8 z-40',
            'flex items-center justify-center cursor-pointer',
            'panel-reset-button border border-b-0 rounded-t-md transition-colors',
            animationsEnabled ? 'animate-mount-fade' : '',
          ].join(' ')}
          title="Reset to default height"
        >
          <ResetHeightIcon className="w-3.5 h-3.5 panel-reset-icon" />
        </button>
      )}

      {/* Reset Height Button (Right) */}
      {isOpen && panelHeight !== DEFAULT_BOTTOM_PANEL_HEIGHT && (
        <button
          type="button"
          onClick={handleResetHeight}
          className={[
            'group absolute -top-7 right-6 h-7 w-8 z-40',
            'flex items-center justify-center cursor-pointer',
            'panel-reset-button border border-b-0 rounded-t-md transition-colors',
            animationsEnabled ? 'animate-mount-fade' : '',
          ].join(' ')}
          title="Reset to default height"
        >
          <ResetHeightIcon className="w-3.5 h-3.5 panel-reset-icon" />
        </button>
      )}

      {/* Panel Header with Navigation Controls */}
      <div
        className={`primary-side-panel-header px-2.5 pt-2 pb-0 flex flex-col gap-2 shrink-0 ${
          occupied ? 'tree-header-occupied' : 'tree-header-empty'
        }`}
      >
        <div className="tree-header-toolbar flex items-center justify-between gap-1 w-full shrink-0 select-none">
          {/* Draggable Grip Handle & Title */}
          <div
            onPointerDown={occupied ? onHandlePointerDown : undefined}
            className={`flex items-center gap-1.5 flex-1 min-w-0 py-0.5 ${
              occupied ? 'cursor-grab active:cursor-grabbing hover:opacity-90' : ''
            }`}
            title={occupied ? 'Drag to dock content' : undefined}
          >
            <span className="text-[10px] text-muted opacity-60 tracking-tighter" aria-hidden="true">&#8942;&#8942;</span>
            <span className="tree-header-title text-xs font-bold uppercase tracking-wider px-0.5 truncate">
              {panelHeading}
            </span>
          </div>

          {/* Action buttons: Move Left, Close/Hide, Move Right, Pin */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onMoveLeft}
              disabled={!canMoveLeft}
              className="primary-side-panel-position-btn group disabled:opacity-35 disabled:cursor-not-allowed"
              title={
                !occupied
                  ? 'Content must be docked first'
                  : !canMoveLeft
                  ? 'No empty sidebar available for displaced content'
                  : `Move ${tabLabel || panelHeading} to Primary Side Bar`
              }
              aria-label="Move content to Primary Side Bar"
            >
              <DockLeftPanelIcon className="w-3.5 h-3.5" isOpen={true} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Hide Bottom Panel"
              aria-label="Hide Bottom Panel"
              className="p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center nav-footer-dock-btn-open"
            >
              <DockBottomPanelIcon className="w-4 h-4" isOpen={true} />
            </button>
            <button
              type="button"
              onClick={onMoveRight}
              disabled={!canMoveRight}
              className="primary-side-panel-position-btn group disabled:opacity-35 disabled:cursor-not-allowed"
              title={
                !occupied
                  ? 'Content must be docked first'
                  : !canMoveRight
                  ? 'No empty sidebar available for displaced content'
                  : `Move ${tabLabel || panelHeading} to Secondary Side Bar`
              }
              aria-label="Move content to Secondary Side Bar"
            >
              <DockRightPanelIcon className="w-3.5 h-3.5" isOpen={true} />
            </button>
            <button
              type="button"
              onClick={onTogglePin}
              className="primary-side-panel-pin-btn group"
              title={isPinned ? 'Unpin Bottom Panel' : 'Pin Bottom Panel'}
              aria-label={isPinned ? 'Unpin Bottom Panel' : 'Pin Bottom Panel'}
              aria-pressed={isPinned}
            >
              {isPinned ? <PinFilledIcon className="w-3.5 h-3.5" /> : <PinOutlineIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Paper Folder Tab Row (when occupied with a tab) */}
        {occupied && tabLabel && (
          <div className="flex items-end justify-between gap-1 w-full shrink-0 -mb-[1px]">
            <div role="tablist" aria-label="Bottom panel views" className="flex items-center relative">
              <button
                type="button"
                role="tab"
                aria-selected={true}
                aria-label={tabLabel}
                onPointerDown={onStartTabDrag}
                className="tree-folder-tab tree-folder-tab-active z-20 group/tab cursor-grab active:cursor-grabbing"
                title={tabTitle || `${tabLabel} (drag to move tab)`}
              >
                <PanelFolderTabSvg
                  gradientId="bottom-panel-tab-grad"
                  isActive={true}
                  variant="slanted"
                />
                <span className="relative z-10 flex items-center select-none">
                  {tabIcon ?? (
                    <span className="font-bold text-[12px] tracking-tight whitespace-nowrap">{tabLabel}</span>
                  )}
                </span>
              </button>
            </div>
          </div>
        )}

        <hr className="tree-header-divider" />
      </div>

      {/* Content Area */}
      <PanelContentTransition contentKey={occupied ? (tabLabel || 'occupied') : 'empty'}>
        <div className="bottom-panel-content flex-1 min-h-0 overflow-auto relative z-10 flex flex-col">
          {children || (
            <EmptyPanelDropZone
              panelTitle="Bottom Panel"
              position="bottom"
              description="Please drag-and-drop to populate it"
            />
          )}
        </div>
      </PanelContentTransition>

      {/* Mirrored Bottom Topper */}
      <div
        className={`panel-bottom-topper ${
          occupied ? 'panel-bottom-topper-occupied' : 'panel-bottom-topper-empty'
        } shrink-0 select-none pointer-events-none`}
        aria-hidden="true"
      />
    </aside>
  );
}
