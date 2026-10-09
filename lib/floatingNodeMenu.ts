import { useSyncExternalStore } from 'react';
import type { MenuTab } from '@/lib/menuTabRequest';

/* ==========================================================================
   The floating node menu: a container's or content element's gear flyout opened somewhere other than its
   Layout-tree row, because the Layout panel isn't showing -- at the cursor for a right-click on the canvas,
   under the toolbar's gear for a click on it. It is the same flyout the tree row opens (FloatingNodeMenuHost
   renders it in the template editor), with a help window's chrome: drag it by its title bar, close it with
   its close button or Escape. Only one at a time; opening another, or any tree flyout, replaces it.
   ========================================================================== */

export interface FloatingNodeMenuState {
  nodeId: string;
  left: number;
  top: number;
  /** The tab it opens on (the toolbar gear asks for Properties). */
  tab: MenuTab;
  /** Changes on every open, so the menu remounts with its opening tab. */
  openCount: number;
}

/** The menu id the floating menu broadcasts with -- prefixed like the tree row's own menu id, so the toolbar
 *  gear's "is this node's menu open" check (editorBarControls' useTreeMenuOpen) sees it as open. */
export const floatingMenuIdFor = (nodeId: string, isContainer: boolean) =>
  `${isContainer ? 'tree-container' : 'tree-comp'}-${nodeId}-floating`;

/** Widest the flyout gets (menuShellXWide, 17.5rem) plus a margin: how far from the right edge it must open. */
const MENU_WIDTH_PX = 280;
const EDGE_MARGIN_PX = 16;

let state: FloatingNodeMenuState | null = null;
let openCount = 0;
const listeners = new Set<() => void>();
const commit = (next: FloatingNodeMenuState | null) => {
  state = next;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function getFloatingNodeMenu(): FloatingNodeMenuState | null {
  return state;
}

export function useFloatingNodeMenu(): FloatingNodeMenuState | null {
  return useSyncExternalStore(subscribe, () => state, () => null);
}

/** Opens the floating menu for `nodeId` with its top-left corner near (`x`, `y`), kept on screen. */
export function openFloatingNodeMenu(nodeId: string, x: number, y: number, tab: MenuTab = 'actions') {
  const left = Math.max(EDGE_MARGIN_PX, Math.min(Math.round(x), window.innerWidth - MENU_WIDTH_PX - EDGE_MARGIN_PX));
  const top = Math.max(EDGE_MARGIN_PX, Math.round(y));
  commit({ nodeId, left, top, tab, openCount: ++openCount });
}

export function closeFloatingNodeMenu() {
  if (state) commit(null);
}

export function moveFloatingNodeMenu(left: number, top: number) {
  if (state) commit({ ...state, left, top });
}
