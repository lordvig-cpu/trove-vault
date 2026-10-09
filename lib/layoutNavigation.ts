import { contentNameOf } from '@/lib/layoutContent';
import type { FieldDefinition } from '@/types/field';
import type { FlexContainerNode, FlexLayoutNode } from '@/types/layout';

/* ==========================================================================
   Walking the layout in the Layout tree's own order -- each container, then everything inside it, top to
   bottom (a pre-order walk) -- so "previous" and "next" mean the row above and below in that tree, with
   every branch expanded. Used by a gear flyout's Select Previous / Next actions, which let you step to any
   element (the Body included) without the tree on screen.
   ========================================================================== */

/** Every node, the Body first, in the Layout tree's order. */
export function flattenLayout(root: FlexContainerNode): FlexLayoutNode[] {
  const out: FlexLayoutNode[] = [];
  const walk = (node: FlexLayoutNode) => {
    out.push(node);
    if (node.nodeType === 'container') node.children.forEach(walk);
  };
  walk(root);
  return out;
}

/** The nodes just before and after `nodeId` in that order (null at either end, or if it isn't found). */
export function layoutNeighbors(root: FlexContainerNode, nodeId: string): { prev: FlexLayoutNode | null; next: FlexLayoutNode | null } {
  const order = flattenLayout(root);
  const i = order.findIndex((node) => node.id === nodeId);
  if (i < 0) return { prev: null, next: null };
  return { prev: order[i - 1] ?? null, next: order[i + 1] ?? null };
}

/** The name a node shows in the Layout tree: "Body", a container's label, or a content element's name. */
export function layoutNodeName(node: FlexLayoutNode, fields: FieldDefinition[], isRoot: boolean): string {
  if (node.nodeType === 'container') return isRoot ? 'Body' : node.label || 'Container';
  return contentNameOf(node, fields);
}
