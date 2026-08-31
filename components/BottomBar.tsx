'use client';

import React, { useState, useEffect } from 'react';

export type ThemePreset = 'theme-default-dark' | 'theme-default-light';

interface BottomBarProps {
  activeCollectionName?: string;
  totalItemsCount?: number;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (enabled: boolean) => void;

}

export default function BottomBar({
  animationsEnabled,
  setAnimationsEnabled,
  activeCollectionName,
  totalItemsCount = 0,
  isRightPanelOpen,
  onToggleRightPanel,
  isAudioEnabled,
  setIsAudioEnabled
}: BottomBarProps) {
  const [theme, setTheme] = useState<ThemePreset>('theme-default-dark');

  // Load saved theme or fall back to default dark on initial mount
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
    <footer className="trove-bottombar h-14 flex items-center justify-between px-4 text-xs select-none shrink-0 z-40">
      
      {/* LEFT: STATUS & ACTIVE COLLECTION */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
          className="group relative p-1.5 rounded-lg border border-transparent bg-transparent hover:bg-surface-hover hover:border-border-subtle transition cursor-pointer overflow-hidden flex items-center justify-center w-7 h-7"
          title={animationsEnabled ? 'Disable UI Animations' : 'Enable UI Animations'}
        >
          {/* Active: Square Stop Sign (Animations ON - Click to Stop) */}
          <svg
            className={`w-3.5 h-3.5 text-white absolute transform transition-all duration-500 ease-out ${
              animationsEnabled
                ? 'rotate-0 opacity-100 scale-100'
                : '-rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>

          {/* Inactive: Forward Triangle Play Sign (Animations OFF - Click to Play) */}
          <svg
            className={`w-3.5 h-3.5 text-white absolute transform transition-all duration-500 ease-out ${
              !animationsEnabled
                ? 'rotate-0 opacity-100 scale-100'
                : 'rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <polygon points="6,4 20,12 6,20" />
          </svg>
        </button>

        {/* Animated Audio Toggle Button */}
        <button
          type="button"
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className="group relative p-1.5 rounded-lg border border-transparent bg-transparent hover:bg-surface-hover hover:border-border-subtle transition cursor-pointer overflow-hidden flex items-center justify-center w-7 h-7"
          title={isAudioEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
        >
          {/* Active: Speaker with Waves (Audio ON) */}
          <svg
            className={`w-3.5 h-3.5 text-white absolute transform transition-all duration-500 ease-out ${
              isAudioEnabled
                ? 'rotate-0 opacity-100 scale-100'
                : '-rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>

          {/* Inactive: Speaker Muted with Slash (Audio OFF) */}
          <svg
            className={`w-3.5 h-3.5 text-white absolute transform transition-all duration-500 ease-out ${
              !isAudioEnabled
                ? 'rotate-0 opacity-100 scale-100'
                : 'rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        </button>

        <span className="text-border-subtle">|</span>

       {/* Right Dock Panel Toggle Icon */}
        <button
          type="button"
          onClick={onToggleRightPanel}
          title={isRightPanelOpen ? 'Close Side Panel' : 'Open Side Panel'}
          className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
            isRightPanelOpen
              ? 'bg-surface-hover border-border-subtle text-content-primary'
              : 'bg-surface hover:bg-surface-hover border-border-subtle text-content-muted hover:text-content-primary'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="15" y1="3" x2="15" y2="21" />
            
            {/* Filled Solid Arrow (Reverses direction cleanly) */}
            <polygon
              points={isRightPanelOpen ? '16,9 20,12 16,15' : '19,9 15,12 19,15'}
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </button>

        {/* 500ms Animated Sun/Moon Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="group relative p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-content-muted hover:text-content-primary transition cursor-pointer overflow-hidden flex items-center justify-center w-7 h-7"
          title={theme === 'theme-default-dark' ? 'Switch to Sunlit Tide (Light Mode)' : 'Switch to Amber Tide (Dark Mode)'}
        >
          {/* Slender Crescent Moon Icon (Dark Mode Active) */}
          <svg
            className={`w-[17px] h-[17px] text-accent-secondary group-hover:text-content-primary absolute transform transition-all duration-500 ease-out ${
              theme === 'theme-default-dark'
                ? 'rotate-0 opacity-100 scale-100'
                : '-rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
            viewBox="0 0 72 72"
            fill="currentColor"
          >
            <g transform="rotate(-45 36 36)">
              <path d="M7.3634,42.4095c4.5525,6.1703,11.874,10.1726,20.1303,10.1726c13.8071,0,25-11.1929,25-25 c0-8.5226-4.2646-16.0492-10.7763-20.5621c13.0383,2.8385,22.7812,14.4426,22.7812,28.3317c0,16.0163-12.9837,29-29,29 C21.9109,64.3517,10.5097,55.0229,7.3634,42.4095z" />
            </g>
          </svg>

          {/* Sun Icon (Light Mode Active) */}
          <svg
            className={`w-3.5 h-3.5 text-amber-500 group-hover:text-content-primary absolute transform transition-all duration-500 ease-out ${
              theme === 'theme-default-light'
                ? 'rotate-0 opacity-100 scale-100'
                : 'rotate-90 opacity-0 scale-50 pointer-events-none'
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.592a.75.75 0 00-1.061 1.061l1.59 1.591z" />
          </svg>
        </button>
      </div>
    </footer>
  );
}