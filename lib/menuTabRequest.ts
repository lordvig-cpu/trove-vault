/* ==========================================================================
   Asking a Layout-tree flyout to open on a particular tab. The toolbars' gear (TreeGearButton in
   components/editorBarControls.tsx) opens a node's flyout through lib/layoutTreeMenu.ts, which works the
   tree row's own gear, and sends this first so that flyout shows Properties -- the toolbar is about editing the selection, so
   that is the tab worth landing on. The tree's own gear sends nothing, so it keeps whichever tab was
   last used. Listened to by the container and content flyouts (TemplateLayoutActionMenu.tsx).
   ========================================================================== */

export const MENU_TAB_REQUEST_EVENT = 'tree-action-menu-show-tab';

export type MenuTab = 'actions' | 'properties';

export interface MenuTabRequest {
  nodeId: string;
  tab: MenuTab;
}

/** Asks the flyout for `nodeId` to show `tab` (sent just before the flyout is opened). */
export function requestMenuTab(nodeId: string, tab: MenuTab) {
  window.dispatchEvent(new CustomEvent<MenuTabRequest>(MENU_TAB_REQUEST_EVENT, { detail: { nodeId, tab } }));
}
