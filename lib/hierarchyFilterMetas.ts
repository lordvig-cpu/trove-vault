import { FlexContainerNode, FlexComponentNode } from '@/types/layout';

/** The Layout tree's three node kinds, for its filter menu: containers, real bound fields
    (placed from the Content tab), and everything else (Lorem Ipsum, and any preset dropped in
    from the Components tab -- table/media/stat/note/divider). */
export type HierarchyFilterCategory = 'container' | 'field' | 'predefined';

/** Display metadata (label, icon) for each category, used by the Layout tree's filter menu. */
export const HIERARCHY_FILTER_METAS: { type: HierarchyFilterCategory; label: string; icon: string }[] = [
  { type: 'container', label: 'Layout Items', icon: '📐' },
  { type: 'field', label: 'Content Items', icon: '📝' },
  { type: 'predefined', label: 'Pre-defined Content', icon: '🧩' },
];

/** Which of the three categories a layout-tree node falls into. */
export function hierarchyNodeCategory(
  node: FlexContainerNode | FlexComponentNode
): HierarchyFilterCategory {
  if (node.nodeType === 'container') return 'container';
  return node.componentType === 'field' ? 'field' : 'predefined';
}
