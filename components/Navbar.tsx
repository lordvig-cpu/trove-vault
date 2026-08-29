'use client';

import { ReactNode, useState, useEffect } from 'react';
import { CollectionRecord } from './CollectionDropdown';
import CollectionDropdown from './CollectionDropdown';
import { PinOutlineIcon } from './icons/PinIcons';

export type SearchScope = 'current' | 'all';
export type ThemePreset = 'clean-energetic' | 'theme-test-dark' | 'theme-test-light';

interface ThemeOption {
  id: ThemePreset;
  label: string;
  dotColor: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'clean-energetic', label: 'Clean & Energetic (Default)', dotColor: '#5680E9' },
  { id: 'theme-test-dark', label: 'Test Dark Theme', dotColor: '#ffaa00' },
  { id: 'theme-test-light', label: 'Test Light Theme', dotColor: '#d0e4ec' },
];

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
}: NavbarProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>('clean-energetic');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('uc_theme_preset') as ThemePreset | null;
    const validThemes: ThemePreset[] = ['clean-energetic', 'theme-test-dark', 'theme-test-light'];

    if (saved && validThemes.includes(saved)) {
      setCurrentTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      setCurrentTheme('clean-energetic');
      document.documentElement.setAttribute('data-theme', 'clean-energetic');
    }
  }, []);

  const handleSelectTheme = (themeId: ThemePreset) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('uc_theme_preset', themeId);
    setIsThemeMenuOpen(false);
  };

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
          {/* BRAND & EXPLORER TAB - Locked to exactly w-76 to perfectly align with the Sidebar's right border */}
          <div className="flex items-center justify-between h-full w-76 shrink-0 relative">

            {/* SHADOW ERASER MASK */}
            <div
              className={`absolute top-full left-0 right-[10px] h-3 bg-surface z-10 pointer-events-none transition-opacity duration-700 ease-in-out ${isPinned ? 'opacity-100 delay-[350ms]' : 'opacity-0 delay-0'
                }`}
              aria-hidden="true"
            />

            {/* RESTORED BLUE BORDER LINE */}
            <div
              className={`absolute top-full left-0 w-full h-[1px] bg-[rgba(81,155,255,0.85)] z-20 pointer-events-none transition-opacity duration-700 ease-in-out ${isPinned ? 'opacity-100 delay-[350ms]' : 'opacity-0 delay-0'
                }`}
              aria-hidden="true"
            />

            {/* BRAND AREA */}
            <div className="flex items-start gap-1.5 pl-4 relative z-20">
              <img
                src="/images/nav_bar_website_logo.png"
                alt="TroveVault"
                className="h-5 w-auto object-contain select-none"
              />
              <span className="text-[10px] text-content-muted/70 font-mono leading-none pt-1.0 select-none">
                v0.1.0
              </span>
            </div>

            {/* EXPLORER TOGGLE BUTTON (Right-aligned against the w-76 boundary) */}
            <div className="relative z-30">
              <button
                type="button"
                onClick={() => {
                  if (!isPinned) {
                    onToggleSidebar();
                  }
                }}
                className={`px-4 py-1.5 transition-all duration-200 font-sans font-black tracking-wide text-base ${isPinned ? 'cursor-default' : 'cursor-pointer'
                  } relative group ${!isPinned && isSidebarOpen
                    ? 'bg-surface border border-border-strong border-b-transparent rounded-t-lg rounded-b-none text-white shadow-[0_-4px_12px_rgba(0,190,230,0.15)] z-[60]'
                    : isPinned
                      ? 'bg-surface border border-border-strong border-b-transparent rounded-t-lg rounded-b-none text-white shadow-[0_-4px_12px_rgba(0,190,230,0.15)] z-[60]'
                      : 'bg-transparent border border-transparent rounded-lg text-white z-50'
                  }`}
              >
                <span className="relative inline-block">
                  Explorer
                  <div
                    className={`absolute -bottom-1 -left-[1px] -right-[1px] h-[2px] bg-[#e77428] pointer-events-none transition-opacity duration-200 ${(isPinned || isSidebarOpen) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    aria-hidden="true"
                  />
                </span>

                {/* Seamless Tab Extension */}
                {(isPinned || isSidebarOpen) && (
                  <div
                    className={`absolute top-[calc(100%-1px)] -left-[1px] -right-[1px] h-3 bg-surface border-l border-border-strong pointer-events-none ${isPinned ? 'border-r border-[rgba(81,155,255,0.85)]' : 'border-r border-border-strong'
                      }`}
                    aria-hidden="true"
                  />
                )}
              </button>

              {/* Floating Menu - Transitions out with a partial slide when pinned */}
              {isSidebarOpen && (
                <>
                  <div 
                    className={`fixed inset-0 top-14 z-40 transition-opacity duration-700 ease-in-out ${
                      isPinned ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`} 
                    onClick={onToggleSidebar} 
                  />
                  <div className={`absolute left-0 mt-[9px] w-88 max-h-[75vh] bg-surface border border-border-strong rounded-xl rounded-tl-none shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10 z-50 p-3 flex flex-col gap-2 backdrop-blur-xl transition-all duration-700 ease-in-out ${
                    isPinned ? 'opacity-0 -translate-x-46 pointer-events-none' : 'opacity-100 translate-x-0'
                  }`}>
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                        🌲 Explorer
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={onTogglePin}
                          className="group p-1 rounded text-content-muted hover:text-content-primary hover:bg-surface-hover transition cursor-pointer"
                          title="Pin Explorer to Sidebar"
                        >
                          <PinOutlineIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={onToggleSidebar}
                          className="p-1 text-content-muted hover:text-content-primary rounded hover:bg-surface-hover text-xs cursor-pointer"
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

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-hover/80 hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-border-subtle transition cursor-pointer"
                title="Change Color Theme"
              >
                <span>🎨</span>
                <span>Themes</span>
                <span className="text-[10px] text-content-muted">▾</span>
              </button>

              {isThemeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsThemeMenuOpen(false)} />
                  <div className="absolute left-0 mt-2 w-52 bg-surface-popover border border-border-strong rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted px-2 py-1 border-b border-border-subtle">
                      Color Themes
                    </span>
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTheme(t.id)}
                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition cursor-pointer ${currentTheme === t.id
                          ? 'bg-accent-primary/20 text-content-primary font-semibold border border-accent-primary/40'
                          : 'text-content-secondary hover:bg-surface-hover hover:text-content-primary'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: t.dotColor }} />
                          <span>{t.label}</span>
                        </div>
                        {currentTheme === t.id && <span className="text-[11px] text-accent-secondary">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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