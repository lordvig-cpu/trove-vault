'use client';

import { useState, useEffect, useCallback } from 'react';

/* ==========================================================================
   CUSTOM HOOK: useLocalStorage2
   A robust, SSR-safe wrapper for localStorage that mimics the useState API.
   ========================================================================== */

/**
 * Persists state to the browser's localStorage while ensuring React hydration
 * remains perfectly matched between the server and client initial render.
 *
 * @param key - The unique string key used to set/get the localStorage item.
 * @param initialValue - The fallback value used during SSR and initial hydration.
 * @returns A tuple containing the current stored value and a setter function.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  
  /* ------------------------------------------------------------------------
     1. INITIALIZATION (SSR SAFE)
     Always initialize with the static initialValue. If we read localStorage 
     synchronously here, the client HTML would differ from the server HTML 
     (which lacks window.localStorage), causing a fatal Hydration Mismatch.
     ------------------------------------------------------------------------ */
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  /* ------------------------------------------------------------------------
     2. CLIENT-SIDE HYDRATION
     Once the component has safely mounted on the client, fetch the true
     saved value from localStorage and update the state.
     ------------------------------------------------------------------------ */
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  /* ------------------------------------------------------------------------
     3. SETTER MUTATION & LOCALSTORAGE SYNC
     Updates both the React state and the browser storage simultaneously.
     Supports both direct values and functional state updaters (prev => next).
     ------------------------------------------------------------------------ */
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((current) => {
          const valueToStore = value instanceof Function ? value(current) : value;
          
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  /* ------------------------------------------------------------------------
     4. CROSS-TAB SYNCHRONIZATION
     Listens for the browser's native 'storage' event. If the user changes 
     a setting in Tab A, Tab B will automatically intercept the event and 
     update its own React state in real-time.
     ------------------------------------------------------------------------ */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

export const useLocalStorage2 = useLocalStorage;