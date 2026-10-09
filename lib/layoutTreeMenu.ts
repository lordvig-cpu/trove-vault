import { requestMenuTab, type MenuTab } from '@/lib/menuTabRequest';

/* ==========================================================================
   Opening a node's Layout-tree gear flyout from outside the tree: the toolbars' gear and a right-click on
   the editor canvas. There is no second menu -- this works the tree row's own gear, so the flyout is the
   same one, opened from the same place, however it was asked for.
   ========================================================================== */

interface OpenLayoutTreeMenuOptions {
  /** 'toggle' clicks the row's gear (pins it open, or closes it if already pinned); 'open' right-clicks the
   *  row (always opens it pinned, never closes it). */
  how: 'toggle' | 'open';
  /** Ask the flyout to show this tab first (otherwise it keeps whichever tab was last used). */
  tab?: MenuTab;
  /** Whether the Layout panel is showing; when not, it is opened first (unpinned) via onOpenLayoutPanel. */
  isLayoutPanelOpen?: boolean;
  onOpenLayoutPanel?: () => void;
  layoutPanelSelector?: string;
}

/** How long to keep looking for the row's gear: selecting a node can expand its collapsed ancestors in
 *  the Layout tree, so the row may only appear a render or two later. */
const MAX_FRAMES_FOR_ROW = 30;

export function openLayoutTreeMenu(
  nodeId: string,
  { how, tab, isLayoutPanelOpen, onOpenLayoutPanel, layoutPanelSelector = '.primary-side-panel' }: OpenLayoutTreeMenuOptions
) {
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

  if (isLayoutPanelOpen) {
    operateTreeGear();
    return;
  }
  // The tree row (and its gear) isn't on screen yet: open the panel unpinned, then wait for the *panel's
  // own* slide-in transition to genuinely finish before syncing to it. The menu's position is computed
  // from the panel's live bounding rect when it opens, so opening mid-transition (or even a couple of
  // animation frames in -- a frame-to-frame "has it stopped moving" check can be fooled by the transition
  // not having visibly started yet) anchors it to the panel's still-collapsed position.
  onOpenLayoutPanel?.();
  const waitForPanelThen = (cb: () => void) => {
    const panelEl = document.querySelector<HTMLElement>(layoutPanelSelector);
    if (!panelEl) {
      requestAnimationFrame(() => waitForPanelThen(cb));
      return;
    }
    const transitionSeconds = parseFloat(getComputedStyle(panelEl).transitionDuration) || 0;
    if (transitionSeconds === 0) {
      cb();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      panelEl.removeEventListener('transitionend', onEnd);
      cb();
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target === panelEl) finish();
    };
    panelEl.addEventListener('transitionend', onEnd);
    // Safety net if the transition never fires an end event (e.g. it gets interrupted).
    setTimeout(finish, transitionSeconds * 1000 + 100);
  };
  waitForPanelThen(() => operateTreeGear());
}
