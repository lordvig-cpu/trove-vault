'use client';

import React, { useState, useEffect } from 'react';
import { ThemePreset } from '@/types/theme';
import { AnimationsOnIcon, AnimationsOffIcon, AudioOnIcon, AudioOffIcon } from '@/components/icons/MediaIcons';
import { DockPanelIcon, MoonIcon, SunIcon } from '@/components/icons/SystemIcons';

interface NavigationFooterProps {
  activeCollectionName?: string;
  totalItemsCount?: number;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (enabled: boolean) => void;
}

export default function NavigationFooter({
  animationsEnabled,
  setAnimationsEnabled,
  activeCollectionName,
  totalItemsCount = 0,
  isRightPanelOpen,
  onToggleRightPanel,
  isAudioEnabled,
  setIsAudioEnabled
}: NavigationFooterProps) {
  const [theme, setTheme] = useState<ThemePreset>('theme-default-dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('uc_theme_preset') as ThemePreset | null;
    if (savedTheme === 'theme-default-dark' || savedTheme === 'theme-default-light') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      setTheme('theme-default-dark');
      document.documentElement.setAttribute('data-theme', 'theme-default-dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemePreset = theme === 'theme-default-dark' ? 'theme-default-light' : 'theme-default-dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('uc_theme_preset', nextTheme);
  };

  return (
    <footer className="navigation-footer h-14 flex items-center justify-between px-4 text-xs select-none shrink-0 z-40">
      
      {/* LEFT: STATUS & ACTIVE COLLECTION */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="nav-footer-status-dot animate-pulse" />
          <span className="text-[11px] font-mono text-content-muted">
            Status: <span className="text-content-primary font-medium">Ready</span>
          </span>
        </div>

        {activeCollectionName && (
          <>
            <span className="text-border-subtle">|</span>
            <span className="text-[11px] text-content-muted truncate max-w-[200px] sm:max-w-xs">
              Active: <span className="text-accent-secondary font-medium">{activeCollectionName}</span>
            </span>
          </>
        )}
      </div>

      {/* MIDDLE */}
      <div className="flex items-center gap-1.5 text-xs text-content-muted cursor-pointer select-none">
        <label className="flex items-center gap-1.5 cursor-pointer text-content-muted hover:text-content-primary transition-colors">
          MIDDLE CONTENT
        </label>
      </div>

      {/* RIGHT: METRICS, PANEL TOGGLE, & THEME TOGGLE */}
      <div className="flex items-center gap-3 relative z-10">
        <span className="text-[11px] font-mono text-content-muted">
          Items: <span className="text-content-primary font-semibold">{totalItemsCount}</span>
        </span>

        <span className="text-border-subtle">|</span>

        {/* Animated Animations Toggle Button */}
        <button
          type="button"
          onClick={() => setAnimationsEnabled(!animationsEnabled)}
          className="nav-footer-icon-btn group"
          title={animationsEnabled ? 'Disable UI Animations' : 'Enable UI Animations'}
        >
          <AnimationsOnIcon
            className={`w-3.5 h-3.5 text-white absolute transform transition-all duration-500 ease-out ${
              animationsEnabled
                ? 'rotate-0 opacity-100 scale-100'
                : '-rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
          />
          <AnimationsOffIcon
            className={`w-3.5 h-3.5 text-white absolute transform transition-all duration-500 ease-out ${
              !animationsEnabled
                ? 'rotate-0 opacity-100 scale-100'
                : 'rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
          />
        </button>

        {/* Animated Audio Toggle Button */}
        <button
          type="button"
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className="nav-footer-icon-btn group"
          title={isAudioEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
        >
          <AudioOnIcon
            className={`w-3.5 h-3.5 text-white absolute transform transition-all duration-500 ease-out ${
              isAudioEnabled
                ? 'rotate-0 opacity-100 scale-100'
                : '-rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
          />
          <AudioOffIcon
            className={`w-3.5 h-3.5 text-white absolute transform transition-all duration-500 ease-out ${
              !isAudioEnabled
                ? 'rotate-0 opacity-100 scale-100'
                : 'rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
          />
        </button>

        <span className="text-border-subtle">|</span>

        {/* Right Dock Panel Toggle Icon */}
        <button
          type="button"
          onClick={onToggleRightPanel}
          title={isRightPanelOpen ? 'Close Side Panel' : 'Open Side Panel'}
          className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
            isRightPanelOpen ? 'nav-footer-dock-btn-open' : 'nav-footer-dock-btn-closed'
          }`}
        >
          <DockPanelIcon className="w-4 h-4" isOpen={isRightPanelOpen} />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="nav-footer-icon-btn group text-content-muted hover:text-content-primary"
          title={theme === 'theme-default-dark' ? 'Switch to Sunlit Tide (Light Mode)' : 'Switch to Amber Tide (Dark Mode)'}
        >
          <MoonIcon
            className={`w-[17px] h-[17px] nav-footer-icon-moon group-hover:text-content-primary absolute transform transition-all duration-500 ease-out ${
              theme === 'theme-default-dark'
                ? 'rotate-0 opacity-100 scale-100'
                : '-rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
          />
          <SunIcon
            className={`w-3.5 h-3.5 nav-footer-icon-sun group-hover:text-content-primary absolute transform transition-all duration-500 ease-out ${
              theme === 'theme-default-light'
                ? 'rotate-0 opacity-100 scale-100'
                : 'rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
          />
        </button>
      </div>
    </footer>
  );
}