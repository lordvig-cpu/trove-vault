'use client';

import React from 'react';
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
 * @property isPrimarySidePanelOpen - Whether the floating flyout panel is actively revealed
 * @property onTogglePrimarySidePanel - Callback toggling the flyout panel visibility
 * @property unpinnedPrimaryPanel - Pre-rendered PrimarySidePanel (flyout variant) anchored under the tab
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
  isPrimarySidePanelOpen?: boolean;
  onTogglePrimarySidePanel?: () => void;
  unpinnedPrimaryPanel?: React.ReactNode;
  onAddNewItem?: () => void;
  onStartGrabbedContentDrag?: (e: React.PointerEvent) => void;
  onStartExplorerDrag?: (e: React.PointerEvent) => void;
  explorerDockedSide?: 'left' | 'right' | null;

  // Backward-compatibility aliases
  isLeftSidePanelOpen?: boolean;
  onToggleLeftSidePanel?: () => void;
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
  isPrimarySidePanelOpen,
  onTogglePrimarySidePanel,
  unpinnedPrimaryPanel,
  onStartGrabbedContentDrag,
  onStartExplorerDrag,
  explorerDockedSide = null,
  isLeftSidePanelOpen,
  onToggleLeftSidePanel,
  unpinnedExplorerPanel,
}: NavigationHeaderProps) {
  /* ------------------------------------------------------------------------
     2.1 CONTEXT & ACTIVE TAB EVALUATION
     ------------------------------------------------------------------------ */
  const { animationsEnabled } = useUIPreferences();

  const effectiveIsOpen = isPrimarySidePanelOpen ?? isLeftSidePanelOpen ?? false;
  const effectiveToggle = onTogglePrimarySidePanel ?? onToggleLeftSidePanel ?? (() => {});
  const effectiveUnpinnedPanel = unpinnedPrimaryPanel ?? unpinnedExplorerPanel;

  const isExplorerDocked = explorerDockedSide !== null;
  const isTabActive = isExplorerDocked || effectiveIsOpen;
  const explorerTabTitle = isExplorerDocked
    ? `Explorer is already docked in the ${explorerDockedSide === 'left' ? 'primary (left)' : 'secondary (right)'} panel`
    : 'Open Explorer or drag to dock in a sidebar';

  return (
    <>
      {/* SVG brushed steel noise texture filter referenced by header styles */}
      <NavigationBarTextureFilter />

      <header className="navigation-header h-14 flex items-center justify-between shrink-0 relative z-[80]">
        <div className="navigation-header-inset-shadow" aria-hidden="true" />
        {/* ------------------------------------------------------------------
            2.2 LEFT SECTION: BRANDING & PRIMARY NAVIGATION
            ------------------------------------------------------------------ */}
        <div className="flex items-center h-full relative z-10">
          {/* Brand & Explorer Tab Cluster */}
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
            <div className="relative z-30 h-full flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (!isExplorerDocked) effectiveToggle();
                }}
                onPointerDown={isExplorerDocked ? undefined : onStartExplorerDrag}
                title={explorerTabTitle}
                aria-label={explorerTabTitle}
                aria-disabled={isExplorerDocked}
                aria-expanded={!isExplorerDocked && effectiveIsOpen}
                className={[
                  'relative w-[104px] py-1.5 flex items-center justify-center gap-2 group',
                  'font-sans text-xs font-bold uppercase tracking-wider',
                  'outline-none focus:outline-none focus-visible:outline-none',
                  'transition-[background,border-color,box-shadow] ease-out',
                  animationsEnabled ? 'duration-300' : 'duration-0',
                  isExplorerDocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
                  isTabActive ? 'nav-tab-active' : 'nav-tab-inactive',
                ].join(' ')}
              >
                <span className="grid grid-cols-2 gap-[2px] opacity-60 shrink-0" aria-hidden="true">
                  {Array.from({ length: 6 }, (_, index) => (
                    <span key={index} className="w-[2px] h-[2px] rounded-full bg-current" />
                  ))}
                </span>
                <span className="explorer-header-title relative">
                  <span className="tracking-wider">EXPLORE<span className="tracking-normal">R</span></span>
                  <span
                    className={[
                      'nav-tab-indicator absolute inset-x-0 -bottom-[2px] transition-opacity ease-out',
                      animationsEnabled ? 'duration-300' : 'duration-0',
                      isTabActive ? 'nav-tab-indicator-active' : 'nav-tab-indicator-inactive',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                </span>

                {/* Underline Track */}
                <div className="absolute inset-x-0 bottom-[4px] flex items-center justify-center pointer-events-none">
                  <div
                    className={[
                      'nav-tab-baseline transition-opacity ease-out',
                      animationsEnabled ? 'duration-300' : 'duration-0',
                      isTabActive ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                </div>

                {/* Seamless Tab Extension */}
                <div
                  className={[
                    'nav-tab-extension transition-opacity ease-out',
                    animationsEnabled ? 'duration-300' : 'duration-0',
                    isTabActive ? 'nav-tab-extension-active' : 'nav-tab-extension-inactive',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </button>

              {/* Unpinned Floating Flyout Mount Slot */}
              {!isExplorerDocked && effectiveUnpinnedPanel}
            </div>
          </div>

          {/* Collection Selection, Schema Templates & Draggable Test Item */}
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

            {/* Quick Grabbable Content Item */}
            {onStartGrabbedContentDrag && (
              <div
                onPointerDown={onStartGrabbedContentDrag}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg select-none',
                  'border border-dashed border-[color-mix(in_oklch,var(--brand-primary)_45%,transparent)]',
                  'bg-[color-mix(in_oklch,var(--brand-primary)_10%,transparent)]',
                  'hover:bg-[color-mix(in_oklch,var(--brand-primary)_20%,transparent)]',
                  'hover:border-[var(--brand-primary)]',
                  'text-xs font-semibold text-[var(--brand-primary)]',
                  'cursor-grab active:cursor-grabbing transition-all duration-150',
                ].join(' ')}
                title="Drag and drop to dock into Primary or Secondary Side Bar"
              >
                <span className="text-[10px] opacity-60 tracking-tighter" aria-hidden="true">⋮⋮</span>
                <span>📦 Grab Item</span>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------
            2.3 RIGHT SECTION: DATABASE STATUS & USER BADGE
            ------------------------------------------------------------------ */}
        <div className="flex items-center gap-3 pr-4 relative z-10">
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
