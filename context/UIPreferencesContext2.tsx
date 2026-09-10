'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemePreset } from '@/types/theme2';
import { useLocalStorage } from '@/hooks/useLocalStorage2';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

/**
 * Shape of the global UI preferences context.
 * Provides application-wide state and toggle controllers to eliminate prop drilling.
 */
interface UIPreferencesContextType {
  // Animations: Controls motion accessibility and transition suppression
  animationsEnabled: boolean;
  toggleAnimations: () => void;
  setAnimationsEnabled: (val: boolean) => void;

  // Audio: Controls sound effects and ambient media audio
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  setIsAudioEnabled: (val: boolean) => void;

  // Theme: Manages active color tokens and HTML root data-theme attribute
  theme: ThemePreset;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreset) => void;

  // Left Side Panel: Tracks docked sidebar vs unpinned flyout modal state
  isPinned: boolean;
  togglePin: () => void;
  setIsPinned: (val: boolean) => void;

  // Hydration Flag: Suppresses startup CSS animation flashes before storage sync
  isHydrated: boolean;
}

/* ==========================================================================
   2. CONTEXT & STORAGE KEYS
   ========================================================================== */

const UIPreferencesContext = createContext<UIPreferencesContextType | null>(null);

/**
 * Storage keys used for cross-tab synchronization and SSR-safe persistence.
 */
const STORAGE_KEYS = {
  ANIMATIONS: 'uc_animations_enabled',
  AUDIO: 'uc_audio_enabled',
  THEME: 'uc_theme_preset',
  PINNED: 'uc_leftsidepanel_pinned',
};

/* ==========================================================================
   3. PROVIDER COMPONENT: UIPreferencesProvider
   Mounts at the root layout to provide reactive preferences across the app.
   ========================================================================== */

export function UIPreferencesProvider({ children }: { children: React.ReactNode }) {
  /* ------------------------------------------------------------------------
     3.1 PERSISTED PREFERENCES (useLocalStorage Hook)
     SSR-safe hooks that synchronize state with localStorage and window events.
     ------------------------------------------------------------------------ */
  const [animationsEnabled, setAnimationsEnabled] = useLocalStorage<boolean>(
    STORAGE_KEYS.ANIMATIONS,
    true
  );

  const [isAudioEnabled, setIsAudioEnabled] = useLocalStorage<boolean>(
    STORAGE_KEYS.AUDIO,
    true
  );

  const [theme, setThemeState] = useLocalStorage<ThemePreset>(
    STORAGE_KEYS.THEME,
    'theme-default-dark'
  );

  const [isPinned, setIsPinned] = useLocalStorage<boolean>(
    STORAGE_KEYS.PINNED,
    false
  );

  /* ------------------------------------------------------------------------
     3.2 HYDRATION SAFETY
     Prevents layout shift or animation glitches while client state initializes.
     ------------------------------------------------------------------------ */
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Synchronize data-theme attribute on the root <html> tag for CSS token scoping
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Mark hydration complete on the next paint tick to allow clean initial renders
  useEffect(() => {
    requestAnimationFrame(() => setIsHydrated(true));
  }, []);

  /* ------------------------------------------------------------------------
     3.3 ACTION HANDLERS & TOGGLES
     ------------------------------------------------------------------------ */
  const toggleAnimations = () => {
    setAnimationsEnabled((prev) => !prev);
  };

  const toggleAudio = () => {
    setIsAudioEnabled((prev) => !prev);
  };

  const setTheme = (nextTheme: ThemePreset) => {
    setThemeState(nextTheme);
  };

  const toggleTheme = () => {
    const nextTheme: ThemePreset =
      theme === 'theme-default-dark' ? 'theme-default-light' : 'theme-default-dark';
    setTheme(nextTheme);
  };

  const togglePin = () => {
    setIsPinned((prev) => !prev);
  };

  /* ------------------------------------------------------------------------
     3.4 CONTEXT VALUE EXPORT
     ------------------------------------------------------------------------ */
  return (
    <UIPreferencesContext.Provider
      value={{
        isHydrated,
        animationsEnabled,
        toggleAnimations,
        setAnimationsEnabled,
        isAudioEnabled,
        toggleAudio,
        setIsAudioEnabled,
        theme,
        toggleTheme,
        setTheme,
        isPinned,
        togglePin,
        setIsPinned,
      }}
    >
      {children}
    </UIPreferencesContext.Provider>
  );
}

/* ==========================================================================
   4. CONSUMER HOOK: useUIPreferences
   Quick-access hook for consuming preferences in any component tree branch.
   ========================================================================== */

export function useUIPreferences() {
  const context = useContext(UIPreferencesContext);
  if (!context) {
    throw new Error('useUIPreferences must be used within a UIPreferencesProvider');
  }
  return context;
}