'use client';

import React from 'react';
import { 
  AnimationsOnIcon, 
  AnimationsOffIcon, 
  AudioOnIcon, 
  AudioOffIcon 
} from '@/components/icons/MediaIcons';
import { 
  DockLeftPanelIcon,
  DockBottomPanelIcon,
  DockRightPanelIcon, 
  MoonIcon, 
  SunIcon 
} from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import OklchSeedControls from '@/components/OklchSeedControls';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

/**
 * Props for the NavigationFooter status bar.
 * @property activeCollectionName - Name of the currently selected collection (or undefined)
 * @property totalItemsCount - Total inventory count of records loaded across all collections
 * @property isLeftPanelPinned - Boolean state tracking whether left primary sidebar is pinned
 * @property onToggleLeftPanel - Handler toggling expansion/collapse of left pinned sidebar
 * @property isBottomPanelOpen - Boolean state tracking whether bottom diagnostics drawer is open
 * @property onToggleBottomPanel - Handler toggling expansion/collapse of bottom diagnostics drawer
 * @property isRightPanelOpen - Boolean state tracking whether the right utility panel is expanded
 * @property onToggleRightPanel - Handler toggling expansion/collapse of the right utility drawer
 */
interface NavigationFooterProps {
  activeCollectionName?: string;
  totalItemsCount?: number;
  isLeftPanelPinned?: boolean;
  onToggleLeftPanel?: () => void;
  isBottomPanelOpen?: boolean;
  onToggleBottomPanel?: () => void;
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
  isLeftPanelPinned = false,
  onToggleLeftPanel,
  isBottomPanelOpen = false,
  onToggleBottomPanel,
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

  const isLightTheme = theme === 'theme-oklch-light';

  return (
    <footer className="navigation-footer h-14 flex items-center justify-between px-4 text-xs select-none shrink-0 z-[60]">
      
      {/* --------------------------------------------------------------------
          2.2 LEFT: SYSTEM READINESS & ACTIVE CONTEXT
          Displays live database status dot alongside the currently active collection.
          -------------------------------------------------------------------- */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="nav-footer-status-dot animate-pulse" />
          <span className="text-[11px] font-mono ui-muted">
            Status: <span className="ui-primary font-medium">Ready</span>
          </span>
        </div>

        {activeCollectionName && (
          <>
            <span className="ui-muted">|</span>
            <span className="text-[11px] ui-muted truncate max-w-[200px] sm:max-w-xs">
              Active: <span className="ui-accent font-medium">{activeCollectionName}</span>
            </span>
          </>
        )}
      </div>

      {/* --------------------------------------------------------------------
          2.3 CENTER: LIVE THEME COLORS
          -------------------------------------------------------------------- */}
      <div className="relative z-10">
        <OklchSeedControls />
      </div>

      {/* --------------------------------------------------------------------
          2.4 RIGHT: INVENTORY METRICS & SYSTEM TOGGLES
          Item counters and interactive buttons for animations, sound FX,
          right side panel docking, and theme switching.
          -------------------------------------------------------------------- */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Total Aggregated Inventory Count */}
        <span className="text-[11px] font-mono ui-muted">
          Items: <span className="ui-primary font-semibold">{totalItemsCount}</span>
        </span>

        <span className="ui-muted">|</span>

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
          Panel Dock Controls (VS Code Style):
          Controls visibility for Left (Primary Sidebar), Bottom (Panel), and Right (Secondary Sidebar).
        */}
        <div className="flex items-center gap-1.5">
          {/* Toggle Left Sidebar (Pinned View) */}
          <button
            type="button"
            onClick={onToggleLeftPanel}
            title={isLeftPanelPinned ? 'Hide Primary Side Bar' : 'Show Primary Side Bar'}
            aria-label={isLeftPanelPinned ? 'Hide Primary Side Bar' : 'Show Primary Side Bar'}
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
              isLeftPanelPinned ? 'nav-footer-dock-btn-open' : 'nav-footer-dock-btn-closed'
            }`}
          >
            <DockLeftPanelIcon className="w-4 h-4" isOpen={isLeftPanelPinned} />
          </button>

          {/* Toggle Bottom Panel */}
          <button
            type="button"
            onClick={onToggleBottomPanel}
            title={isBottomPanelOpen ? 'Hide Panel' : 'Show Panel'}
            aria-label={isBottomPanelOpen ? 'Hide Panel' : 'Show Panel'}
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
              isBottomPanelOpen ? 'nav-footer-dock-btn-open' : 'nav-footer-dock-btn-closed'
            }`}
          >
            <DockBottomPanelIcon className="w-4 h-4" isOpen={isBottomPanelOpen} />
          </button>

          {/* Toggle Right Side Panel */}
          <button
            type="button"
            onClick={onToggleRightPanel}
            title={isRightPanelOpen ? 'Hide Secondary Side Bar' : 'Show Secondary Side Bar'}
            aria-label={isRightPanelOpen ? 'Hide Secondary Side Bar' : 'Show Secondary Side Bar'}
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
              isRightPanelOpen ? 'nav-footer-dock-btn-open' : 'nav-footer-dock-btn-closed'
            }`}
          >
            <DockRightPanelIcon className="w-4 h-4" isOpen={isRightPanelOpen} />
          </button>
        </div>

        {/* 
          Application Theme Toggle:
          Smooth 500ms sliding transition between Dark Mode (Moon) and Light Mode (Sun).
        */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
          className={[
            'nav-footer-icon-btn group relative',
            'ui-muted ui-hover-primary',
          ].join(' ')}
          title={
            isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'
          }
        >
          {/* Moon Icon (Dark Mode Active) */}
          <MoonIcon
            className={[
              'nav-theme-icon nav-theme-icon-moon nav-footer-icon-moon',
              'ui-hover-primary',
              !isLightTheme
                ? 'nav-theme-icon-active'
                : 'nav-theme-icon-hidden-left',
            ].join(' ')}
          />

          {/* Sun Icon (Light Mode Active) */}
          <SunIcon
            className={[
              'nav-theme-icon nav-theme-icon-sun nav-footer-icon-sun',
              'ui-hover-primary',
              isLightTheme
                ? 'nav-theme-icon-active'
                : 'nav-theme-icon-hidden-right',
            ].join(' ')}
          />
        </button>
      </div>
    </footer>
  );
}
