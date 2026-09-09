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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const adjustedLeft = left + 14;

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
      className={`menuShell ${animationsEnabled ? 'menuSlideIn' : 'menuNoAnimation'}`}
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

        <div className="childrenContainer">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

export function ActionMenuItem({
  icon,
  label,
  subtext,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subtext: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded tree-menu-item cursor-pointer"
    >
      <span className="w-5 shrink-0 flex items-center justify-center text-sm leading-none group-hover/action:scale-105 transition-transform select-none">
        {icon}
      </span>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-xs font-medium text-content-primary">{label}</span>
        <span className="text-[9px] text-content-muted">{subtext}</span>
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
  subtext: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/action w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded tree-menu-item-danger cursor-pointer"
    >
      <span className="w-5 shrink-0 flex items-center justify-center text-sm leading-none group-hover/action:scale-105 transition-transform select-none">
        {icon}
      </span>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-xs font-medium tree-menu-danger-label">{label}</span>
        <span className="text-[9px] tree-menu-danger-subtext">{subtext}</span>
      </div>
    </button>
  );
}

export function ActionMenuDivider() {
  return <div className="my-1 mx-1 tree-menu-divider" />;
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
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialValue) {
      onCancel();
      return;
    }
    try {
      setIsSaving(true);
      await onSave(trimmed);
      onCancel();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-2 py-1.5 mx-1 my-0.5 rounded-lg border border-border-subtle/80 bg-[#070f1d] flex items-center gap-1.5 shadow-inner"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        className={[
          'w-full bg-[#040811] rounded-md px-2 py-1 text-xs',
          'text-accent-secondary placeholder:text-content-muted',
          'focus:outline-none transition-colors border',
          value.trim().length > 0
            ? 'border-accent-secondary focus:border-accent-secondary'
            : 'border-border-subtle/80 focus:border-accent-primary',
        ].join(' ')}
        placeholder="Name..."
        disabled={isSaving}
      />
      <button
        type="submit"
        disabled={isSaving || !value.trim()}
        className={[
          'px-2.5 py-1 text-xs font-semibold rounded-md border border-transparent shrink-0 transition-all cursor-pointer',
          'bg-surface-hover/80 text-content-muted hover:text-content-primary hover:bg-surface-hover hover:border-border-subtle',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
        title="Save changes"
      >
        {isSaving ? '...' : 'Save'}
      </button>
    </form>
  );
}