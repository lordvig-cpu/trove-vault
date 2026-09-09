'use client';

import { useEffect, useRef } from 'react';

/* ==========================================================================
   1. TYPE DEFINITIONS
   ========================================================================== */

/**
 * Configuration object for a single keyboard shortcut mapping.
 */
export type KeyCombo = {
  key: string;              // The specific key to listen for (e.g., 'k', 'Escape')
  ctrl?: boolean;           // Requires Control (Windows/Linux) or Command (Mac) modifier
  meta?: boolean;           // Alternative for Command/Windows key explicitly
  shift?: boolean;          // Requires Shift modifier
  alt?: boolean;            // Requires Alt/Option modifier
  action: (e: KeyboardEvent) => void; // Callback executed when the combo matches
  allowInInputs?: boolean;  // If true, triggers even when actively typing in text fields
};

/* ==========================================================================
   2. CUSTOM HOOK: useKeyboardShortcuts
   ========================================================================== */

/**
 * Registers global keyboard shortcuts with capture-phase event listeners.
 * Intercepts browser defaults (like Ctrl+K) and respects user typing focus.
 *
 * @param shortcuts - Array of keyboard combinations and their operational handlers
 * @param isEnabled - Master toggle to activate/deactivate the listener entirely
 */
export function useKeyboardShortcuts(shortcuts: KeyCombo[], isEnabled: boolean = true) {
  /* ------------------------------------------------------------------------
     2.1 STALE CLOSURE PREVENTION
     Maintains a fresh reference to the shortcuts array. This allows callbacks 
     to use the latest state without tearing down and re-binding the window 
     event listener on every render.
     ------------------------------------------------------------------------ */
  const shortcutsRef = useRef<KeyCombo[]>(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  /* ------------------------------------------------------------------------
     2.2 GLOBAL EVENT LISTENER
     ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Assess Viewport Focus Context
      // Determine if the user is currently typing in an input field or text area
      const activeEl = document.activeElement;
      const isTyping =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable);

      // 2. Iterate through registered shortcuts to find a match
      for (const shortcut of shortcutsRef.current) {
        // Case-insensitive key matching (so 'k' matches both 'K' and 'k')
        const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        
        // Treat Command (meta) and Control as interchangeable for standard hotkeys
        const matchesCtrl = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const matchesShift = !!shortcut.shift === e.shiftKey;
        const matchesAlt = !!shortcut.alt === e.altKey;

        // 3. Execution Phase
        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          
          // Aggressively prevent default browser behaviors for modifier combos.
          // (e.g., this prevents Chrome from opening the search bar on Ctrl+K)
          if (shortcut.ctrl || shortcut.meta) {
            e.preventDefault();
            e.stopPropagation();
          }

          // Abort execution if typing in an input field (unless explicitly permitted)
          if (isTyping && !shortcut.allowInInputs) {
            continue;
          }

          // Trigger the registered callback and halt the loop
          shortcut.action(e);
          break;
        }
      }
    };

    // 4. Bind listener using the capture phase.
    // Setting { capture: true } ensures the application intercepts the keydown 
    // at the top level BEFORE nested DOM elements can react and run stopPropagation().
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isEnabled]);
}