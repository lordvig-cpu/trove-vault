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
      /* bg-amber-950/45 brings out translucent glass vibrancy; backdrop-blur-md prevents over-frosting */
      className={`w-56 bg-amber-950/45 border border-amber-500/40 shadow-[0_8px_32px_0_rgba(245,158,11,0.2)] rounded-lg flex flex-col py-1 backdrop-blur-md pointer-events-auto relative ${
        animationsEnabled ? 'animate-explorer-menu-in' : ''
      }`}
    >
      {/* Catchment Hover Bridge */}
      <div
        className={`absolute -top-3 -bottom-3 pointer-events-auto ${
          isPinned ? '-left-12 w-12' : '-left-8 w-8'
        }`}
        style={{ zIndex: 1 }}
        aria-hidden="true"
      />

      {/* Inner Content Wrapper */}
      <div className="relative z-10 flex flex-col pl-5 pr-1">
        {/* Header: px-3 aligns the text with the button rows below */}
        <div className="px-4 py-1.5 border-b border-amber-500/25 mb-1 flex items-center justify-between bg-amber-500/10 rounded-md">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            {title}
          </span>
          <span className="text-[10px] text-amber-300">{titleIcon}</span>
        </div>

        <div className="flex flex-col text-amber-100">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}