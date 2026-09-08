'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FolderCollapseIcon, 
  FolderExpandIcon, 
  PinFilledIcon, 
  PinOutlineIcon 
} from '@/components/icons/ExplorerIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface LeftSidePanelProps {
  variant: 'flyout' | 'sidebar';
  isOpen: boolean;
  onClose: () => void;
  onTogglePin: () => void;
  isAnyFolderExpanded: boolean;
  onToggleAllFolders: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export default function LeftSidePanel({
  variant,
  isOpen,
  onClose,
  onTogglePin,
  isAnyFolderExpanded = false,
  onToggleAllFolders,
  searchQuery,
  onSearchChange,
  loading,
  error,
  children,
}: LeftSidePanelProps) {
  const { isPinned, togglePin, animationsEnabled, isHydrated } = useUIPreferences();
  
  const transitionClass = (animationsEnabled && isHydrated) ? 'transition-all duration-700 ease-in-out' : 'transition-none';

  // Flyout lifecycle state machine
  const [renderMenu, setRenderMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (variant !== 'flyout') return;

    if (isOpen && !isPinned) {
      setRenderMenu(true);
      setIsClosing(false);
    } else if (renderMenu) {
      if (isPinned) {
        const timer = setTimeout(() => {
          setRenderMenu(false);
        }, 700);
        return () => clearTimeout(timer);
      }

      if (animationsEnabled) {
        setIsClosing(true);
        const timer = setTimeout(() => {
          setRenderMenu(false);
          setIsClosing(false);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setRenderMenu(false);
      }
    }
  }, [isOpen, renderMenu, animationsEnabled, isPinned, variant]);

  const handlePinAction = () => {
    if (onTogglePin) {
      onTogglePin();
    } else {
      togglePin();
    }
  };

  // ----------------------------------------------------------------------
  // UNIFIED CONTENT: Shared between both layout variants
  // ----------------------------------------------------------------------
  const innerContent = (
    <>
      {/* PANEL HEADER */}
      <div className="left-side-panel-header px-2.5 py-2 flex items-center justify-between gap-2 border-b border-border-subtle shrink-0">
        {/* COMPACT SEARCH INPUT */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none text-xs select-none">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className={[
              'w-full bg-[#040811] rounded-md pl-6 pr-6 py-1 text-xs',
              'text-accent-secondary placeholder:text-content-muted',
              'focus:outline-none transition-colors border',
              searchQuery.length > 0
                ? 'border-accent-secondary focus:border-accent-secondary'
                : 'border-border-subtle/80 focus:border-accent-primary',
            ].join(' ')}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="group absolute right-1.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary transition-colors text-xs cursor-pointer p-0.5"
              title="Clear search"
            >
              <span className="inline-block origin-center transition-transform duration-200 group-hover:scale-115">
                ✕
              </span>
            </button>
          )}
        </div>

        {/* HEADER ACTIONS (Toggle Folders, Pin, Close) */}
        <div className="flex items-center gap-1 shrink-0">
          {onToggleAllFolders && (
            <button
              type="button"
              onClick={onToggleAllFolders}
              className="left-side-panel-pin-btn group"
              title={isAnyFolderExpanded ? "Collapse all folders" : "Expand all folders"}
            >
              {isAnyFolderExpanded ? (
                <FolderCollapseIcon className="w-3.5 h-3.5 text-content-muted" />
              ) : (
                <FolderExpandIcon className="w-3.5 h-3.5 text-content-muted" />
              )}
            </button>
          )}

          {/* PIN BUTTON: Self-contained icon states */}
          <button
            type="button"
            onClick={handlePinAction}
            className="left-side-panel-pin-btn group"
            title={isPinned ? 'Unpin LeftSidePanel' : 'Pin LeftSidePanel'}
          >
            {variant === 'flyout' || !isPinned ? (
              <PinOutlineIcon className="w-3.5 h-3.5 text-content-muted" />
            ) : (
              <PinFilledIcon className="w-3.5 h-3.5 text-content-primary" />
            )}
          </button>

          {variant === 'flyout' && (
            <button
              type="button"
              onClick={onClose}
              className="left-side-panel-pin-btn group"
              title="Close Explorer"
            >
              <span className="inline-block origin-center transition-transform duration-200 ease-out group-hover:scale-115 text-xs text-content-primary px-1.5 select-none">
                ✕
              </span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="left-side-panel-notice-loading animate-pulse shrink-0 px-3 py-1 text-xs text-content-muted mt-2 mx-2">
          ⏳ Syncing hierarchy...
        </div>
      )}

      {error && (
        <div className="left-side-panel-notice-error mt-2 mx-2">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 pb-6 min-w-0 left-panel-scroll">
        {children}
      </div>
    </>
  );

  // ----------------------------------------------------------------------
  // FLYOUT VARIANT (Unpinned Dropdown)
  // ----------------------------------------------------------------------
  if (variant === 'flyout') {
    if (!renderMenu && !isPinned) return null;

    return (
      <>
        {isHydrated && createPortal(
          <div 
            onClick={onClose}
            className={[
              'fixed inset-0 top-14 z-[60] bg-transparent',
              animationsEnabled
                ? (isClosing && !isPinned ? 'animate-unmount-fade' : 'animate-mount-fade')
                : '',
              isPinned ? 'nav-overlay-pinned' : 'nav-overlay-unpinned',
            ].join(' ')}
            aria-hidden="true"
          />,
          document.body
        )}

        <aside
          style={{ zIndex: 80 }}
          className={[
            'nav-flyout-menu transform',
            transitionClass,
            animationsEnabled && !isPinned
              ? (isClosing ? 'animate-unmount-fade' : 'animate-mount-fade')
              : '',
            isPinned ? 'nav-flyout-pinned' : 'nav-flyout-unpinned',
          ].filter(Boolean).join(' ')}
        >
          {innerContent}
        </aside>
      </>
    );
  }

  // ----------------------------------------------------------------------
  // SIDEBAR VARIANT (Pinned Workspace Column)
  // ----------------------------------------------------------------------
  return (
    <aside
      className={`left-side-panel z-[50] ${transitionClass} ${isPinned ? 'left-side-panel-pinned' : 'left-side-panel-unpinned'}`}
    >
      {innerContent}
    </aside>
  );
}