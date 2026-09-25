'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FlexContainerNode,
  FlexComponentNode,
  FlexGap,
  FlexAlign,
  FlexJustify,
  LayoutVariant,
  resolveDirection,
  resolvePaddingCss,
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
import { activeBtn, barToggleBtn, barToggleGroup, disabledBtn } from '@/components/editorBarStyles';
import TemplateSpacingBox from '@/components/TemplateSpacingBox';
import type { HintContent } from '@/components/HoverHint';
import {
  BodyIcon,
  FlexRowIcon,
  FlexColumnIcon,
  LayoutContainerIcon,
  AddChildContainerIcon,
  ActionIcon,
  PropertiesIcon,
  AutoSizingIcon,
  CustomSizingIcon,
} from '@/components/icons/LayoutIcons';

/* Help bubbles for the Body flyout's Properties sections (see HoverHint for the shape). */
const BODY_SIZE_HINT: HintContent = {
  title: 'Size',
  settings: [
    { name: 'Auto', text: <>Enables the <em>Body</em> to stretch automatically to accommodate child content.</> },
    { name: 'Custom', text: 'Enables custom width and height settings.' },
  ],
  notes: (
    <>
      <strong>Custom</strong> sizing is not available for the <em>Body</em>. Set <strong>Maximum Content Width</strong> to
      set a maximum width instead; the Body will center by default.
    </>
  ),
};

const BODY_LAYOUT_HINT: HintContent = {
  title: 'Layout',
  settings: [
    { name: 'Row', text: 'Lays child containers out side by side, from left to right.' },
    { name: 'Column', text: 'Stacks child containers on top of each other, from top to bottom.' },
  ],
  notes: (
    <>
      The <em>Body</em> always flows using <code>Column</code>, like a page in a book. To place items side by side,
      add a container with <strong>Layout</strong> set to <code>Row</code>.
    </>
  ),
};

const SPACING_HINT: HintContent = {
  title: 'Spacing',
  settings: [
    { name: 'Margin', text: 'Space outside the container, between it and whatever sits next to it.' },
    { name: 'Padding', text: 'Space inside the container, between its edge and its content.' },
  ],
  notes: (
    <>
      Click a side to select it, then use the slider and unit to set it (<code>px</code> or <code>%</code>), or type a
      value in its box. Turn on <strong>Link sides</strong> to change all four together. The <em>Body</em> has no
      margin, only padding.
    </>
  ),
};

// menuShellXWide (31.5rem = 504px) minus the Body flyout's normal 14rem (224px): how much further left a
// right-docked flyout must start so the wider Properties tab still ends at the panel seam.
const PROPERTIES_EXTRA_WIDTH_PX = 280;

const GAP_OPTIONS: { value: FlexGap; label: string }[] = [
  { value: 0, label: '0px' },
  { value: 4, label: '4px' },
  { value: 8, label: '8px' },
  { value: 12, label: '12px' },
  { value: 16, label: '16px' },
  { value: 24, label: '24px' },
  { value: 32, label: '32px' },
];

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
  parentContainer?: FlexContainerNode | null;
  menu: ReturnType<typeof useTreeActionMenu>;
  position?: 'left' | 'right';
  onAddContainer?: (targetContainerId: string, options?: Partial<FlexContainerNode>) => string;
  onUpdateContainer?: (containerId: string, partial: Partial<FlexContainerNode>) => void;
  onRemoveContainer?: (containerId: string) => void;
  onSelectNode?: (nodeId: string | null) => void;
}

export function TemplateContainerActionMenu({
  container,
  parentContainer,
  menu,
  position = 'left',
  onAddContainer,
  onUpdateContainer,
  onRemoveContainer,
  onSelectNode,
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
  const [openSections, setOpenSections] = useState({ size: true, layout: true, spacing: true });
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

  // Read by the non-root Container Padding section below (the Body's padding lives in the Spacing box).
  const paddingRaw = resolvePaddingCss(container.padding);

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

  const containerIcon = isRoot ? (
    <BodyIcon className="w-4 h-4 text-slate-300" />
  ) : container.isCard ? (
    '🗂️'
  ) : resolveDirection(container, isRoot) === 'row' ? (
    <FlexRowIcon className="w-4 h-4 text-slate-300" />
  ) : resolveDirection(container, isRoot) === 'column' ? (
    <FlexColumnIcon className="w-4 h-4 text-slate-300" />
  ) : (
    <LayoutContainerIcon className="w-4 h-4 text-slate-300" />
  );

  return (
    <TreeActionMenu
      isOpen={menu.isMenuOpen}
      onMouseEnter={menu.handleMenuMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      top={menu.menuCoords.top}
      left={menu.menuCoords.left}
      position={position}
      title={isRoot ? 'Root Body Properties' : 'Container Properties'}
      titleIcon={containerIcon}
      className="menuShellWide"
    >
      <div className="flex flex-col gap-2.5 p-2 text-xs">
        {/* Container Name */}
        <div className="flex flex-col gap-1.5">
          <div className="properties-section-heading">
            <hr aria-hidden="true" />
            <h3>Container Name</h3>
          </div>
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
              placeholder="e.g. Header Section, Sidebar, Card Row"
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

        {/* Direction Toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Flex Flow Direction
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateContainer?.(container.id, { direction: 'row' })}
              className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                resolveDirection(container, isRoot) === 'row'
                  ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] border-[var(--primary-accent)] text-white shadow-sm'
                  : 'bg-surface-secondary border-subtle text-muted hover:text-white'
              }`}
            >
              <FlexRowIcon className="w-3.5 h-3.5" />
              <span>Row</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateContainer?.(container.id, { direction: 'column' })}
              className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                resolveDirection(container, isRoot) === 'column'
                  ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] border-[var(--primary-accent)] text-white shadow-sm'
                  : 'bg-surface-secondary border-subtle text-muted hover:text-white'
              }`}
            >
              <FlexColumnIcon className="w-3.5 h-3.5" />
              <span>Column</span>
            </button>
          </div>
        </div>

        {/* Container Sizing (Width / Min / Max, Height / Min / Max, Stack) */}
        {!isRoot && (
          <TemplateContainerSizing
            container={container}
            onUpdate={(partial) => onUpdateContainer?.(container.id, partial)}
          />
        )}

        {/* Child Gap */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Child Item Gap
            </label>
            <span className="text-[10px] font-mono text-[var(--primary-accent)] font-semibold">
              {container.gap}px
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {GAP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdateContainer?.(container.id, { gap: opt.value })}
                className={`flex-1 min-w-[32px] py-0.5 text-[10.5px] font-semibold rounded border transition cursor-pointer ${
                  container.gap === opt.value
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] text-white border-[var(--primary-accent)]'
                    : 'bg-surface-secondary text-muted border-subtle hover:text-strong'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Container Padding */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Container Padding
            </label>
            <span className="text-[10px] font-mono text-[var(--primary-accent)] font-semibold">
              {paddingRaw}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[0, 8, 16, 24].map((pad) => (
              <button
                key={pad}
                type="button"
                onClick={() => onUpdateContainer?.(container.id, { padding: `${pad}px` })}
                className={`py-0.5 text-[10.5px] font-semibold rounded border transition cursor-pointer text-center ${
                  paddingRaw === `${pad}px`
                    ? 'bg-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] text-white border-[var(--primary-accent)]'
                    : 'bg-surface-secondary text-muted border-subtle hover:text-white'
                }`}
              >
                {pad}px
              </button>
            ))}
          </div>
        </div>

        {/* Wrap Children Toggle (Row mode only) */}
        {resolveDirection(container, isRoot) === 'row' && (
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-secondary border border-subtle">
            <span className="text-[11px] font-medium text-strong">Wrap Children</span>
            <button
              type="button"
              onClick={() => onUpdateContainer?.(container.id, { wrap: !container.wrap })}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                container.wrap ? 'bg-[var(--primary-accent)]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  container.wrap ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Alignment & Justify */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Align Items
            </label>
            <select
              value={container.align}
              onChange={(e) => onUpdateContainer?.(container.id, { align: e.target.value as FlexAlign })}
              className="px-2 py-1 text-xs bg-surface-secondary border border-subtle rounded-lg text-strong focus:outline-none focus:border-[var(--primary-accent)]"
            >
              <option value="stretch">Stretch</option>
              <option value="flex-start">Start</option>
              <option value="center">Center</option>
              <option value="flex-end">End</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Justify Content
            </label>
            <select
              value={container.justify}
              onChange={(e) => onUpdateContainer?.(container.id, { justify: e.target.value as FlexJustify })}
              className="px-2 py-1 text-xs bg-surface-secondary border border-subtle rounded-lg text-strong focus:outline-none focus:border-[var(--primary-accent)]"
            >
              <option value="flex-start">Start</option>
              <option value="center">Center</option>
              <option value="flex-end">End</option>
              <option value="between">Space Between</option>
              <option value="around">Space Around</option>
            </select>
          </div>
        </div>

        {/* Card Frame Style Toggle */}
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-secondary border border-subtle">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🗂️</span>
            <span className="text-[11px] font-medium text-strong">Card Frame Style</span>
          </div>
          <button
            type="button"
            onClick={() => onUpdateContainer?.(container.id, { isCard: !container.isCard })}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              container.isCard ? 'bg-[var(--primary-accent)]' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                container.isCard ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Delete Container Action */}
        {!isRoot && onRemoveContainer && (
          <>
            <ActionMenuDivider />
            <ActionMenuDangerItem
              icon={<span>🗑️</span>}
              label="Delete Container"
              subtext="Permanently remove container and all contents"
              onClick={() => {
                onRemoveContainer(container.id);
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
