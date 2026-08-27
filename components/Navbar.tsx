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

const THEME_OPTIONS: { id: ThemePreset; label: string; dotColor: string }[] = [
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
  // Live theme selection state
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
    <header className="h-14 border-b border-border-subtle bg-surface/90 backdrop-blur flex items-center justify-between shrink-0 z-40">
      {/* LEFT SECTION */}
      <div className="flex items-center h-full">
        {/* BRAND & DOCKED TAB AREA */}
        <div
          className={`flex items-center justify-between h-full px-4 transition-all duration-300 ease-in-out ${
            isPinned
              ? 'w-84 border-r border-border-subtle shrink-0'
              : 'w-auto border-r-0 border-transparent gap-3 shrink-0'
          }`}
        >

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-secondary shadow-sm shadow-accent-secondary/50 animate-pulse" />
            <span className="font-black tracking-wider text-base text-content-primary uppercase">
              TROVE<span className="text-accent-secondary">VAULT</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-content-muted font-mono">
              v0.1.0
            </span>
          </div>

          {isPinned && (
            <div className="relative h-full flex items-center px-2 mr-1">
              <span className="text-xs font-semibold text-content-primary tracking-wide select-none">
                Explorer
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-accent-primary rounded-t-full shadow-sm shadow-accent-primary/50" />
            </div>
          )}
        </div>

        {/* TOP LEVEL NAVIGATION BUTTONS */}
        <div className="flex items-center gap-3 px-4 h-full">
          {!isPinned && (
            <div className="relative">
              <button
                type="button"
                onClick={onToggleSidebar}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  isSidebarOpen
                    ? 'bg-accent-primary/15 border-accent-primary text-accent-secondary shadow-sm'
                    : 'bg-surface-hover/80 border-border-subtle text-content-secondary hover:bg-surface-hover hover:text-content-primary'
                }`}
                title="Open Explorer Tree"
              >
                <span>🌲</span>
                <span>Explorer</span>
                <span className="text-[10px] text-content-muted">▾</span>
              </button>

              {isSidebarOpen && (
                <>
                  <div
                    className="fixed inset-0 top-14 z-40"
                    onClick={onToggleSidebar}
                  />
                  <div className="absolute left-0 mt-2 w-88 max-h-[75vh] bg-surface-popover border border-border-strong rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10 z-50 p-3 flex flex-col gap-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
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
          )}

          {/* Collection Selector Popover */}
          <CollectionDropdown
            collections={collections}
            activeCollectionId={activeCollectionId}
            onSelectCollection={onSelectCollection}
            onCollectionsUpdated={onCollectionsUpdated}
            isOpen={isDropdownOpen}
            setIsOpen={setIsDropdownOpen}
            onRequestDelete={onRequestDeleteCollection}
          />

          {/* Master Templates Button */}
          <button
            type="button"
            onClick={onOpenTemplateManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-hover/80 hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-border-subtle transition cursor-pointer"
          >
            <span>📑</span>
            <span>Templates</span>
          </button>

          {/* LIVE THEMES SELECTOR DROPDOWN */}
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
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThemeMenuOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-52 bg-surface-popover border border-border-strong rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted px-2 py-1 border-b border-border-subtle">
                    Color Themes
                  </span>
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTheme(t.id)}
                      className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition cursor-pointer ${
                        currentTheme === t.id
                          ? 'bg-accent-primary/20 text-content-primary font-semibold border border-accent-primary/40'
                          : 'text-content-secondary hover:bg-surface-hover hover:text-content-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: t.dotColor }}
                        />
                        <span>{t.label}</span>
                      </div>
                      {currentTheme === t.id && (
                        <span className="text-[11px] text-accent-secondary">✓</span>
                      )}
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
            placeholder={
              searchScope === 'current'
                ? `Search ${activeCollectionName}...`
                : 'Search all collections...'
            }
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
  );
}