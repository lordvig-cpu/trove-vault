import { requestMenuTab, type MenuTab } from '@/lib/menuTabRequest';
import { closeFloatingNodeMenu, getFloatingNodeMenu, openFloatingNodeMenu } from '@/lib/floatingNodeMenu';

/* ==========================================================================
   Opening a node's gear flyout from outside the Layout tree: the toolbars' gear and a right-click on the
   editor canvas. While the Layout tab is showing, this works the tree row's own gear, so the flyout slides
   out of the panel exactly as if the row had been used. While it isn't, the same flyout opens as a floating
   window at the given point instead (lib/floatingNodeMenu.ts) -- the panel is never opened for it.
   ========================================================================== */

interface OpenNodeMenuOptions {
  /** 'toggle' acts like clicking the gear (a second click closes it); 'open' like right-clicking the row
   *  (always opens, never closes). */
  how: 'toggle' | 'open';
  /** The tab to show (the toolbar gear asks for Properties); otherwise a tree flyout keeps whichever tab
   *  was last used and a floating one opens on Actions. */
  tab?: MenuTab;
  /** Whether the Layout tree is on screen (its panel open with the Layout tab showing). */
  isLayoutPanelOpen?: boolean;
  /** Where the floating menu's top-left corner goes when the Layout tree isn't showing. */
  at: { x: number; y: number };
}

/** How long to keep looking for the row's gear: selecting a node can expand its collapsed ancestors in
 *  the Layout tree, so the row may only appear a render or two later. */
const MAX_FRAMES_FOR_ROW = 30;

export function openNodeMenu(nodeId: string, { how, tab, isLayoutPanelOpen, at }: OpenNodeMenuOptions) {
  if (!isLayoutPanelOpen) {
    if (how === 'toggle' && getFloatingNodeMenu()?.nodeId === nodeId) closeFloatingNodeMenu();
    else openFloatingNodeMenu(nodeId, at.x, at.y, tab);
    return;
  }
  const operateTreeGear = (framesLeft = MAX_FRAMES_FOR_ROW) => {
    const gear = document.querySelector<HTMLElement>(`[data-tree-gear-id="${nodeId}"]`);
    if (!gear) {
      if (framesLeft > 0) requestAnimationFrame(() => operateTreeGear(framesLeft - 1));
      return;
    }
    if (tab) requestMenuTab(nodeId, tab);
    if (how === 'toggle') gear.click();
    // Bubbles to the row's onContextMenu (useTreeActionMenu's handleRowContextMenu), like a real right-click
    else gear.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  };
  operateTreeGear();
}
