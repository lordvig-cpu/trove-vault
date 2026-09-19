'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { createPortal } from 'react-dom';
import '@/app/styles/components/ExplorerActionMenu.css';
import { useUIPreferences } from '@/context/UIPreferencesContext';

/* --------------------------------------------------------------------------
  ACTION MENU CONTRACT
  The parent tree row owns menu state and coordinates. This component owns
  rendering, portal mounting, positioning offsets, and open/close animation.
  -------------------------------------------------------------------------- */
interface ExplorerActionMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  top: number;
  left: number;
  title: string;
  titleIcon: string;
  position?: 'left' | 'right';
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
  position,
  children,
}: ExplorerActionMenuProps) {
  const { animationsEnabled, isPinned } = useUIPreferences();
  const effectivePosition = position ?? 'left';

  const { mounted, renderMenu, isClosing } = usePresence(isOpen, 340, animationsEnabled);
  if (!renderMenu || !mounted) return null;

  // Menu coordinates already compute exact seam positioning
  const adjustedLeft = left;

  const animationClass = !animationsEnabled
    ? 'menuNoAnimation'
    : effectivePosition === 'right'
    ? isClosing
      ? 'menuSlideOutRight'
      : 'menuSlideInRight'
    : isClosing
    ? 'menuSlideOut'
    : 'menuSlideIn';

  const bridgeClass =
    effectivePosition === 'right'
      ? isPinned
        ? 'bridgePinnedRight'
        : 'bridgeUnpinnedRight'
      : isPinned
      ? 'bridgePinned'
      : 'bridgeUnpinned';

  // Render outside the tree's overflow container so the menu can cross panel
  // boundaries and remain positioned against the viewport.
  return createPortal(
    <div
      data-explorer-menu
      inert={!isOpen}
      aria-hidden={!isOpen}
      onFocus={onMouseEnter}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${adjustedLeft}px`,
        margin: 0,
        zIndex: isPinned ? 35 : 'var(--z-explorer-unpinned)',
      }}
      className={`menuShell ${animationClass}`}
    >
      {/* Catchment Hover Bridge (disabled during exit to prevent sticking) */}
      {!isClosing && (
        <div
          className={`bridge ${bridgeClass}`}
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
  REUSABLE ACTION CONTROLS
  ========================================================================== */

// Standard action with a neutral hover treatment.
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
      className="actionMenuItem group"
    >
      <span className="w-4 h-4 flex items-center justify-center shrink-0 ui-muted ui-hover-primary">
        {icon}
      </span>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="actionMenuItemLabel truncate">
          {label}
        </span>
        {subtext && (
          <span className="actionMenuItemSubtext truncate">
            {subtext}
          </span>
        )}
      </div>
    </button>
  );
}

// Destructive action variant used for delete operations.
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
      className="actionMenuDangerItem group"
    >
      <span className="actionMenuDangerIcon">
        {icon}
      </span>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="actionMenuDangerLabel truncate">
          {label}
        </span>
        {subtext && (
          <span className="actionMenuDangerSubtext truncate">
            {subtext}
          </span>
        )}
      </div>
    </button>
  );
}

// Visual separator between groups of related menu actions.
export function ActionMenuDivider() {
  return <div className="my-1 mx-2 tree-menu-divider" />;
}

// Inline rename editor used inside collection and item action menus.
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

  // Focus and select the existing name as soon as the form appears.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Save only meaningful changes; otherwise treat submission as cancellation.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim() && val.trim() !== initialValue) {
      onSave(val.trim());
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="actionMenuRenameForm">
      <input
        ref={inputRef}
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }
        }}
        className="actionMenuRenameInput"
      />
      <div className="actionMenuRenameActions">
        <button
          type="button"
          onClick={onCancel}
          className="actionMenuRenameCancelBtn"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="actionMenuRenameSaveBtn"
        >
          Save
        </button>
      </div>
    </form>
  );
}
