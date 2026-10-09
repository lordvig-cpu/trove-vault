'use client';

import { createContext, useContext } from 'react';
import { layoutNeighbors, layoutNodeName } from '@/lib/layoutNavigation';
import type { FieldDefinition } from '@/types/field';
import type { FlexContainerNode } from '@/types/layout';

/* ==========================================================================
   What a node's gear flyout needs for its Select Previous / Next actions: the layout (to find the
   neighbours and name them) and how to go to one. Each place that owns flyouts provides its own `goTo`:
   the Layout tree selects the node and opens its row's flyout; the floating menu selects it and turns
   itself into that node's menu where it is.
   ========================================================================== */

interface LayoutNavigation {
  root: FlexContainerNode;
  fields: FieldDefinition[];
  goTo: (nodeId: string) => void;
}

const LayoutNavigationContext = createContext<LayoutNavigation | null>(null);

export const LayoutNavigationProvider = LayoutNavigationContext.Provider;

export interface LayoutNeighbor {
  id: string;
  name: string;
}

/** The elements before and after `nodeId` in the Layout tree's order, and how to go to one; null outside a
 *  provider (the flyout then simply has no navigation actions). */
export function useLayoutNeighbors(nodeId: string): { prev: LayoutNeighbor | null; next: LayoutNeighbor | null; goTo: (nodeId: string) => void } | null {
  const nav = useContext(LayoutNavigationContext);
  if (!nav) return null;
  const { prev, next } = layoutNeighbors(nav.root, nodeId);
  const describe = (node: typeof prev) => (node ? { id: node.id, name: layoutNodeName(node, nav.fields, node.id === nav.root.id) } : null);
  return { prev: describe(prev), next: describe(next), goTo: nav.goTo };
}
