'use client';

import React from 'react';
import {
  DockLeftPanelIcon,
  DockRightPanelIcon,
  PinFilledIcon,
  PinOutlineIcon,
} from '@/components/icons/PanelIcons';
import { PrimarySidebarPosition } from '@/types/layout';

interface PanelToolbarRowProps {
  hasDockedContent: boolean;
  title?: string;
  variant: 'flyout' | 'sidebar';
  isPinned?: boolean;
  position: PrimarySidebarPosition;
  onTogglePosition?: () => void;
  moveTooltip?: string;
  canMove: boolean;
  onDock?: (position: 'left' | 'right') => void;
  panelName: string;
  onTogglePin?: () => void;
  onClose: () => void;
  onHandlePointerDown?: (e: React.PointerEvent) => void;
}

/** The panel header's top row: drag grip, title, and the dock/move/pin/close controls. */
export default function PanelToolbarRow({
  hasDockedContent,
  title,
  variant,
  isPinned,
  position,
  onTogglePosition,
  moveTooltip,
  canMove,
  onDock,
  panelName,
  onTogglePin,
  onClose,
  onHandlePointerDown,
}: PanelToolbarRowProps) {
  return (
    <div className="tree-header-toolbar flex items-center justify-between gap-1 w-full shrink-0 select-none">
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
        <span className="tree-header-title text-xs font-bold uppercase tracking-wider px-0.5 truncate">
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
              <DockRightPanelIcon className="w-3.5 h-3.5 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" isOpen={true} />
            ) : (
              <DockLeftPanelIcon className="w-3.5 h-3.5 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" isOpen={true} />
            )}
          </button>
        )}

        {/* Items docks into either sidebar; pinning belongs to the sidebars. */}
        {variant === 'flyout' && onDock && (
          <>
            <button
              type="button"
              onClick={() => onDock('left')}
              className="primary-side-panel-position-btn group"
              title={`Dock ${panelName} to Left`}
              aria-label={`Dock ${panelName} to Left`}
            >
              <DockLeftPanelIcon className="w-3.5 h-3.5 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" isOpen={true} />
            </button>
            <button
              type="button"
              onClick={() => onDock('right')}
              className="primary-side-panel-position-btn group"
              title={`Dock ${panelName} to Right`}
              aria-label={`Dock ${panelName} to Right`}
            >
              <DockRightPanelIcon className="w-3.5 h-3.5 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white" isOpen={true} />
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
              className="w-3.5 h-3.5 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white"
            />
          ) : (
            <PinFilledIcon
              position={position}
              className="w-3.5 h-3.5 text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white"
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
            <span className="inline-block origin-center transition-all duration-200 ease-out group-hover:scale-115 text-xs text-[var(--tree-action-icon,rgba(109,170,209,0.85))] group-hover:text-white px-1 select-none">
              ✕
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
