'use client';

import { useSyncExternalStore } from 'react';

const subscribe = (notify: () => void) => {
  window.addEventListener('resize', notify);
  return () => window.removeEventListener('resize', notify);
};
const snapshot = () => window.screen?.width ?? 0;
const serverSnapshot = () => 0;

/** The user's actual monitor width in px (0 during SSR/until mount); updates if they change display or resize. */
export function useScreenWidth(): number {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
