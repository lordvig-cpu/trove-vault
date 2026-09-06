'use client';

import React, { ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface RightPanelProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export default function RightPanel({
  isOpen,
  onOpen,
  onClose,
  title = "Details",
  children,
}: RightPanelProps) {
  const { animationsEnabled } = useUIPreferences();

  const transitionClass = animationsEnabled 
    ? 'transition-all duration-700 ease-in-out' 
    : 'transition-none';

  return (
    <>
      {/* 1. FLOATING EXPAND TAB */}
      <button
        type="button"
        onClick={onOpen}
        className={[
          // Base Component Structure
          'right-panel-expand-tab group',
          transitionClass,
          // Open / Closed State
          isOpen ? 'right-panel-tab-hidden' : 'right-panel-tab-visible',
        ].filter(Boolean).join(' ')}
        title="Open Side Panel"
      >
        <ChevronLeftIcon
          className={[
            // Layout & Sizing
            'w-3.5 h-3.5',
            // Transform & Transition
            'transform group-hover:-translate-x-0.5 transition-transform',
          ].join(' ')}
        />
      </button>

      {/* 2. DOCKED RIGHT PANEL */}
        <aside
          className={[
            // Base Component Structure
            'right-side-panel',
            transitionClass,
            // Open / Closed State
            isOpen ? 'right-panel-docked-open' : 'right-panel-docked-closed',
          ].filter(Boolean).join(' ')}
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
            className={[
              'right-side-panel-btn',
              'group',
            ].join(' ')}
            title="Collapse Panel"
          >
            <ChevronRightIcon
              className={[
                // Layout & Sizing
                'w-3.5 h-3.5',
                // Typography & Color
                'text-content-muted group-hover:text-content-primary',
                // Transform & Transition
                'transform group-hover:translate-x-0.5 transition-all',
              ].join(' ')}
            />
          </button>
        </div>

        {/* Panel Body with Left-Rail Scrollbar */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pl-3 pr-2 py-3"
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