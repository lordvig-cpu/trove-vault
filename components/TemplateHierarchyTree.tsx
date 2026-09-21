'use client';

import React, { useState, useMemo } from 'react';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  resolveDirection,
} from '@/types/layout';
import { FieldDefinition } from '@/types/field';
import { GearIcon } from '@/components/icons/ExplorerIcons';
import { useExplorerActionMenu } from '@/hooks/useExplorerActionMenu';
import {
  TemplateContainerActionMenu,
  TemplateComponentActionMenu,
} from '@/components/TemplateLayoutActionMenu';
import { BodyIcon, FlexRowIcon, FlexColumnIcon, LayoutContainerIcon } from '@/components/icons/LayoutIcons';

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
  onAddContainer?: (targetContainerId: string, options?: Partial<FlexContainerNode>) => string;
  onUpdateContainer?: (containerId: string, partial: Partial<FlexContainerNode>) => void;
  onUpdateComponent?: (componentId: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveContainer: (containerId: string) => void;
  onRemoveComponent: (componentId: string) => void;
  onPlaceField?: (fieldId: number, targetContainerId?: string) => void;
  /** Dock side: on the right, row gears move to the left edge and menus open rightward. */
  position?: 'left' | 'right';
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
  onAddContainer?: (targetContainerId: string, options?: Partial<FlexContainerNode>) => string;
  onUpdateContainer?: (id: string, partial: Partial<FlexContainerNode>) => void;
  onUpdateComponent?: (id: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveContainer: (id: string) => void;
  onRemoveComponent: (id: string) => void;
  onPlaceField?: (fieldId: number, targetContainerId?: string) => void;
  position?: 'left' | 'right';
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
  onAddContainer,
  onUpdateContainer,
  onUpdateComponent,
  onRemoveContainer,
  onRemoveComponent,
  onPlaceField,
  position = 'left',
}: ContainerNodeRowProps) {
  const isRightSide = position === 'right';
  const [isDragOver, setIsDragOver] = useState(false);
  const isRoot = container.id === 'root-container';
  const isSelected = selectedNodeId === container.id;
  const isActiveTarget = activeContainerId === container.id;
  const isExpanded = expandedIds.has(container.id);
  const hasChildren = container.children.length > 0;
  const menu = useExplorerActionMenu(`tree-container-${container.id}`, 280, position);

  // Semantic layout icon
  const containerIcon = isRoot ? (
    <BodyIcon className="w-3.5 h-3.5 text-slate-400" />
  ) : container.isCard ? (
    '🗂️'
  ) : resolveDirection(container, isRoot) === 'row' ? (
    <FlexRowIcon className="w-3.5 h-3.5 text-slate-400" />
  ) : (
    <FlexColumnIcon className="w-3.5 h-3.5 text-slate-400" />
  );

  const containerLabel = isRoot ? 'Body' : container.label || 'Container';

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      {/* Row Item formatted to exact site explorer model */}
      <div
        onClick={() => onSelectNode(container.id)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          const fieldIdStr =
            e.dataTransfer.getData('application/x-trove-field-id') ||
            e.dataTransfer.getData('text/plain');
          if (fieldIdStr) {
            const fieldId = parseInt(fieldIdStr, 10);
            if (!isNaN(fieldId)) {
              onPlaceField?.(fieldId, container.id);
              onSelectNode(container.id);
            }
          }
        }}
        data-tree-container-id={container.id}
        title={containerLabel}
        style={{ paddingLeft: `${depth * 18 + 6 + (isRightSide ? 32 : 0)}px` }}
        className={[
          'explorer-tree-item group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isDragOver
            ? 'ring-1 ring-[var(--primary-accent)] bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] text-white font-semibold'
            : isSelected
            ? 'explorer-tree-item-selected font-medium'
            : '',
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

        {/* Direction tag: every container, the Body included, is a row or a column */}
        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60 shrink-0">
          {resolveDirection(container, isRoot) === 'row' ? 'Row' : 'Col'}
        </span>

        {/* Child Count Badge */}
        {hasChildren && (
          <span
            title={`${container.children.length} sub-items`}
            className="explorer-tree-badge px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 select-none"
          >
            {container.children.length}
          </span>
        )}


        {/* Gear Icon: Triggers Explorer Action Menu with Item Properties or Body Actions */}
        <div className={isRightSide ? 'absolute left-2 shrink-0' : 'relative ml-auto shrink-0'}>
          <div
            role="button"
            tabIndex={0}
            data-tree-gear-id={container.id}
            aria-label={`Open ${containerLabel} actions`}
            aria-expanded={menu.isMenuOpen}
            onKeyDown={menu.handleGearKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(container.id);
              if (menu.isMenuOpen) {
                menu.closeMenu();
              } else {
                menu.handleGearMouseEnter(e);
              }
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
        position={position}
        onAddContainer={onAddContainer}
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
                  onAddContainer={onAddContainer}
                  onUpdateContainer={onUpdateContainer}
                  onUpdateComponent={onUpdateComponent}
                  onRemoveContainer={onRemoveContainer}
                  onRemoveComponent={onRemoveComponent}
                  onPlaceField={onPlaceField}
                  position={position}
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
                position={position}
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
  position?: 'left' | 'right';
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
  position = 'left',
}: ComponentNodeRowProps) {
  const isRightSide = position === 'right';
  const isSelected = selectedNodeId === component.id;
  const menu = useExplorerActionMenu(`tree-comp-${component.id}`, 280, position);

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
        data-tree-component-id={component.id}
        title={label}
        style={{ paddingLeft: `${depth * 18 + 6 + (isRightSide ? 32 : 0)}px` }}
        className={[
          'explorer-tree-item group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isSelected
            ? 'explorer-tree-item-selected font-medium'
            : '',
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
        <div className={isRightSide ? 'absolute left-2 shrink-0' : 'relative ml-auto shrink-0'}>
          <div
            role="button"
            tabIndex={0}
            data-tree-gear-id={component.id}
            aria-label={`Open ${label} actions`}
            aria-expanded={menu.isMenuOpen}
            onKeyDown={menu.handleGearKeyDown}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(component.id);
              if (menu.isMenuOpen) {
                menu.closeMenu();
              } else {
                menu.handleGearMouseEnter(e);
              }
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
        position={position}
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
  onAddContainer,
  onUpdateContainer,
  onUpdateComponent,
  onRemoveContainer,
  onRemoveComponent,
  onPlaceField,
  position = 'left',
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
        onAddContainer={onAddContainer}
        onUpdateContainer={onUpdateContainer}
        onUpdateComponent={onUpdateComponent}
        onRemoveContainer={onRemoveContainer}
        onRemoveComponent={onRemoveComponent}
        onPlaceField={onPlaceField}
        position={position}
      />
    </div>
  );
}
