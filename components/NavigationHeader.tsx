'use client';

import React from 'react';
import Image from 'next/image';
import logo from '@/assets/images/nav_bar_website_logo.webp';
import { NavigationBarTextureFilter } from '@/components/icons/NavigationIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { HintGripIcon } from '@/components/icons/HintIcons';
import { PackageIcon } from '@/components/icons/GlyphIcons';
import { UserIcon } from '@/components/icons/ContentIcons';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

export type SearchScope = 'current' | 'all';

/**
 * Props for NavigationHeader.
 * @property isPrimarySidePanelOpen - Whether the floating flyout panel is actively revealed
 * @property onTogglePrimarySidePanel - Callback toggling the flyout panel visibility
 * @property unpinnedPrimaryPanel - Pre-rendered PrimarySidePanel (flyout variant) anchored under the tab
 */
interface NavigationHeaderProps {
  isPrimarySidePanelOpen?: boolean;
  onTogglePrimarySidePanel?: () => void;
  unpinnedPrimaryPanel?: React.ReactNode;
  onStartItemsDrag?: (e: React.PointerEvent) => void;
  itemsDockedSide?: 'left' | 'right' | null;
  collectionsDockedSide?: 'left' | 'right' | null;
  isCollectionsOpen?: boolean;
  onToggleCollections?: () => void;
  onStartCollectionsDrag?: (e: React.PointerEvent) => void;
  collectionsFlyoutPanel?: React.ReactNode;
  templatesDockedSide?: 'left' | 'right' | null;
  isTemplatesOpen?: boolean;
  onToggleTemplates?: () => void;
  onStartTemplatesDrag?: (e: React.PointerEvent) => void;
  templatesFlyoutPanel?: React.ReactNode;
  onStartGrabbedContentDrag?: (e: React.PointerEvent) => void;
  /** Width (px) a pinned primary/secondary panel takes out of the workspace, so the portaled
      template toolbar (`#template-toolbar-slot`) can center on the visible canvas, not the full
      header. */
  leftOccupiedWidth?: number;
  rightOccupiedWidth?: number;
}

/* ==========================================================================
   2. MAIN COMPONENT: NavigationHeader
   Fixed top navigation bar (h-14) hosting branding, the Items toggle tab,
   the collection switcher, and live database status indicators.
   ========================================================================== */

export default function NavigationHeader({
  isPrimarySidePanelOpen,
  onTogglePrimarySidePanel,
  unpinnedPrimaryPanel,
  onStartItemsDrag,
  itemsDockedSide = null,
  collectionsDockedSide = null,
  isCollectionsOpen = false,
  onToggleCollections,
  onStartCollectionsDrag,
  collectionsFlyoutPanel,
  templatesDockedSide = null,
  isTemplatesOpen = false,
  onToggleTemplates,
  onStartTemplatesDrag,
  templatesFlyoutPanel,
  onStartGrabbedContentDrag,
  leftOccupiedWidth = 0,
  rightOccupiedWidth = 0,
}: NavigationHeaderProps) {
  /* ------------------------------------------------------------------------
     2.1 CONTEXT & ACTIVE TAB EVALUATION
     ------------------------------------------------------------------------ */
  const { animationsEnabled } = useUIPreferences();


  const treePanels = [
    { name: 'Items', dockedSide: itemsDockedSide, isOpen: isPrimarySidePanelOpen ?? false, toggle: onTogglePrimarySidePanel, drag: onStartItemsDrag, flyout: unpinnedPrimaryPanel },
    { name: 'Collections', dockedSide: collectionsDockedSide, isOpen: isCollectionsOpen, toggle: onToggleCollections, drag: onStartCollectionsDrag, flyout: collectionsFlyoutPanel },
    { name: 'Templates', dockedSide: templatesDockedSide, isOpen: isTemplatesOpen, toggle: onToggleTemplates, drag: onStartTemplatesDrag, flyout: templatesFlyoutPanel },
  ];

  return (
    <>
      {/* SVG brushed steel noise texture filter referenced by header styles */}
      <NavigationBarTextureFilter />

      <header className="navigation-header h-14 flex items-center justify-between shrink-0 relative z-[80]">
        <div className="navigation-header-inset-shadow" aria-hidden="true" />
        {/* ------------------------------------------------------------------
            2.2 LEFT SECTION: BRANDING & PRIMARY NAVIGATION
            ------------------------------------------------------------------ */}
        {/* z 86: the tabs' flyouts render inside this, so it sits above the template toolbar slot (85) --
            an open flyout covers the toolbar, never the reverse. */}
        <div className="flex items-center h-full relative z-[86]">
          {/* Brand Logo & Items Tab Anchor Zone (Pinned to Left Sidebar Width 304px / w-76) */}
          <div className="flex items-center justify-between h-full w-76 shrink-0 relative">
            {/* Brand Logo Anchor */}
            <div className="flex items-center gap-2 pl-4 shrink-0 relative z-20">
              <Image
                src={logo}
                sizes="144px"
                alt="TroveVault"
                className="h-8 w-auto max-w-none shrink-0 object-contain select-none"
              />
            </div>

            {/* Items Tab (Positioned cleanly at the right of the 304px boundary) */}
            <NavTab panel={treePanels[0]} animationsEnabled={animationsEnabled} />
          </div>

          {/* Subsequent Navigation Tabs (Collections, Templates) */}
          <div className="flex items-center gap-2 h-full pl-2 shrink-0 relative">
            {treePanels.slice(1).map(panel => (
              <NavTab key={panel.name} panel={panel} animationsEnabled={animationsEnabled} />
            ))}
          </div>

          {/* Quick Grabbable Content Item for Testing Bottom Docking */}
          {onStartGrabbedContentDrag && (
            <div className="flex items-center pl-4 shrink-0 relative z-30">
              <div
                onPointerDown={onStartGrabbedContentDrag}
                className={[
                  'nav-grab-pill flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg select-none',
                  'border border-dashed border-[color-mix(in_oklch,var(--brand-primary)_45%,transparent)]',
                  'bg-[color-mix(in_oklch,var(--brand-primary)_10%,transparent)]',
                  'hover:bg-[color-mix(in_oklch,var(--brand-primary)_20%,transparent)]',
                  'hover:border-[var(--brand-primary)]',
                  'text-xs font-semibold text-[var(--brand-primary)]',
                  'cursor-grab active:cursor-grabbing transition-all duration-150',
                ].join(' ')}
                title="Drag and drop to dock into Primary, Secondary or Bottom Panel"
              >
                <HintGripIcon className="w-2 h-3 opacity-60" />
                <span className="flex items-center gap-1"><PackageIcon className="w-3 h-3" />Grab Item</span>
              </div>
            </div>
          )}
        </div>

        {/* Slot for the template editor bar (portaled in by the editor), centered on the visible
            canvas — a pinned panel eats into one side, so plain 50% would drift off-center. The
            +1px keeps it below the header's 1px bottom border: `top: 100%` is measured from the
            padding box, so without it the toolbar paints over that border. w-max: an absolute box
            left at the center would otherwise only get the space between there and the right edge
            (about half the header), squeezing a wide toolbar like the content bar. */}
        <div
          id="template-toolbar-slot"
          className={`absolute top-[calc(100%+1px)] w-max -translate-x-1/2 z-[85] pointer-events-none ${
            animationsEnabled ? 'transition-[left] duration-500 ease-in-out' : ''
          }`}
          style={{ left: `calc(50% + ${(leftOccupiedWidth - rightOccupiedWidth) / 2}px)` }}
        />

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
            <UserIcon className="w-4 h-4" />
          </div>
        </div>
      </header>
    </>
  );
}

/* ==========================================================================
   3. NAV TAB
   One tree panel's header tab (Items, Collections, Templates): opens its flyout or drags it to a dock.
   ========================================================================== */

interface NavTabPanel {
  name: string;
  dockedSide: 'left' | 'right' | null;
  isOpen: boolean;
  toggle?: () => void;
  drag?: (e: React.PointerEvent) => void;
  flyout?: React.ReactNode;
}

function NavTab({ panel, animationsEnabled }: { panel: NavTabPanel; animationsEnabled: boolean }) {
  const isDocked = panel.dockedSide !== null;
  const isTabActive = isDocked || panel.isOpen;
  const tabTitle = isDocked
    ? panel.name + ' is already docked in the ' + (panel.dockedSide === 'left' ? 'primary (left)' : 'secondary (right)') + ' panel'
    : 'Open ' + panel.name + ' or drag to dock in a sidebar';
  return (
    <div className="relative z-30 h-full flex items-center shrink-0">
      <button
        type="button"
        onClick={() => {
          if (!isDocked) panel.toggle?.();
        }}
        onPointerDown={isDocked ? undefined : panel.drag}
        title={tabTitle}
        aria-label={tabTitle}
        aria-disabled={isDocked}
        aria-expanded={!isDocked && panel.isOpen}
        className={[
          'relative px-3 py-1.5 flex items-center justify-center gap-2 group',
          'font-sans text-xs font-bold uppercase tracking-wider',
          'outline-none focus:outline-none focus-visible:outline-none',
          'transition-[background,border-color,box-shadow] ease-out',
          animationsEnabled ? 'duration-300' : 'duration-0',
          isDocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
          isTabActive ? 'nav-tab-active' : 'nav-tab-inactive',
        ].join(' ')}
      >
        <span className="grid grid-cols-2 gap-[2px] opacity-60 shrink-0" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="w-[2px] h-[2px] rounded-full bg-current" />
          ))}
        </span>
        <span className="tree-header-title relative">
          <span className="tracking-wider">{panel.name}</span>
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
      {!isDocked && panel.flyout}
    </div>
  );
}
