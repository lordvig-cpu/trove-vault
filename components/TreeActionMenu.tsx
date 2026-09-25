'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { createPortal } from 'react-dom';
import '@/app/styles/components/TreeActionMenu.css';
import { ChevronDownIcon } from '@/components/icons/PanelIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useTreePanel } from '@/context/TreePanelContext';

/* --------------------------------------------------------------------------
  ACTION MENU CONTRACT
  The parent tree row owns menu state and coordinates. This component owns
  rendering, portal mounting, positioning offsets, and open/close animation.
  -------------------------------------------------------------------------- */
interface TreeActionMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  top: number;
  left: number;
  title: string;
  titleIcon?: React.ReactNode;
  /** 'pill' (default): boxed amber title bar, icon on the right. 'plain': no box, white title with
   *  the icon in front -- used by the tabbed Actions/Properties flyouts (see ActionMenuTabs). */
  titleStyle?: 'pill' | 'plain';
  /** Fixed strip under the title bar (e.g. ActionMenuTabs): stays put while `children` scrolls. */
  subheader?: React.ReactNode;
  position?: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}

export default function TreeActionMenu({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  top,
  left,
  title,
  titleIcon,
  titleStyle = 'pill',
  subheader,
  position,
  className,
  children,
}: TreeActionMenuProps) {
  const { animationsEnabled, isPinned: primaryPinned } = useUIPreferences();
  const panel = useTreePanel();
  const isPinned = panel?.isPinned ?? primaryPinned;
  const effectivePosition = position ?? 'left';

  const { mounted, renderMenu, isClosing } = usePresence(isOpen, 340, animationsEnabled);
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedTop, setAdjustedTop] = useState(top);

  // Adjust state during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevTop, setPrevTop] = useState(top);
  if (prevTop !== top) {
    setPrevTop(top);
    setAdjustedTop(top);
  }

  useEffect(() => {
    if (!menuRef.current || !isOpen) return;
    const rect = menuRef.current.getBoundingClientRect();
    const bottomNavReserve = 64; // Reserve space for bottom navigation footer + status bar
    const maxAllowedTop = window.innerHeight - rect.height - bottomNavReserve;
    if (top > maxAllowedTop) {
      setAdjustedTop(Math.max(16, Math.round(maxAllowedTop)));
    }
  }, [top, isOpen, children]);

  if (!renderMenu || !mounted) return null;

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
      ref={menuRef}
      data-tree-menu
      inert={!isOpen}
      aria-hidden={!isOpen}
      onFocus={onMouseEnter}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: `${adjustedTop}px`,
        left: `${adjustedLeft}px`,
        margin: 0,
        zIndex: panel?.isFlyout ? 70 : isPinned ? 35 : 45,
      }}
      className={`menuShell ${animationClass} ${className || ''}`}
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
        <div className={`headerPill ${titleStyle === 'plain' ? 'headerPill-plain' : ''}`}>
          <span className="headerTitle">{title}</span>
          <span className="headerIcon">{titleIcon}</span>
        </div>

        {subheader && <div className="menuSubheader">{subheader}</div>}

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

// Two-or-more tab switcher for a menu that mixes kinds of content (e.g. Actions / Properties).
// Pass it as TreeActionMenu's `subheader` so it stays fixed while the tab's body scrolls. The
// caller owns which tab is active and renders the matching body itself.
export function ActionMenuTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="menuTabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`menuTab ${active === tab.id ? 'menuTab-active' : ''}`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// A collapsible group of controls: a shadowed-rule heading with a chevron, and a body that shows
// only while `isOpen`. Controlled (the caller owns open/closed) so the state survives the menu
// closing and reopening. Sections stack directly, the heading's rule doubling as the horizontal
// bar between them.
export function ActionMenuSection({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const bodyId = useId();
  return (
    <div className="menuSection">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={bodyId}
        className="menuSectionToggle"
      >
        <span className="menuSectionRule" aria-hidden="true" />
        <span className="menuSectionLabel">{label}</span>
        <ChevronDownIcon className={`menuSectionChevron ${isOpen ? 'menuSectionChevron-open' : ''}`} />
      </button>
      {isOpen && <div id={bodyId}>{children}</div>}
    </div>
  );
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
