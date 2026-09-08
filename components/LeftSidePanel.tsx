'use client';

import React, { useState, useEffect, useRef } from 'react';
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

const MIN_WIDTH = 220;
const MAX_WIDTH = 640;

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
  
  const [panelWidth, setPanelWidth] = useState<number>(280);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      // Distance from left viewport edge
      const rawWidth = e.clientX;
      const clampedWidth = Math.min(
        Math.max(rawWidth, MIN_WIDTH),
        Math.min(MAX_WIDTH, window.innerWidth * 0.75)
      );
      setPanelWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  // Disable transitions while actively dragging for 60+ FPS tracking
  const transitionClass = (!isDragging && animationsEnabled && isHydrated) 
    ? 'transition-all duration-700 ease-in-out' 
    : 'transition-none';

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
      {/* RESIZE HANDLE STRIP (Right Edge) - Docked Only */}
      {isPinned && (
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
          }}
          className="group/handle absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-50 flex items-center justify-center select-none"
          title="Drag to resize panel"
        >
          {/* Full-height amber seam line (5px) */}
          <div
            className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[5px] transition-all duration-150 pointer-events-none ${
              isDragging
                ? 'bg-accent-secondary opacity-100'
                : 'opacity-0 group-hover/handle:opacity-100 group-hover/handle:bg-accent-secondary'
            }`}
          />

          {/* Visual indicator handle pill */}
          <div 
            className={`relative z-10 w-1 h-12 rounded-full transition-all duration-200 pointer-events-none ${
              isDragging 
                ? 'bg-accent-secondary w-1.5 h-20 opacity-100' 
                : 'bg-accent-secondary/60 group-hover/handle:bg-accent-secondary group-hover/handle:h-16 group-hover/handle:opacity-100 opacity-0'
            }`} 
          />
        </div>
      )}

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

          {/* PIN BUTTON */}
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
            'nav-flyout-menu relative transform',
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
      style={{ width: isPinned ? `${panelWidth}px` : undefined }}
      className={`left-side-panel relative z-[50] ${transitionClass} ${isPinned ? 'left-side-panel-pinned' : 'left-side-panel-unpinned'}`}
    >
      {innerContent}
    </aside>
  );
}