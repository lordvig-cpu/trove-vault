'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export type DockablePanelId = 'primary' | 'secondary' | 'bottom' | 'explorer' | 'grabbed_content';
export type DockDropTargetZone = 'left' | 'right' | 'bottom' | 'remove';

export function isDockZoneAllowed(
  panelId: DockablePanelId | null,
  targetZone: DockDropTargetZone | null
): boolean {
  if (!panelId || !targetZone) return false;
  // Side panel contents (Explorer and Grabbed Content) cannot be docked to bottom
  if (
    (panelId === 'primary' ||
      panelId === 'secondary' ||
      panelId === 'explorer' ||
      panelId === 'grabbed_content') &&
    targetZone === 'bottom'
  ) {
    return false;
  }
  // Bottom panel cannot be docked to left or right vertical sidebars
  if (panelId === 'bottom' && (targetZone === 'left' || targetZone === 'right')) {
    return false;
  }
  return true;
}

interface UsePanelDockDragOptions {
  onDropPanel: (panelId: DockablePanelId, targetZone: DockDropTargetZone) => void;
}

export function usePanelDockDrag({ onDropPanel }: UsePanelDockDragOptions) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggingPanel, setDraggingPanel] = useState<DockablePanelId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<DockDropTargetZone | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const draggingPanelRef = useRef<DockablePanelId | null>(null);
  const hoveredZoneRef = useRef<DockDropTargetZone | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    draggingPanelRef.current = draggingPanel;
  }, [draggingPanel]);

  useEffect(() => {
    hoveredZoneRef.current = hoveredZone;
  }, [hoveredZone]);

  const handlePointerDown = useCallback((panelId: DockablePanelId, e: React.PointerEvent) => {
    // Only primary mouse button
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    draggingPanelRef.current = panelId;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    hoveredZoneRef.current = null;

    const computeZone = (clientX: number, clientY: number): DockDropTargetZone | null => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const topBoundary = 56;
      const bottomBoundary = vh - 56;

      if (clientY < topBoundary - 30 || clientY > bottomBoundary + 30) {
        return null;
      }

      const relX = clientX / vw;
      const relY = (clientY - topBoundary) / Math.max(1, bottomBoundary - topBoundary);

      // Left Zone: Left 28% of workspace
      if (relX < 0.28) {
        return 'left';
      }

      // Right Zone: Right 28% of workspace
      if (relX > 0.72) {
        return 'right';
      }

      // Remove / Trash Zone: Upper 35% of center workspace column
      if (relY < 0.35) {
        return 'remove';
      }

      // Bottom Zone: Lower 45% of workspace in the center column
      if (relY > 0.55) {
        return 'bottom';
      }

      // Upper center defaults to Left or Right based on closer edge
      return relX <= 0.5 ? 'left' : 'right';
    };

    const handlePointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - startPosRef.current.x;
      const dy = moveEv.clientY - startPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 4px movement threshold to begin drag
      if (!hasMovedRef.current && distance > 4) {
        hasMovedRef.current = true;
        isDraggingRef.current = true;
        setIsDragging(true);
        setDraggingPanel(panelId);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }

      if (hasMovedRef.current) {
        setCursorPos({ x: moveEv.clientX, y: moveEv.clientY });
        const detectedZone = computeZone(moveEv.clientX, moveEv.clientY);
        hoveredZoneRef.current = detectedZone;
        setHoveredZone(detectedZone);

        const allowed = isDockZoneAllowed(panelId, detectedZone);
        if (detectedZone && !allowed) {
          document.body.style.cursor = 'not-allowed';
        } else {
          document.body.style.cursor = 'grabbing';
        }
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      if (hasMovedRef.current && draggingPanelRef.current && hoveredZoneRef.current) {
        if (isDockZoneAllowed(draggingPanelRef.current, hoveredZoneRef.current)) {
          onDropPanel(draggingPanelRef.current, hoveredZoneRef.current);
        }
      }

      hasMovedRef.current = false;
      isDraggingRef.current = false;
      setIsDragging(false);
      setDraggingPanel(null);
      setHoveredZone(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }, [onDropPanel]);

  const cancelDrag = useCallback(() => {
    hasMovedRef.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
    setDraggingPanel(null);
    setHoveredZone(null);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  return {
    isDragging,
    draggingPanel,
    hoveredZone,
    cursorPos,
    handlePointerDown,
    cancelDrag,
  };
}
