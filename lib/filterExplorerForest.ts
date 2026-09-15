import type { UnifiedCollectionNode } from '@/components/UnifiedExplorerTree';
import type { ItemRecord } from '@/types/item';
import type { CollectionRecord } from '@/types/collection';
import type { CollectionTemplate } from '@/types/template';
import {
  detectItemCategory,
  getStandaloneRootItem,
  getItemRootCollectionIds,
  getItemRootCollectionId,
  isDescendantOf,
} from '@/lib/explorerUtils';

export type ExplorerTab = 'items' | 'collections';

/**
 * Builds nested parent-child hierarchies of items, safely handling any
 * items whose parent_id might not be present in the subset.
 */
function buildSafeItemHierarchy(items: ItemRecord[]): ItemRecord[] {
  const itemIds = new Set(items.map((i) => i.id));
  const isRoot = (item: ItemRecord) => !item.parent_id || !itemIds.has(item.parent_id);

  const buildSubtree = (parentId: number): ItemRecord[] => {
    return items
      .filter((it) => it.parent_id === parentId)
      .map((it) => ({
        ...it,
        children: buildSubtree(it.id),
      }));
  };

  return items
    .filter(isRoot)
    .map((root) => ({
      ...root,
      children: buildSubtree(root.id),
    }));
}

/**
 * Synthesizes dynamic category nodes for a given list of items,
 * partitioned by each root item's template category.
 */
function buildCategoryNodesFromItems(
  items: ItemRecord[],
  allItems: ItemRecord[],
  templates: CollectionTemplate[]
): UnifiedCollectionNode[] {
  const categoryMap = new Map<
    number,
    { meta: { id: number; name: string; icon: string }; items: ItemRecord[] }
  >();

  for (const item of items) {
    const rootItem = getStandaloneRootItem(item, allItems);
    const categoryMeta = detectItemCategory(rootItem, templates);

    if (!categoryMap.has(categoryMeta.id)) {
      categoryMap.set(categoryMeta.id, {
        meta: categoryMeta,
        items: [],
      });
    }
    categoryMap.get(categoryMeta.id)!.items.push(item);
  }

  const result: UnifiedCollectionNode[] = [];

  categoryMap.forEach(({ meta, items: catItems }) => {
    const categoryTree = buildSafeItemHierarchy(catItems);
    if (categoryTree.length > 0) {
      result.push({
        id: meta.id,
        name: meta.name,
        description: `All ${meta.name}`,
        icon: meta.icon,
        items: categoryTree,
        subCollections: [],
      });
    }
  });

  return result;
}

/**
 * Primary Explorer forest filter orchestrator:
 * - Items tab: groups items by category. If collection filters are active, only
 *   includes items existing within those filtered collection sets.
 * - Collections tab: returns collection hierarchies, pruning down to selected collections
 *   or showing all collections if no specific filter is checked.
 */
export function filterExplorerForest(
  forest: UnifiedCollectionNode[],
  filterCollectionIds: number[],
  activeTab: ExplorerTab = 'items',
  allItems: ItemRecord[] = [],
  collections: CollectionRecord[] = [],
  templates: CollectionTemplate[] = []
): UnifiedCollectionNode[] {
  if (activeTab === 'items') {
    // If specific collection filters are applied, only include items belonging to those collections
    const targetItems =
      filterCollectionIds.length > 0
        ? allItems.filter((item) => {
            const colIds = getItemRootCollectionIds(item, allItems);
            if (colIds.length === 0) return false;
            return colIds.some(
              (colId) =>
                filterCollectionIds.includes(colId) ||
                filterCollectionIds.some((fId) => isDescendantOf(collections, colId, fId))
            );
          })
        : allItems;

    return buildCategoryNodesFromItems(targetItems, allItems, templates);
  }


  // Collections view: if no specific filters are checked, show all collections
  if (filterCollectionIds.length === 0) {
    return forest.filter((node) => node.id > 0);
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
