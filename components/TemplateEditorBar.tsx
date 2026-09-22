'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { FlexContainerNode, resolveDirection } from '@/types/layout';
import {
  FlexRowIcon,
  FlexColumnIcon,
  SplitColumnsIcon,
  SplitRowsIcon,
  AddContainerBeforeIcon,
  AddChildContainerIcon,
  AddContainerAfterIcon,
} from '@/components/icons/LayoutIcons';
import { GearIcon } from '@/components/icons/TreeIcons';
import { TrashCanIcon } from '@/components/icons/PanelIcons';
import { PreviewWidthPicker, ZoomControls } from '@/components/CanvasViewControls';
import { useDismissOnOutsideOrEscape } from '@/hooks/useDismissOnOutsideOrEscape';
import { activeBtn, barControlHeight, disabledBtn, ghostBtn, idleBtn } from '@/components/editorBarStyles';

/* ==========================================================================
   Template editor bar: one panel hanging from the top navigation header.
   Left: tools for the selected container (grouped; hover a group to see its options).
   Right: preview Width / Fit (Body only, or in preview mode) and zoom (always).
   ========================================================================== */

// No direction here: the editor picks one based on the parent (see defaultChildDirection)
const NEW_CONTAINER = { label: 'New Container', padding: 0, sizing: { type: 'fill' } } as const;

const iconBtn =
  `px-1.5 ${barControlHeight} rounded-md border transition flex items-center gap-1 text-[11px] font-semibold`;
const divider = 'h-4 w-px bg-[color-mix(in_oklch,var(--secondary-accent)_40%,transparent)] shrink-0 mx-0.5';

const ToolGroupContext = createContext<() => void>(() => {});

/**
 * One toolbar icon that stands for a group. Hover opens the options below it; a click pins it
 * open (for touch and keyboard); Esc or a click elsewhere closes it.
 */
function ToolGroup({
  icon,
  label,
  title,
  disabled,
  set,
  children,
}: {
  icon: React.ReactNode;
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
            ? `${activeBtn} cursor-pointer hover:border-white hover:text-white`
            : isOpen
            ? `${idleBtn} cursor-pointer border-white text-white bg-white/10`
            : `${idleBtn} cursor-pointer`
        }`}
      >
        {icon}
        <span>{label}</span>
        <span aria-hidden="true" className="text-[8px] opacity-70">▾</span>
      </button>
      {isOpen && (
        // pt-1 (not a margin) keeps the hover area continuous between the icon and its options
        <div className="absolute top-full left-0 pt-1 z-10" role="menu">
          <div className="tmpl-edge-panel tmpl-edge-menu rounded-xl p-1 flex flex-col gap-0.5 min-w-[9rem]">
            <ToolGroupContext.Provider value={close}>{children}</ToolGroupContext.Provider>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupOption({
  icon,
  label,
  title,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
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

/** Container name; click to rename in place (Enter or blur saves, Esc cancels). */
function EditableName({ name, onCommit }: { name: string; onCommit: (label: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const finish = (save: boolean) => {
    const next = draft.trim();
    if (save && next && next !== name) onCommit(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') finish(true);
          if (e.key === 'Escape') finish(false);
        }}
        aria-label="Container name"
        className="w-36 px-1.5 py-0.5 rounded-md bg-black/40 border border-[color-mix(in_oklch,var(--primary-accent)_35%,cyan)] text-[11px] font-bold text-white focus:outline-none"
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
      className={`truncate max-w-[130px] px-1.5 py-0.5 rounded-md text-[11px] font-bold text-white tracking-wide cursor-text border border-transparent hover:border-white hover:bg-white/10`}
    >
      {name}
    </button>
  );
}

interface TemplateEditorBarProps {
  /** The selected container, or null (nothing / a component is selected). */
  container: FlexContainerNode | null;
  isRoot: boolean;
  /** Preview mode hides the container tools. */
  showContainerTools: boolean;
  onUpdateContainer?: (id: string, partial: Partial<FlexContainerNode>) => void;
  onAddContainer?: (targetContainerId: string, options?: Partial<FlexContainerNode>) => string;
  onInsertContainerSibling?: (
    targetContainerId: string,
    position: 'before' | 'after',
    options?: Partial<FlexContainerNode>
  ) => string;
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows') => void;
  onRemoveContainer?: (id: string) => void;
  onSelectNode?: (id: string | null) => void;
  /** Whether the Structure tree's side panel is currently visible (pinned or unpinned). */
  isStructurePanelOpen?: boolean;
  /** Opens the Structure panel unpinned. The gear needs it on-screen before it can sync to it. */
  onOpenStructurePanel?: () => void;
}

export default function TemplateEditorBar({
  container,
  isRoot,
  showContainerTools,
  onUpdateContainer,
  onAddContainer,
  onInsertContainerSibling,
  onSplitContainer,
  onRemoveContainer,
  onSelectNode,
  isStructurePanelOpen,
  onOpenStructurePanel,
}: TemplateEditorBarProps) {
  const [isTreeMenuOpen, setIsTreeMenuOpen] = useState(false);
  const containerId = container?.id;

  // The gear mirrors the Structure tree's action menu for this container.
  useEffect(() => {
    if (!containerId) return;
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setIsTreeMenuOpen(typeof detail === 'string' && detail.startsWith(`tree-container-${containerId}`));
    };
    const handleClose = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (!detail || (typeof detail === 'string' && detail.startsWith(`tree-container-${containerId}`))) {
        setIsTreeMenuOpen(false);
      }
    };
    window.addEventListener('tree-action-menu-open', handleOpen);
    window.addEventListener('tree-action-menu-close', handleClose);
    return () => {
      window.removeEventListener('tree-action-menu-open', handleOpen);
      window.removeEventListener('tree-action-menu-close', handleClose);
    };
  }, [containerId]);

  const tools = showContainerTools && container ? container : null;
  // Every container is a row or a column
  const direction = tools ? resolveDirection(tools, isRoot) : undefined;
  const flexIcon =
    direction === 'row' ? <FlexRowIcon className="w-3.5 h-3.5" /> : <FlexColumnIcon className="w-3.5 h-3.5" />;
  const flexLabel = direction === 'row' ? 'Row' : 'Column';

  return (
    <div
      className="tmpl-edge-panel tmpl-edge-panel-top select-none pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 max-w-[calc(100vw-2rem)]"
      onClick={(e) => e.stopPropagation()}
    >
      {tools && container && (
        <>
          <ToolGroup
            icon={flexIcon}
            label={flexLabel}
            title={
              isRoot
                ? 'The Body always flows top-to-bottom, like a page. To place items side-by-side, add a Row container and put them inside it.'
                : 'Flex direction: row or column'
            }
            disabled={isRoot}
            set
          >
            <>
                <GroupOption
                  icon={<FlexRowIcon className="w-3.5 h-3.5" />}
                  label="Row"
                  title="Row layout (horizontal flow)"
                  active={direction === 'row'}
                  onClick={() => { onUpdateContainer?.(container.id, { direction: 'row' }); }}
                />
                <GroupOption
                  icon={<FlexColumnIcon className="w-3.5 h-3.5" />}
                  label="Column"
                  title="Column layout (vertical flow)"
                  active={direction === 'column'}
                  onClick={() => { onUpdateContainer?.(container.id, { direction: 'column' }); }}
                />
            </>
          </ToolGroup>

          <ToolGroup
            icon={<AddChildContainerIcon className="w-3.5 h-3.5" />}
            label="Add"
            title="Add a container"
          >
            <>
                <GroupOption
                  icon={<AddContainerBeforeIcon className="w-3.5 h-3.5" />}
                  label="Before"
                  title={isRoot ? 'Not available for the Body' : 'Add Container Before'}
                  disabled={isRoot}
                  onClick={() => { onInsertContainerSibling?.(container.id, 'before', { ...NEW_CONTAINER }); }}
                />
                <GroupOption
                  icon={<AddChildContainerIcon className="w-3.5 h-3.5" />}
                  label="Inside"
                  title="Add Child Container (nested inside)"
                  onClick={() => { onAddContainer?.(container.id, { ...NEW_CONTAINER }); }}
                />
                <GroupOption
                  icon={<AddContainerAfterIcon className="w-3.5 h-3.5" />}
                  label="After"
                  title={isRoot ? 'Not available for the Body' : 'Add Container After'}
                  disabled={isRoot}
                  onClick={() => { onInsertContainerSibling?.(container.id, 'after', { ...NEW_CONTAINER }); }}
                />
            </>
          </ToolGroup>

          <ToolGroup
            icon={<SplitColumnsIcon className="w-3.5 h-3.5" />}
            label="Split"
            title={isRoot ? 'The Body cannot be split' : 'Split this container'}
            disabled={isRoot}
          >
            <>
                <GroupOption
                  icon={<SplitColumnsIcon className="w-3.5 h-3.5" />}
                  label="2 Columns"
                  title="Split into 2 Columns (side-by-side)"
                  onClick={() => { onSplitContainer?.(container.id, 'columns'); }}
                />
                <GroupOption
                  icon={<SplitRowsIcon className="w-3.5 h-3.5" />}
                  label="2 Rows"
                  title="Split into 2 Rows (stacked)"
                  onClick={() => { onSplitContainer?.(container.id, 'rows'); }}
                />
            </>
          </ToolGroup>

          <div className={divider} aria-hidden="true" />

          {isRoot ? (
            <span className="text-[11px] font-bold text-white tracking-wide">Body</span>
          ) : (
            <EditableName
              key={container.id}
              name={container.label || 'Container'}
              onCommit={(label) => onUpdateContainer?.(container.id, { label })}
            />
          )}
          {!isRoot && container.isCard && (
            <span className="text-[9px] font-bold text-emerald-400 px-1 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              Card
            </span>
          )}

          <div className={divider} aria-hidden="true" />

          {/* Sizing mode (Auto / Custom) */}
          <div
            className={`flex items-center gap-0.5 bg-black/40 px-0.5 ${barControlHeight} rounded-md border border-[color-mix(in_oklch,var(--secondary-accent)_35%,transparent)] shrink-0 text-[10px] font-semibold`}
            role="group"
            aria-label="Container sizing mode"
          >
            <button
              type="button"
              onClick={() => {
                if (!isRoot) onUpdateContainer?.(container.id, { width: undefined, sizing: { type: 'fill' } });
              }}
              title={isRoot ? 'Auto: the Body stretches automatically with content' : 'Auto: fill the available parent space'}
              className={`px-1.5 h-[22px] flex items-center rounded transition ${
                isRoot || (container.sizing?.type || 'fill') === 'fill'
                  ? `border ${activeBtn} ${isRoot ? 'cursor-default' : 'cursor-pointer'}`
                  : `${ghostBtn} cursor-pointer`
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              disabled={isRoot}
              onClick={() => {
                // Snapshot the on-screen width (unscaled layout px, not the zoomed CSS box) so
                // switching to Custom only reveals the resize handles — nothing jumps. A stale
                // remembered value from an earlier Custom session would otherwise pop back in.
                const el = document.querySelector<HTMLElement>(`[data-container-id="${container.id}"]`);
                const value = el?.offsetWidth
                  ? `${Math.round(el.offsetWidth)}px`
                  : container.sizing?.type === 'fixed'
                  ? container.sizing.value || '50%'
                  : '50%';
                onUpdateContainer?.(container.id, { width: value, sizing: { type: 'fixed', value } });
              }}
              title={isRoot ? 'Custom sizing is not available for the Body' : 'Custom: set your own width/height (e.g. 50%, 300px)'}
              className={`px-1.5 h-[22px] flex items-center rounded transition ${
                isRoot
                  ? `${disabledBtn} text-[var(--secondary-accent)]`
                  : container.sizing?.type === 'fixed'
                  ? `border ${activeBtn} cursor-pointer`
                  : `${ghostBtn} cursor-pointer`
              }`}
            >
              Custom
            </button>
          </div>

          {/* Gear: opens the Structure tree's properties menu for this container */}
          <button
            type="button"
            data-gear-trigger
            onClick={() => {
              onSelectNode?.(container.id);
              const clickTreeGear = () =>
                document.querySelector<HTMLElement>(`[data-tree-gear-id="${container.id}"]`)?.click();
              if (isStructurePanelOpen) {
                clickTreeGear();
                return;
              }
              // The tree row (and its gear) isn't on screen yet: open the panel unpinned, then
              // wait for the *panel's own* slide-in transition to genuinely finish before syncing
              // to it. The menu's position is computed from the panel's live bounding rect at
              // click time, so clicking mid-transition (or even a couple of animation frames in —
              // a frame-to-frame "has it stopped moving" check can be fooled by the transition not
              // having visibly started yet) anchors it to the panel's still-collapsed position.
              onOpenStructurePanel?.();
              const waitForPanelThen = (cb: () => void) => {
                const panelEl = document.querySelector<HTMLElement>('.primary-side-panel');
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
            title={isRoot ? 'Body Properties' : 'Container Properties'}
            aria-label={isRoot ? 'Body properties' : 'Container properties'}
            aria-expanded={isTreeMenuOpen}
            className={`w-[26px] ${barControlHeight} rounded-md border transition cursor-pointer flex items-center justify-center shrink-0 ${
              isTreeMenuOpen ? activeBtn : idleBtn
            }`}
          >
            <GearIcon
              isActive={isTreeMenuOpen}
              className={`w-3.5 h-3.5 transition-transform duration-300 ${isTreeMenuOpen ? 'rotate-90' : ''}`}
            />
          </button>

          {isRoot ? (
            <button
              type="button"
              disabled
              title="The Body cannot be deleted"
              aria-label="Delete (disabled for Body)"
              className={`w-[26px] ${barControlHeight} rounded-md border transition flex items-center justify-center shrink-0 ${idleBtn} ${disabledBtn}`}
            >
              <TrashCanIcon className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRemoveContainer?.(container.id)}
              className={`w-[26px] ${barControlHeight} rounded-md border transition flex items-center justify-center cursor-pointer shrink-0 bg-black/40 border-[var(--secondary-accent)] text-[var(--secondary-accent)] hover:bg-[var(--tree-menu-danger-hover-bg)] hover:border-white hover:text-[var(--tree-menu-danger-hover-text)]`}
              title="Delete Container"
              aria-label="Delete Container"
            >
              <TrashCanIcon className="w-3.5 h-3.5" />
            </button>
          )}

          <div className={divider} aria-hidden="true" />
        </>
      )}

      {/* Preview width applies to the whole canvas, not the selected container, but stays visible
          no matter what's selected so switching containers doesn't hide it. */}
      <PreviewWidthPicker />
      <div className={divider} aria-hidden="true" />

      <ZoomControls />
    </div>
  );
}
