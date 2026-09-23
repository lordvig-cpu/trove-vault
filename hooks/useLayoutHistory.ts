'use client';

import { useCallback, useRef, useState } from 'react';
import { TemplateFlexLayoutConfig } from '@/types/layout';
import { LayoutHistory, emptyHistory, recordEdit, redo, undo } from '@/lib/layoutHistory';

/**
 * The template editor's undo/redo history, held in memory for the editing session only: it is
 * never saved anywhere, so leaving the editor or refreshing the page starts a fresh history.
 * The history itself lives in a ref (callbacks always see the latest); the state below only
 * exists so the Undo / Redo buttons re-render when they become available or unavailable.
 */
export function useLayoutHistory() {
  const history = useRef<LayoutHistory>(emptyHistory);
  const [available, setAvailable] = useState({ undo: false, redo: false });

  const publish = useCallback(() => {
    const next = { undo: history.current.past.length > 0, redo: history.current.future.length > 0 };
    setAvailable((prev) => (prev.undo === next.undo && prev.redo === next.redo ? prev : next));
  }, []);

  /** Call with the layout before and after every edit. */
  const record = useCallback(
    (previous: TemplateFlexLayoutConfig, next: TemplateFlexLayoutConfig) => {
      history.current = recordEdit(history.current, previous, next, Date.now());
      publish();
    },
    [publish]
  );

  /** The layout to go back to (given the one on screen), or null if there is nothing to undo. */
  const stepBack = useCallback(
    (current: TemplateFlexLayoutConfig) => {
      const result = undo(history.current, current);
      if (!result) return null;
      history.current = result.history;
      publish();
      return result.layout;
    },
    [publish]
  );

  /** The layout to go forward to after an undo, or null if there is nothing to redo. */
  const stepForward = useCallback(
    (current: TemplateFlexLayoutConfig) => {
      const result = redo(history.current, current);
      if (!result) return null;
      history.current = result.history;
      publish();
      return result.layout;
    },
    [publish]
  );

  const clear = useCallback(() => {
    history.current = emptyHistory;
    publish();
  }, [publish]);

  return {
    canUndo: available.undo,
    canRedo: available.redo,
    record,
    stepBack,
    stepForward,
    clear,
  };
}
