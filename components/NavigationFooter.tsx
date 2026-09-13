'use client';

import React from 'react';
import { 
  AnimationsOnIcon, 
  AnimationsOffIcon, 
  AudioOnIcon, 
  AudioOffIcon 
} from '@/components/icons/MediaIcons';
import { 
  DockPanelIcon, 
  MoonIcon, 
  SunIcon 
} from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

/**
 * Props for the NavigationFooter status bar.
 * @property activeCollectionName - Name of the currently selected collection (or undefined)
 * @property totalItemsCount - Total inventory count of records loaded across all collections
 * @property isRightPanelOpen - Boolean state tracking whether the right utility panel is expanded
 * @property onToggleRightPanel - Handler toggling expansion/collapse of the right utility drawer
 */
interface NavigationFooterProps {
  activeCollectionName?: string;
  totalItemsCount?: number;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

/* ==========================================================================
   2. MAIN COMPONENT: NavigationFooter
   Fixed-height (h-14) bottom status bar anchored at z-[60].
   Coordinates data metrics, operational readiness, sound/animation preferences,
   docking toggles, and global color theme switching.
   ========================================================================== */

export default function NavigationFooter({
  activeCollectionName,
  totalItemsCount = 0,
  isRightPanelOpen,
  onToggleRightPanel,
}: NavigationFooterProps) {
  /* ------------------------------------------------------------------------
     2.1 GLOBAL PREFERENCES CONTEXT
     Consumes persisted UI toggles and themes directly from UIPreferencesContext.
     ------------------------------------------------------------------------ */
  const {
    animationsEnabled,
    toggleAnimations,
    isAudioEnabled,
    toggleAudio,
    theme,
    toggleTheme,
  } = useUIPreferences();

  return (
    <footer className="navigation-footer h-14 flex items-center justify-between px-4 text-xs select-none shrink-0 z-[60]">
      
      {/* --------------------------------------------------------------------
          2.2 LEFT: SYSTEM READINESS & ACTIVE CONTEXT
          Displays live database status dot alongside the currently active collection.
          -------------------------------------------------------------------- */}
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

      {/* --------------------------------------------------------------------
          2.3 CENTER: UTILITY / WORKSPACE BREADCRUMB SLOT
          Reserved central utility region for quick shortcuts or breadcrumb tracks.
          -------------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 text-xs text-content-muted cursor-pointer select-none">
        <label className="flex items-center gap-1.5 cursor-pointer text-content-muted hover:text-content-primary transition-colors">
          MIDDLE CONTENT
        </label>
      </div>

      {/* --------------------------------------------------------------------
          2.4 RIGHT: INVENTORY METRICS & SYSTEM TOGGLES
          Item counters and interactive buttons for animations, sound FX,
          right side panel docking, and theme switching.
          -------------------------------------------------------------------- */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Total Aggregated Inventory Count */}
        <span className="text-[11px] font-mono text-content-muted">
          Items: <span className="text-content-primary font-semibold">{totalItemsCount}</span>
        </span>

        <span className="text-border-subtle">|</span>

        {/* 
          Animated UI Transitions Toggle Button:
          Dual-icon sliding track morphing between AnimationsOn and AnimationsOff.
        */}
        <button
          type="button"
          onClick={toggleAnimations}
          className="nav-footer-icon-btn group relative"
          title={animationsEnabled ? 'Disable UI Animations' : 'Enable UI Animations'}
        >
          <AnimationsOnIcon
            className={[
              'nav-toggle-icon',
              animationsEnabled 
                ? 'nav-toggle-icon-active' 
                : 'nav-toggle-icon-hidden-left',
            ].join(' ')}
          />
          <AnimationsOffIcon
            className={[
              'nav-toggle-icon',
              !animationsEnabled 
                ? 'nav-toggle-icon-active' 
                : 'nav-toggle-icon-hidden-right',
            ].join(' ')}
          />
        </button>

        {/* 
          Animated Ambient Audio & Sound FX Toggle:
          Dual-icon sliding track morphing between AudioOn and AudioOff.
        */}
        <button
          type="button"
          onClick={toggleAudio}
          className="nav-footer-icon-btn group relative"
          title={isAudioEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
        >
          <AudioOnIcon
            className={[
              'nav-toggle-icon',
              isAudioEnabled 
                ? 'nav-toggle-icon-active' 
                : 'nav-toggle-icon-hidden-left',
            ].join(' ')}
          />
          <AudioOffIcon
            className={[
              'nav-toggle-icon',
              !isAudioEnabled 
                ? 'nav-toggle-icon-active' 
                : 'nav-toggle-icon-hidden-right',
            ].join(' ')}
          />
        </button>

        <span className="text-border-subtle">|</span>

        {/* 
          Right Side Panel Drawer Toggle:
          Indicates open vs closed panel dock state using dynamic border classes.
        */}
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

        {/* 
          Application Theme Toggle:
          Smooth 500ms sliding transition between Dark Mode (Moon) and Light Mode (Sun).
        */}
        <button
          type="button"
          onClick={toggleTheme}
          className={[
            'nav-footer-icon-btn group relative',
            'text-content-muted hover:text-content-primary',
          ].join(' ')}
          title={
            theme === 'theme-default-dark'
              ? 'Switch to Sunlit Tide (Light Mode)'
              : 'Switch to Amber Tide (Dark Mode)'
          }
        >
          {/* Moon Icon (Dark Mode Active) */}
          <MoonIcon
            className={[
              'nav-theme-icon nav-theme-icon-moon nav-footer-icon-moon',
              'group-hover:text-content-primary',
              theme === 'theme-default-dark'
                ? 'nav-theme-icon-active'
                : 'nav-theme-icon-hidden-left',
            ].join(' ')}
          />

          {/* Sun Icon (Light Mode Active) */}
          <SunIcon
            className={[
              'nav-theme-icon nav-theme-icon-sun nav-footer-icon-sun',
              'group-hover:text-content-primary',
              theme === 'theme-default-light'
                ? 'nav-theme-icon-active'
                : 'nav-theme-icon-hidden-right',
            ].join(' ')}
          />
        </button>
      </div>
    </footer>
  );
}