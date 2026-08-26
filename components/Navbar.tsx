'use client';

import { ReactNode } from 'react';
import { CollectionRecord } from './CollectionDropdown';
import CollectionDropdown from './CollectionDropdown';
import { PinOutlineIcon } from './icons/PinIcons';

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
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between shrink-0 z-40">
      {/* LEFT SECTION */}
      <div className="flex items-center h-full">
        {/* BRAND & DOCKED TAB AREA (Smooth width & border transition) */}
        <div
          className={`flex items-center justify-between h-full px-4 transition-all duration-300 ease-in-out ${
            isPinned
              ? 'w-84 border-r border-slate-800 shrink-0'
              : 'w-auto border-r-0 border-transparent gap-3 shrink-0'
          }`}
        >
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-500/20 shrink-0">
              UC
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                UNIVERSAL COLLECTIONS
              </span>
              <span className="text-[10px] font-mono text-slate-400 block -mt-1">
                v0.1.0
              </span>
            </div>
          </div>

          {/* ServiceNow Active Underlined Tab */}
          {isPinned && (
            <div className="relative h-full flex items-center px-2 mr-1 animate-fadeIn">
              <span className="text-xs font-semibold text-white tracking-wide select-none">
                Explorer
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-500 rounded-t-full shadow-sm shadow-indigo-500/50" />
            </div>
          )}
        </div>

        {/* TOP LEVEL NAVIGATION BUTTONS */}
        <div className="flex items-center gap-3 px-4 h-full">
          {/* UNPINNED EXPLORER BUTTON & POPOVER */}
          {!isPinned && (
            <div className="relative">
              <button
                type="button"
                onClick={onToggleSidebar}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  isSidebarOpen
                    ? 'bg-indigo-950/80 border-indigo-700 text-indigo-200 shadow-sm'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title="Open Explorer Tree"
              >
                <span>🌲</span>
                <span>Explorer</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              {isSidebarOpen && (
                <>
                  {/* INVISIBLE CLICK-OUTSIDE DISMISS AREA */}
                  <div
                    className="fixed inset-0 top-14 z-40"
                    onClick={onToggleSidebar}
                  />

                  {/* HIGH-DEPTH ELEVATED DROPDOWN CARD */}
                  <div className="absolute left-0 mt-2 w-88 max-h-[75vh] bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/10 z-50 p-3 flex flex-col gap-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        🌲 Explorer
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={onTogglePin}
                          className="group p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                          title="Pin Explorer to Sidebar"
                        >
                          <PinOutlineIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={onToggleSidebar}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 text-xs cursor-pointer"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
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
            className="bg-slate-800/90 text-slate-300 text-xs font-medium py-1.5 pl-2 pr-6 border border-slate-700 rounded-l-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
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
            className="w-full bg-slate-900 border-y border-r border-slate-700 text-xs rounded-r-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-slate-500 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 border border-slate-700/80 rounded-lg text-[11px] font-medium text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 hidden sm:inline">Supabase</span> Live
        </div>

        <div
          className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700/80 flex items-center justify-center text-xs font-bold text-indigo-300 shadow-inner cursor-pointer hover:border-indigo-500 transition"
          title="User Profile / Account"
        >
          👤
        </div>
      </div>
    </header>
  );
}