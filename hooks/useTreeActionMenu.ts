'use client';

import { useState, useRef, useId, useCallback, useEffect } from 'react';

/* ==========================================================================
   1. CUSTOM EVENT DEFINITIONS
   ========================================================================== */

/**
 * Window-level CustomEvent broadcast whenever any tree gear icon is triggered.
 * Enforces mutual exclusion so only one action menu remains open across the DOM.
 */
const GLOBAL_MENU_OPEN_EVENT = 'tree-action-menu-open';

/** The menu (hook instance id) currently pinned open by a click, if any. Shared by every instance: while
    one menu is pinned, merely hovering another gear doesn't open that one (and so can't close the
    pinned one); clicking another gear still does. */
let pinnedMenuId: string | null = null;

/* ==========================================================================
   2. CUSTOM HOOK: useTreeActionMenu
   ========================================================================== */

/**
 * Manages positioning physics, mutual exclusivity, hover grace periods,
 * and inline rename expansion states for TreeActionMenu portals.
 *
 * @param id - Unique identifier representing the category, collection, or item instance
 * @param defaultMenuHeight - Base menu height (px) used to calculate upward clamping
 */
export function useTreeActionMenu(
  rowId: string,
  defaultMenuHeight: number = 215,
  position: 'left' | 'right' = 'left',
  menuWidth: number = 224
) {
  /* ------------------------------------------------------------------------
     2.1 REFERENCES & TIMERS
     ------------------------------------------------------------------------ */
  const instanceId = useId();
  const id = `${rowId}-${instanceId}`;
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const activeGearRectRef = useRef<DOMRect | null>(null);
  const activeTargetElRef = useRef<HTMLElement | null>(null);

  /* ------------------------------------------------------------------------
     2.2 LOCAL MENU & INTERACTION STATES
     ------------------------------------------------------------------------ */
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  // Pinned = opened by a click on the gear (not just a hover): it stays open when the pointer leaves
  // or the user clicks elsewhere, until the gear is clicked again (or Escape, or another menu opens).
  // A ref too, so the close timers and document listeners see the current value.
  const [isPinned, setIsPinnedState] = useState(false);
  const pinnedRef = useRef(false);
  const setPinned = useCallback(
    (pinned: boolean) => {
      pinnedRef.current = pinned;
      setIsPinnedState(pinned);
      if (pinned) pinnedMenuId = id;
      else if (pinnedMenuId === id) pinnedMenuId = null;
    },
    [id]
  );

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
        setPinned(false);
      }
    };

    window.addEventListener(GLOBAL_MENU_OPEN_EVENT, handleGlobalMenuOpen);
    return () => {
      window.removeEventListener(GLOBAL_MENU_OPEN_EVENT, handleGlobalMenuOpen);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // A row that unmounts while pinned (deleted, panel closed) must not leave hovers blocked everywhere.
      if (pinnedMenuId === id) pinnedMenuId = null;
    };
  }, [id, setPinned]);

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
      const MENU_WIDTH = menuWidth;

      // Align header slightly above trigger gear icon (-4px offset)
      let calculatedTop = Math.round(gearRect.top - 4);

      // Clamp upwards if overflow would occur
      if (calculatedTop > maxAllowedTop) {
        calculatedTop = Math.max(16, maxAllowedTop);
      }

      // Check if trigger is inside a stage canvas toolbar rather than a sidebar panel
      const isToolbarTarget = Boolean(
        targetEl?.closest?.('.tmpl-container-floating-toolbar, [data-stage-toolbar]')
      );

      if (isToolbarTarget) {
        // Position menu directly under the gear button, aligning with its right edge
        let calculatedTop = Math.round(gearRect.bottom + 6);
        if (calculatedTop > maxAllowedTop) {
          calculatedTop = Math.max(16, Math.round(gearRect.top - menuHeight - 6));
        }
        const calculatedLeft = Math.max(
          16,
          Math.min(
            window.innerWidth - MENU_WIDTH - 16,
            Math.round(gearRect.right - MENU_WIDTH + 8)
          )
        );
        return {
          top: calculatedTop,
          left: calculatedLeft,
        };
      }

      // Find the parent panel boundary for exact seam alignment (supports pinned sidebar, secondary sidebar, and unpinned flyout)
      const panelEl =
        targetEl?.closest?.('aside, .primary-side-panel, .secondary-side-panel, .nav-flyout-menu') ||
        (typeof document !== 'undefined'
          ? (document.querySelector(
              '.nav-flyout-menu, .primary-side-panel:not(.pointer-events-none), .secondary-side-panel:not(.pointer-events-none), .primary-side-panel, .secondary-side-panel, aside'
            ) as HTMLElement | null)
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
    [position, menuWidth]
  );

  /* ------------------------------------------------------------------------
     2.5 EVENT HANDLERS
     ------------------------------------------------------------------------ */

  /**
   * Invoked when the cursor enters the tree row gear button.
   * Measures bounding rect, calculates coordinates, and broadcasts the open event.
   */
  const openMenuFrom = useCallback(
    (trigger: HTMLElement, customHeight?: number) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const rect = trigger.getBoundingClientRect();
      activeGearRectRef.current = rect;
      activeTargetElRef.current = trigger;

      const height = customHeight ?? defaultMenuHeight;
      setMenuCoords(computeCoordinates(rect, height, trigger));

      // Broadcast event so other tree rows close their open popovers
      window.dispatchEvent(
        new CustomEvent(GLOBAL_MENU_OPEN_EVENT, { detail: id })
      );

      setIsMenuOpen(true);
    },
    [id, defaultMenuHeight, computeCoordinates]
  );
  const openMenu = useCallback(
    (e: React.SyntheticEvent<HTMLElement>, customHeight?: number) => openMenuFrom(e.currentTarget, customHeight),
    [openMenuFrom]
  );

  /** Hovering the gear opens the menu unpinned -- unless another menu is pinned open by a click. */
  const handleGearMouseEnter = useCallback(
    (e: React.SyntheticEvent<HTMLElement>, customHeight?: number) => {
      if (pinnedMenuId !== null && pinnedMenuId !== id) return;
      openMenu(e, customHeight);
    },
    [id, openMenu]
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
    // Prevent unmounting if actively editing an inline rename, or while pinned open by a click
    if (isRenaming || pinnedRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const focused = document.activeElement;
      if (focused === activeTargetElRef.current || (focused instanceof HTMLElement && focused.closest('[data-tree-menu]'))) return;
      setIsMenuOpen(false);
      setIsRenaming(false);
      window.dispatchEvent(
        new CustomEvent('tree-action-menu-close', { detail: id })
      );
    }, 350);
  }, [isRenaming, id]);

  /**
   * Explicit immediate dismissal handler (called by Escape hotkeys or node selection).
   */
  const closeMenu = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsMenuOpen(false);
    setIsRenaming(false);
    setPinned(false);
    window.dispatchEvent(
      new CustomEvent('tree-action-menu-close', { detail: id })
    );
  }, [id, setPinned]);

  /**
   * A click on the gear: pins the menu open (opening it first if a hover hasn't already), or, when it
   * is already pinned, unpins and closes it. Hovering alone still opens it unpinned, as before.
   */
  const handleGearClick = useCallback(
    (e: React.SyntheticEvent<HTMLElement>) => {
      if (pinnedRef.current) {
        closeMenu();
        return;
      }
      if (!isMenuOpen) openMenu(e);
      else if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPinned(true);
    },
    [closeMenu, openMenu, isMenuOpen, setPinned]
  );

  /**
   * A right-click (or the keyboard's menu key) on the row: opens this row's menu pinned, exactly as a click
   * on its gear does -- positioned from the gear, so it looks the same however it was opened -- but never
   * closes it (a second right-click keeps it open). Shift+right-click is left to the browser's own menu.
   * The row must contain its gear (`data-tree-gear`, set by TreeGearButton).
   */
  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      if (pinnedRef.current) return;
      const gear = e.currentTarget.querySelector<HTMLElement>('[data-tree-gear]') ?? e.currentTarget;
      if (!isMenuOpen) openMenuFrom(gear);
      else if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPinned(true);
    },
    [isMenuOpen, openMenuFrom, setPinned]
  );

  const handleGearKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (!['Enter', ' ', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    openMenu(event);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-tree-menu]:not([inert]) button')?.focus());
  }, [openMenu]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      closeMenu();
      activeTargetElRef.current?.focus();
    };
    const handleDocumentMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || pinnedRef.current) return; // a pinned menu ignores clicks elsewhere
      if (
        target.closest('[data-tree-menu]') ||
        target.closest('[data-gear-trigger]') ||
        target === activeTargetElRef.current ||
        activeTargetElRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [isMenuOpen, closeMenu]);

  return {
    handleGearKeyDown,
    isMenuOpen,
    isPinned,
    handleGearClick,
    handleRowContextMenu,
    menuCoords,
    isRenaming,
    setIsRenaming,
    handleGearMouseEnter,
    handleMenuMouseEnter,
    handleMouseLeave,
    closeMenu,
  };
}
