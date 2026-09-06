'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemePreset } from '@/types/theme';

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

  // disable that CSS transitions stay disabled until the initial localStorage values are restored
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
  const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabledState] = useState<boolean>(true);
  const [theme, setThemeState] = useState<ThemePreset>('theme-default-dark');
  const [isPinned, setIsPinnedState] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Hydrate preferences from localStorage on initial client mount
  useEffect(() => {
    try {
      const savedAnimations = localStorage.getItem(STORAGE_KEYS.ANIMATIONS);
      if (savedAnimations !== null) {
        setAnimationsEnabledState(savedAnimations === 'true');
      }

      const savedAudio = localStorage.getItem(STORAGE_KEYS.AUDIO);
      if (savedAudio !== null) {
        setIsAudioEnabledState(savedAudio === 'true');
      }

      const savedPinned = localStorage.getItem(STORAGE_KEYS.PINNED);
      if (savedPinned !== null) {
        setIsPinnedState(savedPinned === 'true');
      }

      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as ThemePreset | null;
      if (savedTheme === 'theme-default-dark' || savedTheme === 'theme-default-light') {
        setThemeState(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        document.documentElement.setAttribute('data-theme', 'theme-default-dark');
      }
    } catch {
      // Graceful fallback if localStorage is disabled or inaccessible
    } finally {
      // Mark hydration complete on the next tick
      requestAnimationFrame(() => setIsHydrated(true));
    }
  }, []);

  const setAnimationsEnabled = (val: boolean) => {
    setAnimationsEnabledState(val);
    localStorage.setItem(STORAGE_KEYS.ANIMATIONS, String(val));
  };

  const toggleAnimations = () => {
    setAnimationsEnabled(!animationsEnabled);
  };

  const setIsAudioEnabled = (val: boolean) => {
    setIsAudioEnabledState(val);
    localStorage.setItem(STORAGE_KEYS.AUDIO, String(val));
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const setTheme = (nextTheme: ThemePreset) => {
    setThemeState(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
  };

  const toggleTheme = () => {
    const nextTheme: ThemePreset =
      theme === 'theme-default-dark' ? 'theme-default-light' : 'theme-default-dark';
    setTheme(nextTheme);
  };

  const setIsPinned = (val: boolean) => {
    setIsPinnedState(val);
    localStorage.setItem(STORAGE_KEYS.PINNED, String(val));
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
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