'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { createPortal } from 'react-dom';
import '@/app/styles/components/TreeSubMenu.css';
import { ChevronDownIcon, PanelFolderTabSvg } from '@/components/icons/PanelIcons';
import { HelpCircleIcon } from '@/components/icons/LayoutIcons';
import { HintGripIcon } from '@/components/icons/HintIcons';
import { SearchClearIcon } from '@/components/icons/TreeIcons';
import HoverHint, { type HintContent } from '@/components/HoverHint';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useTreePanel } from '@/context/TreePanelContext';

/* --------------------------------------------------------------------------
  SUB MENU CONTRACT
  The parent tree row owns menu state and coordinates. This component owns
  rendering, portal mounting, positioning offsets, and open/close animation.
  -------------------------------------------------------------------------- */
interface TreeSubMenuProps {
  isOpen: boolean;
  /** Close without the slide-out (the menu's panel was hidden; useTreeActionMenu's `closedWithPanel`). */
  closeInstantly?: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  top: number;
  left: number;
  title: string;
  titleIcon?: React.ReactNode;
  /** Fixed strip under the title bar (e.g. ActionMenuTabs): stays put while `children` scrolls. */
  subheader?: React.ReactNode;
  position?: 'left' | 'right';
  /** Width class etc. for the menu (with `splitBody`, for the body card only). */
  className?: string;
  /**
   * Render the title bar + `subheader` as one narrow card and `children` as a second card below it
   * that can be wider (set its width with `className`). The cards touch and share a border line, so
   * together they read as one L-shaped panel: a wide body under a header that keeps its size.
   */
  splitBody?: boolean;
  /**
   * A floating menu (lib/floatingNodeMenu.ts) rather than one sliding out of a panel: it appears in place,
   * wears a help window's chrome -- grab dots and the type icon before the title (the title bar is the drag
   * handle) and a close button at the right -- and sits on its own layer above the editor's toolbars
   * (Z_INDEX.md).
   */
  floating?: {
    onClose: () => void;
    onTitlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  };
  children: React.ReactNode;
}

export default function TreeSubMenu({
  isOpen,
  closeInstantly = false,
  onMouseEnter,
  onMouseLeave,
  top,
  left,
  title,
  titleIcon,
  subheader,
  position,
  className,
  splitBody = false,
  floating,
  children,
}: TreeSubMenuProps) {
  const { animationsEnabled, isPinned: primaryPinned } = useUIPreferences();
  const panel = useTreePanel();
  const isPinned = panel?.isPinned ?? primaryPinned;
  const effectivePosition = position ?? 'left';

  const { mounted, renderMenu, isClosing } = usePresence(isOpen, 340, animationsEnabled && !closeInstantly);
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

  const animationClass = !animationsEnabled || floating
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
  const header = floating ? (
    <div className="headerPill" onPointerDown={floating.onTitlePointerDown}>
      <span className="hintTitleGroup">
        <HintGripIcon className="w-3 h-4 hintGrip" />
        <span className="headerIcon floatingTitleIcon">{titleIcon}</span>
        <span className="headerTitle" onMouseEnter={(e) => showFullTextIfCut(e, title)}>{title}</span>
      </span>
      <span className="headerIcon">
        <button type="button" className="hintHeaderBtn" onClick={floating.onClose} aria-label={`Close ${title}`} title="Close">
          <SearchClearIcon className="w-4 h-4" />
        </button>
      </span>
    </div>
  ) : (
    <div className="headerPill">
      <span className="headerTitle">{title}</span>
      <span className="headerIcon">{titleIcon}</span>
    </div>
  );
  // A floating menu doesn't come out of a panel, so it has no hover bridge back to one
  const bridge = !isClosing && !floating && <div className={`bridge ${bridgeClass}`} aria-hidden="true" />;

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
        zIndex: floating ? 88 : panel?.isFlyout ? 70 : isPinned ? 35 : 45,
      }}
      role={floating ? 'dialog' : undefined}
      aria-label={floating ? title : undefined}
      className={
        splitBody
          ? `menuShellSplit ${effectivePosition === 'right' && !floating ? 'menuShellSplit-right' : ''} ${floating ? 'menuShellFloating' : ''} ${animationClass}` : `menuShell ${animationClass} ${className || ''}`
      }
    >
      {/* Catchment Hover Bridge (disabled during exit to prevent sticking) */}
      {bridge}

      {splitBody ? (
        <>
          <div className={`menuShell menuShellHead ${className || ''}`}>
            <div className="innerContent">
              {header}
              {subheader && <div className="menuSubheader">{subheader}</div>}
            </div>
          </div>
          <div className={`menuShell menuShellBody ${className || ''}`}>
            <div className="innerContent">
              <div className="childrenContainer">{children}</div>
            </div>
          </div>
        </>
      ) : (
        /* Inner Content Wrapper */
        <div className="innerContent">
          {header}
          {subheader && <div className="menuSubheader">{subheader}</div>}
          <div className="childrenContainer">{children}</div>
        </div>
      )}
    </div>,
    document.body
  );
}

/* ==========================================================================
  REUSABLE ACTION CONTROLS
  ========================================================================== */

// Standard action with a neutral hover treatment.
/** On hover, gives an element a native tooltip with its full text -- but only while some of that text is cut
 *  off with "..." (any `.truncate` inside it, or the element itself, overflowing); text that fits gets none. */
function showFullTextIfCut(e: React.MouseEvent<HTMLElement>, ...text: (string | undefined)[]) {
  const el = e.currentTarget;
  const parts = [el, ...el.querySelectorAll<HTMLElement>('.truncate')];
  const isCut = parts.some((part) => part.scrollWidth > part.clientWidth);
  el.title = isCut ? text.filter(Boolean).join('\n') : '';
}

export function ActionMenuItem({
  icon,
  label,
  labelDetail,
  subtext,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  /** Shown after the label in the Primary Accent, e.g. the element a "Select Next:" goes to. */
  labelDetail?: string;
  subtext?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => showFullTextIfCut(e, labelDetail ? `${label} ${labelDetail}` : label, subtext)}
      className="actionMenuItem group"
    >
      <span className="actionMenuItemIcon w-4 h-4 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="actionMenuItemLabel truncate">
          {label}
          {labelDetail && <span className="actionMenuItemLabelDetail"> {labelDetail}</span>}
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
  labelDetail,
  subtext,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  /** As ActionMenuItem's: shown after the label in the brightened Primary Accent. */
  labelDetail?: string;
  subtext?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => showFullTextIfCut(e, labelDetail ? `${label} ${labelDetail}` : label, subtext)}
      className="actionMenuDangerItem group"
    >
      <span className="actionMenuDangerIcon">
        {icon}
      </span>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="actionMenuDangerLabel truncate">
          {label}
          {labelDetail && <span className="actionMenuItemLabelDetail"> {labelDetail}</span>}
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
// Pass it as TreeSubMenu's `subheader` so it stays fixed while the tab's body scrolls. The
// caller owns which tab is active and renders the matching body itself.
// With fewer than two tabs there's nothing to switch between, so this renders as a plain, empty
// divider band instead of a single oversized "tab" button -- but it's still the exact same
// `.menuTabs` element and CSS as the real tab band, not a different rule for a different shape, so
// every splitBody flyout's head card ends up the same height/proportions regardless of how many
// tabs it actually has. `active`/`onChange` only matter once there's a real choice to make.
// Real tabs are the side panels' paper-folder tabs (the same PanelFolderTabSvg and .tree-folder-tab
// looks), with the icon and label inside, standing on the band's bottom edge; the active one opens into
// the menu body below it (.menuFolderTab in TreeSubMenu.css).
export function ActionMenuTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon: React.ReactNode }[];
  active?: T;
  onChange?: (id: T) => void;
}) {
  const gradientId = useId();
  if (tabs.length < 2) {
    return <div className="menuTabs" aria-hidden="true" />;
  }
  return (
    <div className="menuTabs menuTabs-folder" role="tablist">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(tab.id)}
            className={`menuFolderTab tree-folder-tab ${isActive ? 'tree-folder-tab-active z-20' : 'tree-folder-tab-idle z-10'}`}
          >
            <PanelFolderTabSvg gradientId={`${gradientId}-${tab.id}`} isActive={isActive} variant="curved" />
            <span className="relative z-10 flex items-center gap-1.5 select-none">
              {tab.icon}
              <span>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// A collapsible group of controls, drawn as a card: an icon tile, the title (with a one-line subtitle,
// open or closed), a `?` help bubble and an up/down chevron, over a body that shows only while
// `isOpen`. Controlled (the caller owns open/closed) so the state survives the menu closing and
// reopening. The `?` (`hint`) is a sibling of the toggle button, not inside it -- no interactive
// content in a button, and clicking it shouldn't collapse the section -- laid over a spacer the
// button reserves for it.
export function ActionMenuSection({
  label,
  icon,
  subtitle,
  hint,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  subtitle?: string;
  hint?: HintContent;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const bodyId = useId();
  return (
    <div className="menuSection">
      <div className="menuSectionHeader">
        {/* A div, not a button: the hint icon sits inline right after the title, inside this row, and
            it's its own interactive control (HoverHint's trigger has its own tabIndex) -- nesting
            that inside a real <button> would be invalid HTML and would toggle the section on every
            hover/click of the hint too. role="button" + onKeyDown keeps it keyboard-operable. */}
        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle();
            }
          }}
          aria-expanded={isOpen}
          aria-controls={bodyId}
          className="menuSectionToggle"
        >
          {icon && <span className="menuSectionIconTile">{icon}</span>}
          <span className="menuSectionText">
            <span className="menuSectionTitleRow">
              <span className="menuSectionTitle">{label}</span>
              {hint && (
                <span className="menuSectionHint" onClick={(e) => e.stopPropagation()}>
                  <HoverHint hint={hint}>
                    <HelpCircleIcon className="w-3 h-3" />
                  </HoverHint>
                </span>
              )}
            </span>
            {/* Always shown, open or closed, so the header keeps one height and the body never jumps. */}
            {subtitle && <span className="menuSectionSubtitle">{subtitle}</span>}
          </span>
          <ChevronDownIcon className={`menuSectionChevron ${isOpen ? 'menuSectionChevron-open' : ''}`} />
        </div>
      </div>
      {isOpen && (
        <div id={bodyId} className="menuSectionBody">
          {children}
        </div>
      )}
    </div>
  );
}
