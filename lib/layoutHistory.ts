import { FlexContainerNode, TemplateFlexLayoutConfig } from '@/types/layout';

/* ==========================================================================
   Undo / redo history for the template layout, as pure functions on an immutable snapshot list.
   Session-only: nothing here is persisted (`hooks/useLayoutHistory.ts` keeps it in memory).
   ========================================================================== */

/** Edits closer together than this, on the same set of nodes, count as one (a resize drag). */
export const COALESCE_WINDOW_MS = 500;
/** Oldest snapshots are dropped past this many undo steps. */
export const MAX_HISTORY = 100;

export interface LayoutHistory {
  /** Layouts to go back to, oldest first. */
  past: TemplateFlexLayoutConfig[];
  /** Layouts to go forward to after an undo, next one last. */
  future: TemplateFlexLayoutConfig[];
  /** When the last edit was recorded; 0 after an undo/redo so the next edit starts a new step. */
  lastEditAt: number;
}

export const emptyHistory: LayoutHistory = { past: [], future: [], lastEditAt: 0 };

/** Every node id in the tree, so edits that add/remove/split nodes can be told from tweaks. */
function nodeIdKey(node: FlexContainerNode): string {
  const ids: string[] = [];
  const walk = (n: FlexContainerNode) => {
    ids.push(n.id);
    for (const child of n.children) {
      if (child.nodeType === 'container') walk(child);
      else ids.push(child.id);
    }
  };
  walk(node);
  return ids.join('|');
}

/**
 * Records an edit from `previous` to `next`. A quick run of property tweaks on the same nodes
 * (dragging a resize handle fires one edit per mouse move) stays one undo step; adding, removing
 * or splitting nodes is always its own step. Any new edit clears the redo stack.
 */
export function recordEdit(
  history: LayoutHistory,
  previous: TemplateFlexLayoutConfig,
  next: TemplateFlexLayoutConfig,
  now: number
): LayoutHistory {
  const continuesBurst =
    history.past.length > 0 &&
    now - history.lastEditAt < COALESCE_WINDOW_MS &&
    nodeIdKey(previous.root) === nodeIdKey(next.root);
  const past = continuesBurst ? history.past : [...history.past, previous].slice(-MAX_HISTORY);
  return { past, future: [], lastEditAt: now };
}

/** Steps back: returns the layout to show and the updated history, or null if nothing to undo. */
export function undo(
  history: LayoutHistory,
  current: TemplateFlexLayoutConfig
): { layout: TemplateFlexLayoutConfig; history: LayoutHistory } | null {
  const layout = history.past[history.past.length - 1];
  if (!layout) return null;
  return {
    layout,
    history: { past: history.past.slice(0, -1), future: [...history.future, current], lastEditAt: 0 },
  };
}

/** Steps forward again after an undo, or null if there's nothing to redo. */
export function redo(
  history: LayoutHistory,
  current: TemplateFlexLayoutConfig
): { layout: TemplateFlexLayoutConfig; history: LayoutHistory } | null {
  const layout = history.future[history.future.length - 1];
  if (!layout) return null;
  return {
    layout,
    history: { past: [...history.past, current], future: history.future.slice(0, -1), lastEditAt: 0 },
  };
}
