import { useSyncExternalStore } from 'react';

/* ==========================================================================
   A header pulldown (the Items / Collections / Templates flyout) normally unmounts once it closes or is
   docked. While one of its gear menus has carried on as a floating window (useTreeActionMenu), that menu
   still lives inside the pulldown's tree, so the pulldown is kept mounted -- hidden -- until the menu
   closes. Keyed by the pulldown's name, lowercased ("items", "collections", "templates").
   ========================================================================== */

const held = new Map<string, number>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function holdFlyout(key: string) {
  held.set(key, (held.get(key) ?? 0) + 1);
  notify();
}

export function releaseFlyout(key: string) {
  const count = held.get(key) ?? 0;
  if (count <= 1) held.delete(key);
  else held.set(key, count - 1);
  notify();
}

/** Whether a floating menu is keeping this pulldown mounted. */
export function useFlyoutHeld(key: string): boolean {
  return useSyncExternalStore(subscribe, () => held.has(key), () => false);
}
