'use client';

import React, { useState, useMemo } from 'react';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  FlexLayoutNode,
} from '@/types/layout';
import { FieldDefinition } from '@/types/field';

/* ==========================================================================
   1. PROPS INTERFACE
   ========================================================================== */

interface TemplateHierarchyTreeProps {
  flexLayoutConfig: TemplateFlexLayoutConfig | null;
  selectedNodeId: string | null;
  activeContainerId?: string;
  fields?: FieldDefinition[];
  onSelectNode: (nodeId: string | null) => void;
  onRemoveContainer: (containerId: string) => void;
  onRemoveComponent: (componentId: string) => void;
}

/* ==========================================================================
   2. HELPER FUNCTIONS
   ========================================================================== */

function countElements(node: FlexContainerNode): { containers: number; components: number } {
  let containers = 1; // count this container
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

function getAllContainerIds(node: FlexContainerNode): string[] {
  const ids = [node.id];
  for (const child of node.children) {
    if (child.nodeType === 'container') {
      ids.push(...getAllContainerIds(child));
    }
  }
  return ids;
}

/* ==========================================================================
   3. TREE NODE ROW: Container Node Item
   ========================================================================== */

interface ContainerNodeRowProps {
  container: FlexContainerNode;
  depth: number;
  selectedNodeId: string | null;
  activeContainerId?: string;
  expandedIds: Set<string>;
  fields: FieldDefinition[];
  onToggleExpand: (id: string) => void;
  onSelectNode: (id: string | null) => void;
  onRemoveContainer: (id: string) => void;
  onRemoveComponent: (id: string) => void;
}

function ContainerNodeRow({
  container,
  depth,
  selectedNodeId,
  activeContainerId,
  expandedIds,
  fields,
  onToggleExpand,
  onSelectNode,
  onRemoveContainer,
  onRemoveComponent,
}: ContainerNodeRowProps) {
  const isRoot = container.id === 'root-container';
  const isSelected = selectedNodeId === container.id;
  const isActiveTarget = activeContainerId === container.id;
  const isExpanded = expandedIds.has(container.id);
  const hasChildren = container.children.length > 0;

  // Icon determining container presentation
  const containerIcon = isRoot
    ? '📄'
    : container.isCard
    ? '🗂️'
    : container.direction === 'row'
    ? '↔️'
    : '↕️';

  const containerLabel = isRoot ? 'Body' : (container.label || 'Container');

  return (
    <div className="flex flex-col select-none">
      {/* Container Row */}
      <div
        onClick={() => onSelectNode(container.id)}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-all duration-150 border text-xs ${
          isSelected
            ? 'bg-blue-600/25 border-blue-500/60 text-white font-semibold ring-1 ring-blue-500/40 shadow-sm'
            : isActiveTarget && !isRoot
            ? 'bg-blue-950/20 border-blue-500/30 text-blue-200 hover:bg-blue-900/30'
            : 'border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Expand/Collapse Chevron */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(container.id);
              }}
              className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-700/60 shrink-0 transition"
              title={isExpanded ? 'Collapse' : 'Expand'}
              aria-label={isExpanded ? 'Collapse container' : 'Expand container'}
            >
              <span className="text-[10px] transform transition-transform duration-150">
                {isExpanded ? '▾' : '▸'}
              </span>
            </button>
          ) : (
            <span className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}

          {/* Node Icon */}
          <span className="text-xs shrink-0">{containerIcon}</span>

          {/* Node Label */}
          <span className="truncate font-medium tracking-wide">
            {containerLabel}
          </span>

          {/* Direction / Card Badge */}
          {!isRoot && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800/90 text-slate-400 border border-slate-700/60 shrink-0">
              {container.direction === 'row' ? 'Row' : 'Col'}
            </span>
          )}

          {/* Child Count Pill */}
          <span className="text-[9px] font-mono text-slate-400 shrink-0">
            ({container.children.length})
          </span>

          {/* Active Target Indicator Badge */}
          {isActiveTarget && (
            <span className="text-[8.5px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
              Target
            </span>
          )}
        </div>

        {/* Hover Delete Action */}
        {!isRoot && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveContainer(container.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-200 p-0.5 rounded hover:bg-red-500/20 transition cursor-pointer shrink-0 ml-1"
            title={`Delete ${containerLabel}`}
            aria-label={`Delete ${containerLabel}`}
          >
            🗑️
          </button>
        )}
      </div>

      {/* Render Children when Expanded */}
      {isExpanded && hasChildren && (
        <div className="flex flex-col relative before:absolute before:left-[14px] before:top-0 before:bottom-2 before:w-[1px] before:bg-slate-800/60">
          {container.children.map((child) => {
            if (child.nodeType === 'container') {
              return (
                <ContainerNodeRow
                  key={child.id}
                  container={child}
                  depth={depth + 1}
                  selectedNodeId={selectedNodeId}
                  activeContainerId={activeContainerId}
                  expandedIds={expandedIds}
                  fields={fields}
                  onToggleExpand={onToggleExpand}
                  onSelectNode={onSelectNode}
                  onRemoveContainer={onRemoveContainer}
                  onRemoveComponent={onRemoveComponent}
                />
              );
            }
            return (
              <ComponentNodeRow
                key={child.id}
                component={child}
                depth={depth + 1}
                selectedNodeId={selectedNodeId}
                fields={fields}
                onSelectNode={onSelectNode}
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
  depth: number;
  selectedNodeId: string | null;
  fields: FieldDefinition[];
  onSelectNode: (id: string | null) => void;
  onRemoveComponent: (id: string) => void;
}

function ComponentNodeRow({
  component,
  depth,
  selectedNodeId,
  fields,
  onSelectNode,
  onRemoveComponent,
}: ComponentNodeRowProps) {
  const isSelected = selectedNodeId === component.id;

  const boundField = component.field_id
    ? fields.find((f) => f.id === component.field_id)
    : undefined;

  const label = component.label || boundField?.label || component.componentType;

  // Icon by componentType
  const componentIcon =
    component.componentType === 'field'
      ? '📝'
      : component.componentType === 'table'
      ? '📊'
      : component.componentType === 'media'
      ? '🖼️'
      : component.componentType === 'stat'
      ? '📈'
      : component.componentType === 'note'
      ? '💡'
      : '➖';

  return (
    <div
      onClick={() => onSelectNode(component.id)}
      style={{ paddingLeft: `${depth * 14 + 18}px` }}
      className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-all duration-150 border text-xs select-none ${
        isSelected
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 font-semibold ring-1 ring-amber-500/40 shadow-sm'
          : 'border-transparent text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="text-xs shrink-0">{componentIcon}</span>
        <span className="truncate font-medium">{label}</span>

        {/* Component Type or Sizing Pill */}
        <span className="text-[8.5px] font-mono uppercase px-1 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50 shrink-0">
          {component.sizing.type === 'fill' ? 'Fill' : component.sizing.value || 'Fixed'}
        </span>
      </div>

      {/* Delete Component Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemoveComponent(component.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-200 p-0.5 rounded hover:bg-red-500/20 transition cursor-pointer shrink-0 ml-1 leading-none"
        title={`Remove ${label}`}
        aria-label={`Remove ${label}`}
      >
        ✕
      </button>
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
  onRemoveContainer,
  onRemoveComponent,
}: TemplateHierarchyTreeProps) {
  const root = flexLayoutConfig?.root;

  // Track expanded container IDs (default: all expanded for quick access)
  const allIds = useMemo(() => (root ? getAllContainerIds(root) : []), [root]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(allIds));

  // Toggle individual container expansion
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all containers expanded / collapsed
  const isAllExpanded = root && allIds.every((id) => expandedIds.has(id));
  const toggleExpandAll = () => {
    if (isAllExpanded) {
      // Keep only root expanded
      setExpandedIds(new Set(['root-container']));
    } else {
      setExpandedIds(new Set(allIds));
    }
  };

  // Calculate element stats
  const stats = useMemo(() => {
    if (!root) return { containers: 0, components: 0 };
    return countElements(root);
  }, [root]);

  if (!root) {
    return (
      <div className="p-4 flex flex-col items-center justify-center text-center gap-2 text-slate-500 h-full">
        <span className="text-2xl">📐</span>
        <span className="text-xs font-semibold text-slate-400">No Layout Loaded</span>
        <p className="text-[11px] text-slate-500">
          Open a template to inspect and configure its visual content hierarchy.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* --------------------------------------------------------------------
          1. COMPACT STATUS & ACTIONS TOOLBAR (No search bar, element count & toggles)
          -------------------------------------------------------------------- */}
      <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0 bg-slate-900/30">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Structure
          </span>
          <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-blue-300 border border-slate-700/60 font-semibold">
            {stats.containers + stats.components} nodes
          </span>
        </div>

        <button
          type="button"
          onClick={toggleExpandAll}
          className="text-[10px] font-semibold text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition cursor-pointer flex items-center gap-1"
          title={isAllExpanded ? 'Collapse all containers' : 'Expand all containers'}
        >
          <span>{isAllExpanded ? '⊟' : '⊞'}</span>
          <span>{isAllExpanded ? 'Collapse All' : 'Expand All'}</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------
          2. HIERARCHICAL RECURSIVE TREE VIEW
          -------------------------------------------------------------------- */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 flex flex-col gap-0.5 primary-panel-scroll">
        <ContainerNodeRow
          container={root}
          depth={0}
          selectedNodeId={selectedNodeId}
          activeContainerId={activeContainerId}
          expandedIds={expandedIds}
          fields={fields}
          onToggleExpand={toggleExpand}
          onSelectNode={onSelectNode}
          onRemoveContainer={onRemoveContainer}
          onRemoveComponent={onRemoveComponent}
        />
      </div>
    </div>
  );
}
