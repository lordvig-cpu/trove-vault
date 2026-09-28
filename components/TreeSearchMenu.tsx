'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePresence } from '@/hooks/usePresence';
import '@/app/styles/components/TreeSubMenu.css';
import '@/app/styles/components/TreeSearchMenu.css';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface TreeSearchMenuProps {
  isOpen: boolean;
  onClose: () => void;
  top: number;
  left: number;
  title?: string;
  titleIcon?: React.ReactNode;
  /**
   * Rendered inside the head card's dark tab-band strip, in the same spot a gear-icon flyout's
   * ActionMenuTabs would sit -- there's nothing to switch between here, so it holds the filtered
   * item-type count instead of tab buttons.
   */
  subheader?: React.ReactNode;
  isPinned?: boolean;
  isFlyout?: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
  position?: 'left' | 'right';
  children: React.ReactNode;
}

export default function TreeSearchMenu({
  isOpen,
  onClose,
  top,
  left,
  title = 'Advanced Search',
  titleIcon,
  subheader,
  isPinned = true,
  isFlyout = false,
  triggerRef,
  position,
  children,
}: TreeSearchMenuProps) {
  const { animationsEnabled } = useUIPreferences();
  const effectivePosition = position ?? 'left';
  const { mounted, renderMenu, isClosing } = usePresence(isOpen, 500, animationsEnabled);
  const menuRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------------
  2. CLICK-OUTSIDE & ESCAPE DISMISSAL
  Excludes clicks on the trigger button to prevent the re-open race condition
  ------------------------------------------------------------------------ */
  useEffect(() => {
    if (!isOpen || isClosing) return;

    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(targetNode) &&
        (!triggerRef?.current || !triggerRef.current.contains(targetNode))
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.preventDefault();
        onClose();
        triggerRef?.current?.focus();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isClosing, onClose, triggerRef]);

  if (!renderMenu || !mounted || typeof document === 'undefined') return null;

  const animationClass = !animationsEnabled
    ? 'menuNoAnimation'
    : effectivePosition === 'right'
    ? isClosing
      ? 'menuSlideOutRight'
      : 'menuSlideInRight'
    : isClosing
    ? 'menuSlideOut'
    : 'menuSlideIn';

  // Menu coordinates already account for panel width and docking side
  const adjustedLeft = left;

  return createPortal(
    <div
      ref={menuRef}
      inert={!isOpen}
      aria-hidden={!isOpen}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${adjustedLeft}px`,
        margin: 0,
        zIndex: isFlyout ? 70 : isPinned ? 35 : 45,
      }}
      className={`searchMenuShell menuShellSplit ${effectivePosition === 'right' ? 'menuShellSplit-right' : ''} ${animationClass}`}
    >
      <div className="menuShell menuShellHead menuShellXWide">
        <div className="innerContent">
          <div className="headerPill">
            <span className="headerTitle">{title}</span>
            <span className="headerIcon">{titleIcon}</span>
          </div>
          <div className="menuSubheader">
            <div className="menuTabs items-center">{subheader}</div>
          </div>
        </div>
      </div>
      <div className="menuShell menuShellBody menuShellXWide">
        <div className="innerContent">
          <div className="childrenContainer">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
