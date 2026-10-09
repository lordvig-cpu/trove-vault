'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  resolveDirection,
  type BuiltinKey,
  type PlaceBuiltinHandler,
} from '@/types/layout';
import { FieldDefinition } from '@/types/field';
import { moveNode, type MovePosition } from '@/lib/layoutTree';
import { layoutNodeName } from '@/lib/layoutNavigation';
import { openNodeMenu } from '@/lib/layoutTreeMenu';
import { LayoutNavigationProvider } from '@/context/LayoutNavigationContext';
import { contentNameOf } from '@/lib/layoutContent';
import { SearchGlassIcon } from '@/components/icons/TreeIcons';
import { useTreeActionMenu } from '@/hooks/useTreeActionMenu';
import {
  TemplateContainerActionMenu,
  TemplateComponentActionMenu,
} from '@/components/TemplateLayoutActionMenu';
import { BodyIcon, FlexRowIcon, FlexColumnIcon, ContainerOverflowIcon } from '@/components/icons/LayoutIcons';
import VisibilityEyeIcon from '@/components/VisibilityEyeIcon';
import { activeIconColor } from '@/components/editorBarStyles';
import { HierarchyFilterCategory, hierarchyNodeCategory } from '@/lib/hierarchyFilterMetas';
import { ChevronDownIcon, ChevronRightIcon } from '@/components/icons/PanelIcons';
import { ComponentTypeIcon, LayoutGridIcon } from '@/components/icons/ContentIcons';
import TreeGearButton from '@/components/TreeGearButton';

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
  onInsertContainerSibling?: (
    targetContainerId: string,
    position: 'before' | 'after',
    options?: Partial<FlexContainerNode>
  ) => string;
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows', measuredPx: number) => void;
  onUpdateContainer?: (containerId: string, partial: Partial<FlexContainerNode>) => void;
  onUpdateComponent?: (componentId: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveContainer: (containerId: string) => void;
  onRemoveComponent: (componentId: string) => void;
  onPlaceField?: (fieldId: number, targetContainerId?: string) => void;
  onPlaceLoremIpsum?: (targetContainerId?: string) => void;
  onPlaceBuiltin?: PlaceBuiltinHandler;
  /** Moves a node by drag and drop within the tree (see moveNode in lib/layoutTree.ts). */
  onMoveNode?: (nodeId: string, targetId: string, position: MovePosition) => void;
  /** Nodes hidden from the edit canvas, and the eye toggle that hides/shows one (editor-only state). */
  hiddenNodeIds?: Set<string>;
  onToggleHidden?: (nodeId: string) => void;
  /** Show every row's eye, not just on hover (the Layout panel header's eye). */
  showAllEyes?: boolean;
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
      selfMatches = layoutNodeName(node, fields, isRoot).toLowerCase().includes(query);
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
   DRAG AND DROP REORDERING
   A row (anything but the Body) can be dragged onto another row: the top or bottom edge of a row drops
   the node before or after it, the middle of a container row drops it inside (at the end). The bottom
   edge of an expanded container means "first inside it", since that is where the line is drawn. A
   position moveNode refuses (into itself, out of a split, or back where it already is) shows no
   indicator and does nothing. Field / built-in / Lorem Ipsum drags from the Content tab are separate
   and unchanged: they only ever drop inside a container row.
   ========================================================================== */

const LAYOUT_NODE_MIME = 'application/x-trove-layout-node';

interface DropHint {
  targetId: string;
  position: MovePosition;
}

interface TreeDrag {
  /** The node being dragged (for its dimmed look); null when no tree move is in progress. */
  draggingId: string | null;
  hint: DropHint | null;
  /** True while a tree move is in progress (read from a ref, so it is current during dragover). */
  isMoving: () => boolean;
  begin: (nodeId: string) => void;
  end: () => void;
  /** Shows the indicator for this drop if moveNode allows it; returns whether it does. */
  hover: (targetId: string, position: MovePosition) => boolean;
  clear: () => void;
  drop: () => void;
}

const TreeDragContext = createContext<TreeDrag | null>(null);

function useTreeDrag(root: FlexContainerNode | undefined, onMoveNode?: TemplateHierarchyTreeProps['onMoveNode']): TreeDrag {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hint, setHint] = useState<DropHint | null>(null);
  const draggingRef = useRef<string | null>(null);
  const hintRef = useRef<DropHint | null>(null);

  const showHint = useCallback((next: DropHint | null) => {
    const prev = hintRef.current;
    if (prev?.targetId === next?.targetId && prev?.position === next?.position) return;
    hintRef.current = next;
    setHint(next);
  }, []);

  return useMemo(() => {
    const finish = () => {
      draggingRef.current = null;
      setDraggingId(null);
      showHint(null);
    };
    return {
      draggingId,
      hint,
      isMoving: () => draggingRef.current !== null,
      begin: (nodeId) => {
        draggingRef.current = nodeId;
        // Deferred: changing the dragged row in the same tick as dragstart can cancel the drag.
        setTimeout(() => setDraggingId(nodeId), 0);
      },
      end: finish,
      hover: (targetId, position) => {
        const id = draggingRef.current;
        const ok = !!id && !!root && !!onMoveNode && moveNode(root, id, targetId, position) !== null;
        showHint(ok ? { targetId, position } : null);
        return ok;
      },
      clear: () => showHint(null),
      drop: () => {
        const id = draggingRef.current;
        const target = hintRef.current;
        if (id && target) onMoveNode?.(id, target.targetId, target.position);
        finish();
      },
    };
  }, [draggingId, hint, root, onMoveNode, showHint]);
}

/**
 * One row's part in a tree move: its drag source props, which indicator it shows, and dragover/drop
 * handlers that return false when the drag is not a tree move (so a container row can fall back to its
 * field drops). `firstChildId` is the first visible child of an expanded container.
 */
function useNodeDrag(nodeId: string, kind: 'root' | 'container' | 'component', firstChildId?: string) {
  const drag = useContext(TreeDragContext);
  const hint = drag?.hint?.targetId === nodeId ? drag.hint.position : null;

  const dragProps =
    kind === 'root' || !drag
      ? {}
      : {
          draggable: true,
          onDragStart: (e: React.DragEvent) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData(LAYOUT_NODE_MIME, nodeId);
            drag.begin(nodeId);
          },
          onDragEnd: drag.end,
        };

  const handleMoveOver = (e: React.DragEvent<HTMLElement>): boolean => {
    if (!drag?.isMoving()) return false;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height;
    let target = nodeId;
    let position: MovePosition;
    if (kind === 'component') position = y < 0.5 ? 'before' : 'after';
    else if (y > 0.75 && firstChildId) {
      target = firstChildId;
      position = 'before';
    } else if (kind === 'root') position = 'inside';
    else position = y < 0.25 ? 'before' : y > 0.75 ? 'after' : 'inside';
    e.dataTransfer.dropEffect = drag.hover(target, position) ? 'move' : 'none';
    return true;
  };

  const handleMoveDrop = (e: React.DragEvent): boolean => {
    if (!drag?.isMoving()) return false;
    e.preventDefault();
    e.stopPropagation();
    drag.drop();
    return true;
  };

  return {
    dragProps,
    hint,
    isDragging: drag?.draggingId === nodeId,
    isMoving: () => !!drag?.isMoving(),
    handleMoveOver,
    handleMoveDrop,
  };
}

/** The line drawn above or below a row where a dragged node will land. */
function DropLine({ edge }: { edge: 'before' | 'after' }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute left-1 right-1 h-0.5 rounded-full bg-[var(--primary-accent)] ${edge === 'before' ? '-top-px' : '-bottom-px'}`}
    />
  );
}

/* ==========================================================================
   VISIBILITY
   The eye on each row (not the Body) hides that node -- and so everything inside it -- from the edit
   canvas, to cut clutter while working on one area. It is editor-only state (useTemplateEditor's
   hiddenNodeIds): never saved, ignored by Preview and the item view. A hidden row and every row under
   it are dimmed; a descendant keeps its own eye, so un-hiding the parent restores it as it was.
   ========================================================================== */

interface TreeVisibility {
  hiddenIds: Set<string>;
  toggle?: (nodeId: string) => void;
  /** The Layout header eye is on: every row's eye shows, not just on hover. */
  showAll?: boolean;
}

const TreeVisibilityContext = createContext<TreeVisibility>({ hiddenIds: new Set() });

/** A row's eye toggle: an open eye while shown, a slashed one (in the "set" yellow) while hidden. */
function VisibilityToggle({ nodeId, label }: { nodeId: string; label: string }) {
  const { hiddenIds, toggle, showAll } = useContext(TreeVisibilityContext);
  if (!toggle) return null;
  const isHidden = hiddenIds.has(nodeId);
  // Normally only on row hover, like the gear; a hidden node's eye always shows (a reminder that it is
  // off), and so does every eye while the header eye is on.
  const pinned = isHidden || !!showAll;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle(nodeId);
      }}
      aria-pressed={isHidden}
      aria-label={isHidden ? `Show ${label}` : `Hide ${label}`}
      title={isHidden ? 'Hidden on the canvas: click to show' : 'Hide on the canvas (and everything inside it)'}
      // Hidden = the "set" amber, shown = the tree's idle icon color; either turns white on hover.
      className={`tree-gear-trigger ${pinned ? 'tree-eye-pinned' : ''} flex items-center justify-center w-6 h-6 shrink-0 rounded border border-transparent cursor-pointer transition-colors hover:text-[var(--tree-action-icon-hover)] ${
        isHidden ? activeIconColor : 'text-[var(--primary-tree-muted)]'
      }`}
    >
      <VisibilityEyeIcon hidden={isHidden} className="w-[15px] h-[15px]" />
    </button>
  );
}

/* ==========================================================================
   3. TREE NODE ROW: Container Node Item (Tree Visual Model)
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
  onOpenProperties?: (id: string) => void;
  onAddContainer?: (targetContainerId: string, options?: Partial<FlexContainerNode>) => string;
  onInsertContainerSibling?: (
    targetContainerId: string,
    position: 'before' | 'after',
    options?: Partial<FlexContainerNode>
  ) => string;
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows', measuredPx: number) => void;
  onUpdateContainer?: (id: string, partial: Partial<FlexContainerNode>) => void;
  onUpdateComponent?: (id: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveContainer: (id: string) => void;
  onRemoveComponent: (id: string) => void;
  onPlaceField?: (fieldId: number, targetContainerId?: string) => void;
  onPlaceLoremIpsum?: (targetContainerId?: string) => void;
  onPlaceBuiltin?: PlaceBuiltinHandler;
  position?: 'left' | 'right';
  overflowingContainerIds?: Set<string>;
  /** Ids surviving the current search/filter (null = no filter active, show everything). Filtered
      children stay force-expanded so a match is never hidden behind a collapsed ancestor. */
  visibleIds?: Set<string> | null;
  /** An ancestor is hidden with its eye, so this row is hidden on the canvas too (shown dimmed). */
  ancestorHidden?: boolean;
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
  onOpenProperties,
  onAddContainer,
  onInsertContainerSibling,
  onSplitContainer,
  onUpdateContainer,
  onUpdateComponent,
  onRemoveContainer,
  onRemoveComponent,
  onPlaceField,
  onPlaceLoremIpsum,
  onPlaceBuiltin,
  position = 'left',
  overflowingContainerIds,
  visibleIds,
  ancestorHidden = false,
}: ContainerNodeRowProps) {
  const isRightSide = position === 'right';
  const [isDragOver, setIsDragOver] = useState(false);
  const isRoot = container.id === 'root-container';
  const isSelected = selectedNodeId === container.id;
  const visibleChildren = visibleIds ? container.children.filter((c) => visibleIds.has(c.id)) : container.children;
  const isExpanded = visibleIds ? true : expandedIds.has(container.id);
  const hasChildren = visibleChildren.length > 0;
  const isOverflowing = overflowingContainerIds?.has(container.id) ?? false;
  const move = useNodeDrag(container.id, isRoot ? 'root' : 'container', isExpanded ? visibleChildren[0]?.id : undefined);
  const showDropInside = isDragOver || move.hint === 'inside';
  const { hiddenIds } = useContext(TreeVisibilityContext);
  const isDimmed = ancestorHidden || hiddenIds.has(container.id);
  // Right-docked panels position the flyout by its real width: every container's flyout (Body or not)
  // is the 224px (14rem) shell default -- its wider Properties tab shifts itself left (see
  // PROPERTIES_EXTRA_WIDTH_PX in TemplateLayoutActionMenu).
  const menu = useTreeActionMenu(`tree-container-${container.id}`, 280, position, 224);

  // Semantic layout icon (a card frame is only a look, not a kind of container, so it shows its direction too)
  const containerIcon = isRoot ? (
    <BodyIcon className={`w-3.5 h-3.5 ${activeIconColor}`} />
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
        onContextMenu={(e) => {
          if (!e.shiftKey) onSelectNode(container.id);
          menu.handleRowContextMenu(e);
        }}
        {...move.dragProps}
        onDragOver={(e) => {
          if (move.handleMoveOver(e)) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // A tree move shows its own indicator (from the drop hint), not the field-drop highlight.
          if (move.isMoving()) return;
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          if (move.handleMoveDrop(e)) return;
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          if (e.dataTransfer.getData('application/x-trove-lorem-ipsum')) {
            onPlaceLoremIpsum?.(container.id);
            onSelectNode(container.id);
            return;
          }
          const builtinKey = e.dataTransfer.getData('application/x-trove-builtin');
          if (builtinKey) {
            onPlaceBuiltin?.(builtinKey as BuiltinKey, container.id);
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
          move.isDragging && 'opacity-40',
          showDropInside
            ? 'ring-1 ring-[var(--primary-accent)] bg-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] text-[var(--text-strong)] font-semibold'
            : isSelected
            ? 'tree-item-selected font-medium'
            : '',
        ].filter(Boolean).join(' ')}
      >
        {(move.hint === 'before' || move.hint === 'after') && <DropLine edge={move.hint} />}
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
          {isExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
        </button>

        {/* Node Icon */}
        <span className={`w-4 h-4 flex items-center justify-center text-xs shrink-0 select-none ${isDimmed ? 'opacity-40' : 'opacity-80'}`}>
          {containerIcon}
        </span>

        {/* Node Label */}
        <span className={`text-[13px] tracking-tight truncate flex-1 min-w-0 ${isDimmed ? 'opacity-50' : ''}`}>
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

        {!isRoot && <VisibilityToggle nodeId={container.id} label={containerLabel} />}

        {/* Gear Icon: Triggers Tree Action Menu with Item Properties or Body Actions */}
        <div className={isRightSide ? 'absolute left-2 shrink-0' : 'relative ml-auto shrink-0'}>
          <TreeGearButton menu={menu} label={`Open ${containerLabel} actions`} gearId={container.id} onBeforeClick={() => onSelectNode(container.id)} />
        </div>

      </div>

      {/* Container Flyout Action Menu */}
      <TemplateContainerActionMenu
        container={container}
        menu={menu}
        position={position}
        onAddContainer={onAddContainer}
        onInsertContainerSibling={onInsertContainerSibling}
        onSplitContainer={onSplitContainer}
        onUpdateContainer={onUpdateContainer}
        onRemoveContainer={onRemoveContainer}
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
                  depth={depth + 1}
                  selectedNodeId={selectedNodeId}
                  activeContainerId={activeContainerId}
                  expandedIds={expandedIds}
                  fields={fields}
                  onToggleExpand={onToggleExpand}
                  onSelectNode={onSelectNode}
                  onOpenProperties={onOpenProperties}
                  onAddContainer={onAddContainer}
                  onInsertContainerSibling={onInsertContainerSibling}
                  onSplitContainer={onSplitContainer}
                  onUpdateContainer={onUpdateContainer}
                  onUpdateComponent={onUpdateComponent}
                  onRemoveContainer={onRemoveContainer}
                  onRemoveComponent={onRemoveComponent}
                  onPlaceField={onPlaceField}
                  onPlaceLoremIpsum={onPlaceLoremIpsum}
                  onPlaceBuiltin={onPlaceBuiltin}
                  position={position}
                  overflowingContainerIds={overflowingContainerIds}
                  visibleIds={visibleIds}
                  ancestorHidden={isDimmed}
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
                ancestorHidden={isDimmed}
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
  /** An ancestor is hidden with its eye, so this row is hidden on the canvas too (shown dimmed). */
  ancestorHidden?: boolean;
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
  ancestorHidden = false,
}: ComponentNodeRowProps) {
  const isRightSide = position === 'right';
  const isSelected = selectedNodeId === component.id;
  // Right-docked panels position the flyout by its real width: like a container's, a content flyout is the
  // 224px (14rem) shell default, and its wider Properties tab shifts itself left (PROPERTIES_EXTRA_WIDTH_PX
  // in TemplateLayoutActionMenu).
  const menu = useTreeActionMenu(`tree-comp-${component.id}`, 280, position, 224);
  const move = useNodeDrag(component.id, 'component');
  const { hiddenIds } = useContext(TreeVisibilityContext);
  const isDimmed = ancestorHidden || hiddenIds.has(component.id);

  const label = contentNameOf(component, fields);

  // Icon determining component representation
  const componentIcon = <ComponentTypeIcon type={component.componentType} className={`w-3.5 h-3.5 ${activeIconColor}`} />;

  return (
    <div className="select-none text-[13px] font-sans w-full min-w-0 flex flex-col">
      <div
        onClick={() => onSelectNode(component.id)}
        onContextMenu={(e) => {
          if (!e.shiftKey) onSelectNode(component.id);
          menu.handleRowContextMenu(e);
        }}
        {...move.dragProps}
        onDragOver={move.handleMoveOver}
        onDrop={move.handleMoveDrop}
        data-tree-component-id={component.id}
        title={label}
        style={isRightSide ? { paddingLeft: depth * 24.5 + 44 } : undefined}
        className={[
          'tree-item group relative flex items-center h-7 px-1.5 gap-1.5 rounded-md cursor-pointer transition w-full min-w-0',
          isSelected
            ? 'tree-item-selected font-medium'
            : '',
          move.isDragging && 'opacity-40',
        ].filter(Boolean).join(' ')}
      >
        {(move.hint === 'before' || move.hint === 'after') && <DropLine edge={move.hint} />}
        {/* Spacer aligned with container chevron */}
        <span className="w-3.5 h-3.5 shrink-0 opacity-0" aria-hidden="true" />

        {/* Node Icon */}
        <span className={`w-4 h-4 flex items-center justify-center text-xs shrink-0 select-none ${isDimmed ? 'opacity-40' : 'opacity-80'}`}>
          {componentIcon}
        </span>

        {/* Node Label */}
        <span className={`text-[13px] tracking-tight truncate flex-1 min-w-0 tree-muted ${isDimmed ? 'opacity-50' : ''}`}>
          {label}
        </span>

        {/* Variant / Sizing Badge */}
        {component.variant && component.variant !== 'standard' && (
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-accent-secondary/10 text-flyout-title border border-accent-secondary/20 shrink-0">
            {component.variant}
          </span>
        )}

        {/* Sizing Indicator */}
        {component.sizing && component.sizing.type !== 'fill' && (
          <span className="text-[9px] font-mono text-content-muted shrink-0">
            {component.sizing.type === 'fixed'
              ? component.sizing.value || 'fixed'
              : 'auto'}
          </span>
        )}

        <VisibilityToggle nodeId={component.id} label={label} />

        {/* Gear Icon: Triggers Tree Action Menu with Item Properties */}
        <div className={isRightSide ? 'absolute left-2 shrink-0' : 'relative ml-auto shrink-0'}>
          <TreeGearButton menu={menu} label={`Open ${label} actions`} gearId={component.id} onBeforeClick={() => onSelectNode(component.id)} />
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
  onInsertContainerSibling,
  onSplitContainer,
  onUpdateContainer,
  onUpdateComponent,
  onRemoveContainer,
  onRemoveComponent,
  onPlaceField,
  onPlaceLoremIpsum,
  onPlaceBuiltin,
  onMoveNode,
  hiddenNodeIds,
  onToggleHidden,
  showAllEyes = false,
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

  const drag = useTreeDrag(root, onMoveNode);
  // A flyout's Select Previous / Next: select that node and open its own row's flyout, on Actions so the
  // next step is right there (the tree expands to show a collapsed node first; openNodeMenu waits for it)
  const navigation = useMemo(
    () =>
      root
        ? {
            root,
            fields,
            goTo: (nodeId: string) => {
              onSelectNode(nodeId);
              openNodeMenu(nodeId, { how: 'open', tab: 'actions', isLayoutPanelOpen: true, at: { x: 0, y: 0 } });
            },
          }
        : null,
    [root, fields, onSelectNode]
  );

  const visibility = useMemo<TreeVisibility>(
    () => ({ hiddenIds: hiddenNodeIds ?? new Set(), toggle: onToggleHidden, showAll: showAllEyes }),
    [hiddenNodeIds, onToggleHidden, showAllEyes]
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
      <div className="p-4 flex flex-col items-center justify-center text-center gap-2 text-content-muted h-full">
        <LayoutGridIcon className="w-6 h-6" />
        <span className="text-xs font-semibold text-content-muted">No Layout Loaded</span>
        <p className="text-[11px] text-content-muted">
          Open a template to inspect and configure its visual content structure.
        </p>
      </div>
    );
  }

  if (visibleIds && !visibleIds.has(root.id)) {
    return (
      <div className="p-4 flex flex-col items-center justify-center text-center gap-2 text-content-muted h-full">
        <SearchGlassIcon className="w-6 h-6" />
        <span className="text-xs font-semibold text-content-muted">No matches</span>
        <p className="text-[11px] text-content-muted">
          Nothing in this layout matches your search or filter.
        </p>
      </div>
    );
  }

  return (
    <LayoutNavigationProvider value={navigation}>
    <TreeDragContext.Provider value={drag}>
    <TreeVisibilityContext.Provider value={visibility}>
      {/* Rows stop their own drag events; anything reaching here is empty space, which drops nothing. */}
      <div className="flex flex-col h-full w-full select-none py-1.5" onDragOver={drag.clear}>
      <ContainerNodeRow
        container={root}
        depth={0}
        selectedNodeId={selectedNodeId}
        activeContainerId={activeContainerId}
        expandedIds={effectiveExpandedIds}
        fields={fields}
        onToggleExpand={effectiveOnToggleExpand}
        onSelectNode={onSelectNode}
        onOpenProperties={onOpenProperties}
        onAddContainer={onAddContainer}
        onInsertContainerSibling={onInsertContainerSibling}
        onSplitContainer={onSplitContainer}
        onUpdateContainer={onUpdateContainer}
        onUpdateComponent={onUpdateComponent}
        onRemoveContainer={onRemoveContainer}
        onRemoveComponent={onRemoveComponent}
        onPlaceField={onPlaceField}
        onPlaceLoremIpsum={onPlaceLoremIpsum}
        onPlaceBuiltin={onPlaceBuiltin}
        position={position}
        visibleIds={visibleIds}
        overflowingContainerIds={overflowingContainerIds}
      />
      </div>
    </TreeVisibilityContext.Provider>
    </TreeDragContext.Provider>
    </LayoutNavigationProvider>
  );
}
