'use client';

import { ReactNode, useState, useEffect } from 'react';
import { CollectionRecord } from '@/types/collection';
import CollectionDropdown from '@/components/CollectionDropdown';
import { PinOutlineIcon } from '@/components/icons/PinIcons';
import { NavigationBarTextureFilter } from '@/components/icons/SystemIcons';
import { createPortal } from 'react-dom';

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
  allCollectionsCount?: number;
  allItemsCount?: number;
  onAddNewItem?: () => void;
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
  allCollectionsCount = 0,
  allItemsCount = 0,
  onAddNewItem,
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
      <NavigationBarTextureFilter />

      <header className="navigation-header h-14 flex items-center justify-between shrink-0 relative z-[10]">

        {/* LEFT SECTION */}
        <div className="flex items-center h-full">
          {/* BRAND & EXPLORER TAB */}
          <div className="flex items-center justify-between h-full w-76 shrink-0 relative">

            {/* SHADOW ERASER MASK */}
            <div
              className={[
                // Layout & Geometry
                'absolute top-full left-0 right-[10px] h-3 z-10',
                // Surface & Colors
                'bg-surface',
                // Interaction & Transitions
                'pointer-events-none',
                opacityTransition,
                // Pinned State Visibility
                isPinned ? 'nav-header-pinned-visible' : 'nav-header-pinned-hidden',
              ].join(' ')}
              aria-hidden="true"
            />

            {/* RESTORED ACCENT BORDER LINE */}
            <div
              className={[
                // Layout & Geometry
                'absolute top-full left-0 w-full h-[1px] z-20',
                // Surface & Colors
                'bg-[var(--nav-header-accent-line)]',
                // Interaction & Transitions
                'pointer-events-none',
                opacityTransition,
                // Pinned State Visibility
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

            {/* EXPLORER TOGGLE BUTTON */}
            <div className="relative z-30">
              <button
                type="button"
                onClick={() => {
                  if (!isPinned) {
                    onToggleLeftSidePanel();
                  }
                }}
                className={[
                  // Layout & Spacing
                  'relative px-4 py-1.5 group',
                  // Typography
                  'font-sans font-black tracking-wide text-sm',
                  // Transitions & Durations
                  'transition-all ease-out',
                  animationsEnabled ? 'duration-500' : 'duration-0',
                  // State Classes
                  isPinned ? 'cursor-default' : 'cursor-pointer',
                  isTabActive ? 'nav-tab-active' : 'nav-tab-inactive',
                ].join(' ')}
              >
                <span className="relative inline-block">
                  Explorer
                  <div
                    className={[
                      // Base Indicator & Transitions
                      'nav-tab-indicator transition-opacity ease-out',
                      animationsEnabled ? 'duration-500' : 'duration-0',
                      // Dynamic State Visibility
                      isTabActive ? 'nav-tab-indicator-active' : 'nav-tab-indicator-inactive',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                </span>

                {/* Seamless Tab Extension */}
                <div
                  className={[
                    // Base Extension Layout & Transitions
                    'nav-tab-extension transition-opacity ease-out',
                    animationsEnabled ? 'duration-500' : 'duration-0',
                    // Pinned Border State
                    isPinned
                      ? 'border-r border-[var(--nav-header-accent-line)] border-border-strong'
                      : 'border-r border-border-strong',
                    // State Visibility
                    isTabActive ? 'nav-tab-extension-active' : 'nav-tab-extension-inactive',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </button>

              {/* Floating Menu */}
              {renderMenu && (
                <>
                  {/* Floating Menu Overlay (Portaled to z-[60] on the body) */}
                  {typeof document !== 'undefined' && createPortal(
                    <div
                      className={[
                        // Layout & Fixed Viewport Positioning
                        'fixed inset-0 top-14 z-[60]',
                        // Mount / Unmount Animations & Transitions
                        animationsEnabled
                          ? (isClosing && !isPinned
                              ? 'animate-unmount-fade'
                              : 'animate-mount-fade transition-opacity duration-700 ease-in-out')
                          : 'transition-none',
                        // Pinned Visibility & Pointer Events
                        isPinned ? 'nav-overlay-pinned' : 'nav-overlay-unpinned',
                      ].join(' ')}
                      onClick={onToggleLeftSidePanel}
                    />,
                    document.body
                  )}

                  {/* Floating Menu Container */}
                  <div
                    style={{ zIndex: 80 }}
                    className={[
                      // Base Geometry & Transforms
                      'nav-flyout-menu transform',
                      transitionClass,
                      // Mount / Unmount Animations
                      animationsEnabled && !isPinned
                        ? (isClosing ? 'animate-unmount-fade' : 'animate-mount-fade')
                        : '',
                      // Pinned State & Interaction
                      isPinned ? 'nav-flyout-pinned' : 'nav-flyout-unpinned',
                    ].filter(Boolean).join(' ')}
                  >
                    {/* MATCHED EXPLORER HEADER */}
                    <div className="left-side-panel-header shrink-0 pb-2">
                      <div>
                        <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
                          Explorer
                        </span>
                        <span className="text-[10px] text-content-muted font-mono">
                          {allCollectionsCount} Folders • {allItemsCount} Items
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {activeCollectionId && onAddNewItem && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddNewItem();
                              onToggleLeftSidePanel(); // Closes the floating popover when adding an item
                            }}
                            className="text-[11px] font-semibold text-accent-secondary hover:text-accent-primary shrink-0 cursor-pointer"
                          >
                            + New Item
                          </button>
                        )}

                        {/* PIN BUTTON */}
                        <button
                          type="button"
                          onClick={onTogglePin}
                          className="left-side-panel-pin-btn group"
                          title="Pin Explorer to LeftSidePanel"
                        >
                          <PinOutlineIcon className="w-3.5 h-3.5 text-content-primary" />
                        </button>

                        {/* CLOSE BUTTON */}
                        <button
                          type="button"
                          onClick={onToggleLeftSidePanel}
                          className="left-side-panel-pin-btn group text-xs text-content-muted hover:text-content-primary"
                          title="Close Explorer"
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
              className={[
                // Layout & Spacing
                'flex items-center gap-1.5 px-3 py-1.5',
                // Typography & Content
                'text-xs font-semibold text-content-secondary hover:text-content-primary',
                // Surface & Borders
                'bg-surface-hover/80 hover:bg-surface-hover border border-border-subtle rounded-lg',
                // Interaction
                'cursor-pointer transition',
              ].join(' ')}
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