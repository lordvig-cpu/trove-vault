'use client';

import { useState, useRef, useId, useCallback, useEffect, useMemo } from 'react';
import { holdFlyout, releaseFlyout } from '@/lib/flyoutHold';

/* ==========================================================================
   1. CUSTOM EVENT DEFINITIONS
   ========================================================================== */

/**
 * Window-level CustomEvent broadcast whenever any tree gear icon is triggered.
 * Enforces mutual exclusion so only one action menu remains open across the DOM.
 */
export const GLOBAL_MENU_OPEN_EVENT = 'tree-action-menu-open';
/** Broadcast when a menu closes (detail: its id), so a control mirroring it (the toolbar gear) can follow. */
export const GLOBAL_MENU_CLOSE_EVENT = 'tree-action-menu-close';

/** The menu (hook instance id) currently pinned open by a click, if any. Shared by every instance: while
    one menu is pinned, merely hovering another gear doesn't open that one (and so can't close the
    pinned one); clicking another gear still does. */
let pinnedMenuId: string | null = null;

/** A menu that isn't a useTreeActionMenu instance (the floating node menu, lib/floatingNodeMenu.ts) holding
    the pin while it is open, so hovering a gear doesn't open another menu over it. */
export function holdMenuPin(menuId: string) {
  pinnedMenuId = menuId;
}
export function releaseMenuPin(menuId: string) {
  if (pinnedMenuId === menuId) pinnedMenuId = null;
}

/** What every gear flyout takes as its `menu` prop. */
export type TreeActionMenuApi = ReturnType<typeof useTreeActionMenu>;

/* ==========================================================================
   2. CUSTOM HOOK: useTreeActionMenu
   ========================================================================== */

/**
 * Manages positioning physics, mutual exclusivity, hover grace periods,
 * and pin state for the tree rows' gear flyouts.
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
  /** Set by a menu that can live on without its panel (the Layout tree's container / content menus, which
      reopen as the floating node menu): called with where the menu stood when its panel was hidden while it
      was pinned open. Without one, hiding the panel just closes the menu. */
  const panelHiddenHandlerRef = useRef<((at: { top: number; left: number }) => void) | null>(null);

  /* ------------------------------------------------------------------------
     2.2 LOCAL MENU & INTERACTION STATES
     ------------------------------------------------------------------------ */
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Closed because its panel was hidden: it disappears at once instead of sliding out alongside the panel
  // (and before the floating menu that may take its place appears). Cleared on the next open.
  const [closedWithPanel, setClosedWithPanel] = useState(false);
  // Floating: pinned open when its panel was hidden, it carries on in place as a movable window with a close
  // button (TreeSubMenu's `floating` chrome) instead of closing. A header pulldown it came from stays mounted
  // meanwhile (held since the menu was pinned, see setPinned), since the menu still lives in that pulldown's tree.
  const [isFloating, setIsFloating] = useState(false);
  const isFloatingRef = useRef(false);
  const endFloating = useCallback(() => {
    isFloatingRef.current = false;
    setIsFloating(false);
  }, []);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  // Pinned = opened by a click on the gear (not just a hover): it stays open when the pointer leaves
  // or the user clicks elsewhere, until the gear is clicked again (or Escape, or another menu opens).
  // A ref too, so the close timers and document listeners see the current value.
  const [isPinned, setIsPinnedState] = useState(false);
  const pinnedRef = useRef(false);
  // While pinned inside a header pulldown, the pulldown is held mounted (lib/flyoutHold.ts): closing or docking
  // it then can't unmount the menu before it gets the chance to float.
  const heldFlyoutRef = useRef<string | null>(null);
  const setPinned = useCallback(
    (pinned: boolean) => {
      pinnedRef.current = pinned;
      setIsPinnedState(pinned);
      if (pinned) pinnedMenuId = id;
      else if (pinnedMenuId === id) pinnedMenuId = null;
      if (pinned && !heldFlyoutRef.current) {
        const flyoutKey = activeTargetElRef.current?.closest<HTMLElement>('aside[data-flyout-panel]')?.dataset.flyoutPanel;
        if (flyoutKey) {
          holdFlyout(flyoutKey);
          heldFlyoutRef.current = flyoutKey;
        }
      } else if (!pinned && heldFlyoutRef.current) {
        releaseFlyout(heldFlyoutRef.current);
        heldFlyoutRef.current = null;
      }
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
        setPinned(false);
        endFloating();
      }
    };

    window.addEventListener(GLOBAL_MENU_OPEN_EVENT, handleGlobalMenuOpen);
    return () => {
      window.removeEventListener(GLOBAL_MENU_OPEN_EVENT, handleGlobalMenuOpen);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // A row that unmounts while pinned (deleted, panel closed) must not leave hovers blocked everywhere.
      if (pinnedMenuId === id) pinnedMenuId = null;
      if (heldFlyoutRef.current) releaseFlyout(heldFlyoutRef.current);
      heldFlyoutRef.current = null;
    };
  }, [id, setPinned, endFloating]);

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
      setClosedWithPanel(false);

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
      if (isFloatingRef.current) return; // floating, it stays where it was moved to
      openMenu(e, customHeight);
    },
    [id, openMenu]
  );

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
    // A menu pinned open by a click doesn't close when the pointer leaves
    if (pinnedRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const focused = document.activeElement;
      if (focused === activeTargetElRef.current || (focused instanceof HTMLElement && focused.closest('[data-tree-menu]'))) return;
      setIsMenuOpen(false);
      window.dispatchEvent(
        new CustomEvent(GLOBAL_MENU_CLOSE_EVENT, { detail: id })
      );
    }, 350);
  }, [id]);

  /**
   * Explicit immediate dismissal handler (called by Escape hotkeys or node selection).
   */
  const closeMenu = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsMenuOpen(false);
    setPinned(false);
    endFloating();
    window.dispatchEvent(
      new CustomEvent(GLOBAL_MENU_CLOSE_EVENT, { detail: id })
    );
  }, [id, setPinned, endFloating]);

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

  /* A menu belongs to the panel its gear is in: when that panel is hidden (it stays mounted but goes inert),
     the menu closes rather than staying on screen with no way back to its gear -- or, pinned open with a
     takeover handler, hands over to it (the floating node menu) at the same spot. */
  useEffect(() => {
    if (!isMenuOpen) return;
    const panel = activeTargetElRef.current?.closest<HTMLElement>('aside');
    if (!panel) return;
    const check = () => {
      if (isFloatingRef.current) return;
      if (!panel.hasAttribute('inert') && panel.getAttribute('aria-hidden') !== 'true') return;
      const takeOver = pinnedRef.current ? panelHiddenHandlerRef.current : null;
      if (pinnedRef.current && !takeOver) {
        // Carry on in place as a floating window
        isFloatingRef.current = true;
        setIsFloating(true);
        return;
      }
      setClosedWithPanel(true);
      closeMenu();
      takeOver?.(menuCoords);
    };
    const observer = new MutationObserver(check);
    observer.observe(panel, { attributes: true, attributeFilter: ['inert', 'aria-hidden'] });
    return () => observer.disconnect();
  }, [isMenuOpen, closeMenu, menuCoords]);

  // A menu whose row unmounts while open (its tree swapped for another tab) tells mirrors (the toolbar gear) it closed.
  const isMenuOpenRef = useRef(false);
  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);
  useEffect(
    () => () => {
      if (isMenuOpenRef.current) window.dispatchEvent(new CustomEvent(GLOBAL_MENU_CLOSE_EVENT, { detail: id }));
    },
    [id]
  );

  const setPanelHiddenHandler = useCallback((handler: ((at: { top: number; left: number }) => void) | null) => {
    panelHiddenHandlerRef.current = handler;
  }, []);

  const menuCoordsRef = useRef(menuCoords);
  useEffect(() => {
    menuCoordsRef.current = menuCoords;
  }, [menuCoords]);
  /** Floating, its title bar drags it (kept partly on screen, like the floating node menu). */
  const handleFloatingTitlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const start = menuCoordsRef.current;
    const onMove = (ev: PointerEvent) => {
      const left = Math.min(Math.max(start.left + ev.clientX - startX, 48 - menuWidth), window.innerWidth - 48);
      const top = Math.min(Math.max(start.top + ev.clientY - startY, 0), window.innerHeight - 48);
      setMenuCoords({ top, left });
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  }, [menuWidth]);
  const floatingChrome = useMemo(
    () => (isFloating ? { onClose: closeMenu, onTitlePointerDown: handleFloatingTitlePointerDown } : undefined),
    [isFloating, closeMenu, handleFloatingTitlePointerDown]
  );

  return {
    /** TreeSubMenu's `floating` chrome while the menu floats (its panel was hidden while pinned), else undefined. */
    floatingChrome,
    closedWithPanel,
    setPanelHiddenHandler,
    handleGearKeyDown,
    isMenuOpen,
    isPinned,
    handleGearClick,
    handleRowContextMenu,
    menuCoords,
    handleGearMouseEnter,
    handleMenuMouseEnter,
    handleMouseLeave,
    closeMenu,
  };
}
