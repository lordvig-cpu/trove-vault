'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import '@/app/styles/components/ExplorerActionMenu.css';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface ExplorerActionMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  top: number;
  left: number;
  title: string;
  titleIcon: string;
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
  children,
}: ExplorerActionMenuProps) {
  const { animationsEnabled, isPinned } = useUIPreferences();
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      if (animationsEnabled) {
        setIsClosing(true);
        closeTimeoutRef.current = setTimeout(() => {
          setShouldRender(false);
          setIsClosing(false);
        }, 340); // Matches menuSlideOut 350ms duration
      } else {
        setShouldRender(false);
      }
    }

    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [isOpen, animationsEnabled, shouldRender]);

  if (!shouldRender || !mounted || typeof document === 'undefined') return null;

  const adjustedLeft = isPinned ? left + 10 : left;

  const animationClass = !animationsEnabled
    ? 'menuNoAnimation'
    : isClosing
    ? 'menuSlideOut'
    : 'menuSlideIn';

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
      className={`menuShell ${animationClass}`}
    >
      {/* Catchment Hover Bridge (disabled during exit to prevent sticking) */}
      {!isClosing && (
        <div
          className={`bridge ${isPinned ? 'bridgePinned' : 'bridgeUnpinned'}`}
          aria-hidden="true"
        />
      )}

      {/* Inner Content Wrapper */}
      <div className="innerContent">
        <div className="headerPill">
          <span className="headerTitle">{title}</span>
          <span className="headerIcon">{titleIcon}</span>
        </div>

        <div className="childrenContainer">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* ==========================================================================
   SUB-COMPONENTS FOR REUSABLE ACTIONS
   ========================================================================== */

export function ActionMenuItem({
  icon,
  label,
  subtext,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subtext?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-surface-hover/70 flex items-center gap-2.5 transition-colors cursor-pointer group"
    >
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-content-muted group-hover:text-content-primary">
        {icon}
      </span>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-xs font-medium text-content-primary group-hover:text-white truncate">
          {label}
        </span>
        {subtext && (
          <span className="text-[10px] text-content-muted group-hover:text-content-secondary truncate">
            {subtext}
          </span>
        )}
      </div>
    </button>
  );
}

export function ActionMenuDangerItem({
  icon,
  label,
  subtext,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subtext?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer group border border-transparent hover:border-rose-900/40"
    >
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-rose-400">
        {icon}
      </span>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-xs font-medium text-rose-300 group-hover:text-rose-200 truncate">
          {label}
        </span>
        {subtext && (
          <span className="text-[10px] text-rose-400/70 group-hover:text-rose-300 truncate">
            {subtext}
          </span>
        )}
      </div>
    </button>
  );
}

export function ActionMenuDivider() {
  return <div className="my-1 mx-2 tree-menu-divider" />;
}

export function ActionMenuRenameForm({
  initialValue,
  onSave,
  onCancel,
}: {
  initialValue: string;
  onSave: (val: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim() && val.trim() !== initialValue) {
      onSave(val.trim());
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-2 py-1 flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        className="text-xs bg-[#040811] text-white px-2 py-1 rounded border border-accent-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent-secondary"
      />
      <div className="flex items-center justify-end gap-1.5 text-[10px]">
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-0.5 rounded text-content-muted hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-2 py-0.5 rounded bg-accent-secondary/20 text-accent-secondary hover:bg-accent-secondary/30 font-medium"
        >
          Save
        </button>
      </div>
    </form>
  );
}