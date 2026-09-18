'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ==========================================================================
   1. TYPES & CONFIGURATION
   ========================================================================== */

/**
 * Configuration options for the `useResizableHeight` hook.
 */
interface UseResizableHeightOptions {
  /** Baseline/fallback height of the panel in pixels. Defaults to `220`. */
  initialHeight?: number;
  /** Absolute minimum height floor in pixels to prevent panel collapse. Defaults to `140`. */
  minHeight?: number;
  /** Minimum buffer space (in pixels) preserved from the top header/workspace. Defaults to `48`. */
  minGap?: number;
  /** Optional callback fired when dragging concludes or height is reset (ideal for state persistence). */
  onHeightChange?: (height: number) => void;
}

/* ==========================================================================
   2. CUSTOM HOOK: useResizableHeight
   Manages pointer-drag vertical resizing, boundary clamping, cursor overrides,
   and snap-to-default resets for bottom-docked drawers and panels.
   ========================================================================== */

export function useResizableHeight({
  initialHeight = 220,
  minHeight = 140,
  minGap = 48,
  onHeightChange,
}: UseResizableHeightOptions = {}) {
  // ---------------------------------------------------------------------------
  // Internal State & Stale-Closure Guard Refs
  // ---------------------------------------------------------------------------
  const [panelHeight, setPanelHeight] = useState<number>(initialHeight);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Refs mirror state so window-level event listeners can read fresh values
  // without needing teardown and reattachment on every frame.
  const isDraggingRef = useRef<boolean>(false);
  const panelHeightRef = useRef<number>(panelHeight);
  const panelElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    panelHeightRef.current = panelHeight;
  }, [panelHeight]);

  // ---------------------------------------------------------------------------
  // Dynamic Workspace Boundary Clamping
  // ---------------------------------------------------------------------------
  // Constrains current panel height if viewport resizes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Viewport height minus top nav clearance (56px) and buffer margin (48px)
    const dynamicMax = Math.max(minHeight, window.innerHeight - 56 - minGap);
    setPanelHeight((prev) => {
      if (prev > dynamicMax) {
        onHeightChange?.(dynamicMax);
        return dynamicMax;
      }
      return prev;
    });
  }, [minHeight, minGap, onHeightChange]);

  // ---------------------------------------------------------------------------
  // Global Pointer Listeners (Window Level)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    /**
     * Calculates height relative to bottom edge of panel/viewport.
     */
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      let bottomOffset = window.innerHeight;
      if (panelElementRef.current) {
        bottomOffset = panelElementRef.current.getBoundingClientRect().bottom;
      }

      // Height expands upwards from bottom edge
      const rawHeight = bottomOffset - e.clientY;
      const dynamicMax = Math.max(minHeight, window.innerHeight - 56 - minGap);
      const clampedHeight = Math.min(Math.max(rawHeight, minHeight), dynamicMax);

      panelHeightRef.current = clampedHeight;
      setPanelHeight(clampedHeight);
      onHeightChange?.(clampedHeight);
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

        // Emit final settled height for parent/preference syncing
        onHeightChange?.(panelHeightRef.current);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [minHeight, minGap, onHeightChange]);

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
    document.body.style.cursor = 'row-resize';
  }, []);

  /**
   * Snaps panel back to its baseline default height and notifies callbacks.
   */
  const handleResetHeight = useCallback(() => {
    setPanelHeight(initialHeight);
    onHeightChange?.(initialHeight);
  }, [initialHeight, onHeightChange]);

  // ---------------------------------------------------------------------------
  // Public Hook Interface
  // ---------------------------------------------------------------------------
  return {
    panelHeight,
    setPanelHeight,
    isDragging,
    handlePointerDown,
    handleResetHeight,
    panelElementRef,
  };
}

