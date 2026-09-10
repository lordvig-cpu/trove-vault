'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ==========================================================================
   1. CUSTOM EVENT DEFINITIONS
   ========================================================================== */

/**
 * Window-level CustomEvent broadcast whenever any tree gear icon is triggered.
 * Enforces mutual exclusion so only one action menu remains open across the DOM.
 */
const GLOBAL_MENU_OPEN_EVENT = 'trove-action-menu-open';

/* ==========================================================================
   2. CUSTOM HOOK: useActionMenu2
   ========================================================================== */

/**
 * Manages positioning physics, mutual exclusivity, hover grace periods,
 * and inline rename expansion states for ExplorerActionMenu portals.
 *
 * @param id - Unique identifier representing the folder or item instance
 * @param defaultMenuHeight - Base menu height (px) used to calculate upward clamping
 */
export function useActionMenu2(id: string, defaultMenuHeight: number = 215) {
  /* ------------------------------------------------------------------------
     2.1 REFERENCES & TIMERS
     ------------------------------------------------------------------------ */
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const activeGearRectRef = useRef<DOMRect | null>(null);

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
     ------------------------------------------------------------------------ */
  const computeCoordinates = useCallback(
    (rect: DOMRect, menuHeight: number) => {
      const bottomNavReserve = 64; // Height of bottom status bar + padding buffer
      const maxAllowedTop = window.innerHeight - menuHeight - bottomNavReserve;

      // Align header slightly above trigger gear icon (-4px offset)
      let calculatedTop = Math.round(rect.top - 4);

      // Clamp upwards if overflow would occur
      if (calculatedTop > maxAllowedTop) {
        calculatedTop = Math.max(16, maxAllowedTop);
      }

      return {
        top: calculatedTop,
        left: Math.round(rect.right + 6), // +6px horizontal clearance beyond scrollbar
      };
    },
    []
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

      const height = customHeight ?? defaultMenuHeight;
      setMenuCoords(computeCoordinates(rect, height));

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
    setMenuCoords(computeCoordinates(activeGearRectRef.current, expandedHeight));
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
   * Explicit immediate dismissal handler (called by Escape hotkeys or item selection).
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

export const useActionMenu = useActionMenu2;