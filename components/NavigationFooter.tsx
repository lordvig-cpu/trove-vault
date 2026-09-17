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
 * @property isPrimaryPinned - Boolean state tracking whether primary sidebar is pinned
 * @property onTogglePrimary - Handler toggling expansion/collapse of primary sidebar
 * @property isBottomOpen - Boolean state tracking whether bottom diagnostics drawer is open
 * @property onToggleBottom - Handler toggling expansion/collapse of bottom diagnostics drawer
 * @property isSecondaryOpen - Boolean state tracking whether secondary utility panel is open
 * @property onToggleSecondary - Handler toggling expansion/collapse of secondary utility drawer
 */
interface NavigationFooterProps {
  activeCollectionName?: string;
  totalItemsCount?: number;
  isPrimaryOpen?: boolean;
  isPrimaryPinned?: boolean;
  onTogglePrimary?: () => void;
  isBottomOpen?: boolean;
  onToggleBottom?: () => void;
  isSecondaryOpen?: boolean;
  onToggleSecondary?: () => void;
  
  // Backward-compatibility aliases
  isLeftPanelPinned?: boolean;
  onToggleLeftPanel?: () => void;
  isBottomPanelOpen?: boolean;
  onToggleBottomPanel?: () => void;
  isRightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
}

/* ==========================================================================
   2. MAIN COMPONENT: NavigationFooter
   Fixed-height (h-14) bottom status bar anchored at z-[60].
   Coordinates data metrics, operational readiness, sound/animation preferences,
   panel docking toggles, and global color theme switching.
   ========================================================================== */

export default function NavigationFooter({
  activeCollectionName,
  totalItemsCount = 0,
  isPrimaryOpen,
  isPrimaryPinned,
  onTogglePrimary,
  isBottomOpen,
  onToggleBottom,
  isSecondaryOpen,
  onToggleSecondary,
  isLeftPanelPinned,
  onToggleLeftPanel,
  isBottomPanelOpen,
  onToggleBottomPanel,
  isRightPanelOpen,
  onToggleRightPanel,
}: NavigationFooterProps) {
  /* ------------------------------------------------------------------------
     2.1 GLOBAL PREFERENCES CONTEXT
     ------------------------------------------------------------------------ */
  const {
    animationsEnabled,
    toggleAnimations,
    isAudioEnabled,
    toggleAudio,
    theme,
    toggleTheme,
    primaryPosition,
  } = useUIPreferences();

  const isLightTheme = theme === 'theme-oklch-light';

  const effectivePrimaryOpen = isPrimaryOpen ?? isPrimaryPinned ?? isLeftPanelPinned ?? false;
  const effectiveTogglePrimary = onTogglePrimary ?? onToggleLeftPanel;
  const effectiveBottomOpen = isBottomOpen ?? isBottomPanelOpen ?? false;
  const effectiveToggleBottom = onToggleBottom ?? onToggleBottomPanel;
  const effectiveSecondaryOpen = isSecondaryOpen ?? isRightPanelOpen ?? false;
  const effectiveToggleSecondary = onToggleSecondary ?? onToggleRightPanel;

  // Left vs Right icons match physical panel positions (Left is Primary, Right is Secondary)
  const isLeftDockOpen = effectivePrimaryOpen;
  const onToggleLeftDock = effectiveTogglePrimary;

  const isRightDockOpen = effectiveSecondaryOpen;
  const onToggleRightDock = effectiveToggleSecondary;

  return (
    <footer className="navigation-footer h-14 flex items-center justify-between px-4 text-xs select-none shrink-0 z-[60]">
      {/* --------------------------------------------------------------------
          2.2 LEFT: SYSTEM READINESS & ACTIVE CONTEXT
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
          -------------------------------------------------------------------- */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Total Aggregated Inventory Count */}
        <span className="text-[11px] font-mono ui-muted">
          Items: <span className="ui-primary font-semibold">{totalItemsCount}</span>
        </span>

        <span className="ui-muted">|</span>

        {/* Animated UI Transitions Toggle Button */}
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

        {/* Animated Ambient Audio & Sound FX Toggle */}
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

        {/* Panel Dock Controls (VS Code Style) */}
        <div className="flex items-center gap-1.5">
          {/* Toggle Left Sidebar */}
          <button
            type="button"
            onClick={onToggleLeftDock}
            title={isLeftDockOpen ? 'Hide Primary Side Bar' : 'Show Primary Side Bar'}
            aria-label="Toggle Left Panel"
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
              isLeftDockOpen ? 'nav-footer-dock-btn-open' : 'nav-footer-dock-btn-closed'
            }`}
          >
            <DockLeftPanelIcon className="w-4 h-4" isOpen={isLeftDockOpen} />
          </button>

          {/* Toggle Bottom Panel */}
          <button
            type="button"
            onClick={effectiveToggleBottom}
            title={effectiveBottomOpen ? 'Hide Bottom Panel' : 'Show Bottom Panel'}
            aria-label={effectiveBottomOpen ? 'Hide Bottom Panel' : 'Show Bottom Panel'}
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
              effectiveBottomOpen ? 'nav-footer-dock-btn-open' : 'nav-footer-dock-btn-closed'
            }`}
          >
            <DockBottomPanelIcon className="w-4 h-4" isOpen={effectiveBottomOpen} />
          </button>

          {/* Toggle Right Sidebar */}
          <button
            type="button"
            onClick={onToggleRightDock}
            title={isRightDockOpen ? 'Hide Secondary Side Bar' : 'Show Secondary Side Bar'}
            aria-label="Toggle Right Panel"
            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
              isRightDockOpen ? 'nav-footer-dock-btn-open' : 'nav-footer-dock-btn-closed'
            }`}
          >
            <DockRightPanelIcon className="w-4 h-4" isOpen={isRightDockOpen} />
          </button>
        </div>

        {/* Application Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
          className={[
            'nav-footer-icon-btn group relative',
            'ui-muted ui-hover-primary',
          ].join(' ')}
          title={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <MoonIcon
            className={[
              'nav-theme-icon nav-theme-icon-moon nav-footer-icon-moon',
              'ui-hover-primary',
              !isLightTheme ? 'nav-theme-icon-active' : 'nav-theme-icon-hidden-left',
            ].join(' ')}
          />
          <SunIcon
            className={[
              'nav-theme-icon nav-theme-icon-sun nav-footer-icon-sun',
              'ui-hover-primary',
              isLightTheme ? 'nav-theme-icon-active' : 'nav-theme-icon-hidden-right',
            ].join(' ')}
          />
        </button>
      </div>
    </footer>
  );
}
