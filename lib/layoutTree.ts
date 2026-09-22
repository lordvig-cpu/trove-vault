import {
  FlexComponentNode,
  FlexContainerNode,
  FlexSizing,
  findFlexNode,
  findParentFlexContainer,
  halveCssLength,
  parsePxValue,
  resolveDirection,
} from '@/types/layout';

/* ==========================================================================
   Pure operations on the template layout tree (root container -> containers and components).
   Each function takes the current root and returns a NEW root; nothing here touches React state,
   the database or the DOM. useTemplateEditor calls these, then saves the result.
   ========================================================================== */

export type LayoutNode = FlexContainerNode | FlexComponentNode;

/** A unique-enough id such as `cont-1718000000000-x3k9`. */
export function newNodeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

/** Applies `visit` to every container, rebuilding the tree; leaves components untouched. */
function mapContainers(
  node: FlexContainerNode,
  visit: (container: FlexContainerNode) => FlexContainerNode | null
): FlexContainerNode {
  const replaced = visit(node);
  const current = replaced ?? node;
  return {
    ...current,
    children: current.children.map((child) =>
      child.nodeType === 'container' ? mapContainers(child, visit) : child
    ),
  };
}

/** Every container label in the tree. */
export function collectLabels(root: FlexContainerNode): Set<string> {
  const labels = new Set<string>();
  const walk = (node: FlexContainerNode) => {
    if (node.label) labels.add(node.label);
    for (const child of node.children) if (child.nodeType === 'container') walk(child);
  };
  walk(root);
  return labels;
}

/**
 * The next free numbered name after `label`: "Box" -> "Box 2", "Column 1" -> "Column 2",
 * skipping any name already in `taken` ("Box 2" taken -> "Box 3").
 */
export function nextNumberedLabel(label: string, taken: Set<string>): string {
  const match = label.match(/^(.*\S)\s+(\d+)$/);
  const base = match ? match[1] : label;
  let n = match ? parseInt(match[2], 10) + 1 : 2;
  while (taken.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

/** A new container with sensible defaults; `options` override any of them. */
export function buildContainer(
  options: Partial<FlexContainerNode>,
  defaultLabel: string,
  defaultDirection: 'row' | 'column'
): FlexContainerNode {
  return {
    id: newNodeId('cont'),
    nodeType: 'container',
    label: options.label || defaultLabel,
    direction: options.direction || defaultDirection,
    gap: options.gap !== undefined ? options.gap : 0,
    wrap: options.wrap !== undefined ? options.wrap : true,
    align: options.align || 'stretch',
    justify: options.justify || 'start',
    padding: options.padding !== undefined ? options.padding : 0,
    sizing: options.sizing || { type: 'fill' },
    isCard: options.isCard !== undefined ? options.isCard : false,
    children: options.children || [],
  };
}

/** Appends `child` to the container `targetId` (the root when `targetId` does not exist). */
export function insertChild(root: FlexContainerNode, targetId: string, child: LayoutNode): FlexContainerNode {
  const target = findFlexNode(root, targetId) ? targetId : root.id;
  return mapContainers(root, (container) =>
    container.id === target ? { ...container, children: [...container.children, child] } : null
  );
}

/** Inserts `node` next to the child `targetId` of the container `parentId`. */
export function insertSibling(
  root: FlexContainerNode,
  parentId: string,
  targetId: string,
  position: 'before' | 'after',
  node: LayoutNode
): FlexContainerNode {
  return mapContainers(root, (container) => {
    if (container.id !== parentId) return null;
    const targetIndex = container.children.findIndex((child) => child.id === targetId);
    if (targetIndex === -1) return container;
    const children = [...container.children];
    children.splice(position === 'before' ? targetIndex : targetIndex + 1, 0, node);
    return { ...container, children };
  });
}

export function updateContainer(
  root: FlexContainerNode,
  containerId: string,
  partial: Partial<FlexContainerNode>
): FlexContainerNode {
  return mapContainers(root, (container) => (container.id === containerId ? { ...container, ...partial } : null));
}

export function updateComponent(
  root: FlexContainerNode,
  componentId: string,
  partial: Partial<FlexComponentNode>
): FlexContainerNode {
  return mapContainers(root, (container) => ({
    ...container,
    children: container.children.map((child) =>
      child.nodeType === 'component' && child.id === componentId ? { ...child, ...partial } : child
    ),
  }));
}

/** Removes the container or component `nodeId` wherever it is (the root itself is never removed). */
export function removeNode(root: FlexContainerNode, nodeId: string): FlexContainerNode {
  return mapContainers(root, (container) => ({
    ...container,
    children: container.children.filter((child) => child.id !== nodeId),
  }));
}

export interface SplitResult {
  root: FlexContainerNode;
  /** The id of the newly created half (the one after the original). */
  newId: string;
}

/**
 * Splits a container into two halves side by side ('columns') or stacked ('rows').
 * Returns null when it cannot be split (the root, or a container that is not found).
 */
export function splitContainer(
  root: FlexContainerNode,
  targetId: string,
  splitType: 'columns' | 'rows'
): SplitResult | null {
  if (targetId === root.id) return null;

  const parent = findParentFlexContainer(root, targetId);
  if (!parent) return null;

  const found = findFlexNode(root, targetId);
  if (!found || found.nodeType !== 'container') return null;
  const target: FlexContainerNode = found;

  // The container being split keeps its name; the new half gets the next free number.
  const sourceLabel = target.label || 'Container';
  const newContainerLabel = nextNumberedLabel(sourceLabel, collectLabels(root));

  const parentDir = parent.direction;
  const targetSizing: FlexSizing = target.sizing || { type: 'fill' };
  const targetWidthRaw = (targetSizing.type === 'fixed' && targetSizing.value) || target.width || undefined;
  const targetHeightRaw = target.height || targetSizing.height || undefined;
  const targetHeightPx = /px$/i.test(targetHeightRaw || '') ? parsePxValue(targetHeightRaw) : null;

  // Rows stack children of a column parent; columns sit side by side in a row parent.
  // In any other parent, wrap the two halves in a new container so neither the parent's
  // direction nor its other children are disturbed.
  const inPlace = splitType === 'columns' ? parentDir === 'row' : parentDir === 'column';

  // Height: columns share the target's height; rows split it (px only).
  const halfHeight =
    splitType === 'rows' && targetHeightPx !== null
      ? `${Math.max(0, targetHeightPx / 2)}px`
      : targetHeightRaw;

  // Width / basis of each half
  let halfSizing: FlexSizing;
  if (splitType === 'columns') {
    halfSizing = { type: 'fixed', value: inPlace ? halveCssLength(targetWidthRaw) : '50%' };
  } else {
    halfSizing =
      inPlace && targetSizing.type === 'fixed' && targetSizing.value
        ? { type: 'fixed', value: targetSizing.value }
        : { type: 'fixed', value: '100%' };
  }

  const withDims = (node: FlexContainerNode, sizing: FlexSizing, height?: string): FlexContainerNode => ({
    ...node,
    width: undefined,
    height,
    sizing: { ...sizing, height, minHeight: node.minHeight ?? sizing.minHeight },
  });

  const newId = newNodeId('cont');
  const updatedTarget = withDims({ ...target }, halfSizing, halfHeight);
  const newContainer = withDims(
    {
      id: newId,
      nodeType: 'container',
      label: newContainerLabel,
      direction: resolveDirection(target, false),
      gap: target.gap !== undefined ? target.gap : 0,
      wrap: target.wrap !== undefined ? target.wrap : true,
      align: target.align || 'stretch',
      justify: target.justify || 'start',
      padding: target.padding ?? 0,
      sizing: halfSizing,
      isCard: target.isCard !== undefined ? target.isCard : false,
      children: [],
    },
    halfSizing,
    halfHeight
  );

  // Node(s) that replace the target inside its parent
  const replacement: FlexContainerNode[] = inPlace
    ? [updatedTarget, newContainer]
    : [
        // The wrapper inherits the target's original footprint inside the parent
        {
          id: newNodeId('cont-split'),
          nodeType: 'container',
          label: `${sourceLabel} Split`,
          direction: splitType === 'columns' ? 'row' : 'column',
          gap: 0,
          wrap: false,
          align: 'stretch',
          justify: 'start',
          padding: 0,
          sizing: { ...targetSizing },
          width: target.width,
          height: target.height,
          isCard: false,
          children: [updatedTarget, newContainer],
        },
      ];

  const nextRoot = mapContainers(root, (container) => {
    if (container.id !== parent.id) return null;
    const childIndex = container.children.findIndex((child) => child.id === targetId);
    if (childIndex === -1) return container;
    const children = [...container.children];
    children.splice(childIndex, 1, ...replacement);
    return { ...container, children };
  });

  return { root: nextRoot, newId };
}
