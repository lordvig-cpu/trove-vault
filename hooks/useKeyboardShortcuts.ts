'use client';

import { useEffect, useRef } from 'react';

export type KeyCombo = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: (e: KeyboardEvent) => void;
  allowInInputs?: boolean;
};

export function useKeyboardShortcuts(shortcuts: KeyCombo[], isEnabled: boolean = true) {
  const shortcutsRef = useRef<KeyCombo[]>(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable);

      for (const shortcut of shortcutsRef.current) {
        const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const matchesShift = !!shortcut.shift === e.shiftKey;
        const matchesAlt = !!shortcut.alt === e.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          // If the shortcut is Ctrl+K, prevent Chrome from opening the address bar immediately
          if (shortcut.ctrl || shortcut.meta) {
            e.preventDefault();
            e.stopPropagation();
          }

          if (isTyping && !shortcut.allowInInputs) {
            continue;
          }

          shortcut.action(e);
          break;
        }
      }
    };

    // Use capture phase so your app intercepts the event before the browser defaults
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isEnabled]);
}