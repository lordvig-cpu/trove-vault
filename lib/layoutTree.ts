import {
  FlexComponentNode,
  FlexContainerNode,
  FlexSizing,
  defaultChildDirection,
  findFlexNode,
  findParentFlexContainer,
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

/**
 * `label` as-is if it's free, otherwise the next free numbered variant (`nextNumberedLabel`). For
 * a generic/repeatable default like "New Container" -- the first one shouldn't be forced to "New
 * Container 2" the way a Split's paired second half always is.
 */
export function uniqueLabel(label: string, taken: Set<string>): string {
  return taken.has(label) ? nextNumberedLabel(label, taken) : label;
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

/**
 * A new container, like buildContainer, but with its label deduped against every label already in
 * `root` (uniqueLabel) -- for wherever a container gets added with a generic, repeatable default
 * label (e.g. "Add Inside" clicked several times in a row), so they don't all end up identically
 * named "New Container".
 */
export function buildUniqueContainer(
  root: FlexContainerNode,
  options: Partial<FlexContainerNode>,
  defaultLabel: string,
  defaultDirection: 'row' | 'column'
): FlexContainerNode {
  const built = buildContainer(options, defaultLabel, defaultDirection);
  return { ...built, label: uniqueLabel(built.label || defaultLabel, collectLabels(root)) };
}

/**
 * Where content (a field, Lorem Ipsum, ...) actually lands when placed "into" `containerId`: that
 * container, unless it's a split wrapper (isSplitWrapper), in which case its first child -- a
 * wrapper holds exactly its two Split halves and is never itself a content slot (dropping a 3rd,
 * un-halved child into it would break the split's 50/50 sizing). Falls through nested wrappers,
 * though that shouldn't normally occur. Unknown ids pass through unchanged.
 */
export function resolveContentTarget(root: FlexContainerNode, containerId: string): string {
  let current = findFlexNode(root, containerId);
  while (current?.nodeType === 'container' && current.isSplitWrapper && current.children[0]) {
    current = current.children[0];
  }
  return current?.id ?? containerId;
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
  splitType: 'columns' | 'rows',
  /**
   * The container's current on-screen size in px along the axis being split: width for columns,
   * height for rows. Most containers are Auto/fill with no stored width or height to derive a half
   * from, so the caller measures the real rendered box (like the Custom-sizing toolbar button
   * does) and passes it in; this function only ever halves that live number.
   */
  measuredPx: number
): SplitResult | null {
  if (targetId === root.id) return null;

  const parent = findParentFlexContainer(root, targetId);
  if (!parent) return null;

  const found = findFlexNode(root, targetId);
  if (!found || found.nodeType !== 'container') return null;
  const target: FlexContainerNode = found;

  // The container being split keeps its name; the new half gets the next free number.
  const sourceLabel = target.label || 'Container';
  const takenLabels = collectLabels(root);
  const newContainerLabel = nextNumberedLabel(sourceLabel, takenLabels);

  const parentDir = parent.direction;
  const targetSizing: FlexSizing = target.sizing || { type: 'fill' };

  // Rows stack children of a column parent; columns sit side by side in a row parent.
  // In any other parent, wrap the two halves in a new container so neither the parent's
  // direction nor its other children are disturbed.
  const inPlace = splitType === 'columns' ? parentDir === 'row' : parentDir === 'column';

  const halfPx = `${Math.max(0, measuredPx / 2)}px`;

  // Only the axis being split changes: columns go Custom-width and leave height alone; rows go
  // Custom-height and leave width/sizing alone (so an Auto-width row split stays Auto-width).
  const halfSizing: FlexSizing = splitType === 'columns' ? { ...targetSizing, type: 'fixed', value: halfPx } : targetSizing;
  const halfHeight = splitType === 'rows' ? halfPx : target.height;

  const withDims = (node: FlexContainerNode, sizing: FlexSizing, height?: string): FlexContainerNode => ({
    ...node,
    width: undefined,
    height,
    sizing: { ...sizing, height, minHeight: node.minHeight ?? sizing.minHeight },
  });

  // The new half's own direction (how ITS future children will flow) follows the same
  // alternate-with-your-parent convention as any other brand-new container (defaultChildDirection)
  // -- based on whichever container will actually be its parent, not copied from the unrelated
  // target. In place, that's the existing parent; wrapped, it's the new wrapper below.
  const wrapperDirection: 'row' | 'column' = splitType === 'columns' ? 'row' : 'column';
  const newContainerDirection: 'row' | 'column' = inPlace
    ? defaultChildDirection(parent, parent.id === root.id)
    : wrapperDirection === 'row' ? 'column' : 'row'; // opposite of the new wrapper it'll sit in

  const newId = newNodeId('cont');
  // The source keeps its own direction if it already has children (so their arrangement isn't
  // disturbed) -- but if it's empty, as most freshly split containers are, there's nothing to
  // disturb, so it gets the same alternating direction as the new half instead of an arbitrary
  // leftover value from before the split (a Row container split into columns shouldn't end up
  // holding one Row half and one Column half of the same, empty, split).
  const updatedTarget = withDims(
    { ...target, direction: target.children.length === 0 ? newContainerDirection : target.direction },
    halfSizing,
    halfHeight
  );
  const newContainer = withDims(
    {
      id: newId,
      nodeType: 'container',
      label: newContainerLabel,
      direction: newContainerDirection,
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

  // Unnumbered ("Box Split") the first time; only numbered ("Box Split 2") once that's already
  // taken -- splitting a container that's already inside a wrapper of its own produces two
  // "Box Split" nodes otherwise, indistinguishable in the tree.
  const wrapperLabel = uniqueLabel(`${sourceLabel} Split`, new Set(takenLabels).add(newContainerLabel));

  // Node(s) that replace the target inside its parent
  const replacement: FlexContainerNode[] = inPlace
    ? [updatedTarget, newContainer]
    : [
        // The wrapper inherits the target's original footprint inside the parent. It's structural
        // (isSplitWrapper): holds exactly these two halves, and is never itself a content-drop
        // target -- see FlexContainerRenderer / useTemplateLayoutTree's placement guards.
        {
          id: newNodeId('cont-split'),
          nodeType: 'container',
          label: wrapperLabel,
          direction: wrapperDirection,
          gap: 0,
          wrap: false,
          align: 'stretch',
          justify: 'start',
          padding: 0,
          sizing: { ...targetSizing },
          width: target.width,
          height: target.height,
          isCard: false,
          isSplitWrapper: true,
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
