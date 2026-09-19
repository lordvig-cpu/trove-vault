'use client';

import { useMemo, useSyncExternalStore } from 'react';

const CHANGE_EVENT = 'uc-storage-change';

/** SSR-safe preferences with pure React snapshots and cross-tab synchronization. */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((current: T) => T)) => void] {
  const store = useMemo(() => createStore(key, initialValue), [key, initialValue]);
  const value = useSyncExternalStore(store.subscribe, store.read, store.serverSnapshot);
  return [value, store.set];
}

function createStore<T>(key: string, initialValue: T) {
  let snapshot = initialValue;
  let lastRaw: string | null | undefined;
  const listeners = new Set<() => void>();
  const read = () => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== lastRaw) {
        snapshot = raw === null ? initialValue : JSON.parse(raw) as T;
        lastRaw = raw;
      }
    } catch {
      // Keep preferences usable when storage is unavailable or malformed.
    }
    return snapshot;
  };
  const notify = () => listeners.forEach(listener => listener());
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const changed = (event: Event) => {
      if (event instanceof StorageEvent && event.storageArea !== window.localStorage) return;
      if (event instanceof StorageEvent && event.key !== null && event.key !== key) return;
      if (event instanceof CustomEvent && event.detail !== key) return;
      notify();
    };
    window.addEventListener('storage', changed);
    window.addEventListener(CHANGE_EVENT, changed);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', changed);
      window.removeEventListener(CHANGE_EVENT, changed);
    };
  };
  const set = (value: T | ((current: T) => T)) => {
    const current = read();
    const next = value instanceof Function ? value(current) : value;
    try {
      const raw = JSON.stringify(next);
      window.localStorage.setItem(key, raw);
      lastRaw = raw;
    } catch {
      // A failed write must not prevent the in-memory preference changing.
    }
    snapshot = next;
    notify();
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
  };
  return { read, subscribe, set, serverSnapshot: () => initialValue };
}
