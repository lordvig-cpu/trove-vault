'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FlexContainerNode,
  FlexComponentNode,
  LayoutVariant,
  resolveDirection,
  normalizeAlign,
  normalizeJustify,
} from '@/types/layout';
import { FieldDefinition } from '@/types/field';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import TreeActionMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuSection,
  ActionMenuTabs,
} from '@/components/TreeActionMenu';
import TemplateBodyDimensions from '@/components/TemplateBodyDimensions';
import TemplateContainerSizing from '@/components/TemplateContainerSizing';
import { activeBtn, barToggleBtn, barToggleGroup, disabledBtn, ghostBtn } from '@/components/editorBarStyles';
import { NEW_CONTAINER_OPTIONS } from '@/lib/layoutTree';
import { AlignItemsIcon, JustifyContentIcon } from '@/components/icons/AlignIcons';
import { measureContainerPx } from '@/lib/measureContainer';
import TemplateSpacingBox from '@/components/TemplateSpacingBox';
import TemplateAppearanceControls from '@/components/TemplateAppearanceControls';
import HoverHint, { HintRef, type HintContent } from '@/components/HoverHint';
import {
  BodyIcon,
  FlexRowIcon,
  FlexColumnIcon,
  AddChildContainerIcon,
  AddContainerBeforeIcon,
  AddContainerAfterIcon,
  SplitColumnsIcon,
  SplitRowsIcon,
  ActionIcon,
  PropertiesIcon,
  AutoSizingIcon,
  CustomSizingIcon,
  LinkIcon,
  HelpCircleIcon,
  FitContentIcon,
} from '@/components/icons/LayoutIcons';

/* Help bubbles for the Body flyout's Properties sections (see HoverHint for the shape). */
const BODY_SIZE_HINT: HintContent = {
  title: 'Size',
  settings: [
    { name: 'Auto', icon: <AutoSizingIcon className="w-2.5 h-2.5" />, text: <>Enables the <em>Body</em> to stretch automatically to accommodate child content.</> },
    { name: 'Custom', icon: <CustomSizingIcon className="w-2.5 h-2.5" />, text: 'Enables custom width and height settings.' },
  ],
  notes: [
    { kind: 'caution', text: <><HintRef icon={<CustomSizingIcon className="w-2.5 h-2.5" />}>Custom</HintRef> sizing is not available for the <em>Body</em>.</> },
    { kind: 'tip', text: <>Set <strong>Maximum Content Width</strong> to set a maximum width instead; the Body will center by default.</> },
  ],
};

const BODY_LAYOUT_HINT: HintContent = {
  title: 'Layout',
  settings: [
    { name: 'Row', icon: <FlexRowIcon className="w-2.5 h-2.5" />, text: 'Lays child containers out side by side, from left to right.' },
    { name: 'Column', icon: <FlexColumnIcon className="w-2.5 h-2.5" />, text: 'Stacks child containers on top of each other, from top to bottom.' },
  ],
  notes: [
    { kind: 'tip', text: <>The <em>Body</em> always flows using <code>Column</code>, like a page in a book.</> },
    { kind: 'use', text: <>To place items side by side, add a container with <strong>Layout</strong> set to <code>Row</code>.</> },
  ],
};

const SPACING_HINT: HintContent = {
  title: 'Spacing',
  settings: [
    { name: 'Margin', text: 'Space outside the container, between it and whatever sits next to it.' },
    { name: 'Padding', text: 'Space inside the container, between its edge and its content.' },
  ],
  notes: [
    { kind: 'use', text: <>Click a side to select it, then use the slider and unit to set it (<code>px</code> or <code>%</code>), or type a value in its box.</> },
    { kind: 'tip', text: <>Turn on <HintRef icon={<LinkIcon className="w-2.5 h-2.5" />}>Link sides</HintRef> to change all four together.</> },
    { kind: 'caution', text: <>The <em>Body</em> has no margin, only padding.</> },
  ],
};

// menuShellXWide (31.5rem = 504px) minus the Body flyout's normal 14rem (224px): how much further left a
// right-docked flyout must start so the wider Properties tab still ends at the panel seam.
const PROPERTIES_EXTRA_WIDTH_PX = 280;

/**
 * Help for one alignment group, worded for the container's direction: "Align items" runs across the
 * flow (up/down in a Row, left/right in a Column) and "Justify content" along it, so the same option
 * reads "top" in one and "left" in the other. Each option shows the icon its button has.
 */
function alignmentHint(kind: 'align' | 'justify', isRow: boolean): HintContent {
  const across = kind === 'align';
  const vertical = across === isRow; // across a Row, or along a Column
  const cls = (rotate: string) => `w-2.5 h-2.5 ${rotate}`.trim();
  const rot = across ? (isRow ? '' : '-rotate-90') : isRow ? '' : 'rotate-90';
  const start = vertical ? 'top' : 'left';
  const middle = vertical ? 'middle' : 'center';
  const end = vertical ? 'bottom' : 'right';
  const notes: HintContent['notes'] = [
    {
      kind: 'tip',
      text: (
        <>
          Only shows when children don&apos;t already fill the container:{' '}
          <HintRef icon={<AutoSizingIcon className="w-2.5 h-2.5" />}>Auto</HintRef> children stretch to fill it, so
          give them a <HintRef icon={<CustomSizingIcon className="w-2.5 h-2.5" />}>Custom</HintRef> size to see it.
        </>
      ),
    },
  ];
  if (across) {
    return {
      title: vertical ? 'Vertical align' : 'Horizontal align',
      settings: [
        { name: 'Stretch', icon: <AlignItemsIcon value="stretch" className={cls(rot)} />, text: `Children stretch to fill the container's ${vertical ? 'height' : 'width'}.` },
        { name: 'Start', icon: <AlignItemsIcon value="start" className={cls(rot)} />, text: `Children line up at the ${start}.` },
        { name: 'Center', icon: <AlignItemsIcon value="center" className={cls(rot)} />, text: `Children line up in the ${middle}.` },
        { name: 'End', icon: <AlignItemsIcon value="end" className={cls(rot)} />, text: `Children line up at the ${end}.` },
      ],
      notes,
    };
  }
  return {
    title: vertical ? 'Vertical align' : 'Horizontal align',
    settings: [
      { name: 'Start', icon: <JustifyContentIcon value="start" className={cls(rot)} />, text: `Children are grouped at the ${start}.` },
      { name: 'Center', icon: <JustifyContentIcon value="center" className={cls(rot)} />, text: `Children are grouped in the ${middle}.` },
      { name: 'End', icon: <JustifyContentIcon value="end" className={cls(rot)} />, text: `Children are grouped at the ${end}.` },
      { name: 'Between', icon: <JustifyContentIcon value="between" className={cls(rot)} />, text: 'Children are spread out, the first and last against the edges.' },
      { name: 'Around', icon: <JustifyContentIcon value="around" className={cls(rot)} />, text: 'Children are spread out with equal space around each one.' },
    ],
    notes,
  };
}

/** A labeled segmented group of icon buttons for one alignment property (see the Layout section). */
function AlignmentButtons<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  renderIcon,
}: {
  label: string;
  hint: HintContent;
  value: T;
  options: { value: T; title: string }[];
  onChange: (value: T) => void;
  renderIcon: (value: T) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center justify-end gap-1 text-[10px] font-semibold tracking-[0.04em] text-[var(--secondary-tree-menu-header-title)]">
        {label}
        <HoverHint hint={hint}>
          <HelpCircleIcon className="w-3 h-3" />
        </HoverHint>
      </span>
      <div className={`${barToggleGroup} w-full`} role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            aria-label={opt.title}
            title={opt.title}
            className={`${barToggleBtn} flex-1 justify-center ${
              value === opt.value ? `border cursor-default ${activeBtn}` : `${ghostBtn} cursor-pointer`
            }`}
          >
            {renderIcon(opt.value)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* Help bubbles for a standard (non-Body) container's Properties sections. */
const CONTAINER_SIZE_HINT: HintContent = {
  title: 'Size',
  settings: [
    { name: 'Auto', icon: <AutoSizingIcon className="w-2.5 h-2.5" />, text: 'Fills the space its parent gives it, and grows with its content.' },
    { name: 'Fit', icon: <FitContentIcon className="w-2.5 h-2.5" />, text: 'Shrinks the container to fit its content. Available once it has content.' },
    { name: 'Custom', icon: <CustomSizingIcon className="w-2.5 h-2.5" />, text: 'Lets you set your own width and height, and shows drag handles on the canvas.' },
  ],
  notes: [
    { kind: 'use', text: <><strong>Width</strong>, <strong>Min</strong> and <strong>Max</strong> take <code>px</code> or <code>%</code>.</> },
    { kind: 'tip', text: <>A blank <strong>Width</strong> means fill; a blank <strong>Height</strong> means auto.</> },
    { kind: 'tip', text: <><strong>Stack when narrower than</strong> turns a Row into a Column below that width.</> },
  ],
};

const CONTAINER_LAYOUT_HINT: HintContent = {
  title: 'Layout',
  settings: [
    { name: 'Row', icon: <FlexRowIcon className="w-2.5 h-2.5" />, text: 'Lays child containers out side by side, from left to right.' },
    { name: 'Column', icon: <FlexColumnIcon className="w-2.5 h-2.5" />, text: 'Stacks child containers on top of each other, from top to bottom.' },
    {
      name: 'Along the flow',
      text: 'Left to right in a Row, top to bottom in a Column: group children at the start, center or end, or spread them with space between or around.',
    },
    {
      name: 'Across the flow',
      text: 'Up and down in a Row, left and right in a Column: stretch children to fill, or line them up at the start, center or end.',
    },
  ],
  notes: [
    {
      kind: 'tip',
      text: (
        <>
          Alignment only shows when children don&apos;t already fill the container: <HintRef icon={<AutoSizingIcon className="w-2.5 h-2.5" />}>Auto</HintRef> children stretch to fill
          it, so give them a <HintRef icon={<CustomSizingIcon className="w-2.5 h-2.5" />}>Custom</HintRef> size to see it.
        </>
      ),
    },
  ],
};

const CONTAINER_SPACING_HINT: HintContent = {
  title: 'Spacing',
  settings: [
    { name: 'Margin', text: 'Space outside the container, between it and whatever sits next to it.' },
    { name: 'Padding', text: 'Space inside the container, between its edge and its content.' },
  ],
  notes: [
    { kind: 'use', text: <>Click a side to select it, then use the slider and unit to set it (<code>px</code> or <code>%</code>), or type a value in its box.</> },
    { kind: 'tip', text: <>Turn on <HintRef icon={<LinkIcon className="w-2.5 h-2.5" />}>Link sides</HintRef> to change all four together.</> },
  ],
};

const VARIANT_OPTIONS: { variant: LayoutVariant; label: string; icon: string }[] = [
  { variant: 'standard', label: 'Standard Card', icon: '🗂️' },
  { variant: 'compact', label: 'Compact Pill', icon: '🏷️' },
  { variant: 'stat', label: 'Stat / Metric', icon: '📈' },
  { variant: 'table_row', label: 'Table Row', icon: '📊' },
  { variant: 'hero', label: 'Hero Display', icon: '🖼️' },
  { variant: 'callout', label: 'Callout Accent', icon: '💡' },
];

/* ==========================================================================
   1. CONTAINER ACTION MENU (Flyout Properties)
   ========================================================================== */

interface TemplateContainerActionMenuProps {
  container: FlexContainerNode;
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
  onAddContainer?: (targetContainerId: string, options?: Partial<FlexContainerNode>) => string;
  onInsertContainerSibling?: (
    targetContainerId: string,
    position: 'before' | 'after',
    options?: Partial<FlexContainerNode>
  ) => string;
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows', measuredPx: number) => void;
  onUpdateContainer?: (containerId: string, partial: Partial<FlexContainerNode>) => void;
  onRemoveContainer?: (containerId: string) => void;
}

export function TemplateContainerActionMenu({
  container,
  menu,
  position = 'left',
  onAddContainer,
  onInsertContainerSibling,
  onSplitContainer,
  onUpdateContainer,
  onRemoveContainer,
}: TemplateContainerActionMenuProps) {
  const isRoot = container.id === 'root-container';
  const defaultLabel = isRoot ? 'Body' : container.label || 'Container';
  const [label, setLabel] = useState(defaultLabel);
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [newContainerName, setNewContainerName] = useState('New Container');
  const inputRef = useRef<HTMLInputElement>(null);

  // Body flyout's Actions / Properties tabs and which Properties sections are expanded. Kept here
  // (not inside the menu shell) so they survive the flyout closing and reopening.
  const [activeTab, setActiveTab] = useState<'actions' | 'properties'>('actions');
  const [openSections, setOpenSections] = useState({ name: true, size: true, layout: true, spacing: true, appearance: true });
  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (isAddingContent) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isAddingContent]);

  // Adjust state during render, not in an effect, when the menu closes or the container's own
  // label changes (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  const [prevMenuOpen, setPrevMenuOpen] = useState(menu.isMenuOpen);
  if (prevMenuOpen !== menu.isMenuOpen) {
    setPrevMenuOpen(menu.isMenuOpen);
    if (!menu.isMenuOpen) {
      setIsAddingContent(false);
      setNewContainerName('New Container');
    }
  }

  const [prevDefaultLabel, setPrevDefaultLabel] = useState(defaultLabel);
  if (prevDefaultLabel !== defaultLabel) {
    setPrevDefaultLabel(defaultLabel);
    setLabel(defaultLabel);
  }

  if (isRoot) {
    return (
      <TreeActionMenu
        isOpen={menu.isMenuOpen}
        onMouseEnter={menu.handleMenuMouseEnter}
        onMouseLeave={menu.handleMouseLeave}
        top={menu.menuCoords.top}
        left={menu.menuCoords.left - (position === 'right' && activeTab === 'properties' ? PROPERTIES_EXTRA_WIDTH_PX : 0)}
        position={position}
        splitBody
        className={activeTab === 'properties' ? 'menuShellXWide' : undefined}
        title="Body Properties"
        titleIcon={<BodyIcon className="w-4 h-4" />}
        subheader={
          <ActionMenuTabs
            tabs={[
              { id: 'actions', label: 'Actions', icon: <ActionIcon className="w-4 h-4" /> },
              { id: 'properties', label: 'Properties', icon: <PropertiesIcon className="w-4 h-4" /> },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        }
      >
        {activeTab === 'actions' && (
          <>
            <ActionMenuItem
              icon={<AddChildContainerIcon className="w-3.5 h-3.5" />}
              label="Add Child Container"
              subtext="Insert nested container"
              onClick={() => {
                setNewContainerName('New Container');
                setIsAddingContent((prev) => !prev);
              }}
            />

            {isAddingContent && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = newContainerName.trim() || 'New Container';
                  onAddContainer?.(container.id, { label: trimmed, padding: '0px', sizing: { type: 'fill' } });
                  setIsAddingContent(false);
                  menu.closeMenu();
                }}
                className="actionMenuRenameForm"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={newContainerName}
                  onChange={(e) => setNewContainerName(e.target.value)}
                  placeholder="New Container"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsAddingContent(false);
                    }
                  }}
                  className="actionMenuRenameInput"
                />
                <div className="actionMenuRenameActions">
                  <button
                    type="button"
                    onClick={() => setIsAddingContent(false)}
                    className="actionMenuRenameCancelBtn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="actionMenuRenameSaveBtn"
                  >
                    Add Child Container
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {activeTab === 'properties' && (
          <div className="menuColumns">
            <div className="menuColumn">
                <ActionMenuSection label="Size" hint={BODY_SIZE_HINT} isOpen={openSections.size} onToggle={() => toggleSection('size')}>
                  <div className="px-3 pt-0 pb-2">
                    <div className={`${barToggleGroup} w-full`} role="group" aria-label="Sizing mode">
                      <button
                        type="button"
                        title="Auto: the Body stretches automatically with content"
                        className={`${barToggleBtn} flex-1 justify-center border cursor-default ${activeBtn}`}
                      >
                        <AutoSizingIcon className="w-3.5 h-3.5" />
                        Auto
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Custom sizing is not available for the Body"
                        className={`${barToggleBtn} flex-1 justify-center ${disabledBtn} text-[var(--secondary-accent)]`}
                      >
                        <CustomSizingIcon className="w-3.5 h-3.5" />
                        Custom
                      </button>
                    </div>
                  </div>

                  {/* Max Content Width -- also a Size setting (caps/centers the Body's content). */}
                  <TemplateBodyDimensions
                    root={container}
                    onUpdate={(partial) => onUpdateContainer?.(container.id, partial)}
                  />
                </ActionMenuSection>

                <ActionMenuSection label="Layout" hint={BODY_LAYOUT_HINT} isOpen={openSections.layout} onToggle={() => toggleSection('layout')}>
                  <div className="px-3 pt-0 pb-2">
                    <div className={`${barToggleGroup} w-full`} role="group" aria-label="Flex direction">
                      <button
                        type="button"
                        disabled
                        title="The Body always flows top-to-bottom, like a page. To place items side-by-side, add a Row container and put them inside it."
                        className={`${barToggleBtn} flex-1 justify-center ${disabledBtn} text-[var(--secondary-accent)]`}
                      >
                        <FlexRowIcon className="w-3.5 h-3.5" />
                        Row
                      </button>
                      <button
                        type="button"
                        title="The Body always flows top-to-bottom, like a page."
                        className={`${barToggleBtn} flex-1 justify-center border cursor-default ${activeBtn}`}
                      >
                        <FlexColumnIcon className="w-3.5 h-3.5" />
                        Column
                      </button>
                    </div>
                  </div>
                </ActionMenuSection>
            </div>

            <div className="menuColumnDivider" aria-hidden="true" />

            <div className="menuColumn">
              <ActionMenuSection label="Spacing" hint={SPACING_HINT} isOpen={openSections.spacing} onToggle={() => toggleSection('spacing')}>
                <TemplateSpacingBox
                  container={container}
                  onUpdate={(partial) => onUpdateContainer?.(container.id, partial)}
                  marginDisabled
                />
              </ActionMenuSection>
            </div>
          </div>
        )}
      </TreeActionMenu>
    );
  }

  // Committing is explicit (Save/Enter) rather than on blur, so clicking away from a half-typed
  // name doesn't silently apply it -- Cancel/Escape discards back to the last saved value instead.
  const isNameDirty = label !== defaultLabel;
  const handleLabelSave = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== container.label) {
      onUpdateContainer?.(container.id, { label: trimmed });
    } else {
      setLabel(defaultLabel);
    }
  };
  const handleLabelCancel = () => setLabel(defaultLabel);

  const containerIcon = container.isCard ? (
    '🗂️'
  ) : resolveDirection(container, isRoot) === 'row' ? (
    <FlexRowIcon className="w-4 h-4" />
  ) : (
    <FlexColumnIcon className="w-4 h-4" />
  );

  const direction = resolveDirection(container, isRoot);
  const isFixedSize = container.sizing?.type === 'fixed';
  const isFitSize = container.sizing?.type === 'auto';
  // Fit shrinks a container to its content, so it only means something once there is some.
  const hasContent = container.children.length > 0;
  // Switching to Custom snapshots the on-screen width (unscaled layout px, not the zoomed CSS box)
  // so nothing jumps -- it only reveals the resize handles. Same as the top toolbar's Custom.
  const switchToCustomSize = () => {
    const el = document.querySelector<HTMLElement>(`[data-container-id="${container.id}"]`);
    const value = el?.offsetWidth
      ? `${Math.round(el.offsetWidth)}px`
      : isFixedSize
      ? container.sizing.value || '50%'
      : '50%';
    onUpdateContainer?.(container.id, { width: value, sizing: { type: 'fixed', value } });
  };

  // An action: run it, then close the flyout.
  const act = (fn?: () => void) => () => {
    fn?.();
    menu.closeMenu();
  };

  return (
    <TreeActionMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left - (position === 'right' && activeTab === 'properties' ? PROPERTIES_EXTRA_WIDTH_PX : 0)}
      position={position}
      splitBody
      className={activeTab === 'properties' ? 'menuShellXWide' : undefined}
      title="Container Properties"
      titleIcon={containerIcon}
      subheader={
        <ActionMenuTabs
          tabs={[
            { id: 'actions', label: 'Actions', icon: <ActionIcon className="w-4 h-4" /> },
            { id: 'properties', label: 'Properties', icon: <PropertiesIcon className="w-4 h-4" /> },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      }
    >
      {activeTab === 'actions' && (
        <>
          <ActionMenuItem
            icon={<AddContainerBeforeIcon className="w-3.5 h-3.5" />}
            label="Add Before"
            subtext="Insert a container before this one"
            onClick={act(() => onInsertContainerSibling?.(container.id, 'before', { ...NEW_CONTAINER_OPTIONS }))}
          />
          <ActionMenuItem
            icon={<AddChildContainerIcon className="w-3.5 h-3.5" />}
            label="Add Inside"
            subtext="Nest a new container in this one"
            onClick={act(() => onAddContainer?.(container.id, { ...NEW_CONTAINER_OPTIONS }))}
          />
          <ActionMenuItem
            icon={<AddContainerAfterIcon className="w-3.5 h-3.5" />}
            label="Add After"
            subtext="Insert a container after this one"
            onClick={act(() => onInsertContainerSibling?.(container.id, 'after', { ...NEW_CONTAINER_OPTIONS }))}
          />
          <ActionMenuDivider />
          <ActionMenuItem
            icon={<SplitColumnsIcon className="w-3.5 h-3.5" />}
            label="Split into 2 Columns"
            subtext="Side by side"
            onClick={act(() => onSplitContainer?.(container.id, 'columns', measureContainerPx(container.id, 'width')))}
          />
          <ActionMenuItem
            icon={<SplitRowsIcon className="w-3.5 h-3.5" />}
            label="Split into 2 Rows"
            subtext="Stacked"
            onClick={act(() => onSplitContainer?.(container.id, 'rows', measureContainerPx(container.id, 'height')))}
          />

          {onRemoveContainer && (
            <>
              <ActionMenuDivider />
              <ActionMenuDangerItem
                icon={<span>🗑️</span>}
                label="Delete Container"
                subtext="Permanently remove container and all contents"
                onClick={act(() => onRemoveContainer(container.id))}
              />
            </>
          )}

        </>
      )}

      {activeTab === 'properties' && (
        <div className="menuColumns">
          <div className="menuColumn">
            <ActionMenuSection label="Container Name" isOpen={openSections.name} onToggle={() => toggleSection('name')}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLabelSave();
                }}
                className="flex flex-col gap-1.5 px-3 pt-0 pb-2"
              >
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLabelCancel();
                    }
                  }}
                  placeholder="e.g. Header Section, Sidebar"
                  className="actionMenuRenameInput"
                />
                {isNameDirty && (
                  <div className="actionMenuRenameActions">
                    <button type="button" onClick={handleLabelCancel} className="actionMenuRenameCancelBtn">
                      Cancel
                    </button>
                    <button type="submit" className="actionMenuRenameSaveBtn">
                      Save
                    </button>
                  </div>
                )}
              </form>
            </ActionMenuSection>

            <ActionMenuSection label="Size" hint={CONTAINER_SIZE_HINT} isOpen={openSections.size} onToggle={() => toggleSection('size')}>
              <div className="px-3 pt-0 pb-2">
                <div className={`${barToggleGroup} w-full`} role="group" aria-label="Sizing mode">
                  <button
                    type="button"
                    onClick={() => onUpdateContainer?.(container.id, { width: undefined, sizing: { type: 'fill' } })}
                    title="Auto: fill the available parent space"
                    className={`${barToggleBtn} flex-1 justify-center ${
                      !isFixedSize && !isFitSize ? `border cursor-default ${activeBtn}` : `${ghostBtn} cursor-pointer`
                    }`}
                  >
                    <AutoSizingIcon className="w-3.5 h-3.5" />
                    Auto
                  </button>
                  <button
                    type="button"
                    disabled={!hasContent}
                    onClick={() =>
                      onUpdateContainer?.(container.id, {
                        width: undefined,
                        sizing: { ...container.sizing, type: 'auto', value: undefined },
                      })
                    }
                    title={hasContent ? 'Fit: shrink the container to fit its content' : 'Fit: add content to this container first'}
                    className={`${barToggleBtn} flex-1 justify-center ${
                      !hasContent
                        ? `${disabledBtn} text-[var(--secondary-accent)]`
                        : isFitSize
                        ? `border cursor-default ${activeBtn}`
                        : `${ghostBtn} cursor-pointer`
                    }`}
                  >
                    <FitContentIcon className="w-3.5 h-3.5" />
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={switchToCustomSize}
                    title="Custom: set your own width/height (e.g. 50%, 300px)"
                    className={`${barToggleBtn} flex-1 justify-center ${
                      isFixedSize ? `border cursor-default ${activeBtn}` : `${ghostBtn} cursor-pointer`
                    }`}
                  >
                    <CustomSizingIcon className="w-3.5 h-3.5" />
                    Custom
                  </button>
                </div>
              </div>
              <TemplateContainerSizing
                bare
                container={container}
                onUpdate={(partial) => onUpdateContainer?.(container.id, partial)}
              />
            </ActionMenuSection>

          </div>

          <div className="menuColumnDivider" aria-hidden="true" />

          <div className="menuColumn">
            <ActionMenuSection label="Spacing" hint={CONTAINER_SPACING_HINT} isOpen={openSections.spacing} onToggle={() => toggleSection('spacing')}>
              <TemplateSpacingBox
                container={container}
                onUpdate={(partial) => onUpdateContainer?.(container.id, partial)}
              />
            </ActionMenuSection>

            <ActionMenuSection label="Layout" hint={CONTAINER_LAYOUT_HINT} isOpen={openSections.layout} onToggle={() => toggleSection('layout')}>
              <div className="flex flex-col gap-2 px-3 pt-0 pb-2">
                <div className={`${barToggleGroup} w-full`} role="group" aria-label="Flex direction">
                  <button
                    type="button"
                    onClick={() => onUpdateContainer?.(container.id, { direction: 'row' })}
                    title="Row layout (horizontal flow)"
                    className={`${barToggleBtn} flex-1 justify-center ${
                      direction === 'row' ? `border cursor-default ${activeBtn}` : `${ghostBtn} cursor-pointer`
                    }`}
                  >
                    <FlexRowIcon className="w-3.5 h-3.5" />
                    Row
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateContainer?.(container.id, { direction: 'column' })}
                    title="Column layout (vertical flow)"
                    className={`${barToggleBtn} flex-1 justify-center ${
                      direction === 'column' ? `border cursor-default ${activeBtn}` : `${ghostBtn} cursor-pointer`
                    }`}
                  >
                    <FlexColumnIcon className="w-3.5 h-3.5" />
                    Column
                  </button>
                </div>

                {(() => {
                  const isRow = direction === 'row';
                  // Cross axis (Align Items): up/down in a Row, left/right in a Column. Main axis
                  // (Justify Content): the other way round. Always shown horizontal first, then vertical.
                  const align = (
                    <AlignmentButtons
                      key="align"
                      hint={alignmentHint('align', isRow)}
                      label={isRow ? 'Vertical align' : 'Horizontal align'}
                      value={normalizeAlign(container.align)}
                      onChange={(v) => onUpdateContainer?.(container.id, { align: v })}
                      options={[
                        { value: 'stretch', title: 'Stretch to fill' },
                        { value: 'start', title: isRow ? 'Top' : 'Left' },
                        { value: 'center', title: isRow ? 'Middle' : 'Center' },
                        { value: 'end', title: isRow ? 'Bottom' : 'Right' },
                      ]}
                      renderIcon={(v) => (
                        <AlignItemsIcon value={v} className={isRow ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 -rotate-90'} />
                      )}
                    />
                  );
                  const justify = (
                    <AlignmentButtons
                      key="justify"
                      hint={alignmentHint('justify', isRow)}
                      label={isRow ? 'Horizontal align' : 'Vertical align'}
                      value={normalizeJustify(container.justify)}
                      onChange={(v) => onUpdateContainer?.(container.id, { justify: v })}
                      options={[
                        { value: 'start', title: isRow ? 'Left' : 'Top' },
                        { value: 'center', title: isRow ? 'Center' : 'Middle' },
                        { value: 'end', title: isRow ? 'Right' : 'Bottom' },
                        { value: 'between', title: 'Space between' },
                        { value: 'around', title: 'Space around' },
                      ]}
                      renderIcon={(v) => (
                        <JustifyContentIcon value={v} className={isRow ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 rotate-90'} />
                      )}
                    />
                  );
                  return isRow ? [justify, align] : [align, justify];
                })()}
              </div>
            </ActionMenuSection>

            <ActionMenuSection label="Appearance" isOpen={openSections.appearance} onToggle={() => toggleSection('appearance')}>
              <TemplateAppearanceControls
                container={container}
                onUpdate={(partial) => onUpdateContainer?.(container.id, partial)}
              />
            </ActionMenuSection>
          </div>
        </div>
      )}
    </TreeActionMenu>
  );
}

/* ==========================================================================
   2. COMPONENT ACTION MENU (Flyout Properties)
   ========================================================================== */

interface TemplateComponentActionMenuProps {
  component: FlexComponentNode;
  parentContainer?: FlexContainerNode | null;
  fields?: FieldDefinition[];
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
  onUpdateComponent?: (componentId: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveComponent?: (componentId: string) => void;
  onSelectNode?: (nodeId: string | null) => void;
}

export function TemplateComponentActionMenu({
  component,
  parentContainer,
  fields,
  menu,
  position = 'left',
  onUpdateComponent,
  onRemoveComponent,
  onSelectNode,
}: TemplateComponentActionMenuProps) {
  const [label, setLabel] = useState(component.label || '');

  // Adjust state during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevComponentLabel, setPrevComponentLabel] = useState(component.label);
  if (prevComponentLabel !== component.label) {
    setPrevComponentLabel(component.label);
    setLabel(component.label || '');
  }

  const handleLabelBlur = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== component.label) {
      onUpdateComponent?.(component.id, { label: trimmed });
    }
  };

  const compIcon =
    component.componentType === 'field'
      ? '📝'
      : component.componentType === 'table'
      ? '📊'
      : component.componentType === 'media'
      ? '🖼️'
      : component.componentType === 'stat'
      ? '📈'
      : '💡';

  return (
    <TreeActionMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      title="Component Properties"
      titleIcon={compIcon}
      className="menuShellWide"
    >
      <div className="flex flex-col gap-2.5 p-2 text-xs">
        {/* Component Label / Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Component Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelBlur();
            }}
            placeholder="e.g. Hero Banner, Specs Table"
            className="w-full px-2.5 py-1.5 bg-surface-secondary border border-subtle rounded-lg text-xs text-strong focus:outline-none focus:border-[var(--primary-accent)] font-medium transition"
          />
        </div>

        {/* Component Type Badge */}
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-secondary border border-subtle">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Type</span>
          <span className="text-xs font-mono font-bold uppercase text-[var(--primary-accent)]">
            {component.componentType}
          </span>
        </div>

        {/* Flex Sizing Behavior */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Flex Sizing
          </label>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => onUpdateComponent?.(component.id, { sizing: { type: 'fill' } })}
              className={`py-1 px-1.5 rounded-md text-[10.5px] font-semibold border transition cursor-pointer text-center ${
                (component.sizing?.type || 'fill') === 'fill'
                  ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-white border-[var(--primary-accent)] shadow-sm'
                  : 'bg-surface-secondary text-muted border-subtle hover:text-white'
              }`}
            >
              Fill
            </button>
            <button
              type="button"
              onClick={() => onUpdateComponent?.(component.id, { sizing: { type: 'auto' } })}
              className={`py-1 px-1.5 rounded-md text-[10.5px] font-semibold border transition cursor-pointer text-center ${
                component.sizing?.type === 'auto'
                  ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-white border-[var(--primary-accent)] shadow-sm'
                  : 'bg-surface-secondary text-muted border-subtle hover:text-white'
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => onUpdateComponent?.(component.id, { sizing: { type: 'fixed', value: '160px' } })}
              className={`py-1 px-1.5 rounded-md text-[10.5px] font-semibold border transition cursor-pointer text-center ${
                component.sizing?.type === 'fixed'
                  ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] text-white border-[var(--primary-accent)] shadow-sm'
                  : 'bg-surface-secondary text-muted border-subtle hover:text-white'
              }`}
            >
              Fixed
            </button>
          </div>
        </div>

        {/* Layout Variant Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Display Variant
          </label>
          <div className="grid grid-cols-2 gap-1">
            {VARIANT_OPTIONS.map((v) => (
              <button
                key={v.variant}
                type="button"
                onClick={() => onUpdateComponent?.(component.id, { variant: v.variant })}
                className={`flex items-center gap-1.5 p-1.5 rounded-md border text-[11px] font-medium transition cursor-pointer text-left ${
                  (component.variant || 'standard') === v.variant
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] border-[var(--primary-accent)] text-white shadow-sm font-bold'
                    : 'bg-surface-secondary border-subtle text-muted hover:text-white'
                }`}
              >
                <span>{v.icon}</span>
                <span className="truncate">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bound Schema Field Selector (if field type) */}
        {component.componentType === 'field' && fields && fields.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Bound Schema Field
            </label>
            <select
              value={component.field_id || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                const f = fields.find((item) => item.id === val);
                onUpdateComponent?.(component.id, {
                  field_id: val || null,
                  label: f ? f.label : component.label,
                });
              }}
              className="px-2 py-1 text-xs bg-surface-secondary border border-subtle rounded-lg text-strong focus:outline-none focus:border-[var(--primary-accent)]"
            >
              <option value="">-- Select Field --</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.field_type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Delete Component Action */}
        {onRemoveComponent && (
          <>
            <ActionMenuDivider />
            <ActionMenuDangerItem
              icon={<span>🗑️</span>}
              label="Delete Component"
              subtext="Remove component from layout container"
              onClick={() => {
                onRemoveComponent(component.id);
                menu.closeMenu();
              }}
            />
          </>
        )}

        {/* Parent Container Reference */}
        {parentContainer && (
          <div className="pt-2 border-t border-subtle flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Parent Container
            </span>
            {onSelectNode ? (
              <button
                type="button"
                onClick={() => {
                  onSelectNode(parentContainer.id);
                  menu.closeMenu();
                }}
                className="text-xs font-semibold text-[var(--primary-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                title={`Select parent container: ${parentContainer.id === 'root-container' ? 'Body' : parentContainer.label || 'Container'}`}
              >
                <span>⬆️</span>
                <span>
                  {parentContainer.id === 'root-container'
                    ? 'Body'
                    : parentContainer.label || 'Container'}
                </span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-[var(--primary-accent)] flex items-center gap-1">
                <span>⬆️</span>
                <span>
                  {parentContainer.id === 'root-container'
                    ? 'Body'
                    : parentContainer.label || 'Container'}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </TreeActionMenu>
  );
}
