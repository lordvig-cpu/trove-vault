'use client';

import React from 'react';
import { DockablePanelId, DockDropTargetZone, isDockZoneAllowed } from '@/hooks/usePanelDockDrag';

interface PanelDockDropZonesProps {
  isDragging: boolean;
  draggingPanel: DockablePanelId | null;
  hoveredZone: DockDropTargetZone | null;
  cursorPos: { x: number; y: number };
}

export default function PanelDockDropZones({
  isDragging,
  draggingPanel,
  hoveredZone,
  cursorPos,
}: PanelDockDropZonesProps) {
  if (!isDragging || !draggingPanel) return null;

  const getPanelName = (id: DockablePanelId) => {
    switch (id) {
      case 'primary':
        return 'Primary Side Bar';
      case 'secondary':
        return 'Secondary Side Bar';
      case 'bottom':
        return 'Bottom Panel';
      default:
        return 'Panel';
    }
  };

  const panelName = getPanelName(draggingPanel);
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
          hoveredZone && !isHoveredZoneAllowed ? 'dock-cursor-badge-prohibited' : ''
        }`}
      >
        <span className="dock-cursor-badge-icon">
          {hoveredZone && !isHoveredZoneAllowed ? '⃠' : '❖'}
        </span>
        <span>
          {hoveredZone && !isHoveredZoneAllowed
            ? `Cannot Dock ${panelName} Here`
            : `Docking: ${panelName}`}
        </span>
      </div>

      {/* --------------------------------------------------------------------
          2. WORKSPACE BOUNDARY OVERLAY (Inset between Nav Header & Footer)
          -------------------------------------------------------------------- */}
      <div className="dock-drop-workspace-bounds animate-mount-fade">
        {/* LEFT DOCK TARGET (Primary OKLCH Palette) */}
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
            <span>Dock {panelName} Left</span>
          </div>
          <span
            className={`dock-zone-side-text ${
              hoveredZone === 'left' ? 'dock-zone-side-text-active' : ''
            }`}
          >
            {hoveredZone === 'left' ? 'Release mouse to dock here' : 'Drop Left'}
          </span>
        </div>

        {/* CENTER COLUMN: CANVAS HINT & BOTTOM DOCK TARGET (Secondary OKLCH Palette) */}
        <div className="dock-zone-center-column">
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
                  : `Dock ${panelName} Bottom`}
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

        {/* RIGHT DOCK TARGET (Primary OKLCH Palette) */}
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
            <span>Dock {panelName} Right</span>
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
