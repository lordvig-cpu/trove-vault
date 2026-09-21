'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePresence } from '@/hooks/usePresence';
import '@/app/styles/components/TreeSearchMenu.css';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface TreeSearchMenuProps {
  isOpen: boolean;
  onClose: () => void;
  top: number;
  left: number;
  title?: string;
  titleIcon?: React.ReactNode;
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
    ? 'searchMenuNoAnimation'
    : effectivePosition === 'right'
    ? isClosing
      ? 'searchMenuSlideOutRight'
      : 'searchMenuSlideInRight'
    : isClosing
    ? 'searchMenuSlideOut'
    : 'searchMenuSlideIn';

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
      className={`searchMenuShell ${animationClass}`}
    >
      <div className="searchMenuInner">
        <div className="searchMenuHeaderPill">
          <span className="searchMenuHeaderTitle">{title}</span>
          <span className="searchMenuHeaderIcon flex items-center justify-center">
            {titleIcon}
          </span>
        </div>

        <div className="searchMenuBody gap-1.5 mt-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
