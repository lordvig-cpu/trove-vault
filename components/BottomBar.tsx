'use client';

import React from 'react';

interface BottomBarProps {
  activeCollectionName?: string;
  totalItemsCount?: number;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}

export default function BottomBar({
  animationsEnabled,
  setAnimationsEnabled,
  activeCollectionName,
  totalItemsCount = 0,
  isRightPanelOpen,
  onToggleRightPanel,
}: BottomBarProps) {
  return (
    <footer className="trove-bottombar h-9 flex items-center justify-between px-4 text-xs select-none shrink-0 z-40">
    
      {/* Left Status Area */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-content-muted">
            Status: <span className="text-content-primary">Ready</span>
          </span>
        </div>

        {activeCollectionName && (
          <>
            <span className="text-border-subtle">|</span>
            <span className="text-[11px] text-content-muted truncate max-w-[200px] sm:max-w-xs">
              Active: <span className="text-accent-secondary font-medium">{activeCollectionName}</span>
            </span>
          </>
        )}
      </div>

      {/* Center Utility Placeholder */}
      <div className="hidden md:flex items-center gap-2 text-xs text-content-muted">
        {/* Breadcrumb / quick action placeholder */}
      </div>

      {/* Right Metrics & Panel Toggle */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-content-muted">
          Items: <span className="text-content-primary font-semibold">{totalItemsCount}</span>
        </span>

        <span className="text-border-subtle">|</span>

        {/* Right Dock Panel Toggle Icon */}
        <button
          type="button"
          onClick={onToggleRightPanel}
          title={isRightPanelOpen ? 'Close Side Panel' : 'Open Side Panel'}
          className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
            isRightPanelOpen
              ? 'bg-accent-primary/20 border-accent-primary text-accent-secondary'
              : 'bg-surface hover:bg-surface-hover border-border-subtle text-content-muted hover:text-content-primary'
          }`}
        >
          {/* Dock Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="15" y1="3" x2="15" y2="21" />
            <path d="M18 9l-3 3 3 3" />
          </svg>
        </button>

        <label className="flex items-center gap-2 text-xs text-content-muted cursor-pointer">
          <input 
            type="checkbox" 
            checked={animationsEnabled} 
            onChange={(e) => setAnimationsEnabled(e.target.checked)}
            className="rounded border-border-subtle bg-surface text-accent-secondary focus:ring-0 cursor-pointer"
          />
          Animations
        </label>
      </div>
    </footer>
  );
}