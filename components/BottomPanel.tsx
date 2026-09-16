'use client';

import React, { useState } from 'react';
import { ChevronDownIcon } from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  reservedLeft?: number;
  reservedRight?: number;
  activeCollectionName?: string;
  totalItemsCount?: number;
}

type BottomTab = 'diagnostics' | 'output' | 'terminal';

/* ==========================================================================
   2. MAIN COMPONENT: BottomPanel
   Collapsible bottom drawer anchored above the footer.
   Controls visibility of workspace diagnostics and system output.
   ========================================================================== */

export default function BottomPanel({
  isOpen,
  onClose,
  reservedLeft = 0,
  reservedRight = 0,
  activeCollectionName,
  totalItemsCount = 0,
}: BottomPanelProps) {
  const { animationsEnabled, theme } = useUIPreferences();
  const [activeTab, setActiveTab] = useState<BottomTab>('diagnostics');

  const transitionClass = animationsEnabled
    ? 'transition-[transform,opacity,left,right] duration-500 ease-in-out'
    : 'transition-none';

  return (
    <aside
      style={{
        left: `${reservedLeft}px`,
        right: `${reservedRight}px`,
      }}
      className={[
        'bottom-side-panel',
        transitionClass,
        isOpen ? 'bottom-panel-docked-open' : 'bottom-panel-docked-closed',
      ].join(' ')}
      aria-hidden={!isOpen}
    >
      {/* Panel Header with Navigation Tabs & Collapse Control */}
      <div className="bottom-side-panel-header">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`bottom-panel-tab ${
              activeTab === 'diagnostics' ? 'bottom-panel-tab-active' : ''
            }`}
          >
            Diagnostics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('output')}
            className={`bottom-panel-tab ${
              activeTab === 'output' ? 'bottom-panel-tab-active' : ''
            }`}
          >
            Output
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`bottom-panel-tab ${
              activeTab === 'terminal' ? 'bottom-panel-tab-active' : ''
            }`}
          >
            Terminal
          </button>
        </div>

        {/* Header Right Action: Close Downward */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono ui-muted">
            {activeCollectionName ? `Collection: ${activeCollectionName}` : 'All Collections'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bottom-side-panel-btn group"
            title="Collapse Bottom Panel"
          >
            <ChevronDownIcon className="w-3.5 h-3.5 ui-muted origin-center transition-all duration-200 ease-out group-hover:translate-y-0.5 group-hover:scale-115" />
          </button>
        </div>
      </div>

      {/* Panel Scrollable Content Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 font-mono text-xs space-y-1 relative z-10 select-text">
        {activeTab === 'diagnostics' && (
          <div className="space-y-1 text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">● [ONLINE]</span>
              <span>TroveVault Studio Core Engine v2.0</span>
            </div>
            <div className="text-slate-400">
              <span className="text-sky-400">[DATABASE]</span> SQLite schema v2 connected &amp; synced
            </div>
            <div className="text-slate-400">
              <span className="text-sky-400">[INVENTORY]</span> {totalItemsCount} total records loaded in memory
            </div>
            <div className="text-slate-400">
              <span className="text-amber-400">[THEME]</span> Active preset: {theme} (OKLCH Color Space)
            </div>
            <div className="text-slate-500">
              [LATENCY] Client-side layout engine: 60fps compositor layer
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="space-y-1 text-slate-400">
            <div className="text-slate-500">&gt; Workspace viewports initialized successfully.</div>
            <div className="text-slate-500">&gt; Pinned Explorer &amp; Detail Inspector channels synchronized.</div>
            <div className="text-emerald-400/80">&gt; Ready for queries and taxonomy modifications.</div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="space-y-1 text-slate-400">
            <div className="text-slate-400">
              <span className="text-emerald-400">trove-vault:~$</span> status --all
            </div>
            <div className="text-slate-500 pl-4">
              All services healthy. Pinned Sidebar: {reservedLeft > 0 ? `${reservedLeft}px` : 'hidden'}. Details Drawer: {reservedRight > 0 ? `${reservedRight}px` : 'hidden'}.
            </div>
            <div className="text-slate-400 flex items-center gap-1">
              <span className="text-emerald-400">trove-vault:~$</span>
              <span className="inline-block w-2 h-3.5 bg-sky-400 animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

