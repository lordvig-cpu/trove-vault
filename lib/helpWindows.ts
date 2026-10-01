import { useSyncExternalStore } from 'react';
import type { HintContent } from '@/components/HoverHint';

/**
 * The help windows: a `?` bubble opens anchored (it belongs to its `?` and closes when the pointer
 * leaves it); clicking the bubble's anchor icon un-anchors it into a small draggable window that
 * stays until its close button is used. They live in this module-level store (not in the `?` that
 * opened them) so they outlive the flyout or panel they came from; `HelpWindowHost` renders them
 * once, at the app root. A window is keyed by its hint's title, so there is never a duplicate of
 * the same help. Position is not remembered once closed: reopening starts from the `?` again.
 */

export interface HelpWindowState {
  key: string;
  hint: HintContent;
  left: number;
  top: number;
  /** Anchored: fixed in place, closes when the pointer leaves it. Not anchored: draggable, stays until closed. */
  anchored: boolean;
}

/** More than this and the oldest window closes, so they can't pile up over the interface. */
export const MAX_HELP_WINDOWS = 4;

let windows: HelpWindowState[] = [];
const listeners = new Set<() => void>();

const commit = (next: HelpWindowState[]) => {
  windows = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY: HelpWindowState[] = [];

/** Open the free-floating (un-anchored) window for `hint` at `left` / `top`, or close it if it is already open. */
export function toggleHelpWindow(hint: HintContent, position: { left: number; top: number }) {
  const key = hint.title;
  if (windows.some((w) => w.key === key)) {
    closeHelpWindow(key);
    return;
  }
  commit([...windows, { key, hint, ...position, anchored: false }].slice(-MAX_HELP_WINDOWS));
}

export function setHelpWindowAnchored(key: string, anchored: boolean) {
  commit(windows.map((w) => (w.key === key ? { ...w, anchored } : w)));
}

export function closeHelpWindow(key: string) {
  commit(windows.filter((w) => w.key !== key));
}

export function moveHelpWindow(key: string, left: number, top: number) {
  commit(windows.map((w) => (w.key === key ? { ...w, left, top } : w)));
}

/** Bring a window in front of the others (they share one z-index, so DOM order decides). */
export function raiseHelpWindow(key: string) {
  const win = windows.find((w) => w.key === key);
  if (!win || windows[windows.length - 1] === win) return;
  commit([...windows.filter((w) => w.key !== key), win]);
}

export function useHelpWindows(): HelpWindowState[] {
  return useSyncExternalStore(
    subscribe,
    () => windows,
    () => EMPTY
  );
}

export function useIsHelpWindowOpen(key: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => windows.some((w) => w.key === key),
    () => false
  );
}
