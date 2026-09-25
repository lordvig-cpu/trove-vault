'use client';

import React, { useState, useMemo } from 'react';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  resolveDirection,
} from '@/types/layout';
import { FieldDefinition } from '@/types/field';
import { GearIcon } from '@/components/icons/TreeIcons';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import {
  TemplateContainerActionMenu,
  TemplateComponentActionMenu,
} from '@/components/TemplateLayoutActionMenu';
import { BodyIcon, FlexRowIcon, FlexColumnIcon, ContainerOverflowIcon } from '@/components/icons/LayoutIcons';
import { activeIconColor } from '@/components/editorBarStyles';
import { HierarchyFilterCategory, hierarchyNodeCategory } from '@/lib/hierarchyFilterMetas';

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
  onPlaceLoremIpsum?: (targetContainerId?: string) => void;
  /** Dock side: on the right, row gears move to the left edge and menus open rightward. */
  position?: 'left' | 'right';
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  /** Container ids whose own row currently has children that don't fit it (see FlexContainerRenderer). */
  overflowingContainerIds?: Set<string>;
  /** Filters by node name; combined with filterHierarchyTypes (both must match). */
  searchQuery?: string;
  filterHierarchyTypes?: HierarchyFilterCategory[];
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

/** The name shown for a node in the tree -- matches what each row actually renders. */
function hierarchyNodeLabel(
  node: FlexContainerNode | FlexComponentNode,
  fields: FieldDefinition[],
  isRoot: boolean
): string {
  if (node.nodeType === 'container') {
    return isRoot ? 'Body' : node.label || 'Container';
  }
  const boundField = node.field_id ? fields.find((f) => f.id === node.field_id) : undefined;
  return node.label || boundField?.label || node.componentType;
}

/**
 * Which node ids survive the Layout panel's search + category filter: a node keeps its place when
 * it matches itself, or when any of its descendants do (so the path down to a match stays visible
 * even though the container itself didn't match). Returns null when neither a search term nor a
 * category filter is active, meaning "show everything, respect the user's own expand/collapse".
 */
function computeVisibleHierarchyIds(
  root: FlexContainerNode,
  searchQuery: string,
  filterTypes: HierarchyFilterCategory[],
  fields: FieldDefinition[]
): Set<string> | null {
  const query = searchQuery.trim().toLowerCase();
  if (!query && filterTypes.length === 0) return null;

  const keep = new Set<string>();
  const visit = (node: FlexContainerNode | FlexComponentNode, isRoot: boolean): boolean => {
    let selfMatches = filterTypes.length === 0 || filterTypes.includes(hierarchyNodeCategory(node));
    if (selfMatches && query) {
      selfMatches = hierarchyNodeLabel(node, fields, isRoot).toLowerCase().includes(query);
    }
    let descendantMatches = false;
    if (node.nodeType === 'container') {
      for (const child of node.children) {
        if (visit(child, false)) descendantMatches = true;
      }
    }
    const keepThis = selfMatches || descendantMatches;
    if (keepThis) keep.add(node.id);
    return keepThis;
  };
  visit(root, true);
  return keep;
}

/* ==========================================================================
   3. TREE NODE ROW: Container Node Item (Tree Visual Model)
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
  onPlaceLoremIpsum?: (targetContainerId?: string) => void;
  position?: 'left' | 'right';
  overflowingContainerIds?: Set<string>;
  /** Ids surviving the current search/filter (null = no filter active, show everything). Filtered
      children stay force-expanded so a match is never hidden behind a collapsed ancestor. */
  visibleIds?: Set<string> | null;
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
  onPlaceLoremIpsum,
  position = 'left',
  overflowingContainerIds,
  visibleIds,
}: ContainerNodeRowProps) {
  const isRightSide = position === 'right';
  const [isDragOver, setIsDragOver] = useState(false);
  const isRoot = container.id === 'root-container';
  const isSelected = selectedNodeId === container.id;
  const visibleChildren = visibleIds ? container.children.filter((c) => visibleIds.has(c.id)) : container.children;
  const isExpanded = visibleIds ? true : expandedIds.has(container.id);
  const hasChildren = visibleChildren.length > 0;
  const isOverflowing = overflowingContainerIds?.has(container.id) ?? false;
  // Right-docked panels position the flyout by its real width: a container's uses .menuShellWide
  // (328px / 20.5rem), the Body's is the 224px (14rem) shell default.
  const menu = useTreeActionMenu(`tree-container-${container.id}`, 280, position, isRoot ? 224 : 328);

  // Semantic layout icon
  const containerIcon = isRoot ? (
    <BodyIcon className={`w-3.5 h-3.5 ${activeIconColor}`} />
  ) : container.isCard ? (
    '🗂️'
  ) : resolveDirection(container, isRoot) === 'row' ? (
    <FlexRowIcon className={`w-3.5 h-3.5 ${activeIconColor}`} />
  ) : (
    <FlexColumnIcon className={`w-3.5 h-3.5 ${activeIconColor}`} />
  );

  const containerLabel = isRoot ? 'Body' : container.label || 'Container';

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      {/* Row Item formatted to exact site tree model */}
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
          if (e.dataTransfer.getData('application/x-trove-lorem-ipsum')) {
            onPlaceLoremIpsum?.(container.id);
            onSelectNode(container.id);
            return;
          }
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
        style={isRightSide ? { paddingLeft: depth * 24.5 + 44 } : undefined}
        className={[
          'tree-item group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isDragOver
            ? 'ring-1 ring-[var(--primary-accent)] bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] text-white font-semibold'
            : isSelected
            ? 'tree-item-selected font-medium'
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
            'text-[9px] tree-muted',
            'cursor-pointer transition select-none',
            !hasChildren && 'tree-hidden pointer-events-none cursor-default opacity-0',
          ].filter(Boolean).join(' ')}
          title={isExpanded ? 'Collapse container' : 'Expand container'}
        >
          {isExpanded ? '▼' : '▶︎'}
        </button>

        {/* Node Icon */}
        <span className="w-4 h-4 flex items-center justify-center text-xs opacity-80 shrink-0 select-none">
          {containerIcon}
        </span>

        {/* Node Label */}
        <span className="text-[13px] tracking-tight truncate flex-1 min-w-0">
          {containerLabel}
        </span>

        {/* Overflow Warning: this row's children don't fit it at their set widths */}
        {isOverflowing && (
          <span
            title="This container's Custom width doesn't fit its children at their own set widths"
            className="shrink-0 flex items-center justify-center text-[var(--editor-invalid)]"
          >
            <ContainerOverflowIcon className="w-3.5 h-3.5" />
          </span>
        )}

        {/* Child Count Badge */}
        {hasChildren && (
          <span
            title={`${visibleChildren.length} sub-items`}
            className="tree-badge px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 select-none"
          >
            {visibleChildren.length}
          </span>
        )}


        {/* Gear Icon: Triggers Tree Action Menu with Item Properties or Body Actions */}
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
                  ? 'tree-primary rotate-90'
                  : 'tree-action-icon',
              ].join(' ')}
            />
          </div>
        </div>

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
        <div className={`flex flex-col relative ${isRightSide ? '' : 'tree-branch border-l ml-[13.5px] pl-2.5'}`}>
          {/* Same mechanism as UnifiedTree (see its matching comments): left-docked indents by
              nesting this wrapper (ml/pl), so its own border-l is the guide, 16px left of each
              child row's own chevron. Right-docked rows carry their own absolute depth-based
              paddingLeft instead, so the guide is a full-height overlay at that same x. */}
          {isRightSide && (
            <div
              aria-hidden="true"
              className="tree-branch absolute top-0 bottom-0 border-l pointer-events-none"
              style={{ left: depth * 24.5 + 52.5 }}
            />
          )}
          {visibleChildren.map((child) => {
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
                  onPlaceLoremIpsum={onPlaceLoremIpsum}
                  position={position}
                  overflowingContainerIds={overflowingContainerIds}
                  visibleIds={visibleIds}
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
  onUpdateComponent,
  onRemoveComponent,
  position = 'left',
}: ComponentNodeRowProps) {
  const isRightSide = position === 'right';
  const isSelected = selectedNodeId === component.id;
  // 328px (20.5rem): matches the .menuShellWide class TemplateComponentActionMenu renders with.
  const menu = useTreeActionMenu(`tree-comp-${component.id}`, 280, position, 328);

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
        style={isRightSide ? { paddingLeft: depth * 24.5 + 44 } : undefined}
        className={[
          'tree-item group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isSelected
            ? 'tree-item-selected font-medium'
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
        <span className="text-[13px] tracking-tight truncate flex-1 min-w-0 tree-muted">
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

        {/* Gear Icon: Triggers Tree Action Menu with Item Properties */}
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
                  ? 'tree-primary rotate-90'
                  : 'tree-action-icon',
              ].join(' ')}
            />
          </div>
        </div>

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
  onPlaceLoremIpsum,
  position = 'left',
  expandedIds: externalExpandedIds,
  onToggleExpand: externalOnToggleExpand,
  overflowingContainerIds,
  searchQuery = '',
  filterHierarchyTypes = [],
}: TemplateHierarchyTreeProps) {
  const root = flexLayoutConfig?.root;

  // Fallback internal expansion tracking if not controlled externally
  const allIds = useMemo(() => (root ? getAllContainerIds(root) : []), [root]);
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(() => new Set(allIds));

  const visibleIds = useMemo(
    () => (root ? computeVisibleHierarchyIds(root, searchQuery, filterHierarchyTypes, fields) : null),
    [root, searchQuery, filterHierarchyTypes, fields]
  );

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

  if (visibleIds && !visibleIds.has(root.id)) {
    return (
      <div className="p-4 flex flex-col items-center justify-center text-center gap-2 text-slate-500 h-full">
        <span className="text-2xl">🔍</span>
        <span className="text-xs font-semibold text-slate-400">No matches</span>
        <p className="text-[11px] text-slate-500">
          Nothing in this layout matches your search or filter.
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
        onPlaceLoremIpsum={onPlaceLoremIpsum}
        position={position}
        visibleIds={visibleIds}
        overflowingContainerIds={overflowingContainerIds}
      />
    </div>
  );
}
