'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PinFilledIcon, PinOutlineIcon } from '@/components/icons/PinIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface LeftSidePanelProps {
  variant: 'flyout' | 'sidebar';
  isOpen: boolean; 
  onClose: () => void; 
  onTogglePin?: () => void;
  allCollectionsCount: number;
  allItemsCount: number;
  activeCollectionId: number | null;
  onAddNewItem: () => void;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}

export default function LeftSidePanel({
  variant,
  isOpen,
  onClose,
  onTogglePin,
  allCollectionsCount,
  allItemsCount,
  activeCollectionId,
  onAddNewItem,
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
      <div className="left-side-panel-header shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
        <div>
          <span className="text-[11px] font-bold text-content-muted uppercase tracking-wider block">
            Explorer
          </span>
          <span className="text-[10px] text-content-muted font-mono">
            {allCollectionsCount} Folders • {allItemsCount} Items
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {activeCollectionId && (
            <button
              type="button"
              onClick={onAddNewItem}
              className="text-[11px] font-semibold text-accent-secondary hover:text-accent-primary shrink-0 cursor-pointer"
            >
              + New Item
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
              <PinOutlineIcon className="w-3.5 h-3.5 text-[var(--panel-border-strong)]" />
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
              <span className="text-xs text-content-primary px-1.5">✕</span>
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
        <div className="left-side-panel-notice-error px-3 py-1 text-xs text-red-400 mt-2 mx-2">
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