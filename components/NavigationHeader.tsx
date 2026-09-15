'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CollectionRecord } from '@/types/collection';
import CollectionDropdown from '@/components/CollectionDropdown';
import { NavigationBarTextureFilter } from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

export type SearchScope = 'current' | 'all';

/**
 * Props for NavigationHeader.
 * @property activeCollectionName - Name of the collection currently open in the workspace
 * @property collections - Full list of collections for the dropdown selector
 * @property activeCollectionId - ID of current collection (or null if none selected)
 * @property onSelectCollection - Callback when switching active collection
 * @property onCollectionsUpdated - Trigger to refetch collections after mutations
 * @property isDropdownOpen - Controlled open state of the collection switcher dropdown
 * @property setIsDropdownOpen - State setter for the collection switcher dropdown
 * @property onRequestDeleteCollection - Trigger to launch delete collection confirmation modal
 * @property onOpenFieldManager - Optional callback to launch custom field settings
 * @property onOpenTemplateManager - Callback launching the schema template manager modal
 * @property isLeftSidePanelOpen - Whether the floating flyout panel is actively revealed
 * @property onToggleLeftSidePanel - Callback toggling the flyout panel visibility
 * @property onAddNewItem - Optional handler to launch create item dialog
 * @property unpinnedExplorerPanel - Pre-rendered LeftSidePanel (flyout variant) anchored under the tab
 */
interface NavigationHeaderProps {
  activeCollectionName: string;
  collections: CollectionRecord[];
  activeCollectionId: number | null;
  onSelectCollection: (id: number) => void;
  onCollectionsUpdated: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  onRequestDeleteCollection: (collection: CollectionRecord) => void;
  onOpenFieldManager?: () => void;
  onOpenTemplateManager: () => void;
  isLeftSidePanelOpen: boolean;
  onToggleLeftSidePanel: () => void;
  onAddNewItem?: () => void;
  unpinnedExplorerPanel?: React.ReactNode;
}

/* ==========================================================================
   2. MAIN COMPONENT: NavigationHeader
   Fixed top navigation bar (h-14) hosting branding, the Explorer toggle tab,
   the collection switcher, and live database status indicators.
   ========================================================================== */

export default function NavigationHeader({
  activeCollectionName,
  collections,
  activeCollectionId,
  onSelectCollection,
  onCollectionsUpdated,
  isDropdownOpen,
  setIsDropdownOpen,
  onRequestDeleteCollection,
  onOpenTemplateManager,
  isLeftSidePanelOpen,
  onToggleLeftSidePanel,
  unpinnedExplorerPanel,
}: NavigationHeaderProps) {
  /* ------------------------------------------------------------------------
     2.1 CONTEXT & ACTIVE TAB EVALUATION
     Reads layout preferences to determine whether the Explorer tab displays
     in its active highlighted state (docked/pinned or unpinned flyout open).
     ------------------------------------------------------------------------ */
  const { isPinned, animationsEnabled, theme, setTheme } = useUIPreferences();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    }
    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isThemeMenuOpen]);

  const isTabActive = isPinned || isLeftSidePanelOpen;


  return (
    <>
      {/* SVG brushed steel noise texture filter referenced by header styles */}
      <NavigationBarTextureFilter />

      <header className="navigation-header h-14 flex items-center justify-between shrink-0 relative z-[80]">
        
        {/* ------------------------------------------------------------------
            2.2 LEFT SECTION: BRANDING & PRIMARY NAVIGATION
            ------------------------------------------------------------------ */}
        <div className="flex items-center h-full relative z-10">
          
          {/* Brand & Explorer Tab Cluster (Fixed w-76 aligns with docked sidebar seam) */}
          <div className="flex items-center justify-between h-full w-76 shrink-0 relative">

            {/* Brand Logo Anchor */}
            <div className="flex items-center gap-2 pl-4 relative z-20">
              <img
                src="/images/nav_bar_website_logo.png"
                alt="TroveVault"
                className="h-8 w-auto object-contain select-none"
              />
            </div>

            {/* Explorer Mode Toggle Tab & Flyout Anchor */}
            <div className="relative z-30">
              <button
                type="button"
                onClick={() => {
                  if (!isPinned) {
                    onToggleLeftSidePanel();
                  }
                }}
                className={[
                  'relative w-[90px] py-1.5 flex items-center justify-center group',
                  'font-sans font-black tracking-wide text-sm',
                  'transition-all ease-out',
                  animationsEnabled ? 'duration-500' : 'duration-0',
                  isPinned ? 'cursor-default' : 'cursor-pointer',
                  isTabActive ? 'nav-tab-active' : 'nav-tab-inactive',
                ].join(' ')}
              >
                <span className="relative inline-block">
                  Explorer
                  {/* Underline Indicator */}
                  <div
                    className={[
                      'nav-tab-indicator transition-opacity ease-out',
                      animationsEnabled ? 'duration-500' : 'duration-0',
                      isTabActive ? 'nav-tab-indicator-active' : 'nav-tab-indicator-inactive',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                </span>

                {/* Seamless Tab Extension (Blends tab bottom directly into the panel below) */}
                <div
                  className={[
                    'nav-tab-extension transition-opacity ease-out',
                    animationsEnabled ? 'duration-500' : 'duration-0',
                    isTabActive ? 'nav-tab-extension-active' : 'nav-tab-extension-inactive',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </button>

              {/* Unpinned Floating Flyout Mount Slot */}
              {unpinnedExplorerPanel}
            </div>
          </div>

          {/* Collection Selection & Schema Template Actions */}
          <div className="flex items-center gap-3 px-4 h-full">
            <CollectionDropdown
              collections={collections}
              activeCollectionId={activeCollectionId}
              onSelectCollection={onSelectCollection}
              onCollectionsUpdated={onCollectionsUpdated}
              isOpen={isDropdownOpen}
              setIsOpen={setIsDropdownOpen}
              onRequestDelete={onRequestDeleteCollection}
            />

            <button
              type="button"
              onClick={onOpenTemplateManager}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5',
                'text-xs font-semibold ui-secondary ui-hover-primary',
                'ui-surface-hover ui-border-subtle border rounded-lg',
                'cursor-pointer transition',
              ].join(' ')}
            >
              <span>📑</span>
              <span>Templates</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            2.3 RIGHT SECTION: DATABASE STATUS, THEME SELECTOR & USER BADGE
            ------------------------------------------------------------------ */}
        <div className="flex items-center gap-3 pr-4 relative z-10">
          
          {/* Quick Theme Selector Pill (Concept 3 • Premium Contrast) */}
          <div className="relative" ref={themeMenuRef}>
            <div className={`flex items-center rounded-full overflow-hidden border transition-all ${
              theme === 'theme-premium-contrast'
                ? 'border-sky-400/80 bg-sky-950/60 shadow-[0_0_16px_rgba(14,165,233,0.4)]'
                : 'border-slate-700/60 bg-slate-900/60 hover:border-slate-500'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setTheme(
                    theme === 'theme-premium-contrast'
                      ? 'theme-default-dark'
                      : 'theme-premium-contrast'
                  );
                }}
                className={[
                  'flex items-center gap-2 px-3 py-1 text-xs font-semibold transition cursor-pointer',
                  theme === 'theme-premium-contrast'
                    ? 'text-sky-100 bg-sky-500/20'
                    : 'text-slate-300 hover:text-white',
                ].join(' ')}
                title="Click to toggle Concept 3: Premium Contrast"
              >
                <span
                  className={`w-2 h-2 rounded-full transition-all ${
                    theme === 'theme-premium-contrast'
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-slate-500'
                  }`}
                />
                <span>Concept 3 • Premium Contrast</span>
              </button>

              <button
                type="button"
                onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                className={`px-2 py-1 text-xs border-l transition cursor-pointer ${
                  theme === 'theme-premium-contrast'
                    ? 'border-sky-500/40 text-sky-300 hover:text-white hover:bg-sky-500/20'
                    : 'border-slate-700/60 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Select Theme Preset"
              >
                ▾
              </button>
            </div>

            {/* Theme Selection Dropdown Menu */}
            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-[#030d22] border border-sky-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(0,140,255,0.25)] p-1.5 z-[100] backdrop-blur-md">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-400/80">
                  Theme Presets
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('theme-premium-contrast');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between transition cursor-pointer ${
                    theme === 'theme-premium-contrast'
                      ? 'bg-sky-500/25 text-sky-200 font-semibold border border-sky-400/50'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                    <span>Concept 3 • Premium Contrast</span>
                  </span>
                  {theme === 'theme-premium-contrast' && <span className="text-sky-400 font-bold">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('theme-default-dark');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between transition cursor-pointer ${
                    theme === 'theme-default-dark'
                      ? 'bg-slate-700/50 text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span>Default Dark (Moody)</span>
                  </span>
                  {theme === 'theme-default-dark' && <span className="text-white font-bold">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('theme-default-light');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between transition cursor-pointer ${
                    theme === 'theme-default-light'
                      ? 'bg-amber-500/20 text-amber-200 font-semibold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-300" />
                    <span>Default Light (Daylight)</span>
                  </span>
                  {theme === 'theme-default-light' && <span className="text-amber-400 font-bold">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Live Supabase Connection Badge */}
          <div className="nav-live-badge">
            <span className="nav-live-dot animate-pulse" />
            <span className="ui-secondary hidden sm:inline">Supabase</span> Live
          </div>

          {/* Account Profile Trigger */}
          <div
            className="nav-profile-badge"
            title="User Profile / Account"
          >
            👤
          </div>
        </div>
      </header>
    </>
  );
}