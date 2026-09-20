'use client';

import React, { useState, useEffect } from 'react';
import {
  FlexContainerNode,
  FlexComponentNode,
  FlexDirection,
  FlexGap,
  FlexAlign,
  FlexJustify,
  LayoutVariant,
} from '@/types/layout';
import { FieldDefinition } from '@/types/field';
import { useExplorerActionMenu } from '@/hooks/useExplorerActionMenu';
import ExplorerActionMenu, {
  ActionMenuDangerItem,
  ActionMenuDivider,
} from '@/components/ExplorerActionMenu';

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
  menu: ReturnType<typeof useExplorerActionMenu>;
  position?: 'left' | 'right';
  onUpdateContainer?: (containerId: string, partial: Partial<FlexContainerNode>) => void;
  onRemoveContainer?: (containerId: string) => void;
  onSelectNode?: (nodeId: string | null) => void;
}

export function TemplateContainerActionMenu({
  container,
  parentContainer,
  menu,
  position = 'left',
  onUpdateContainer,
  onRemoveContainer,
  onSelectNode,
}: TemplateContainerActionMenuProps) {
  const isRoot = container.id === 'root-container';
  const defaultLabel = isRoot ? 'Body' : container.label || 'Container';
  const [label, setLabel] = useState(defaultLabel);

  useEffect(() => {
    setLabel(isRoot ? 'Body' : container.label || 'Container');
  }, [container.label, isRoot]);

  const handleLabelBlur = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== container.label) {
      onUpdateContainer?.(container.id, { label: trimmed });
    }
  };

  const containerIcon = isRoot
    ? '📦'
    : container.isCard
    ? '🗂️'
    : container.direction === 'row'
    ? '↔️'
    : '↕️';

  return (
    <ExplorerActionMenu
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
        {/* Container Label / Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Container Name
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelBlur();
            }}
            placeholder="e.g. Header Section, Sidebar, Card Row"
            className="w-full px-2.5 py-1.5 bg-surface-secondary border border-subtle rounded-lg text-xs text-strong focus:outline-none focus:border-[var(--primary-accent)] font-medium transition"
          />
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
                container.direction === 'row'
                  ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] border-[var(--primary-accent)] text-white shadow-sm'
                  : 'bg-surface-secondary border-subtle text-muted hover:text-white'
              }`}
            >
              <span>↔️</span>
              <span>Row</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateContainer?.(container.id, { direction: 'column' })}
              className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                container.direction === 'column'
                  ? 'bg-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] border-[var(--primary-accent)] text-white shadow-sm'
                  : 'bg-surface-secondary border-subtle text-muted hover:text-white'
              }`}
            >
              <span>↕️</span>
              <span>Column</span>
            </button>
          </div>
        </div>

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

        {/* Wrap Children Toggle (Row mode only) */}
        {container.direction === 'row' && (
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
    </ExplorerActionMenu>
  );
}

/* ==========================================================================
   2. COMPONENT ACTION MENU (Flyout Properties)
   ========================================================================== */

interface TemplateComponentActionMenuProps {
  component: FlexComponentNode;
  parentContainer?: FlexContainerNode | null;
  fields?: FieldDefinition[];
  menu: ReturnType<typeof useExplorerActionMenu>;
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

  useEffect(() => {
    setLabel(component.label || '');
  }, [component.label]);

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
    <ExplorerActionMenu
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
    </ExplorerActionMenu>
  );
}
