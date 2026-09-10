'use client';

import React from 'react';
import { CollectionRecord } from '@/types/collection2';
import CollectionDropdown from '@/components/CollectionDropdown2';
import { NavigationBarTextureFilter } from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext2';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

export type SearchScope = 'current' | 'all';

/**
 * Props for NavigationHeader2.
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
   2. MAIN COMPONENT: NavigationHeader2
   Fixed top navigation bar (h-14) hosting branding, the Explorer toggle tab,
   the collection switcher, and live database status indicators.
   ========================================================================== */

export default function NavigationHeader2({
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
  const { isPinned, animationsEnabled } = useUIPreferences();
  const opacityTransition = animationsEnabled
    ? 'transition-opacity duration-700 ease-in-out'
    : 'transition-none';

  const isTabActive = isPinned || isLeftSidePanelOpen;

  return (
    <>
      {/* SVG brushed steel noise texture filter referenced by header styles */}
      <NavigationBarTextureFilter />

      <header className="navigation-header h-14 flex items-center justify-between shrink-0 relative z-[10]">
        
        {/* ------------------------------------------------------------------
            2.2 LEFT SECTION: BRANDING & PRIMARY NAVIGATION
            ------------------------------------------------------------------ */}
        <div className="flex items-center h-full">
          
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
                'text-xs font-semibold text-content-secondary hover:text-content-primary',
                'bg-surface-hover/80 hover:bg-surface-hover border border-border-subtle rounded-lg',
                'cursor-pointer transition',
              ].join(' ')}
            >
              <span>📑</span>
              <span>Templates</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            2.3 RIGHT SECTION: DATABASE STATUS & USER BADGE
            ------------------------------------------------------------------ */}
        <div className="flex items-center gap-3 pr-4">
          
          {/* Live Supabase Connection Badge */}
          <div className="nav-live-badge">
            <span className="nav-live-dot animate-pulse" />
            <span className="text-content-secondary hidden sm:inline">Supabase</span> Live
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