'use client';

import React from 'react';
import { DockablePanelId, DockDropTargetZone, isDockZoneAllowed } from '@/hooks/usePanelDockDrag';

interface PanelDockDropZonesProps {
  isDragging: boolean;
  draggingPanel: DockablePanelId | null;
  hoveredZone: DockDropTargetZone | null;
  cursorPos: { x: number; y: number };
  primaryPanelContent?: 'empty' | 'explorer' | 'grabbed_content';
  secondaryPanelContent?: 'empty' | 'explorer' | 'grabbed_content';
}

export default function PanelDockDropZones({
  isDragging,
  draggingPanel,
  hoveredZone,
  cursorPos,
  primaryPanelContent = 'empty',
  secondaryPanelContent = 'empty',
}: PanelDockDropZonesProps) {
  if (!isDragging || !draggingPanel) return null;

  const leftTargetName = 'Primary Side Bar';
  const rightTargetName = 'Secondary Side Bar';

  const getDraggedItemName = (id: DockablePanelId) => {
    switch (id) {
      case 'explorer':
        return 'Explorer';
      case 'grabbed_content':
        return 'Grabbed Content';
      case 'primary':
        return primaryPanelContent === 'grabbed_content' ? 'Grabbed Content' : 'Explorer';
      case 'secondary':
        return secondaryPanelContent === 'grabbed_content' ? 'Grabbed Content' : 'Explorer';
      case 'bottom':
        return 'Bottom Panel';
      default:
        return 'Panel';
    }
  };

  const draggedItemName = getDraggedItemName(draggingPanel);
  const isLeftAllowed = isDockZoneAllowed(draggingPanel, 'left');
  const isRightAllowed = isDockZoneAllowed(draggingPanel, 'right');
  const isBottomAllowed = isDockZoneAllowed(draggingPanel, 'bottom');

  const isHoveredZoneAllowed = hoveredZone ? isDockZoneAllowed(draggingPanel, hoveredZone) : true;

  return (
    <div className="dock-drop-overlay">
      {/* --------------------------------------------------------------------
          1. CURSOR-ATTACHED FLOATING DRAG BADGE
          -------------------------------------------------------------------- */}
      <div
        style={{
          transform: `translate3d(${cursorPos.x + 14}px, ${cursorPos.y + 14}px, 0)`,
        }}
        className={`dock-cursor-badge ${
          hoveredZone === 'remove'
            ? 'dock-cursor-badge-remove'
            : hoveredZone && !isHoveredZoneAllowed
            ? 'dock-cursor-badge-prohibited'
            : ''
        }`}
      >
        <span className="dock-cursor-badge-icon">
          {hoveredZone === 'remove' ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          ) : hoveredZone && !isHoveredZoneAllowed ? (
            '⃠'
          ) : (
            '❖'
          )}
        </span>
        <span>
          {hoveredZone === 'remove'
            ? `Remove ${draggedItemName} Content`
            : hoveredZone && !isHoveredZoneAllowed
            ? `Cannot Dock ${draggedItemName} Here`
            : hoveredZone === 'left'
            ? `Dock to ${leftTargetName}`
            : hoveredZone === 'right'
            ? `Dock to ${rightTargetName}`
            : hoveredZone === 'bottom'
            ? 'Dock to Bottom Panel'
            : `Docking: ${draggedItemName}`}
        </span>
      </div>

      {/* --------------------------------------------------------------------
          2. WORKSPACE BOUNDARY OVERLAY (Inset between Nav Header & Footer)
          -------------------------------------------------------------------- */}
      <div className="dock-drop-workspace-bounds animate-mount-fade">
        {/* LEFT DOCK TARGET (Matches sidebar currently on the Left) */}
        <div
          className={`dock-zone-side ${
            hoveredZone === 'left' ? 'dock-zone-side-active' : ''
          }`}
        >
          <div
            className={`dock-zone-side-pill ${
              hoveredZone === 'left' ? 'dock-zone-side-pill-active' : ''
            }`}
          >
            <span>◧</span>
            <span>Dock to {leftTargetName}</span>
          </div>
          <span
            className={`dock-zone-side-text ${
              hoveredZone === 'left' ? 'dock-zone-side-text-active' : ''
            }`}
          >
            {hoveredZone === 'left' ? 'Release mouse to dock here' : 'Drop Left'}
          </span>
        </div>

        {/* CENTER COLUMN: TRASH / REMOVE ZONE, CANVAS HINT & BOTTOM DOCK TARGET */}
        <div className="dock-zone-center-column">
          {/* TRASH / REMOVE FROM SIDEBAR TARGET */}
          <div
            className={`dock-zone-remove ${
              hoveredZone === 'remove' ? 'dock-zone-remove-active' : ''
            }`}
          >
            <div
              className={`dock-zone-remove-pill ${
                hoveredZone === 'remove' ? 'dock-zone-remove-pill-active' : ''
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Remove Content & Empty Panel</span>
            </div>
            <span
              className={`dock-zone-remove-text ${
                hoveredZone === 'remove' ? 'dock-zone-remove-text-active' : ''
              }`}
            >
              {hoveredZone === 'remove' ? 'Release mouse to empty this sidebar' : 'Drop here to remove docked content'}
            </span>
          </div>

          <div className="dock-zone-canvas-hint">
            Main Workspace Canvas
          </div>

          {/* BOTTOM DOCK TARGET (Valid or Prohibited State) */}
          <div
            className={`dock-zone-bottom ${
              !isBottomAllowed
                ? `dock-zone-bottom-prohibited ${
                    hoveredZone === 'bottom' ? 'dock-zone-bottom-prohibited-active' : ''
                  }`
                : hoveredZone === 'bottom'
                ? 'dock-zone-bottom-active'
                : ''
            }`}
          >
            <div
              className={`dock-zone-bottom-pill ${
                !isBottomAllowed
                  ? `dock-zone-bottom-pill-prohibited ${
                      hoveredZone === 'bottom' ? 'dock-zone-bottom-pill-prohibited-active' : ''
                    }`
                  : hoveredZone === 'bottom'
                  ? 'dock-zone-bottom-pill-active'
                  : ''
              }`}
            >
              {!isBottomAllowed ? (
                /* Prohibited / Slashed NO Dock Icon */
                <span className="dock-zone-prohibited-icon" aria-hidden="true">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.366zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.366zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              ) : (
                <span>⬕</span>
              )}
              <span>
                {!isBottomAllowed
                  ? 'Cannot Dock Explorer Bottom'
                  : 'Dock to Bottom Panel'}
              </span>
            </div>
            <span
              className={`dock-zone-bottom-text ${
                !isBottomAllowed
                  ? `dock-zone-bottom-text-prohibited ${
                      hoveredZone === 'bottom' ? 'dock-zone-bottom-text-prohibited-active' : ''
                    }`
                  : hoveredZone === 'bottom'
                  ? 'dock-zone-bottom-text-active'
                  : ''
              }`}
            >
              {!isBottomAllowed
                ? hoveredZone === 'bottom'
                  ? '🚫 Explorer requires a vertical side panel'
                  : 'Not available for Explorer'
                : hoveredZone === 'bottom'
                ? 'Release mouse to dock here'
                : 'Drop Bottom'}
            </span>
          </div>
        </div>

        {/* RIGHT DOCK TARGET (Matches sidebar currently on the Right) */}
        <div
          className={`dock-zone-side ${
            hoveredZone === 'right' ? 'dock-zone-side-active' : ''
          }`}
        >
          <div
            className={`dock-zone-side-pill ${
              hoveredZone === 'right' ? 'dock-zone-side-pill-active' : ''
            }`}
          >
            <span>◨</span>
            <span>Dock to {rightTargetName}</span>
          </div>
          <span
            className={`dock-zone-side-text ${
              hoveredZone === 'right' ? 'dock-zone-side-text-active' : ''
            }`}
          >
            {hoveredZone === 'right' ? 'Release mouse to dock here' : 'Drop Right'}
          </span>
        </div>
      </div>
    </div>
  );
}
