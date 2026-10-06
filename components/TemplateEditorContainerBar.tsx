'use client';

import React from 'react';
import { FlexContainerNode, resolveDirection } from '@/types/layout';
import {
  FlexRowIcon,
  FlexColumnIcon,
  SplitColumnsIcon,
  SplitRowsIcon,
  AddContainerBeforeIcon,
  AddChildContainerIcon,
  AddContainerAfterIcon,
  AutoSizingIcon,
  FitContentIcon,
  CustomSizingIcon,
} from '@/components/icons/LayoutIcons';
import { HintRef, type HintContent } from '@/components/HoverHint';
import {
  activeBtn,
  barDisabledBtn,
  barGhostBtn,
  barToggleBtn,
  barToggleGroup,
} from '@/components/editorBarStyles';
import {
  BarSectionLabel,
  DeleteButton,
  EditableName,
  GroupOption,
  ToolGroup,
  TreeGearButton,
  VisibilityButton,
  barDivider as divider,
} from '@/components/editorBarControls';
import { NEW_CONTAINER_OPTIONS } from '@/lib/layoutTree';
import { measureContainerPx } from '@/lib/measureContainer';

/* ==========================================================================
   Template editor bar: the container toolbar, anchored to the top navigation header (see
   TemplateEditorBar/TemplateEditorBarTop for the template-wide toolbar, anchored to the workspace
   footer instead). Holds tools for the selected container only — name, Size, Layout, Add, Split,
   properties gear, delete — grouped and separated from the template-wide tools by living in their
   own panel entirely.
   ========================================================================== */

/* Help bubbles for this bar's own Size/Layout controls -- narrower than the Properties flyout's own
   Size/Layout hints (TemplateLayoutActionMenu.tsx), since the bar only ever shows Auto/Fit/Custom
   and Row/Column, never Width/Min/Max or alignment; a tip on each points at the flyout for those. */
const TOOLBAR_SIZE_HINT: HintContent = {
  title: 'Size',
  settings: [
    { name: 'Auto', icon: <AutoSizingIcon className="w-2.5 h-2.5" />, text: 'Fills the space its parent gives it, and grows with its content.' },
    { name: 'Fit', icon: <FitContentIcon className="w-2.5 h-2.5" />, text: 'Shrinks the container to fit its content. Available once it has content.' },
    { name: 'Custom', icon: <CustomSizingIcon className="w-2.5 h-2.5" />, text: 'Lets you set your own width and height, and shows drag handles on the canvas.' },
  ],
  notes: [
    { kind: 'caution', text: <><HintRef icon={<FitContentIcon className="w-2.5 h-2.5" />}>Fit</HintRef> and <HintRef icon={<CustomSizingIcon className="w-2.5 h-2.5" />}>Custom</HintRef> aren&apos;t available for the <em>Body</em>.</> },
    { kind: 'tip', text: <>For <strong>Width</strong>, <strong>Min</strong>, <strong>Max</strong> and <strong>Stack when narrower than</strong>, open this container&apos;s own Properties (the gear icon).</> },
  ],
};

const TOOLBAR_LAYOUT_HINT: HintContent = {
  title: 'Layout',
  settings: [
    { name: 'Row', icon: <FlexRowIcon className="w-2.5 h-2.5" />, text: 'Lays child containers out side by side, from left to right.' },
    { name: 'Column', icon: <FlexColumnIcon className="w-2.5 h-2.5" />, text: 'Stacks child containers on top of each other, from top to bottom.' },
  ],
  notes: [
    { kind: 'caution', text: <>The <em>Body</em> always flows using <code>Column</code>, like a page in a book.</> },
    { kind: 'tip', text: <>For child alignment (<strong>Align items</strong>, <strong>Justify content</strong>), open this container&apos;s own Properties (the gear icon).</> },
  ],
};


interface TemplateEditorContainerBarProps {
  /** The selected container, or null (nothing / a component is selected). */
  container: FlexContainerNode | null;
  isRoot: boolean;
  onUpdateContainer?: (id: string, partial: Partial<FlexContainerNode>) => void;
  onAddContainer?: (targetContainerId: string, options?: Partial<FlexContainerNode>) => string;
  onInsertContainerSibling?: (
    targetContainerId: string,
    position: 'before' | 'after',
    options?: Partial<FlexContainerNode>
  ) => string;
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows', measuredPx: number) => void;
  onRemoveContainer?: (id: string) => void;
  onSelectNode?: (id: string | null) => void;
  /** Whether the Layout tree's side panel is currently visible (pinned or unpinned). */
  isLayoutPanelOpen?: boolean;
  /** Opens the Layout panel unpinned. The gear needs it on-screen before it can sync to it. */
  onOpenLayoutPanel?: () => void;
  /**
   * The panel shell to wait on for its slide-in transition before syncing: whichever side
   * (primary/left or secondary/right) the Layout tab is actually docked on.
   */
  layoutPanelSelector?: string;
  /** Whether this container is hidden on the edit canvas (the Layout tree's eye), and its toggle. */
  isHidden?: boolean;
  onToggleHidden?: (id: string) => void;
}

export default function TemplateEditorContainerBar({
  container,
  isRoot,
  onUpdateContainer,
  onAddContainer,
  onInsertContainerSibling,
  onSplitContainer,
  onRemoveContainer,
  onSelectNode,
  isLayoutPanelOpen,
  onOpenLayoutPanel,
  layoutPanelSelector = '.primary-side-panel',
  isHidden = false,
  onToggleHidden,
}: TemplateEditorContainerBarProps) {
  if (!container) return null;

  // Every container is a row or a column
  const direction = resolveDirection(container, isRoot);
  // Fit shrinks a container to its content, so it only means something once there is some.
  const hasContent = container.children.length > 0;

  return (
    <div
      className="tmpl-edge-panel tmpl-edge-panel-top select-none pointer-events-auto flex items-center px-2.5 py-2 max-w-[calc(100vw-2rem)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        {/* The eye leads, beside the name it hides (not for the Body). */}
        {!isRoot && onToggleHidden && (
          <VisibilityButton hidden={isHidden} onToggle={() => onToggleHidden(container.id)} />
        )}
        {isRoot ? (
          <span className="text-[11px] font-bold text-[var(--flyout-white)] tracking-wide">Body</span>
        ) : (
          <EditableName
            key={container.id}
            name={container.label || 'Container'}
            onCommit={(label) => onUpdateContainer?.(container.id, { label })}
            ariaLabel="Container name"
          />
        )}
        {!isRoot && container.isCard && (
          <span className="text-[9px] font-bold text-emerald-400 px-1 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            Card
          </span>
        )}
      </div>

      {/* A fixed gap from the name (not one derived from matching column widths — see
          TemplateEditorBarTop for why), matching the template-wide toolbar's own section spacing. */}
      <div className="flex items-center gap-1.5 ml-8 shrink-0">
        {/* Sizing mode (Auto / Custom) */}
        <BarSectionLabel label="Size" hint={TOOLBAR_SIZE_HINT} />
        <div
          className={barToggleGroup}
          role="group"
          aria-label="Container sizing mode"
        >
          <button
            type="button"
            onClick={() => {
              if (!isRoot) onUpdateContainer?.(container.id, { width: undefined, sizing: { type: 'fill' } });
            }}
            title={isRoot ? 'Auto: the Body stretches automatically with content' : 'Auto: fill the available parent space'}
            className={`${barToggleBtn} ${
              isRoot || (container.sizing?.type || 'fill') === 'fill'
                ? `border ${activeBtn} ${isRoot ? 'cursor-default' : 'cursor-pointer'}`
                : `${barGhostBtn} cursor-pointer`
            }`}
          >
            <AutoSizingIcon className="w-3.5 h-3.5" />
            Auto
          </button>
          <button
            type="button"
            disabled={isRoot || !hasContent}
            onClick={() => {
              onUpdateContainer?.(container.id, { width: undefined, sizing: { ...container.sizing, type: 'auto', value: undefined } });
            }}
            title={
              isRoot
                ? 'Fit is not available for the Body'
                : !hasContent
                ? 'Fit: add content to this container first'
                : 'Fit: shrink the container to fit its content'
            }
            className={`${barToggleBtn} ${
              isRoot || !hasContent
                ? `border border-transparent ${barDisabledBtn}`
                : container.sizing?.type === 'auto'
                ? `border ${activeBtn} cursor-pointer`
                : `${barGhostBtn} cursor-pointer`
            }`}
          >
            <FitContentIcon className="w-3.5 h-3.5" />
            Fit
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
            className={`${barToggleBtn} ${
              isRoot
                ? `border border-transparent ${barDisabledBtn}`
                : container.sizing?.type === 'fixed'
                ? `border ${activeBtn} cursor-pointer`
                : `${barGhostBtn} cursor-pointer`
            }`}
          >
            <CustomSizingIcon className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>
  
        <div className={divider} aria-hidden="true" />
  
        {/* Flex direction: only two choices, so a pill toggle rather than a pulldown. */}
        <BarSectionLabel label="Layout" hint={TOOLBAR_LAYOUT_HINT} />
        <div className={barToggleGroup} role="group" aria-label="Flex direction">
          <button
            type="button"
            disabled={isRoot}
            onClick={() => { onUpdateContainer?.(container.id, { direction: 'row' }); }}
            title={
              isRoot
                ? 'The Body always flows top-to-bottom, like a page. To place items side-by-side, add a Row container and put them inside it.'
                : 'Row layout (horizontal flow)'
            }
            aria-label="Row"
            className={`${barToggleBtn} ${
              isRoot
                ? `border border-transparent ${barDisabledBtn}`
                : direction === 'row'
                ? `border ${activeBtn} cursor-pointer`
                : `${barGhostBtn} cursor-pointer`
            }`}
          >
            <FlexRowIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isRoot}
            onClick={() => { onUpdateContainer?.(container.id, { direction: 'column' }); }}
            title={
              isRoot
                ? 'The Body always flows top-to-bottom, like a page. To place items side-by-side, add a Row container and put them inside it.'
                : 'Column layout (vertical flow)'
            }
            aria-label="Column"
            className={`${barToggleBtn} ${
              isRoot || direction === 'column'
                ? `border ${activeBtn} ${isRoot ? 'cursor-default' : 'cursor-pointer'}`
                : `${barGhostBtn} cursor-pointer`
            }`}
          >
            <FlexColumnIcon className="w-3.5 h-3.5" />
          </button>
        </div>
  
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
                onClick={() => { onInsertContainerSibling?.(container.id, 'before', { ...NEW_CONTAINER_OPTIONS }); }}
              />
              <GroupOption
                icon={<AddChildContainerIcon className="w-3.5 h-3.5" />}
                label="Inside"
                title="Add Child Container (nested inside)"
                onClick={() => { onAddContainer?.(container.id, { ...NEW_CONTAINER_OPTIONS }); }}
              />
              <GroupOption
                icon={<AddContainerAfterIcon className="w-3.5 h-3.5" />}
                label="After"
                title={isRoot ? 'Not available for the Body' : 'Add Container After'}
                disabled={isRoot}
                onClick={() => { onInsertContainerSibling?.(container.id, 'after', { ...NEW_CONTAINER_OPTIONS }); }}
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
                onClick={() => { onSplitContainer?.(container.id, 'columns', measureContainerPx(container.id, 'width')); }}
              />
              <GroupOption
                icon={<SplitRowsIcon className="w-3.5 h-3.5" />}
                label="2 Rows"
                title="Split into 2 Rows (stacked)"
                onClick={() => { onSplitContainer?.(container.id, 'rows', measureContainerPx(container.id, 'height')); }}
              />
          </>
        </ToolGroup>
      </div>

      <div className="flex items-center gap-1.5 ml-8 shrink-0">
        {/* The gear (the Layout tree's properties menu for this container), then delete. */}
        <TreeGearButton
          nodeId={container.id}
          menuIdPrefix={`tree-container-${container.id}`}
          title={isRoot ? 'Body Properties' : 'Container Properties'}
          onSelectNode={onSelectNode}
          isLayoutPanelOpen={isLayoutPanelOpen}
          onOpenLayoutPanel={onOpenLayoutPanel}
          layoutPanelSelector={layoutPanelSelector}
        />
        <DeleteButton
          title="Delete Container"
          disabledTitle="The Body cannot be deleted"
          onDelete={isRoot ? undefined : () => onRemoveContainer?.(container.id)}
        />
      </div>
    </div>
  );
}
