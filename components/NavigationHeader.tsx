'use client';

import { ReactNode, useState, useEffect } from 'react';
import { CollectionRecord } from '@/types/collection';
import CollectionDropdown from '@/components/CollectionDropdown';
import { PinOutlineIcon } from '@/components/icons/PinIcons';

export type SearchScope = 'current' | 'all';

interface NavigationHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchScope: SearchScope;
  onSearchScopeChange: (scope: SearchScope) => void;
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
  isPinned: boolean;
  onToggleLeftSidePanel: () => void;
  onTogglePin: () => void;
  explorerContent: ReactNode;
  animationsEnabled: boolean;
}

export default function NavigationHeader({
  searchQuery,
  onSearchChange,
  searchScope,
  onSearchScopeChange,
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
  isPinned,
  onToggleLeftSidePanel,
  onTogglePin,
  explorerContent,
  animationsEnabled,
}: NavigationHeaderProps) {
  const transitionClass = animationsEnabled ? 'transition-all duration-700 ease-in-out' : 'transition-none';
  const opacityTransition = animationsEnabled ? 'transition-opacity duration-700 ease-in-out' : 'transition-none';

  const [renderMenu, setRenderMenu] = useState(isLeftSidePanelOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isLeftSidePanelOpen) {
      setRenderMenu(true);
      setIsClosing(false);
    } else if (renderMenu) {
      if (isPinned) {
        const timer = setTimeout(() => {
          setRenderMenu(false);
        }, 700);
        return () => clearTimeout(timer);
      }

      if (animationsEnabled) {
        setIsClosing(true);
        const timer = setTimeout(() => {
          setRenderMenu(false);
          setIsClosing(false);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setRenderMenu(false);
      }
    }
  }, [isLeftSidePanelOpen, renderMenu, animationsEnabled, isPinned]);

  const isTabActive = isPinned || (renderMenu && !isClosing);

  return (
    <>
      <svg className="hidden" aria-hidden="true">
        <filter id="navigationBarTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 1.8" numOctaves="5" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.85 0" in="noise" result="coloredNoise" />
          <feBlend mode="overlay" in="SourceGraphic" in2="coloredNoise" />
        </filter>
      </svg>

      <header className="navigation-header h-14 flex items-center justify-between shrink-0 relative z-[200]">

        {/* LEFT SECTION */}
        <div className="flex items-center h-full">
          {/* BRAND & EXPLORER TAB */}
          <div className="flex items-center justify-between h-full w-76 shrink-0 relative">

            {/* SHADOW ERASER MASK */}
            <div
              className={`absolute top-full left-0 right-[10px] h-3 bg-surface z-10 pointer-events-none ${opacityTransition} ${
                isPinned ? 'opacity-100 delay-[350ms]' : 'opacity-0 delay-0'
              }`}
              aria-hidden="true"
            />

            {/* RESTORED ACCENT BORDER LINE */}
            <div
              className={`absolute top-full left-0 w-full h-[1px] bg-[var(--nav-header-accent-line)] z-20 pointer-events-none ${opacityTransition} ${
                isPinned ? 'opacity-100 delay-[350ms]' : 'opacity-0 delay-0'
              }`}
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

            {/* EXPLORER TOGGLE BUTTON */}
            <div className="relative z-30">
              <button
                type="button"
                onClick={() => {
                  if (!isPinned) {
                    onToggleLeftSidePanel();
                  }
                }}
                className={`px-4 py-1.5 font-sans font-black tracking-wide text-sm relative group transition-all ease-out ${
                  animationsEnabled ? 'duration-500' : 'duration-0'
                } ${isPinned ? 'cursor-default' : 'cursor-pointer'} ${
                  isTabActive ? 'nav-tab-active' : 'nav-tab-inactive'
                }`}
              >
                <span className="relative inline-block">
                  Explorer
                  <div
                    className={`nav-tab-indicator transition-opacity ease-out ${
                      animationsEnabled ? 'duration-500' : 'duration-0'
                    } ${isTabActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    aria-hidden="true"
                  />
                </span>

                {/* Seamless Tab Extension */}
                <div
                  className={`nav-tab-extension transition-opacity ease-out ${
                    animationsEnabled ? 'duration-500' : 'duration-0'
                  } ${
                    isPinned
                      ? 'border-r border-[var(--nav-header-accent-line)] border-border-strong'
                      : 'border-r border-border-strong'
                  } ${isTabActive ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden="true"
                />
              </button>

              {/* Floating Menu */}
              {renderMenu && (
                <>
                  {/* Floating Menu Overlay */}
                  <div
                    className={`fixed inset-0 top-14 z-40 ${
                      animationsEnabled
                        ? (isClosing && !isPinned ? 'animate-unmount-fade' : 'animate-mount-fade transition-opacity duration-700 ease-in-out')
                        : 'transition-none'
                    } ${isPinned ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    onClick={onToggleLeftSidePanel}
                  />

                  {/* Floating Menu Container */}
                  <div
                    className={`nav-flyout-menu transform ${
                      animationsEnabled && !isPinned
                        ? (isClosing ? 'animate-unmount-fade' : 'animate-mount-fade')
                        : ''
                    } ${transitionClass} ${
                      isPinned ? 'opacity-0 -translate-x-46 pointer-events-none' : 'opacity-100 translate-x-0'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                        🌲 Explorer
                      </span>

                      <div className="flex items-center gap-1">
                        {/* PIN BUTTON */}
                        <button
                          type="button"
                          onClick={onTogglePin}
                          className="group p-1.5 rounded-lg border border-transparent hover:border-border-subtle hover:bg-surface-hover transition cursor-pointer flex items-center justify-center shrink-0"
                          title="Pin Explorer to LeftSidePanel"
                        >
                          <PinOutlineIcon className="w-3.5 h-3.5 text-content-muted" />
                        </button>

                        {/* CLOSE BUTTON */}
                        <button
                          type="button"
                          onClick={onToggleLeftSidePanel}
                          className="p-1.5 text-content-muted hover:text-content-primary rounded-lg border border-transparent hover:border-border-subtle hover:bg-surface-hover transition text-xs cursor-pointer flex items-center justify-center w-7 h-7"
                          title="Close"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="overflow-auto max-h-[60vh] py-1">
                      <br />
                      {explorerContent}
                    </div>
                  </div>
                </>
              )}

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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-hover/80 hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-border-subtle transition cursor-pointer"
            >
              <span>📑</span>
              <span>Templates</span>
            </button>
          </div>
        </div>

        {/* RIGHT SECTION: SEARCH BAR + DB STATUS + PROFILE */}
        <div className="flex items-center gap-3 pr-4">
          <div className="relative flex items-center w-80">
            <select
              value={searchScope}
              onChange={(e) => onSearchScopeChange(e.target.value as SearchScope)}
              className="nav-search-select"
            >
              <option value="current">📁 This Folder</option>
              <option value="all">🌐 All Folders</option>
            </select>

            <input
              type="text"
              placeholder={searchScope === 'current' ? `Search ${activeCollectionName}...` : 'Search all collections...'}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="nav-search-input"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-content-muted hover:text-content-primary text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

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