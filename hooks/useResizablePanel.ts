// hooks/useResizablePanel.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ==========================================================================
   1. TYPES & CONFIGURATION
   ========================================================================== */

/**
 * Configuration options for the `useResizablePanel` hook.
 */
interface UseResizablePanelOptions {
  /** Baseline/fallback width of the panel in pixels. Defaults to `304`. */
  initialWidth?: number;
  /** Absolute minimum width floor in pixels to prevent panel collapse. Defaults to `304`. */
  minWidth?: number;
  /** Minimum buffer space (in pixels) preserved between opposing workspace panels. Defaults to `48`. */
  minGap?: number;
  /** Width claimed by an opposing docked/pinned panel (used to prevent collisions). Defaults to `0`. */
  reservedWidth?: number;
  /** Layout orientation: determines if width expands toward the right ('left') or left ('right'). Defaults to `'left'`. */
  direction?: 'left' | 'right';
  /** Optional callback fired when dragging concludes or width is reset (ideal for state persistence). */
  onWidthChange?: (width: number) => void;
}

/* ==========================================================================
   2. CUSTOM HOOK: useResizablePanel
   Manages pointer-drag resizing, boundary clamping, cursor overrides,
   and snap-to-default resets for docked sidebars and detail inspectors.
   ========================================================================== */

export function useResizablePanel({
  initialWidth = 304,
  minWidth = 304,
  minGap = 48,
  reservedWidth = 0,
  direction = 'left',
  onWidthChange,
}: UseResizablePanelOptions = {}) {
  // ---------------------------------------------------------------------------
  // Internal State & Stale-Closure Guard Refs
  // ---------------------------------------------------------------------------
  const [panelWidth, setPanelWidth] = useState<number>(initialWidth);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Refs mirror state so window-level event listeners can read fresh values
  // without needing teardown and reattachment on every frame.
  const isDraggingRef = useRef<boolean>(false);
  const panelWidthRef = useRef<number>(panelWidth);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    panelWidthRef.current = panelWidth;
  }, [panelWidth]);

  // ---------------------------------------------------------------------------
  // Dynamic Workspace Boundary Clamping
  // ---------------------------------------------------------------------------
  // Constrains current panel width if viewport resizes or opposing panel expands
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Viewport minus opposite panel's footprint and buffer margin
    const dynamicMax = Math.max(minWidth, window.innerWidth - reservedWidth - minGap);
    setPanelWidth((prev) => (prev > dynamicMax ? dynamicMax : prev));
  }, [reservedWidth, minWidth, minGap]);

  // ---------------------------------------------------------------------------
  // Global Pointer Listeners (Window Level)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    /**
     * Calculates width relative to viewport edge depending on panel orientation.
     */
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      // Left panel measures from screen left (0 -> X); right panel measures from screen right (innerWidth -> X)
      const rawWidth = direction === 'left' ? e.clientX : window.innerWidth - e.clientX;
      const dynamicMax = Math.max(minWidth, window.innerWidth - reservedWidth - minGap);
      const clampedWidth = Math.min(Math.max(rawWidth, minWidth), dynamicMax);

      panelWidthRef.current = clampedWidth;
      setPanelWidth(clampedWidth);
    };

    /**
     * Cleans up global document styles and notifies listeners of final dimensions.
     */
    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);

        // Restore default text selection and cursor styles on body
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        // Emit final settled width for parent/preference syncing
        onWidthChange?.(panelWidthRef.current);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [reservedWidth, minWidth, minGap, direction, onWidthChange]);

  // ---------------------------------------------------------------------------
  // Interaction Handlers
  // ---------------------------------------------------------------------------

  /**
   * Initializes drag operation on handle pointerdown. Locks cursor and prevents
   * accidental text selection across the canvas while moving quickly.
   */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);

    // Apply interaction locks to window body
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, []);

  /**
   * Snaps panel back to its baseline default width and notifies callbacks.
   */
  const handleResetWidth = useCallback(() => {
    setPanelWidth(initialWidth);
    onWidthChange?.(initialWidth);
  }, [initialWidth, onWidthChange]);

  // ---------------------------------------------------------------------------
  // Public Hook Interface
  // ---------------------------------------------------------------------------
  return {
    panelWidth,
    setPanelWidth,
    isDragging,
    handlePointerDown,
    handleResetWidth,
  };
}