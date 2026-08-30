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
      {/* 1. FLOATING EXPAND TAB (Slides right and fades out when panel opens) */}
      <button
        type="button"
        onClick={onOpen}
        className={`absolute right-0 top-5 z-30 h-7 px-2 rounded-l-md bg-surface/80 hover:bg-surface-hover border-y border-l border-border-subtle hover:border-border-strong text-content-muted hover:text-content-primary shadow-lg backdrop-blur-md cursor-pointer flex items-center justify-center group ${transitionClass} ${
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
        className={`absolute top-2 bottom-2 right-[10px] w-[340px] max-w-[calc(100vw-30px)] bg-surface/80 border border-border-strong rounded-l-xl rounded-r-none shadow-[-20px_20px_50px_rgba(0,0,0,0.85)] z-40 flex flex-col overflow-hidden ${transitionClass} ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0 pointer-events-none'
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
            {title}
          </span>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-hover border border-transparent hover:border-border-subtle transition cursor-pointer flex items-center justify-center group"
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

        {/* Panel Body with Guaranteed Left-Rail Scrollbar */}
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