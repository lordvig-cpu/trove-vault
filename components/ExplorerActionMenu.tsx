'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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

  // Offset pinned menu further right so the panel border cleanly clears the inner text/icons
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
      className={`w-56 bg-[var(--popover-surface-bg)] border border-[var(--panel-border-strong)] shadow-[var(--popover-elevation-shadow)] rounded-lg flex flex-col py-1 backdrop-blur-xl pointer-events-auto relative ${
        animationsEnabled ? 'animate-explorer-menu-in' : ''
      }`}
    >
      {/* Catchment Hover Bridge: wider when pinned to span the extra offset */}
      <div
        className={`absolute -top-3 -bottom-3 pointer-events-auto ${
          isPinned ? '-left-12 w-12' : '-left-8 w-8'
        }`}
        style={{ zIndex: 1 }}
        aria-hidden="true"
      />

      {/* Inner Content Wrapper */}
      <div className="relative z-10 flex flex-col pl-5 pr-1">
        <div className="px-2.5 py-1.5 border-b border-[var(--panel-border-subtle)] mb-1 flex items-center justify-between bg-[var(--card-surface-hover)]/30 rounded-md">
          <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">
            {title}
          </span>
          <span className="text-[10px]">{titleIcon}</span>
        </div>

        <div className="flex flex-col">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}