'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import '@/app/styles/components/ExplorerActionMenu.css';
import { useUIPreferences } from '@/context/UIPreferencesContext2';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

/**
 * Props for the ExplorerActionMenu flyout portal.
 * @property isOpen - Controls mounting and visibility of the action menu portal
 * @property onMouseEnter - Cancels close grace-period timers when cursor enters portal hitboxes
 * @property onMouseLeave - Initiates close grace-period timers when cursor departs portal hitboxes
 * @property top - Viewport Y-coordinate (px) calculated relative to the triggering gear icon
 * @property left - Viewport X-coordinate (px) calculated relative to the triggering gear icon
 * @property title - Pill banner label (e.g., "Folder Actions", "Item Actions")
 * @property titleIcon - Context icon glyph shown adjacent to the title banner
 * @property children - Interactive menu items, dividers, or inline forms rendered inside
 */
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

/* ==========================================================================
   2. MAIN COMPONENT: ExplorerActionMenu
   ========================================================================== */

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
  /* ------------------------------------------------------------------------
     2.1 CONTEXT & PREFERENCES
     Reads user preferences to conditionally apply slide animations and
     adjust z-index layering when the Explorer panel is pinned vs floating.
     ------------------------------------------------------------------------ */
  const { animationsEnabled, isPinned } = useUIPreferences();

  /* ------------------------------------------------------------------------
     2.2 SSR HYDRATION SAFETY
     React Portals require access to `document.body`. Delay mounting until
     after client hydration to prevent server/client DOM mismatch warnings.
     ------------------------------------------------------------------------ */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard against unmounted SSR execution or closed visibility states
  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  /* ------------------------------------------------------------------------
     2.3 VIEWPORT POSITIONING GEOMETRY
     Offset the horizontal position by +14px to guarantee clean clearance
     from the triggering gear icon boundary.
     ------------------------------------------------------------------------ */
  const adjustedLeft = left + 14;

  /* ------------------------------------------------------------------------
     2.4 PORTAL SHELL & CATCHMENT HITBOX RENDERING
     Mounts directly to document.body to break free from parent CSS overflow
     clipping in the left side panel.
     ------------------------------------------------------------------------ */
  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${adjustedLeft}px`,
        margin: 0,
        zIndex: isPinned ? 30 : 70, // Sits above docked panels while remaining under modals
      }}
      className={`menuShell ${animationsEnabled ? 'menuSlideIn' : 'menuNoAnimation'}`}
    >
      {/* 
        Catchment Hover Bridge:
        Spans the invisible geometric void between the trigger gear icon and this
        portal body so fast or diagonal cursor transit does not trigger mouseLeave.
      */}
      <div
        className={`bridge ${isPinned ? 'bridgePinned' : 'bridgeUnpinned'}`}
        aria-hidden="true"
      />

      {/* Internal Content Chassis */}
      <div className="innerContent">
        {/* Context Category Pill Banner */}
        <div className="headerPill">
          <span className="headerTitle">{title}</span>
          <span className="headerIcon">{titleIcon}</span>
        </div>

        {/* Action Item Slots */}
        <div className="childrenContainer">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* ==========================================================================
   3. SUB-COMPONENTS & ACTION PRIMITIVES
   Reusable modular rows, destructive buttons, dividers, and rename forms.
   ========================================================================== */

/**
 * Standard Action Row Button
 * Renders an interactive option with leading icon, primary label, and descriptor.
 */
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

/**
 * Destructive / Danger Action Row Button
 * Uses danger token variables to display high-visibility warning colors on hover.
 */
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

/**
 * Menu Divider Line
 * Inset separator utilizing `--explorer-menu-divider` theme variables.
 */
export function ActionMenuDivider() {
  return <div className="my-1 mx-1 tree-menu-divider" />;
}

/**
 * Inline Rename Form
 * Self-focusing text input enabling instant in-place folder or item renaming
 * without opening a full blocking modal dialog.
 */
export function ActionMenuRenameForm({
  initialValue,
  onSave,
  onCancel,
}: {
  initialValue: string;
  onSave: (value: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || value.trim() === initialValue) {
      onCancel();
      return;
    }
    try {
      setIsSaving(true);
      await onSave(value.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="renameForm">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        className="renameInput"
        placeholder="Name..."
        disabled={isSaving}
      />
      <button
        type="submit"
        disabled={isSaving || !value.trim()}
        className="px-2.5 py-1 text-xs font-semibold rounded-md border border-transparent shrink-0 transition-all cursor-pointer bg-surface-hover/80 text-content-muted hover:text-content-primary hover:bg-surface-hover hover:border-border-subtle disabled:opacity-50"
      >
        {isSaving ? '...' : 'Save'}
      </button>
    </form>
  );
}