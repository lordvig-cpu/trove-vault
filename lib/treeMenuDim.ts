import { useSyncExternalStore } from 'react';

/* ==========================================================================
   A gear submenu open out of a tree (hovered or pinned) dims and blurs the canvas, the way a header pulldown
   does (app/page.tsx's isBlurred), until it is closed. A menu reports itself here by its id while it is open;
   a floating one doesn't (it is for working on the canvas).
   ========================================================================== */

const dimming = new Set<string>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function setTreeMenuDim(menuId: string, dim: boolean) {
  if (dim === dimming.has(menuId)) return;
  if (dim) dimming.add(menuId);
  else dimming.delete(menuId);
  notify();
}

/** Whether any docked tree submenu is open. */
export function useTreeMenuDim(): boolean {
  return useSyncExternalStore(subscribe, () => dimming.size > 0, () => false);
}
