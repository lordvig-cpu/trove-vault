'use client';

import { useState, useRef, useEffect } from 'react';
import CollectionDropdown, { CollectionRecord } from './CollectionDropdown';

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
  onRequestDeleteCollection: (col: CollectionRecord) => void;
  onOpenFieldManager: () => void;
  onOpenTemplateManager: () => void;
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
  onOpenFieldManager,
  onOpenTemplateManager,
}: NavbarProps) {
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const scopeMenuRef = useRef<HTMLDivElement>(null);

  // Close scope picker on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (scopeMenuRef.current && !scopeMenuRef.current.contains(event.target as Node)) {
        setIsScopeMenuOpen(false);
      }
    }
    if (isScopeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isScopeMenuOpen]);

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Collection Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 text-sm">
            UC
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wide uppercase text-slate-100">
              Universal Collections
            </h1>
            <p className="text-[10px] text-slate-500 font-mono">v0.1.0 • Supabase Live</p>
          </div>
        </div>

        {/* Anchored Collection Dropdown */}
        <div className="relative ml-2">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 bg-slate-950/80 border px-3 py-1.5 rounded-xl transition text-xs group ${
              isDropdownOpen
                ? 'border-indigo-500 bg-slate-900 shadow-md shadow-indigo-950/50'
                : 'border-slate-800 hover:border-indigo-500/50'
            }`}
          >
            <span className="text-indigo-400">🗂️</span>
            <span className="font-semibold text-slate-200 group-hover:text-white truncate max-w-[140px]">
              {activeCollectionName}
            </span>
            <span
              className={`text-[10px] text-slate-500 group-hover:text-slate-300 transition duration-150 ${
                isDropdownOpen ? 'rotate-180 text-indigo-400' : ''
              }`}
            >
              ▾
            </span>
          </button>

          <CollectionDropdown
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            collections={collections}
            activeCollectionId={activeCollectionId}
            onSelectCollection={onSelectCollection}
            onCollectionsUpdated={onCollectionsUpdated}
            onRequestDeleteCollection={onRequestDeleteCollection}
          />
        </div>

        {/* Collection Schema Action Buttons */}
        {activeCollectionId && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenTemplateManager}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/40 border border-indigo-900/60 hover:border-indigo-500 rounded-xl text-xs text-indigo-300 hover:text-white transition shadow-sm"
              title="Browse & Apply Schema Templates"
            >
              <span>📑</span>
              <span className="hidden sm:inline font-semibold">Templates</span>
            </button>
            <button
              onClick={onOpenFieldManager}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-400 hover:text-white transition"
              title="Customize Active Collection Fields"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline font-medium">Fields</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Search Filter with Outlook-Style Scoped Dropdown */}
      <div className="w-[450px] relative">
        <div className="flex items-center bg-slate-950/80 border border-slate-800 focus-within:border-indigo-500 rounded-full pl-1.5 pr-3 py-1 transition shadow-inner">
          {/* Scope Tag Selector */}
          <div className="relative shrink-0" ref={scopeMenuRef}>
            <button
              type="button"
              onClick={() => setIsScopeMenuOpen(!isScopeMenuOpen)}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-indigo-300 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer select-none"
            >
              <span>{searchScope === 'current' ? '📁 This Collection' : '🌐 All Collections'}</span>
              <span className="text-[9px] text-slate-400">▾</span>
            </button>

            {/* Scope Selection Popover */}
            {isScopeMenuOpen && (
              <div className="absolute top-8 left-0 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    onSearchScopeChange('current');
                    setIsScopeMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition flex items-center justify-between ${
                    searchScope === 'current'
                      ? 'bg-indigo-950/70 text-indigo-200 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>📁 This Collection</span>
                  {searchScope === 'current' && <span className="text-[10px]">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSearchScopeChange('all');
                    setIsScopeMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition flex items-center justify-between ${
                    searchScope === 'all'
                      ? 'bg-indigo-950/70 text-indigo-200 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>🌐 All Collections</span>
                  {searchScope === 'all' && <span className="text-[10px]">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 flex items-center ml-2">
            <span className="text-xs text-slate-500 mr-2">🔍</span>
            <input
              type="text"
              placeholder={
                searchScope === 'current'
                  ? 'Search in this collection...'
                  : 'Universal search across all collections...'
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-xs text-slate-500 hover:text-white p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right User Indicator */}
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-medium text-slate-400">Database Connected</span>
      </div>
    </header>
  );
}