'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export type DockablePanelId = 'primary' | 'secondary' | 'bottom' | 'explorer' | 'collections' | 'grabbed_content';
export type DockDropTargetZone =
  | 'left'
  | 'left-tab'
  | 'left-replace'
  | 'right'
  | 'right-tab'
  | 'right-replace'
  | 'bottom'
  | 'remove';
export type DockContent = 'empty' | 'explorer' | 'collections' | 'grabbed_content';
export interface DockContents {
  primary?: DockContent;
  secondary?: DockContent;
  bottom?: DockContent;
  primaryTabs?: DockContent[];
  secondaryTabs?: DockContent[];
  primaryActiveTab?: DockContent;
  secondaryActiveTab?: DockContent;
}

export function isDockZoneAllowed(
  panelId: DockablePanelId | null,
  targetZone: DockDropTargetZone | null,
  contents: DockContents = {}
): boolean {
  if (!panelId || !targetZone) return false;
  const content =
    panelId === 'explorer' || panelId === 'collections' || panelId === 'grabbed_content'
      ? panelId
      : panelId === 'primary'
      ? (contents.primaryActiveTab ?? contents.primary ?? 'empty')
      : panelId === 'secondary'
      ? (contents.secondaryActiveTab ?? contents.secondary ?? 'empty')
      : (contents[panelId] ?? 'empty');

  if (content === 'empty') return false;
  if (targetZone === 'bottom') return content === 'grabbed_content';
  if (targetZone === 'remove') return true;

  const primaryTabs = contents.primaryTabs ?? (contents.primary && contents.primary !== 'empty' ? [contents.primary] : []);
  const secondaryTabs = contents.secondaryTabs ?? (contents.secondary && contents.secondary !== 'empty' ? [contents.secondary] : []);

  if (targetZone === 'left-tab') {
    if (primaryTabs.length >= 3) return false;
    if (primaryTabs.includes(content)) return false;
    return true;
  }

  if (targetZone === 'right-tab') {
    if (secondaryTabs.length >= 3) return false;
    if (secondaryTabs.includes(content)) return false;
    return true;
  }

  if (targetZone === 'left-replace' || targetZone === 'left') {
    return true;
  }

  if (targetZone === 'right-replace' || targetZone === 'right') {
    return true;
  }

  return true;
}

interface UsePanelDockDragOptions {
  onDropPanel: (panelId: DockablePanelId, targetZone: DockDropTargetZone) => void;
  contents?: DockContents;
}

export function usePanelDockDrag({ onDropPanel, contents }: UsePanelDockDragOptions) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggingPanel, setDraggingPanel] = useState<DockablePanelId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<DockDropTargetZone | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const cleanupRef = useRef<(() => void) | null>(null);
  const draggingPanelRef = useRef<DockablePanelId | null>(null);
  const hoveredZoneRef = useRef<DockDropTargetZone | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  useEffect(() => () => cleanupRef.current?.(), []);

  const cancelDrag = useCallback(() => {
    cleanupRef.current?.();
    hasMovedRef.current = false;
    draggingPanelRef.current = null;
    hoveredZoneRef.current = null;
    setIsDragging(false);
    setDraggingPanel(null);
    setHoveredZone(null);
  }, []);

  const handlePointerDown = useCallback((panelId: DockablePanelId, e: React.PointerEvent) => {
    // Only primary mouse button
    if (e.button !== 0) return;

    cancelDrag();
    const pointerId = e.pointerId;
    const { userSelect, cursor } = document.body.style;
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

      const primaryTabs = contents?.primaryTabs ?? (contents?.primary && contents?.primary !== 'empty' ? [contents.primary] : []);
      const secondaryTabs = contents?.secondaryTabs ?? (contents?.secondary && contents?.secondary !== 'empty' ? [contents.secondary] : []);
      const hasPrimaryTabs = primaryTabs.length > 0;
      const hasSecondaryTabs = secondaryTabs.length > 0;

      // Left Zone: Left 28% of workspace
      if (relX < 0.28) {
        if (hasPrimaryTabs) {
          return relY < 0.38 ? 'left-tab' : 'left-replace';
        }
        return 'left';
      }

      // Right Zone: Right 28% of workspace
      if (relX > 0.72) {
        if (hasSecondaryTabs) {
          return relY < 0.38 ? 'right-tab' : 'right-replace';
        }
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

      // Center area defaults to Left or Right based on closer edge
      if (relX <= 0.5) {
        if (hasPrimaryTabs) {
          return relY < 0.38 ? 'left-tab' : 'left-replace';
        }
        return 'left';
      } else {
        if (hasSecondaryTabs) {
          return relY < 0.38 ? 'right-tab' : 'right-replace';
        }
        return 'right';
      }
    };

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (moveEv.pointerId !== pointerId) return;
      const dx = moveEv.clientX - startPosRef.current.x;
      const dy = moveEv.clientY - startPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 4px movement threshold to begin drag
      if (!hasMovedRef.current && distance > 4) {
        hasMovedRef.current = true;
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

        const allowed = isDockZoneAllowed(panelId, detectedZone, contents);
        if (detectedZone && !allowed) {
          document.body.style.cursor = 'not-allowed';
        } else {
          document.body.style.cursor = 'grabbing';
        }
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const panel = draggingPanelRef.current;
      const zone = hoveredZoneRef.current;
      const shouldDrop = hasMovedRef.current && panel && zone && isDockZoneAllowed(panel, zone, contents);
      cancelDrag();
      if (shouldDrop) onDropPanel(panel, zone);
    };
    const handleCancel = (event: PointerEvent) => {
      if (event.pointerId === pointerId) cancelDrag();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelDrag();
    };
    cleanupRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handleCancel);
      window.removeEventListener('blur', cancelDrag);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.userSelect = userSelect;
      document.body.style.cursor = cursor;
      cleanupRef.current = null;
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handleCancel);
    window.addEventListener('blur', cancelDrag);
    window.addEventListener('keydown', handleKeyDown);
  }, [onDropPanel, contents, cancelDrag]);

  return {
    isDragging,
    draggingPanel,
    hoveredZone,
    cursorPos,
    handlePointerDown,
    cancelDrag,
  };
}
