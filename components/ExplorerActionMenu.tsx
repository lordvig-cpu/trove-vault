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
  isPinned = true, // Default to true for safety
  children,
}: ExplorerActionMenuProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      console.log('🔍 ExplorerActionMenu rendered:', {
        isPinned,
        computedZIndex: isPinned ? 30 : 80,
      });
    }
  }, [isOpen, isPinned]);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ 
        position: 'fixed',
        top: `${top}px`, 
        left: `${left}px`,
        margin: 0,
        zIndex: isPinned ? 30 : 80 
      }}
      className={`w-48 bg-[var(--popover-surface-bg)] border border-[var(--panel-border-strong)] shadow-[var(--popover-elevation-shadow)] rounded-lg flex flex-col py-1 backdrop-blur-xl pointer-events-auto relative ${
        animationsEnabled ? 'animate-explorer-menu-in' : ''
      }`}
    >
      {/* Expanded Hover Catchment Bridge:
          Extends 32px leftward and 12px vertically beyond the bounds to eliminate any deadzone */}
      <div 
        className="absolute -left-8 -top-3 -bottom-3 w-8 pointer-events-auto" 
        style={{ zIndex: 1 }}
        aria-hidden="true" 
      />
      
      <div className="px-3 py-1.5 border-b border-[var(--panel-border-subtle)] mb-1 flex items-center justify-between bg-[var(--card-surface-hover)]/30">
        <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">{title}</span>
        <span className="text-[10px]">{titleIcon}</span>
      </div>
      {children}
    </div>,
    document.body
  );
}