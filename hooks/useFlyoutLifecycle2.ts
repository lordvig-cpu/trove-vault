'use client';

import { useState, useEffect } from 'react';

/* ==========================================================================
   CUSTOM HOOK: useFlyoutLifecycle2
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

    // SCENARIO A: Opening the flyout
    if (isOpen && !isPinned) {
      setRenderMenu(true);
      setIsClosing(false);
    } 
    // SCENARIO B: Closing or Pinning an already-open flyout
    else if (renderMenu) {
      // 1. User clicked "Pin"
      if (isPinned) {
        const timer = setTimeout(() => setRenderMenu(false), 700);
        return () => clearTimeout(timer);
      }

      // 2. User clicked "Close" or background overlay
      if (animationsEnabled) {
        setIsClosing(true);
        const timer = setTimeout(() => {
          setRenderMenu(false);
          setIsClosing(false);
        }, 500);
        return () => clearTimeout(timer);
      } 
      
      // 3. User closed with animations disabled
      else {
        setRenderMenu(false);
      }
    }
  }, [isOpen, renderMenu, animationsEnabled, isPinned, variant]);

  return { renderMenu, isClosing };
}

// Alias export to support either naming convention
export const useFlyoutLifecycle2 = useFlyoutLifecycle;