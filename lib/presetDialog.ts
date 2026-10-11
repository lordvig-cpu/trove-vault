import { useSyncExternalStore } from 'react';
import type { PresetKind } from '@/lib/layoutPresets';

/* ==========================================================================
   Which pre-defined content block (Field List, Header, Stat Row) is being added, and into which container:
   the Add menus (the top toolbar's Add pulldown, a container's gear Actions) open it, and AddPresetDialog
   (mounted once, in app/page.tsx) shows it. A store rather than props, so neither menu has to be wired to
   the dialog through the components between them.
   ========================================================================== */

export interface PresetDialogState {
  kind: PresetKind;
  containerId: string;
}

let state: PresetDialogState | null = null;
const listeners = new Set<() => void>();
const commit = (next: PresetDialogState | null) => {
  state = next;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function openPresetDialog(kind: PresetKind, containerId: string) {
  commit({ kind, containerId });
}

export function closePresetDialog() {
  if (state) commit(null);
}

export function usePresetDialog(): PresetDialogState | null {
  return useSyncExternalStore(subscribe, () => state, () => null);
}
