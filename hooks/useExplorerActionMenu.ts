'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ==========================================================================
   1. CUSTOM EVENT DEFINITIONS
   ========================================================================== */

/**
 * Window-level CustomEvent broadcast whenever any tree gear icon is triggered.
 * Enforces mutual exclusion so only one action menu remains open across the DOM.
 */
const GLOBAL_MENU_OPEN_EVENT = 'explorer-action-menu-open';

/* ==========================================================================
   2. CUSTOM HOOK: useExplorerActionMenu
   ========================================================================== */

/**
 * Manages positioning physics, mutual exclusivity, hover grace periods,
 * and inline rename expansion states for ExplorerActionMenu portals.
 *
 * @param id - Unique identifier representing the category, collection, or item instance
 * @param defaultMenuHeight - Base menu height (px) used to calculate upward clamping
 */
export function useExplorerActionMenu(
  id: string,
  defaultMenuHeight: number = 215,
  position: 'left' | 'right' = 'left'
) {
  /* ------------------------------------------------------------------------
     2.1 REFERENCES & TIMERS
     ------------------------------------------------------------------------ */
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const activeGearRectRef = useRef<DOMRect | null>(null);
  const activeTargetElRef = useRef<HTMLElement | null>(null);

  /* ------------------------------------------------------------------------
     2.2 LOCAL MENU & INTERACTION STATES
     ------------------------------------------------------------------------ */
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [isRenaming, setIsRenaming] = useState(false);

  /* ------------------------------------------------------------------------
     2.3 MUTUAL EXCLUSION LISTENER
     Dismisses this menu instance if any other tree row opens its action menu.
     ------------------------------------------------------------------------ */
  useEffect(() => {
    const handleGlobalMenuOpen = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail !== id) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsMenuOpen(false);
        setIsRenaming(false);
      }
    };

    window.addEventListener(GLOBAL_MENU_OPEN_EVENT, handleGlobalMenuOpen);
    return () => {
      window.removeEventListener(GLOBAL_MENU_OPEN_EVENT, handleGlobalMenuOpen);
    };
  }, [id]);

  /* ------------------------------------------------------------------------
     2.4 VIEWPORT GEOMETRY & CLAMPING
     Calculates viewport top/left coordinates. Clamps upwards if the menu would
     otherwise clip underneath the bottom navigation bar.
     Aligns menu precisely to the panel seam with consistent tucked overlap.
     ------------------------------------------------------------------------ */
  const computeCoordinates = useCallback(
    (gearRect: DOMRect, menuHeight: number, targetEl?: HTMLElement | null) => {
      const bottomNavReserve = 64; // Height of bottom status bar + padding buffer
      const maxAllowedTop = window.innerHeight - menuHeight - bottomNavReserve;
      const MENU_WIDTH = 224; // 14rem width defined in ExplorerActionMenu.css

      // Align header slightly above trigger gear icon (-4px offset)
      let calculatedTop = Math.round(gearRect.top - 4);

      // Clamp upwards if overflow would occur
      if (calculatedTop > maxAllowedTop) {
        calculatedTop = Math.max(16, maxAllowedTop);
      }

      // Find the parent panel boundary for exact seam alignment
      const panelEl =
        targetEl?.closest?.('.primary-side-panel') ||
        (typeof document !== 'undefined'
          ? (document.querySelector('.primary-side-panel') as HTMLElement | null)
          : null);
      const panelRect = panelEl ? panelEl.getBoundingClientRect() : gearRect;

      // If docked on right (or in right half of screen), flyout opens to the left
      const isRightDocked = position === 'right' || panelRect.left > window.innerWidth / 2;

      // Left Dock: overlap = 14px (menu left starts 14px inside panel's right border)
      // Right Dock: overlap = 11px (menu right ends 11px inside panel's left border)
      const calculatedLeft = isRightDocked
        ? Math.round(panelRect.left + 11 - MENU_WIDTH)
        : Math.round(panelRect.right - 14);

      return {
        top: calculatedTop,
        left: calculatedLeft,
      };
    },
    [position]
  );

  /* ------------------------------------------------------------------------
     2.5 EVENT HANDLERS
     ------------------------------------------------------------------------ */

  /**
   * Invoked when the cursor enters the tree row gear button.
   * Measures bounding rect, calculates coordinates, and broadcasts the open event.
   */
  const handleGearMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, customHeight?: number) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const rect = e.currentTarget.getBoundingClientRect();
      activeGearRectRef.current = rect;
      activeTargetElRef.current = e.currentTarget;

      const height = customHeight ?? defaultMenuHeight;
      setMenuCoords(computeCoordinates(rect, height, e.currentTarget));

      // Broadcast event so other tree rows close their open popovers
      window.dispatchEvent(
        new CustomEvent(GLOBAL_MENU_OPEN_EVENT, { detail: id })
      );

      setIsMenuOpen(true);
    },
    [id, defaultMenuHeight, computeCoordinates]
  );

  /**
   * Recomputes vertical coordinates dynamically if the inline rename form opens,
   * accounting for the additional 42px required by the text input.
   */
  useEffect(() => {
    if (!isMenuOpen || !activeGearRectRef.current) return;
    const expandedHeight = defaultMenuHeight + (isRenaming ? 42 : 0);
    setMenuCoords(
      computeCoordinates(
        activeGearRectRef.current,
        expandedHeight,
        activeTargetElRef.current
      )
    );
  }, [isRenaming, isMenuOpen, defaultMenuHeight, computeCoordinates]);

  /**
   * Invoked when the cursor transits onto the portal popover body.
   * Cancels any pending unmount timers.
   */
  const handleMenuMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  /**
   * Invoked when the cursor departs the trigger gear or the portal popover.
   * Starts a 350ms grace-period timer before unmounting.
   */
  const handleMouseLeave = useCallback(() => {
    // Prevent unmounting if actively editing an inline rename
    if (isRenaming) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
      setIsRenaming(false);
    }, 350);
  }, [isRenaming]);

  /**
   * Explicit immediate dismissal handler (called by Escape hotkeys or node selection).
   */
  const closeMenu = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsMenuOpen(false);
    setIsRenaming(false);
  }, []);

  return {
    isMenuOpen,
    menuCoords,
    isRenaming,
    setIsRenaming,
    handleGearMouseEnter,
    handleMenuMouseEnter,
    handleMouseLeave,
    closeMenu,
  };
}