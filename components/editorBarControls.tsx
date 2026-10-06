'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { EyeIcon, EyeOffIcon, HelpCircleIcon } from '@/components/icons/LayoutIcons';
import { GearIcon } from '@/components/icons/TreeIcons';
import { TrashCanIcon, ChevronDownIcon } from '@/components/icons/PanelIcons';
import { useDismissOnOutsideOrEscape } from '@/hooks/useDismissOnOutsideOrEscape';
import HoverHint, { type HintContent } from '@/components/HoverHint';
import { activeBtn, barControlHeight, disabledBtn, ghostBtn, idleBtn } from '@/components/editorBarStyles';
import { requestMenuTab } from '@/lib/menuTabRequest';

/* ==========================================================================
   Controls shared by the template editor's selection toolbars (TemplateEditorContainerBar for a
   container, TemplateEditorContentBar for a content element): grouped pulldowns, the in-place name,
   section labels, and the eye / gear / delete buttons at the right end.
   ========================================================================== */

export const iconBtn =
  `px-1.5 ${barControlHeight} rounded-md border transition flex items-center gap-1 text-[11px] font-semibold`;
export const barDivider = 'h-4 w-px bg-[color-mix(in_oklch,var(--secondary-accent)_40%,transparent)] shrink-0 mx-0.5';
const squareBtn = `w-[26px] ${barControlHeight} rounded-md border transition flex items-center justify-center shrink-0`;

/** A section's caption ("SIZE:"), with its help bubble when it has one. */
export function BarSectionLabel({ label, hint }: { label: string; hint?: HintContent }) {
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--primary-tree-item-text)] mr-1">
      {label}:
      {hint && (
        <HoverHint hint={hint}>
          <HelpCircleIcon className="w-3 h-3 text-[var(--secondary-tree-menu-header-title)]" />
        </HoverHint>
      )}
    </span>
  );
}

const ToolGroupContext = createContext<() => void>(() => {});

/**
 * One toolbar icon that stands for a group. Hover opens the options below it; a click pins it
 * open (for touch and keyboard); Esc or a click elsewhere closes it.
 */
export function ToolGroup({
  icon,
  label,
  title,
  disabled,
  set,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  title: string;
  disabled?: boolean;
  /** A value is chosen in this group: show the pill in light blue, like a set field. */
  set?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clearTimer, []);

  const close = useCallback(() => {
    clearTimer();
    setOpen(false);
    setPinned(false);
  }, []);
  useDismissOnOutsideOrEscape(open, ref, close);

  const isOpen = open && !disabled;

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        clearTimer();
        if (!disabled) setOpen(true);
      }}
      onMouseLeave={() => {
        if (pinned) return;
        clearTimer();
        timer.current = setTimeout(() => setOpen(false), 180); // forgiving hover-out
      }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={title}
        onClick={() => {
          if (pinned) {
            close();
          } else {
            setOpen(true);
            setPinned(true);
          }
        }}
        className={`${iconBtn} ${
          disabled && set
            ? `${activeBtn} opacity-60 cursor-not-allowed`
            : disabled
            ? `${idleBtn} ${disabledBtn}`
            : set
            ? `${activeBtn} cursor-pointer hover:border-glint hover:text-[var(--text-strong)]`
            : isOpen
            ? `${idleBtn} cursor-pointer border-glint text-[var(--text-strong)] bg-glint/10`
            : `${idleBtn} cursor-pointer`
        }`}
      >
        {icon}
        <span>{label}</span>
        <ChevronDownIcon className="w-2.5 h-2.5 opacity-70" />
      </button>
      {isOpen && (
        // pt-1 (not a margin) keeps the hover area continuous between the icon and its options
        <div className="absolute top-full left-0 pt-1 z-10" role="menu">
          <div className="tmpl-edge-panel tmpl-edge-menu rounded-xl p-1 flex flex-col gap-0.5 min-w-[9rem] max-h-[60vh] overflow-y-auto">
            <ToolGroupContext.Provider value={close}>{children}</ToolGroupContext.Provider>
          </div>
        </div>
      )}
    </div>
  );
}

/** A subheading between a ToolGroup's options (e.g. "Item" / "Fields"). */
export function GroupHeading({ label }: { label: string }) {
  return (
    <span className="px-2 pt-1.5 pb-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--primary-tree-item-text)]">
      {label}
    </span>
  );
}

export function GroupOption({
  icon,
  label,
  title,
  active,
  disabled,
  onClick,
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const closeGroup = useContext(ToolGroupContext);
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={title}
      aria-current={active || undefined}
      onClick={() => {
        onClick();
        closeGroup();
      }}
      className={`px-2 py-1 rounded-md border flex items-center gap-2 text-[11px] font-semibold text-left transition ${
        disabled
          ? `${idleBtn} ${disabledBtn}`
          : active
          ? `${activeBtn} cursor-pointer`
          : `${ghostBtn} cursor-pointer`
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/** The selection's name; click to rename in place (Enter or blur saves, Esc cancels). An empty name is
    only saved when `allowEmpty` (a content element's name falls back to its label text). */
export function EditableName({
  name,
  onCommit,
  ariaLabel,
  placeholder,
  allowEmpty = false,
}: {
  name: string;
  onCommit: (label: string) => void;
  ariaLabel: string;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const finish = (save: boolean) => {
    const next = draft.trim();
    if (save && (next || allowEmpty) && next !== name) onCommit(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') finish(true);
          if (e.key === 'Escape') finish(false);
        }}
        aria-label={ariaLabel}
        className="w-36 px-1.5 py-0.5 rounded-md bg-shade/40 border border-[var(--focus-blue)] text-[11px] font-bold text-[var(--flyout-white)] focus:outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      title="Click to rename"
      className="truncate max-w-[130px] px-1.5 py-0.5 rounded-md text-[11px] font-bold text-[var(--flyout-white)] tracking-wide cursor-text border border-transparent hover:border-glint hover:bg-glint/10"
    >
      {name || placeholder}
    </button>
  );
}

/** A two-state icon button on the bar (Bold, Italic, ...): yellow while on. */
export function BarToggle({
  on,
  title,
  onClick,
  children,
}: {
  on: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`${squareBtn} cursor-pointer ${on ? activeBtn : idleBtn}`}
    >
      {children}
    </button>
  );
}

/** The eye: hides the selection (and what's inside it) from the edit canvas, like the Layout tree's. */
export function VisibilityButton({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  return (
    <BarToggle
      on={hidden}
      title={hidden ? 'Hidden on the canvas: click to show' : 'Hide on the canvas (and everything inside it)'}
      onClick={onToggle}
    >
      {hidden ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
    </BarToggle>
  );
}

/** Whether the Layout tree's gear menu for this node is open (its menu ids start with `menuIdPrefix`). */
function useTreeMenuOpen(menuIdPrefix: string | null) {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (!menuIdPrefix) return;
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setIsOpen(typeof detail === 'string' && detail.startsWith(menuIdPrefix));
    };
    const handleClose = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (!detail || (typeof detail === 'string' && detail.startsWith(menuIdPrefix))) setIsOpen(false);
    };
    window.addEventListener('tree-action-menu-open', handleOpen);
    window.addEventListener('tree-action-menu-close', handleClose);
    return () => {
      window.removeEventListener('tree-action-menu-open', handleOpen);
      window.removeEventListener('tree-action-menu-close', handleClose);
    };
  }, [menuIdPrefix]);
  return isOpen;
}

/**
 * The gear: opens the Layout tree's own properties menu for this node (the bar has no menu of its
 * own, it mirrors the tree's), opening the Layout panel first when it isn't showing.
 */
export function TreeGearButton({
  nodeId,
  menuIdPrefix,
  title,
  onSelectNode,
  isLayoutPanelOpen,
  onOpenLayoutPanel,
  layoutPanelSelector = '.primary-side-panel',
}: {
  nodeId: string;
  /** The tree menu id this node's gear opens (`tree-container-<id>` or `tree-comp-<id>`). */
  menuIdPrefix: string;
  title: string;
  onSelectNode?: (id: string | null) => void;
  isLayoutPanelOpen?: boolean;
  onOpenLayoutPanel?: () => void;
  layoutPanelSelector?: string;
}) {
  const isTreeMenuOpen = useTreeMenuOpen(menuIdPrefix);
  return (
    <button
      type="button"
      data-gear-trigger
      onClick={() => {
        onSelectNode?.(nodeId);
        // The flyout opens on its Properties tab when opened from here (see lib/menuTabRequest.ts).
        const clickTreeGear = () => {
          requestMenuTab(nodeId, 'properties');
          document.querySelector<HTMLElement>(`[data-tree-gear-id="${nodeId}"]`)?.click();
        };
        if (isLayoutPanelOpen) {
          clickTreeGear();
          return;
        }
        // The tree row (and its gear) isn't on screen yet: open the panel unpinned, then
        // wait for the *panel's own* slide-in transition to genuinely finish before syncing
        // to it. The menu's position is computed from the panel's live bounding rect at
        // click time, so clicking mid-transition (or even a couple of animation frames in —
        // a frame-to-frame "has it stopped moving" check can be fooled by the transition not
        // having visibly started yet) anchors it to the panel's still-collapsed position.
        onOpenLayoutPanel?.();
        const waitForPanelThen = (cb: () => void) => {
          const panelEl = document.querySelector<HTMLElement>(layoutPanelSelector);
          if (!panelEl) {
            requestAnimationFrame(() => waitForPanelThen(cb));
            return;
          }
          const transitionSeconds = parseFloat(getComputedStyle(panelEl).transitionDuration) || 0;
          if (transitionSeconds === 0) {
            cb();
            return;
          }
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            panelEl.removeEventListener('transitionend', onEnd);
            cb();
          };
          const onEnd = (e: TransitionEvent) => {
            if (e.target === panelEl) finish();
          };
          panelEl.addEventListener('transitionend', onEnd);
          // Safety net if the transition never fires an end event (e.g. it gets interrupted).
          setTimeout(finish, transitionSeconds * 1000 + 100);
        };
        waitForPanelThen(clickTreeGear);
      }}
      title={title}
      aria-label={title}
      aria-expanded={isTreeMenuOpen}
      className={`${squareBtn} cursor-pointer ${isTreeMenuOpen ? activeBtn : idleBtn}`}
    >
      <GearIcon
        isActive={isTreeMenuOpen}
        className={`w-3.5 h-3.5 transition-transform duration-300 ${isTreeMenuOpen ? 'rotate-90' : ''}`}
      />
    </button>
  );
}

/** The delete button (danger colors on hover); disabled with an explanation when `onDelete` is absent. */
export function DeleteButton({ title, onDelete, disabledTitle }: { title: string; onDelete?: () => void; disabledTitle?: string }) {
  if (!onDelete) {
    return (
      <button
        type="button"
        disabled
        title={disabledTitle ?? title}
        aria-label={disabledTitle ?? title}
        className={`${squareBtn} ${idleBtn} ${disabledBtn}`}
      >
        <TrashCanIcon className="w-3.5 h-3.5" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onDelete}
      className={`${squareBtn} cursor-pointer bg-shade/40 border-[var(--secondary-accent)] text-[var(--secondary-accent)] hover:bg-[var(--tree-menu-danger-hover-bg)] hover:border-glint hover:text-[var(--tree-menu-danger-hover-text)]`}
      title={title}
      aria-label={title}
    >
      <TrashCanIcon className="w-3.5 h-3.5" />
    </button>
  );
}
