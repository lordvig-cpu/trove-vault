'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import '@/app/styles/components/ExplorerSearchMenu.css';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface ExplorerSearchMenuProps {
  isOpen: boolean;
  onClose: () => void;
  top: number;
  left: number;
  title?: string;
  titleIcon?: React.ReactNode;
  isPinned?: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
  position?: 'left' | 'right';
  children: React.ReactNode;
}

export default function ExplorerSearchMenu({
  isOpen,
  onClose,
  top,
  left,
  title = 'Advanced Search',
  titleIcon,
  isPinned = true,
  triggerRef,
  position,
  children,
}: ExplorerSearchMenuProps) {
  const { animationsEnabled, primaryPosition } = useUIPreferences();
  const effectivePosition = position ?? (primaryPosition === 'right' ? 'right' : 'left');
  const [mounted, setMounted] = useState(false);
  const [renderMenu, setRenderMenu] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ------------------------------------------------------------------------ 
  1. LIFECYCLE & UNMOUNT DELAY 
  Keeps portal mounted for 500ms when isOpen turns false to play slide-out 
  ------------------------------------------------------------------------ */

  // Controls mounting and unmounting timer for exit slide transition 
  useEffect(() => { 
    if (isOpen) { 
      setRenderMenu(true); 
      setIsClosing(false); 
    } 
    else if (renderMenu) { 
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
  }, [isOpen, renderMenu, animationsEnabled]);

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
      if (e.key === 'Escape') onClose();
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
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${adjustedLeft}px`,
        margin: 0,
        zIndex: isPinned ? 30 : 70,
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
