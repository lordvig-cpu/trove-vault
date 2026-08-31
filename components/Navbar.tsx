'use client';

import { ReactNode, useState, useEffect } from 'react';
import { CollectionRecord } from './CollectionDropdown';
import CollectionDropdown from './CollectionDropdown';
import { PinOutlineIcon, PinFilledIcon } from '@/components/icons/PinIcons';

export type SearchScope = 'current' | 'all';

interface NavbarProps {
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
  isSidebarOpen: boolean;
  isPinned: boolean;
  onToggleSidebar: () => void;
  onTogglePin: () => void;
  explorerContent: ReactNode;
  animationsEnabled: boolean;
}

export default function Navbar({
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
  isSidebarOpen,
  isPinned,
  onToggleSidebar,
  onTogglePin,
  explorerContent,
  animationsEnabled,
}: NavbarProps) {
  const transitionClass = animationsEnabled ? 'transition-all duration-700 ease-in-out' : 'transition-none';
  const opacityTransition = animationsEnabled ? 'transition-opacity duration-700 ease-in-out' : 'transition-none';

  const [renderMenu, setRenderMenu] = useState(isSidebarOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
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
  }, [isSidebarOpen, renderMenu, animationsEnabled, isPinned]);

  return (
    <>
      <svg className="hidden" aria-hidden="true">
        <filter id="troveNavTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 1.8" numOctaves="5" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.85 0" in="noise" result="coloredNoise" />
          <feBlend mode="overlay" in="SourceGraphic" in2="coloredNoise" />
        </filter>
      </svg>

      <header className="trove-navbar h-14 flex items-center justify-between shrink-0 relative z-[200]">

        {/* LEFT SECTION */}
        <div className="flex items-center h-full">
          {/* BRAND & EXPLORER TAB */}
          <div className="flex items-center justify-between h-full w-76 shrink-0 relative">

            {/* SHADOW ERASER MASK */}
            <div
              className={`absolute top-full left-0 right-[10px] h-3 bg-surface z-10 pointer-events-none ${opacityTransition} ${isPinned ? 'opacity-100 delay-[350ms]' : 'opacity-0 delay-0'
                }`}
              aria-hidden="true"
            />

            {/* RESTORED BLUE BORDER LINE */}
            <div
              className={`absolute top-full left-0 w-full h-[1px] bg-[rgba(81,155,255,0.85)] z-20 pointer-events-none ${opacityTransition} ${isPinned ? 'opacity-100 delay-[350ms]' : 'opacity-0 delay-0'
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
                    onToggleSidebar();
                  }
                }}
                className={`px-4 py-1.5 font-sans font-black tracking-wide text-sm relative group transition-all ease-out ${animationsEnabled ? 'duration-500' : 'duration-0'
                  } ${isPinned ? 'cursor-default' : 'cursor-pointer'} ${isPinned || (renderMenu && !isClosing)
                    ? 'bg-surface border border-border-strong border-b-transparent rounded-t-lg rounded-b-none text-white shadow-[0_-4px_12px_rgba(0,190,230,0.15)] z-[60]'
                    : 'bg-transparent border border-transparent rounded-lg text-white z-50'
                  }`}
              >
                <span className="relative inline-block">
                  Explorer
                  <div
                    className={`absolute -bottom-1 -left-[1px] -right-[1px] h-[2px] bg-[#e77428] pointer-events-none transition-opacity ease-out ${animationsEnabled ? 'duration-500' : 'duration-0'
                      } ${isPinned || (renderMenu && !isClosing) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    aria-hidden="true"
                  />
                </span>

                {/* Seamless Tab Extension */}
                <div
                  className={`absolute top-[calc(100%-1px)] -left-[1px] -right-[1px] h-3 bg-surface border-l pointer-events-none transition-opacity ease-out ${animationsEnabled ? 'duration-500' : 'duration-0'
                    } ${isPinned ? 'border-r border-[rgba(81,155,255,0.85)] border-border-strong' : 'border-r border-border-strong'
                    } ${isPinned || (renderMenu && !isClosing) ? 'opacity-100' : 'opacity-0'
                    }`}
                  aria-hidden="true"
                />
              </button>

              {/* Floating Menu */}
              {renderMenu && (
                <>
                  <style>{`
                    @keyframes mountFade {
                      0% { opacity: 0; }
                      100% { opacity: 1; }
                    }
                    @keyframes unmountFade {
                      0% { opacity: 1; }
                      100% { opacity: 0; }
                    }
                    .animate-mount-fade {
                      animation: mountFade 500ms ease-out;
                    }
                    .animate-unmount-fade {
                      animation: unmountFade 500ms ease-out forwards;
                    }
                  `}</style>

                  {/* Floating Menu Overlay */}
                  <div
                    className={`fixed inset-0 top-14 z-40 ${animationsEnabled
                      ? (isClosing && !isPinned ? 'animate-unmount-fade' : 'animate-mount-fade transition-opacity duration-700 ease-in-out')
                      : 'transition-none'
                      } ${isPinned ? 'opacity-0 pointer-events-none' : 'opacity-100'
                      }`}
                    onClick={onToggleSidebar}
                  />

                  {/* Floating Menu Container */}
                  <div className={`absolute left-0 mt-[11px] w-88 max-h-[75vh] bg-surface/80 border border-border-strong rounded-xl rounded-tl-none shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 p-3 flex flex-col gap-2 transform ${animationsEnabled && !isPinned
                    ? (isClosing ? 'animate-unmount-fade' : 'animate-mount-fade')
                    : ''
                    } ${transitionClass} ${isPinned ? 'opacity-0 -translate-x-46 pointer-events-none' : 'opacity-100 translate-x-0'
                    }`}>
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                        🌲 Explorer
                      </span>

                      <div className="flex items-center gap-1">
                        {/* PIN TO SIDEBAR BUTTON */}
                        <button
                          type="button"
                          onClick={onTogglePin}
                          className="group p-1.5 rounded-lg border border-transparent hover:border-border-subtle hover:bg-surface-hover transition cursor-pointer flex items-center justify-center shrink-0"
                          title="Pin Explorer to Sidebar"
                        >
                          <PinOutlineIcon className="w-3.5 h-3.5 text-content-muted" />
                        </button>

                        {/* CLOSE BUTTON */}
                        <button
                          type="button"
                          onClick={onToggleSidebar}
                          className="p-1.5 text-content-muted hover:text-content-primary rounded-lg border border-transparent hover:border-border-subtle hover:bg-surface-hover transition text-xs cursor-pointer flex items-center justify-center w-7 h-7"
                          title="Close"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="overflow-auto max-h-[60vh] py-1">
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
              className="bg-surface text-content-secondary text-xs font-medium py-1.5 pl-2 pr-6 border border-border-subtle rounded-l-lg focus:outline-none focus:border-accent-primary cursor-pointer"
            >
              <option value="current">📁 This Folder</option>
              <option value="all">🌐 All Folders</option>
            </select>

            <input
              type="text"
              placeholder={searchScope === 'current' ? `Search ${activeCollectionName}...` : 'Search all collections...'}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-canvas border-y border-r border-border-subtle text-xs rounded-r-lg px-3 py-1.5 text-content-primary placeholder-content-muted focus:outline-none focus:border-accent-primary"
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

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border-subtle rounded-lg text-[11px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-content-secondary hidden sm:inline">Supabase</span> Live
          </div>

          <div
            className="w-8 h-8 rounded-full bg-accent-primary/20 border border-accent-primary/60 flex items-center justify-center text-xs font-bold text-accent-secondary shadow-inner cursor-pointer hover:border-accent-primary transition"
            title="User Profile / Account"
          >
            👤
          </div>
        </div>
      </header>
    </>
  );
}