'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FlexContainerNode,
  FlexComponentNode,
  resolveDirection,
  normalizeAlign,
  normalizeJustify,
} from '@/types/layout';
import { FieldDefinition } from '@/types/field';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import TreeSubMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
  ActionMenuItem,
  ActionMenuSection,
  ActionMenuTabs,
} from '@/components/TreeSubMenu';
import TemplateBodyDimensions from '@/components/TemplateBodyDimensions';
import TemplateContainerSizing from '@/components/TemplateContainerSizing';
import { activeBtn, barDisabledBtn, barGhostBtn, barToggleBtn, barToggleGroup } from '@/components/editorBarStyles';
import { NEW_CONTAINER_OPTIONS } from '@/lib/layoutTree';
import { AlignItemsIcon, JustifyContentIcon } from '@/components/icons/AlignIcons';
import {
  SectionAppearanceIcon,
  SectionContentIcon,
  SectionLabelIcon,
  SectionLayoutIcon,
  SectionSizeIcon,
  SectionSpacingIcon,
  SectionTextIcon,
} from '@/components/icons/SectionIcons';
import { measureContainerPx } from '@/lib/measureContainer';
import TemplateSpacingBox from '@/components/TemplateSpacingBox';
import TemplateAppearanceControls from '@/components/TemplateAppearanceControls';
import {
  CONTENT_LABEL_HINT,
  CONTENT_SOURCE_HINT,
  CONTENT_TEXT_HINT,
  ContentLabelControls,
  ContentSourceControls,
  ContentTextControls,
} from '@/components/TemplateContentControls';
import { bindingOf, contentNameOf } from '@/lib/layoutContent';
import { MENU_TAB_REQUEST_EVENT, type MenuTab, type MenuTabRequest } from '@/lib/menuTabRequest';
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
import { ChevronDownIcon, TrashCanIcon } from '@/components/icons/PanelIcons';
import { ChevronUpIcon } from '@/components/icons/GlyphIcons';
import { useLayoutNeighbors } from '@/context/LayoutNavigationContext';
import { ComponentTypeIcon, BulbIcon } from '@/components/icons/ContentIcons';

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

// menuShellXWide (17.5rem = 280px) minus the flyout's normal 14rem (224px): how much further left a
// right-docked flyout must start so the wide shell still ends at the panel seam.
const PROPERTIES_EXTRA_WIDTH_PX = 56;

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
      <span className="flex items-center gap-1 menu-field-label text-[10px] font-semibold tracking-[0.04em] text-[var(--text-strong)]">
        {label}
        <HoverHint hint={hint}>
          <HelpCircleIcon className="w-3 h-3 text-[var(--secondary-tree-menu-header-title)]" />
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
              value === opt.value ? `border cursor-default ${activeBtn}` : `${barGhostBtn} cursor-pointer`
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

/** Select Previous / Next: step to the element just above or below this one in the Layout tree's order
 *  (the Body comes first), without needing the tree on screen. Leads every Actions tab; either is left out
 *  at the start or end of the layout, and both outside a LayoutNavigationProvider. */
function LayoutNavigationActions({ nodeId }: { nodeId: string }) {
  const nav = useLayoutNeighbors(nodeId);
  if (!nav || (!nav.prev && !nav.next)) return null;
  const { prev, next, goTo } = nav;
  return (
    <>
      {prev && (
        <ActionMenuItem
          icon={<ChevronUpIcon className="w-3.5 h-3.5" />}
          label={`Select Previous: ${prev.name}`}
          subtext="The element above this one in the layout"
          onClick={() => goTo(prev.id)}
        />
      )}
      {next && (
        <ActionMenuItem
          icon={<ChevronDownIcon className="w-3.5 h-3.5" />}
          label={`Select Next: ${next.name}`}
          subtext="The element below this one in the layout"
          onClick={() => goTo(next.id)}
        />
      )}
      <ActionMenuDivider />
    </>
  );
}

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
  /** Shown as a floating window instead of sliding out of the Layout tree (lib/floatingNodeMenu.ts). */
  floating?: FloatingMenuChrome;
  /** The tab it opens on (default Actions); a floating menu remounts on each open, so it takes effect then. */
  initialTab?: MenuTab;
}

/** TreeSubMenu's floating chrome (its close and drag handlers). */
type FloatingMenuChrome = NonNullable<React.ComponentProps<typeof TreeSubMenu>['floating']>;

/** Switches a flyout's tab when the toolbar gear asks it to (lib/menuTabRequest.ts). */
function useMenuTabRequest(nodeId: string, setActiveTab: (tab: MenuTab) => void) {
  useEffect(() => {
    const handle = (e: Event) => {
      const { nodeId: target, tab } = (e as CustomEvent<MenuTabRequest>).detail;
      if (target === nodeId) setActiveTab(tab);
    };
    window.addEventListener(MENU_TAB_REQUEST_EVENT, handle);
    return () => window.removeEventListener(MENU_TAB_REQUEST_EVENT, handle);
  }, [nodeId, setActiveTab]);
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
  floating,
  initialTab = 'actions',
}: TemplateContainerActionMenuProps) {
  const isRoot = container.id === 'root-container';
  const defaultLabel = isRoot ? 'Body' : container.label || 'Container';
  const [label, setLabel] = useState(defaultLabel);
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [newContainerName, setNewContainerName] = useState('New Container');
  const inputRef = useRef<HTMLInputElement>(null);

  // Body flyout's Actions / Properties tabs and which Properties sections are expanded. Kept here
  // (not inside the menu shell) so they survive the flyout closing and reopening.
  const [activeTab, setActiveTab] = useState<MenuTab>(initialTab);
  useMenuTabRequest(container.id, setActiveTab);
  const [openSections, setOpenSections] = useState({ size: true, layout: true, spacing: true, appearance: true });
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
      <TreeSubMenu
        isOpen={menu.isMenuOpen}
        onMouseEnter={menu.handleMenuMouseEnter}
        onMouseLeave={menu.handleMouseLeave}
        top={menu.menuCoords.top}
        left={menu.menuCoords.left - (position === 'right' ? PROPERTIES_EXTRA_WIDTH_PX : 0)}
        position={position}
        splitBody
        className="menuShellXWide"
        title={floating ? 'Body' : 'Body Properties'}
        floating={floating}
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
            <LayoutNavigationActions nodeId={container.id} />
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
          <>
                <ActionMenuSection label="Size" icon={<SectionSizeIcon />} subtitle="Auto and content width" hint={BODY_SIZE_HINT} isOpen={openSections.size} onToggle={() => toggleSection('size')}>
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
                        className={`${barToggleBtn} flex-1 justify-center border border-transparent ${barDisabledBtn}`}
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

                <ActionMenuSection label="Layout" icon={<SectionLayoutIcon />} subtitle="Direction" hint={BODY_LAYOUT_HINT} isOpen={openSections.layout} onToggle={() => toggleSection('layout')}>
                  <div className="px-3 pt-0 pb-2">
                    <div className={`${barToggleGroup} w-full`} role="group" aria-label="Flex direction">
                      <button
                        type="button"
                        disabled
                        title="The Body always flows top-to-bottom, like a page. To place items side-by-side, add a Row container and put them inside it."
                        className={`${barToggleBtn} flex-1 justify-center border border-transparent ${barDisabledBtn}`}
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

              <ActionMenuSection label="Spacing" icon={<SectionSpacingIcon />} subtitle="Padding" hint={SPACING_HINT} isOpen={openSections.spacing} onToggle={() => toggleSection('spacing')}>
                <TemplateSpacingBox
                  container={container}
                  onUpdate={(partial) => onUpdateContainer?.(container.id, partial)}
                  marginDisabled
                />
              </ActionMenuSection>
          </>
        )}
      </TreeSubMenu>
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

  const containerIcon = resolveDirection(container, isRoot) === 'row' ? (
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
    <TreeSubMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left - (position === 'right' ? PROPERTIES_EXTRA_WIDTH_PX : 0)}
      position={position}
      splitBody
      className="menuShellXWide"
      title={floating ? `Container: ${defaultLabel}` : 'Container Properties'}
      floating={floating}
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
          <LayoutNavigationActions nodeId={container.id} />
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
            icon={<SplitColumnsIcon className="w-3.5 h-3.5 menu-icon-accent" />}
            label="Split into 2 Columns"
            subtext="Side by side"
            onClick={act(() => onSplitContainer?.(container.id, 'columns', measureContainerPx(container.id, 'width')))}
          />
          <ActionMenuItem
            icon={<SplitRowsIcon className="w-3.5 h-3.5 menu-icon-accent" />}
            label="Split into 2 Rows"
            subtext="Stacked"
            onClick={act(() => onSplitContainer?.(container.id, 'rows', measureContainerPx(container.id, 'height')))}
          />

          {onRemoveContainer && (
            <>
              <ActionMenuDivider />
              <ActionMenuDangerItem
                icon={<TrashCanIcon />}
                label="Delete Container"
                subtext="Permanently remove container and all contents"
                onClick={act(() => onRemoveContainer(container.id))}
              />
            </>
          )}

        </>
      )}

      {activeTab === 'properties' && (
        <>
            <div className="flex flex-col gap-1 px-3 pb-2">
              <span className="menu-field-label text-[10px] font-semibold tracking-[0.04em] text-[var(--text-strong)]">
                Container Name
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLabelSave();
                }}
                className="flex flex-col gap-1.5"
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
            </div>

            <ActionMenuSection label="Size" icon={<SectionSizeIcon />} subtitle="Width, height and limits" hint={CONTAINER_SIZE_HINT} isOpen={openSections.size} onToggle={() => toggleSection('size')}>
              <div className="px-3 pt-0 pb-2">
                <div className={`${barToggleGroup} w-full`} role="group" aria-label="Sizing mode">
                  <button
                    type="button"
                    onClick={() => onUpdateContainer?.(container.id, { width: undefined, sizing: { type: 'fill' } })}
                    title="Auto: fill the available parent space"
                    className={`${barToggleBtn} flex-1 justify-center ${
                      !isFixedSize && !isFitSize ? `border cursor-default ${activeBtn}` : `${barGhostBtn} cursor-pointer`
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
                        ? `border border-transparent ${barDisabledBtn}`
                        : isFitSize
                        ? `border cursor-default ${activeBtn}`
                        : `${barGhostBtn} cursor-pointer`
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
                      isFixedSize ? `border cursor-default ${activeBtn}` : `${barGhostBtn} cursor-pointer`
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

            <ActionMenuSection label="Spacing" icon={<SectionSpacingIcon />} subtitle="Margin and padding" hint={CONTAINER_SPACING_HINT} isOpen={openSections.spacing} onToggle={() => toggleSection('spacing')}>
              <TemplateSpacingBox
                container={container}
                onUpdate={(partial) => onUpdateContainer?.(container.id, partial)}
              />
            </ActionMenuSection>

            <ActionMenuSection label="Layout" icon={<SectionLayoutIcon />} subtitle="Direction and alignment" hint={CONTAINER_LAYOUT_HINT} isOpen={openSections.layout} onToggle={() => toggleSection('layout')}>
              <div className="flex flex-col gap-2 px-3 pt-0 pb-2">
                <div className={`${barToggleGroup} w-full`} role="group" aria-label="Flex direction">
                  <button
                    type="button"
                    onClick={() => onUpdateContainer?.(container.id, { direction: 'row' })}
                    title="Row layout (horizontal flow)"
                    className={`${barToggleBtn} flex-1 justify-center ${
                      direction === 'row' ? `border cursor-default ${activeBtn}` : `${barGhostBtn} cursor-pointer`
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
                      direction === 'column' ? `border cursor-default ${activeBtn}` : `${barGhostBtn} cursor-pointer`
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

            <ActionMenuSection label="Appearance" icon={<SectionAppearanceIcon />} subtitle="Background and styling" isOpen={openSections.appearance} onToggle={() => toggleSection('appearance')}>
              <TemplateAppearanceControls
                container={container}
                onUpdate={(partial) => onUpdateContainer?.(container.id, partial)}
              />
            </ActionMenuSection>
        </>
      )}
    </TreeSubMenu>
  );
}

/* ==========================================================================
   2. COMPONENT ACTION MENU (Flyout Properties)
   A content element's gear flyout: the same split shell as a container's, with an Actions tab and a
   Properties tab. Its Properties are Content (what it shows and how), Label, Text and Appearance --
   deliberately no Size, Spacing or Layout: the container holding the element owns those, which is
   what keeps dropping content into a configured container a plain drag-and-drop.
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
  floating?: FloatingMenuChrome;
  initialTab?: MenuTab;
}

export function TemplateComponentActionMenu({
  component,
  fields = [],
  menu,
  position = 'left',
  onUpdateComponent,
  onRemoveComponent,
  floating,
  initialTab = 'actions',
}: TemplateComponentActionMenuProps) {
  const update = (partial: Partial<FlexComponentNode>) => onUpdateComponent?.(component.id, partial);
  // A bound element (or a field not bound yet) has the full set; the old table / media / stat
  // placeholder blocks have no data, so they only get a name and Appearance until pre-defined content
  // replaces them.
  const isContent = bindingOf(component) !== null || component.componentType === 'field';

  // Active tab and which Properties sections are expanded. Kept here (not inside the menu shell) so
  // they survive the flyout closing and reopening.
  const [activeTab, setActiveTab] = useState<MenuTab>(initialTab);
  useMenuTabRequest(component.id, setActiveTab);
  const [openSections, setOpenSections] = useState({ content: true, label: false, text: true, appearance: false });
  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const [name, setName] = useState(component.label || '');
  const [prevLabel, setPrevLabel] = useState(component.label);
  if (prevLabel !== component.label) {
    setPrevLabel(component.label);
    setName(component.label || '');
  }
  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== component.label) update({ label: trimmed });
  };

  const compIcon = <ComponentTypeIcon type={component.componentType} className="w-4 h-4" fallback={BulbIcon} />;

  return (
    <TreeSubMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left - (position === 'right' ? PROPERTIES_EXTRA_WIDTH_PX : 0)}
      position={position}
      splitBody
      className="menuShellXWide"
      title={floating ? `Content: ${contentNameOf(component, fields) || 'Content'}` : 'Content Properties'}
      floating={floating}
      titleIcon={compIcon}
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
          <LayoutNavigationActions nodeId={component.id} />
          {onRemoveComponent ? (
            <ActionMenuDangerItem
              icon={<TrashCanIcon />}
              label="Delete Content"
              subtext="Remove this from its container"
              onClick={() => {
                onRemoveComponent(component.id);
                menu.closeMenu();
              }}
            />
          ) : (
            <div className="px-3 py-2 text-[11px] text-muted">Nothing to do here yet.</div>
          )}
        </>
      )}

      {activeTab === 'properties' && (
        <>
          {isContent ? (
            <>
              <ActionMenuSection label="Content" icon={<SectionContentIcon />} subtitle="What it shows" hint={CONTENT_SOURCE_HINT} isOpen={openSections.content} onToggle={() => toggleSection('content')}>
                <ContentSourceControls component={component} fields={fields} onUpdate={update} />
              </ActionMenuSection>

              <ActionMenuSection label="Label" icon={<SectionLabelIcon />} subtitle="Name beside the value" hint={CONTENT_LABEL_HINT} isOpen={openSections.label} onToggle={() => toggleSection('label')}>
                <ContentLabelControls component={component} fields={fields} onUpdate={update} />
              </ActionMenuSection>

              <ActionMenuSection label="Text" icon={<SectionTextIcon />} subtitle="Size, weight and color" hint={CONTENT_TEXT_HINT} isOpen={openSections.text} onToggle={() => toggleSection('text')}>
                <ContentTextControls component={component} fields={fields} onUpdate={update} />
              </ActionMenuSection>
            </>
          ) : (
            <div className="flex flex-col gap-1 px-3 pb-2">
              <span className="menu-field-label text-[10px] font-semibold tracking-[0.04em] text-[var(--text-strong)]">
                Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                placeholder="e.g. Hero Banner, Specs Table"
                aria-label="Name"
                className="w-full px-2.5 py-1.5 bg-surface-secondary border border-subtle rounded-lg text-xs text-strong focus:outline-none focus:border-[var(--secondary-accent)] font-medium transition"
              />
            </div>
          )}

          <ActionMenuSection label="Appearance" icon={<SectionAppearanceIcon />} subtitle="Background and styling" isOpen={openSections.appearance} onToggle={() => toggleSection('appearance')}>
            <TemplateAppearanceControls container={component} onUpdate={update} />
          </ActionMenuSection>
        </>
      )}
    </TreeSubMenu>
  );
}
