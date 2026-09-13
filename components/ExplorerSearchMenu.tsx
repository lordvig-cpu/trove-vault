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
  children,
}: ExplorerSearchMenuProps) {
  const { animationsEnabled } = useUIPreferences();
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        margin: 0,
        zIndex: isPinned ? 30 : 70,
      }}
      // Swapped 'searchMenuDropIn' to 'searchMenuSlideIn'
      className={`searchMenuShell ${animationsEnabled ? 'searchMenuSlideIn' : 'searchMenuNoAnimation'}`}
    >
      <div className="searchMenuInner">
        <div className="searchMenuHeaderPill">
          <span className="searchMenuHeaderTitle">{title}</span>
          <span className="searchMenuHeaderIcon flex items-center justify-center">{titleIcon}</span>
        </div>

        <div className="searchMenuBody gap-1.5 mt-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}