'use client';

import CollectionDropdown, { CollectionRecord } from './CollectionDropdown';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCollectionName: string;
  collections: CollectionRecord[];
  activeCollectionId: number | null;
  onSelectCollection: (id: number) => void;
  onCollectionsUpdated: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  onRequestDeleteCollection: (col: CollectionRecord) => void;
}

export default function Navbar({
  searchQuery,
  onSearchChange,
  activeCollectionName,
  collections,
  activeCollectionId,
  onSelectCollection,
  onCollectionsUpdated,
  isDropdownOpen,
  setIsDropdownOpen,
  onRequestDeleteCollection,
}: NavbarProps) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Logo & Anchored Collection Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
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

        {/* Anchored Relative Container */}
        <div className="relative">
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

          {/* Floating Dropdown Popover */}
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
      </div>

      {/* Top Search Filter */}
      <div className="w-96 relative">
        <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
        <input
          type="text"
          placeholder="Search items by name or attributes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-full pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-2 text-xs text-slate-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right User Indicator */}
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-medium text-slate-400">Database Connected</span>
      </div>
    </header>
  );
}