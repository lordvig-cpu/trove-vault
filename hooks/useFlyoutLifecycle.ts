'use client';

import { useState, useEffect } from 'react';

/* ==========================================================================
   CUSTOM HOOK: useFlyoutLifecycle
   ========================================================================== */

/**
 * Manages the complex mount and unmount lifecycles for the floating flyout panel.
 * Ensures CSS animations (fade-in, fade-out, and slide-to-pin) have enough
 * time to complete before React actually removes the DOM nodes.
 *
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
     
  // Controls actual presence in the React DOM.
  const [renderMenu, setRenderMenu] = useState(false);
  
  // Triggers the 'animate-unmount-fade' CSS class before destruction.
  const [isClosing, setIsClosing] = useState(false);

  /* ------------------------------------------------------------------------
     2. STATE MACHINE
     Evaluates on every prop change to orchestrate entrance and exit timers.
     ------------------------------------------------------------------------ */
  useEffect(() => {
    // This hook only applies to the unpinned floating popover variant
    if (variant !== 'flyout') return;

    // SCENARIO A: Opening the flyout
    if (isOpen && !isPinned) {
      setRenderMenu(true);
      setIsClosing(false);
    } 
    // SCENARIO B: Closing or Pinning an already-open flyout
    else if (renderMenu) {
      
      // 1. User clicked "Pin"
      // Keep the menu mounted for 700ms to allow the slide-left CSS transition
      // to reach the sidebar docking area before unmounting the portal.
      if (isPinned) {
        const timer = setTimeout(() => setRenderMenu(false), 700);
        return () => clearTimeout(timer);
      }

      // 2. User clicked "Close" or background overlay
      if (animationsEnabled) {
        setIsClosing(true); // Triggers the opacity fade-out animation
        
        // Keep mounted for 500ms until the fade animation completes
        const timer = setTimeout(() => {
          setRenderMenu(false);
          setIsClosing(false);
        }, 500);
        return () => clearTimeout(timer);
      } 
      
      // 3. User closed with animations disabled (Instant destruction)
      else {
        setRenderMenu(false);
      }
    }
  }, [isOpen, renderMenu, animationsEnabled, isPinned, variant]);

  return { renderMenu, isClosing };
}