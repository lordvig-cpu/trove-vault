'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '@/app/styles/components/ExplorerActionMenu.css';

interface ExplorerActionMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  top: number;
  left: number;
  title: string;
  titleIcon: string;
  animationsEnabled?: boolean;
  isPinned?: boolean;
  children: React.ReactNode;
}

export default function ExplorerActionMenu({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  top,
  left,
  title,
  titleIcon,
  animationsEnabled = true,
  isPinned = true,
  children,
}: ExplorerActionMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const adjustedLeft = isPinned ? left + 10 : left;

  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${adjustedLeft}px`,
        margin: 0,
        zIndex: isPinned ? 30 : 70,
      }}
      className={`menuShell ${animationsEnabled ? 'animate-explorer-menu-in' : ''}`}
    >
      {/* Catchment Hover Bridge */}
      <div
        className={`bridge ${isPinned ? 'bridgePinned' : 'bridgeUnpinned'}`}
        aria-hidden="true"
      />

      {/* Inner Content Wrapper */}
      <div className="innerContent">
        <div className="headerPill">
          <span className="headerTitle">{title}</span>
          <span className="headerIcon">{titleIcon}</span>
        </div>

        <div className="childrenContainer">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}