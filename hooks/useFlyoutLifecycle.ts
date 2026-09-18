'use client';

import { useState, useEffect } from 'react';

/* ==========================================================================
   CUSTOM HOOK: useFlyoutLifecycle
   Manages mount and unmount lifecycles for the floating flyout panel.
   Orchestrates entrance, exit, and pin transition timers.
   ========================================================================== */

/**
 * @param isOpen - The requested visibility state of the flyout
 * @param isPinned - Whether the panel is currently docked to the layout
 * @param animationsEnabled - User preference for enabling/disabling transitions
 * @param variant - The layout mode ('flyout' or 'sidebar')
 */
export function useFlyoutLifecycle(
  isOpen: boolean,
  isPinned: boolean,
  animationsEnabled: boolean,
  variant: 'flyout' | 'sidebar'
) {
  /* ------------------------------------------------------------------------
     1. LIFECYCLE STATES
     ------------------------------------------------------------------------ */
  const [renderMenu, setRenderMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  /* ------------------------------------------------------------------------
     2. STATE MACHINE
     ------------------------------------------------------------------------ */
  useEffect(() => {
    if (variant !== 'flyout') return;

    if (isOpen) {
      setRenderMenu(true);
      setIsClosing(false);
    } else if (renderMenu) {
      if (animationsEnabled) {
        setIsClosing(true);
        const timer = setTimeout(() => {
          setRenderMenu(false);
          setIsClosing(false);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        setRenderMenu(false);
      }
    }
  }, [isOpen, renderMenu, animationsEnabled, variant]);

  return { renderMenu, isClosing };
}