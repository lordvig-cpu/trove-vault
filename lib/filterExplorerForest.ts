import type { UnifiedCollectionNode } from '@/components/UnifiedExplorerTree';

export function filterExplorerForest(
  forest: UnifiedCollectionNode[],
  filterCollectionIds: number[]
): UnifiedCollectionNode[] {
  if (filterCollectionIds.length === 0) {
    return forest.filter((node) => node.id < 0);
  }

  const pruneNode = (node: UnifiedCollectionNode): UnifiedCollectionNode | null => {
    const subCollections = (node.subCollections || [])
      .map(pruneNode)
      .filter((child): child is UnifiedCollectionNode => child !== null);
    const isSelected = filterCollectionIds.includes(node.id);

    if (!isSelected && subCollections.length === 0) return null;

    return {
      ...node,
      subCollections,
      items: isSelected ? node.items : [],
    };
  };

  return forest
    .map(pruneNode)
    .filter((node): node is UnifiedCollectionNode => node !== null);
}
