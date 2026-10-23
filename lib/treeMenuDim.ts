import { useSyncExternalStore } from 'react';

/* ==========================================================================
   A gear submenu open out of a tree (hovered or pinned) dims and blurs the canvas, the way a header pulldown
   does (app/page.tsx's isBlurred), until it is closed. A menu reports itself here by its id while it is open;
   a floating one doesn't (it is for working on the canvas). A menu whose controls change the template editor's
   canvas live (a container's, the Body's, a content element's) says so, and doesn't dim it while a template is
   being edited: you need to watch what its edits do.
   ========================================================================== */

/** Each open menu, by id: whether its controls edit the template canvas. */
const dimming = new Map<string, boolean>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function setTreeMenuDim(menuId: string, dim: boolean, editsCanvas = false) {
  if (dim === dimming.has(menuId) && (!dim || dimming.get(menuId) === editsCanvas)) return;
  if (dim) dimming.set(menuId, editsCanvas);
  else dimming.delete(menuId);
  notify();
}

const anyMenuDims = () => dimming.size > 0;
const anyNonCanvasMenuDims = () => [...dimming.values()].some((editsCanvas) => !editsCanvas);

/** Whether the canvas is dimmed by an open docked tree submenu. While a template is being edited, only by one that
    doesn't edit the canvas. */
export function useTreeMenuDim(isEditingTemplate: boolean): boolean {
  return useSyncExternalStore(subscribe, isEditingTemplate ? anyNonCanvasMenuDims : anyMenuDims, () => false);
}
