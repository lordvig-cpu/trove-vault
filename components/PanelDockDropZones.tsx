'use client';

import React from 'react';
import { DockablePanelId, DockDropTargetZone } from '@/hooks/usePanelDockDrag';

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

  return (
    <div className="dock-drop-overlay">
      {/* --------------------------------------------------------------------
          1. CURSOR-ATTACHED FLOATING DRAG BADGE
          -------------------------------------------------------------------- */}
      <div
        style={{
          transform: `translate3d(${cursorPos.x + 14}px, ${cursorPos.y + 14}px, 0)`,
        }}
        className="dock-cursor-badge"
      >
        <span className="dock-cursor-badge-icon">❖</span>
        <span>Docking: {panelName}</span>
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

          <div
            className={`dock-zone-bottom ${
              hoveredZone === 'bottom' ? 'dock-zone-bottom-active' : ''
            }`}
          >
            <div
              className={`dock-zone-bottom-pill ${
                hoveredZone === 'bottom' ? 'dock-zone-bottom-pill-active' : ''
              }`}
            >
              <span>⬕</span>
              <span>Dock {panelName} Bottom</span>
            </div>
            <span
              className={`dock-zone-bottom-text ${
                hoveredZone === 'bottom' ? 'dock-zone-bottom-text-active' : ''
              }`}
            >
              {hoveredZone === 'bottom' ? 'Release mouse to dock here' : 'Drop Bottom'}
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
