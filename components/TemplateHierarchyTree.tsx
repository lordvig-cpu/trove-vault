'use client';

import React, { useState, useMemo } from 'react';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
} from '@/types/layout';
import { FieldDefinition } from '@/types/field';
import { GearIcon } from '@/components/icons/ActionIcons';
import { useExplorerActionMenu } from '@/hooks/useExplorerActionMenu';
import {
  TemplateContainerActionMenu,
  TemplateComponentActionMenu,
} from '@/components/TemplateLayoutActionMenu';

/* ==========================================================================
   1. PROPS INTERFACE
   ========================================================================== */

export interface TemplateHierarchyTreeProps {
  flexLayoutConfig: TemplateFlexLayoutConfig | null;
  selectedNodeId: string | null;
  activeContainerId?: string;
  fields?: FieldDefinition[];
  onSelectNode: (nodeId: string | null) => void;
  onOpenProperties?: (nodeId: string) => void;
  onUpdateContainer?: (containerId: string, partial: Partial<FlexContainerNode>) => void;
  onUpdateComponent?: (componentId: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveContainer: (containerId: string) => void;
  onRemoveComponent: (componentId: string) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
}

/* ==========================================================================
   2. HELPER FUNCTIONS
   ========================================================================== */

export function countElements(node: FlexContainerNode): { containers: number; components: number } {
  let containers = 1;
  let components = 0;

  for (const child of node.children) {
    if (child.nodeType === 'container') {
      const sub = countElements(child);
      containers += sub.containers;
      components += sub.components;
    } else {
      components += 1;
    }
  }

  return { containers, components };
}

export function getAllContainerIds(node: FlexContainerNode): string[] {
  const ids = [node.id];
  for (const child of node.children) {
    if (child.nodeType === 'container') {
      ids.push(...getAllContainerIds(child));
    }
  }
  return ids;
}

/* ==========================================================================
   3. TREE NODE ROW: Container Node Item (Explorer Tree Visual Model)
   ========================================================================== */

interface ContainerNodeRowProps {
  container: FlexContainerNode;
  parentContainer?: FlexContainerNode | null;
  depth: number;
  selectedNodeId: string | null;
  activeContainerId?: string;
  expandedIds: Set<string>;
  fields: FieldDefinition[];
  onToggleExpand: (id: string) => void;
  onSelectNode: (id: string | null) => void;
  onOpenProperties?: (id: string) => void;
  onUpdateContainer?: (id: string, partial: Partial<FlexContainerNode>) => void;
  onUpdateComponent?: (id: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveContainer: (id: string) => void;
  onRemoveComponent: (id: string) => void;
}

function ContainerNodeRow({
  container,
  parentContainer,
  depth,
  selectedNodeId,
  activeContainerId,
  expandedIds,
  fields,
  onToggleExpand,
  onSelectNode,
  onOpenProperties,
  onUpdateContainer,
  onUpdateComponent,
  onRemoveContainer,
  onRemoveComponent,
}: ContainerNodeRowProps) {
  const isRoot = container.id === 'root-container';
  const isSelected = selectedNodeId === container.id;
  const isActiveTarget = activeContainerId === container.id;
  const isExpanded = expandedIds.has(container.id);
  const hasChildren = container.children.length > 0;
  const menu = useExplorerActionMenu(`tree-container-${container.id}`, 280, 'left');

  // Semantic layout icon
  const containerIcon = isRoot
    ? '📦'
    : container.isCard
    ? '🗂️'
    : container.direction === 'row'
    ? '↔️'
    : '↕️';

  const containerLabel = isRoot ? 'Body' : container.label || 'Container';

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      {/* Row Item formatted to exact site explorer model */}
      <div
        onClick={() => onSelectNode(container.id)}
        title={containerLabel}
        style={{ paddingLeft: `${depth * 18 + 6}px` }}
        className={[
          'group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isSelected
            ? 'explorer-tree-item-selected font-medium'
            : 'explorer-tree-item',
        ].join(' ')}
      >
        {/* Expand / Collapse Chevron */}
        <button
          type="button"
          aria-label={isExpanded ? 'Collapse container' : 'Expand container'}
          aria-expanded={hasChildren ? isExpanded : undefined}
          disabled={!hasChildren}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(container.id);
          }}
          className={[
            'flex items-center justify-center w-3.5 h-3.5 shrink-0',
            'text-[9px] explorer-tree-muted',
            'cursor-pointer transition select-none',
            !hasChildren && 'explorer-tree-hidden pointer-events-none cursor-default opacity-0',
          ].filter(Boolean).join(' ')}
          title={isExpanded ? 'Collapse container' : 'Expand container'}
        >
          {isExpanded ? '▼' : '▶\uFE0E'}
        </button>

        {/* Node Icon */}
        <span className="w-4 h-4 flex items-center justify-center text-xs opacity-80 shrink-0 select-none">
          {containerIcon}
        </span>

        {/* Node Label */}
        <span className="text-[13px] tracking-tight truncate flex-1 min-w-0 text-slate-200 group-hover:text-white">
          {containerLabel}
        </span>

        {/* Direction tag for non-root containers */}
        {!isRoot && (
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60 shrink-0">
            {container.direction === 'row' ? 'Row' : 'Col'}
          </span>
        )}

        {/* Child Count Badge */}
        {hasChildren && (
          <span
            title={`${container.children.length} sub-items`}
            className="explorer-tree-badge px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 select-none"
          >
            {container.children.length}
          </span>
        )}

        {/* Active Target Indicator Badge */}
        {isActiveTarget && !isRoot && (
          <span className="text-[8.5px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] text-[var(--primary-accent)] border border-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] shrink-0 select-none">
            Target
          </span>
        )}

        {/* Gear Icon: Triggers Explorer Action Menu with Item Properties */}
        <div className="relative ml-auto shrink-0">
          <div
            role="button"
            tabIndex={0}
            aria-label={`Open ${containerLabel} actions`}
            aria-expanded={menu.isMenuOpen}
            onKeyDown={menu.handleGearKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(container.id);
              menu.handleGearMouseEnter(e);
            }}
            onMouseEnter={menu.handleGearMouseEnter}
            onMouseLeave={menu.handleMouseLeave}
            className={[
              'group/gear flex items-center justify-center w-6 h-6 shrink-0',
              'rounded border border-transparent cursor-pointer transition-colors',
              menu.isMenuOpen ? 'tree-gear-trigger-active' : 'tree-gear-trigger',
            ].join(' ')}
          >
            <GearIcon
              isActive={menu.isMenuOpen}
              className={[
                'w-[15px] h-[15px] transition-all duration-300 ease-out',
                menu.isMenuOpen
                  ? 'explorer-tree-primary rotate-90'
                  : 'explorer-tree-action-icon',
              ].join(' ')}
            />
          </div>
        </div>

        {/* Hover Delete Action */}
        {!isRoot && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveContainer(container.id);
            }}
            className="opacity-0 group-hover:opacity-70 hover:!opacity-100 text-[11px] text-red-400 hover:text-red-200 p-0.5 rounded hover:bg-red-500/20 transition cursor-pointer shrink-0"
            title={`Delete ${containerLabel}`}
            aria-label={`Delete ${containerLabel}`}
          >
            🗑️
          </button>
        )}
      </div>

      {/* Container Flyout Action Menu */}
      <TemplateContainerActionMenu
        container={container}
        parentContainer={parentContainer}
        menu={menu}
        position="left"
        onUpdateContainer={onUpdateContainer}
        onRemoveContainer={onRemoveContainer}
        onSelectNode={onSelectNode}
      />

      {/* Render Children when Expanded */}
      {isExpanded && hasChildren && (
        <div className="flex flex-col relative">
          {container.children.map((child) => {
            if (child.nodeType === 'container') {
              return (
                <ContainerNodeRow
                  key={child.id}
                  container={child}
                  parentContainer={container}
                  depth={depth + 1}
                  selectedNodeId={selectedNodeId}
                  activeContainerId={activeContainerId}
                  expandedIds={expandedIds}
                  fields={fields}
                  onToggleExpand={onToggleExpand}
                  onSelectNode={onSelectNode}
                  onOpenProperties={onOpenProperties}
                  onUpdateContainer={onUpdateContainer}
                  onUpdateComponent={onUpdateComponent}
                  onRemoveContainer={onRemoveContainer}
                  onRemoveComponent={onRemoveComponent}
                />
              );
            }
            return (
              <ComponentNodeRow
                key={child.id}
                component={child}
                parentContainer={container}
                depth={depth + 1}
                selectedNodeId={selectedNodeId}
                fields={fields}
                onSelectNode={onSelectNode}
                onOpenProperties={onOpenProperties}
                onUpdateComponent={onUpdateComponent}
                onRemoveComponent={onRemoveComponent}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   4. TREE NODE ROW: Component Node Item
   ========================================================================== */

interface ComponentNodeRowProps {
  component: FlexComponentNode;
  parentContainer?: FlexContainerNode | null;
  depth: number;
  selectedNodeId: string | null;
  fields: FieldDefinition[];
  onSelectNode: (id: string | null) => void;
  onOpenProperties?: (id: string) => void;
  onUpdateComponent?: (id: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveComponent: (id: string) => void;
}

function ComponentNodeRow({
  component,
  parentContainer,
  depth,
  selectedNodeId,
  fields,
  onSelectNode,
  onOpenProperties,
  onUpdateComponent,
  onRemoveComponent,
}: ComponentNodeRowProps) {
  const isSelected = selectedNodeId === component.id;
  const menu = useExplorerActionMenu(`tree-comp-${component.id}`, 280, 'left');

  const boundField = component.field_id
    ? fields.find((f) => f.id === component.field_id)
    : undefined;

  const label = component.label || boundField?.label || component.componentType;

  // Icon determining component representation
  const componentIcon =
    component.componentType === 'field'
      ? '📝'
      : component.componentType === 'table'
      ? '📊'
      : component.componentType === 'media'
      ? '🖼️'
      : component.componentType === 'stat'
      ? '📈'
      : '🗒️';

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => onSelectNode(component.id)}
        title={label}
        style={{ paddingLeft: `${depth * 18 + 6}px` }}
        className={[
          'group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isSelected
            ? 'explorer-tree-item-selected font-medium'
            : 'explorer-tree-item',
        ].join(' ')}
      >
        {/* Spacer aligned with container chevron */}
        <span className="w-3.5 h-3.5 shrink-0 opacity-0" aria-hidden="true" />

        {/* Node Icon */}
        <span className="w-4 h-4 flex items-center justify-center text-xs opacity-80 shrink-0 select-none">
          {componentIcon}
        </span>

        {/* Node Label */}
        <span className="text-[13px] tracking-tight truncate flex-1 min-w-0 text-slate-200 group-hover:text-white">
          {label}
        </span>

        {/* Variant / Sizing Badge */}
        {component.variant && component.variant !== 'standard' && (
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
            {component.variant}
          </span>
        )}

        {/* Sizing Indicator */}
        {component.sizing && component.sizing.type !== 'fill' && (
          <span className="text-[9px] font-mono text-slate-400 shrink-0">
            {component.sizing.type === 'fixed'
              ? component.sizing.value || 'fixed'
              : 'auto'}
          </span>
        )}

        {/* Gear Icon: Triggers Explorer Action Menu with Item Properties */}
        <div className="relative ml-auto shrink-0">
          <div
            role="button"
            tabIndex={0}
            aria-label={`Open ${label} actions`}
            aria-expanded={menu.isMenuOpen}
            onKeyDown={menu.handleGearKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(component.id);
              menu.handleGearMouseEnter(e);
            }}
            onMouseEnter={menu.handleGearMouseEnter}
            onMouseLeave={menu.handleMouseLeave}
            className={[
              'group/gear flex items-center justify-center w-6 h-6 shrink-0',
              'rounded border border-transparent cursor-pointer transition-colors',
              menu.isMenuOpen ? 'tree-gear-trigger-active' : 'tree-gear-trigger',
            ].join(' ')}
          >
            <GearIcon
              isActive={menu.isMenuOpen}
              className={[
                'w-[15px] h-[15px] transition-all duration-300 ease-out',
                menu.isMenuOpen
                  ? 'explorer-tree-primary rotate-90'
                  : 'explorer-tree-action-icon',
              ].join(' ')}
            />
          </div>
        </div>

        {/* Hover Delete Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveComponent(component.id);
          }}
          className="opacity-0 group-hover:opacity-70 hover:!opacity-100 text-[11px] text-red-400 hover:text-red-200 p-0.5 rounded hover:bg-red-500/20 transition cursor-pointer shrink-0"
          title={`Delete ${label}`}
          aria-label={`Delete ${label}`}
        >
          🗑️
        </button>
      </div>

      {/* Component Flyout Action Menu */}
      <TemplateComponentActionMenu
        component={component}
        parentContainer={parentContainer}
        fields={fields}
        menu={menu}
        position="left"
        onUpdateComponent={onUpdateComponent}
        onRemoveComponent={onRemoveComponent}
        onSelectNode={onSelectNode}
      />
    </div>
  );
}

/* ==========================================================================
   5. MAIN COMPONENT: TemplateHierarchyTree
   ========================================================================== */

export default function TemplateHierarchyTree({
  flexLayoutConfig,
  selectedNodeId,
  activeContainerId,
  fields = [],
  onSelectNode,
  onOpenProperties,
  onUpdateContainer,
  onUpdateComponent,
  onRemoveContainer,
  onRemoveComponent,
  expandedIds: externalExpandedIds,
  onToggleExpand: externalOnToggleExpand,
}: TemplateHierarchyTreeProps) {
  const root = flexLayoutConfig?.root;

  // Fallback internal expansion tracking if not controlled externally
  const allIds = useMemo(() => (root ? getAllContainerIds(root) : []), [root]);
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(() => new Set(allIds));

  const effectiveExpandedIds = externalExpandedIds ?? internalExpandedIds;
  const effectiveOnToggleExpand =
    externalOnToggleExpand ??
    ((id: string) => {
      setInternalExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    });

  if (!root) {
    return (
      <div className="p-4 flex flex-col items-center justify-center text-center gap-2 text-slate-500 h-full">
        <span className="text-2xl">📐</span>
        <span className="text-xs font-semibold text-slate-400">No Layout Loaded</span>
        <p className="text-[11px] text-slate-500">
          Open a template to inspect and configure its visual content structure.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full select-none py-1.5">
      <ContainerNodeRow
        container={root}
        parentContainer={null}
        depth={0}
        selectedNodeId={selectedNodeId}
        activeContainerId={activeContainerId}
        expandedIds={effectiveExpandedIds}
        fields={fields}
        onToggleExpand={effectiveOnToggleExpand}
        onSelectNode={onSelectNode}
        onOpenProperties={onOpenProperties}
        onUpdateContainer={onUpdateContainer}
        onUpdateComponent={onUpdateComponent}
        onRemoveContainer={onRemoveContainer}
        onRemoveComponent={onRemoveComponent}
      />
    </div>
  );
}
