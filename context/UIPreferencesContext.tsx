'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemePreset } from '@/types/theme';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface UIPreferencesContextType {
  // Animations
  animationsEnabled: boolean;
  toggleAnimations: () => void;
  setAnimationsEnabled: (val: boolean) => void;

  // Audio / Sound FX
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  setIsAudioEnabled: (val: boolean) => void;

  // Theme
  theme: ThemePreset;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreset) => void;

  // Left Panel Pinned State
  isPinned: boolean;
  togglePin: () => void;
  setIsPinned: (val: boolean) => void;

  // Flag indicating client mount is complete
  isHydrated: boolean;
}

const UIPreferencesContext = createContext<UIPreferencesContextType | null>(null);

const STORAGE_KEYS = {
  ANIMATIONS: 'uc_animations_enabled',
  AUDIO: 'uc_audio_enabled',
  THEME: 'uc_theme_preset',
  PINNED: 'uc_leftsidepanel_pinned',
};

export function UIPreferencesProvider({ children }: { children: React.ReactNode }) {
  // Use our SSR-safe useLocalStorage hook for persistent preferences
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

  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Apply data-theme to HTML tag whenever theme changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Mark hydration complete on initial client tick to prevent CSS animation flashes
  useEffect(() => {
    requestAnimationFrame(() => setIsHydrated(true));
  }, []);

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

export function useUIPreferences() {
  const context = useContext(UIPreferencesContext);
  if (!context) {
    throw new Error('useUIPreferences must be used within a UIPreferencesProvider');
  }
  return context;
}