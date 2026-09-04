'use client';

import React, { ReactNode } from 'react';

interface RightPanelProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  animationsEnabled?: boolean;
}

export default function RightPanel({
  isOpen,
  onOpen,
  onClose,
  title = "Details",
  children,
  animationsEnabled = true,
}: RightPanelProps) {
  const transitionClass = animationsEnabled 
    ? 'transition-all duration-700 ease-in-out' 
    : 'transition-none';

  return (
    <>
      {/* 1. FLOATING EXPAND TAB */}
      <button
        type="button"
        onClick={onOpen}
        className={`right-panel-expand-tab group ${transitionClass} ${
          isOpen ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
        }`}
        title="Open Side Panel"
      >
        <svg 
          className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* 2. DOCKED RIGHT PANEL */}
      <aside
        className={`right-side-panel ${transitionClass} ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0 pointer-events-none'
        }`}
      >
        {/* Panel Header */}
        <div className="right-side-panel-header">
          <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
            {title}
          </span>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={onClose}
            className="right-side-panel-btn group"
            title="Collapse Panel"
          >
            <svg 
              className="w-3.5 h-3.5 text-content-muted group-hover:text-content-primary transform group-hover:translate-x-0.5 transition-all" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Panel Body with Left-Rail Scrollbar */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden trove-panel-scroll pl-3 pr-2 py-3"
          style={{ direction: 'rtl' }}
        >
          <div 
            className="space-y-4 text-content-primary"
            style={{ direction: 'ltr' }}
          >
            {children ? (
              children
            ) : (
              <>
                {Array.from({ length: 80 }).map((_, i) => (
                  <div key={i} className="text-xs font-mono">
                    Test Row #{i + 1}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}