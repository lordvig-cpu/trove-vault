'use client';

import React from 'react';

interface RightSidePanelProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function RightSidePanel({
  isOpen,
  onOpen,
  onClose,
  title = 'Side Panel',
  subtitle = 'Utility & Actions',
  children,
}: RightSidePanelProps) {
  return (
    <>
      {/* FLOATING EXPAND TAB ON RIGHT EDGE (When Closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="absolute right-0 top-2.5 z-30 h-7 px-2 rounded-l-md bg-surface/90 hover:bg-surface-hover border-y border-l border-border-subtle hover:border-border-strong text-content-muted hover:text-white shadow-lg backdrop-blur-md transition-all cursor-pointer flex items-center justify-center group"
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
      )}

      {/* RIGHT DOCKED PANEL */}
      <aside
        className={`absolute right-0 top-0 h-full border-border-subtle bg-surface/95 backdrop-blur-md flex flex-col overflow-x-hidden overflow-y-auto shrink-0 transition-all duration-300 ease-in-out z-30 ${
          isOpen
            ? 'w-76 max-w-76 border-l p-3 opacity-100 shadow-[-12px_0_30px_-10px_rgba(0,0,0,0.75)] translate-x-0'
            : 'w-76 max-w-76 translate-x-full border-l-0 p-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header Row */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-2.5 shrink-0 pr-8">
          <div>
            <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
              {title}
            </span>
            <span className="text-[10px] text-content-muted font-mono">
              {subtitle}
            </span>
          </div>
        </div>

        {/* Collapse Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 z-30 h-7 w-7 rounded-md text-content-muted hover:text-white hover:bg-surface-hover border border-transparent hover:border-border-subtle transition cursor-pointer flex items-center justify-center group"
          title="Collapse Panel"
        >
          <svg 
            className="w-3.5 h-3.5 text-content-muted group-hover:text-white transform group-hover:translate-x-0.5 transition-all" 
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

        {/* Panel Scrollable Content Body */}
        <div className="flex-1 py-3 text-xs text-content-muted">
          {children || (
            <div className="border border-dashed border-border-subtle/80 rounded-xl p-4 text-center">
              Panel ready for activity logs, quick attributes, or history.
            </div>
          )}
        </div>
      </aside>
    </>
  );
}