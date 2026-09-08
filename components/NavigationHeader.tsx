'use client';

import React from 'react';
import { CollectionRecord } from '@/types/collection';
import CollectionDropdown from '@/components/CollectionDropdown';
import { NavigationBarTextureFilter } from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';

export type SearchScope = 'current' | 'all';

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
  const { isPinned, animationsEnabled } = useUIPreferences();
  const opacityTransition = animationsEnabled ? 'transition-opacity duration-700 ease-in-out' : 'transition-none';

  const isTabActive = isPinned || isLeftSidePanelOpen;

  return (
    <>
      <NavigationBarTextureFilter />

      <header className="navigation-header h-14 flex items-center justify-between shrink-0 relative z-[10]">
        {/* LEFT SECTION */}
        <div className="flex items-center h-full">
          {/* BRAND & EXPLORER TAB */}
          <div className="flex items-center justify-between h-full w-76 shrink-0 relative">
            
            {/* SHADOW ERASER MASK */}
            <div
              className={[
                'absolute top-full left-0 right-[10px] h-3 z-10',
                'bg-surface',
                'pointer-events-none',
                opacityTransition,
                isPinned ? 'nav-header-pinned-visible' : 'nav-header-pinned-hidden',
              ].join(' ')}
              aria-hidden="true"
            />

            {/* ACCENT BORDER LINE */}
            <div
              className={[
                'absolute top-full left-0 w-full h-[1px] z-20',
                'bg-[var(--nav-header-accent-line)]',
                'pointer-events-none',
                opacityTransition,
                isPinned ? 'nav-header-pinned-visible' : 'nav-header-pinned-hidden',
              ].join(' ')}
              aria-hidden="true"
            />

            {/* BRAND AREA */}
            <div className="flex items-center gap-2 pl-4 relative z-20">
              <img
                src="/images/nav_bar_website_logo.png"
                alt="TroveVault"
                className="h-8 w-auto object-contain select-none"
              />
            </div>

            {/* EXPLORER TOGGLE BUTTON & FLYOUT CONTAINER */}
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
                  <div
                    className={[
                      'nav-tab-indicator transition-opacity ease-out',
                      animationsEnabled ? 'duration-500' : 'duration-0',
                      isTabActive ? 'nav-tab-indicator-active' : 'nav-tab-indicator-inactive',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                </span>

                {/* Seamless Tab Extension */}
                <div
                  className={[
                    'nav-tab-extension transition-opacity ease-out',
                    animationsEnabled ? 'duration-500' : 'duration-0',
                    isTabActive ? 'nav-tab-extension-active' : 'nav-tab-extension-inactive',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </button>

              {/* FLYOUT ANCHOR: This relative wrapper guarantees absolute left-0 positions precisely under the button */}
              {unpinnedExplorerPanel}
            </div>
          </div>

          {/* OTHER NAVIGATION BUTTONS */}
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

        {/* RIGHT SECTION: DB STATUS + PROFILE */}
        <div className="flex items-center gap-3 pr-4">

          <div className="nav-live-badge">
            <span className="nav-live-dot animate-pulse" />
            <span className="text-content-secondary hidden sm:inline">Supabase</span> Live
          </div>

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