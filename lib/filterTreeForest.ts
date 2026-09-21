import type { UnifiedCollectionNode } from '@/components/UnifiedTree';
import type { ItemRecord } from '@/types/item';
import type { CollectionRecord } from '@/types/collection';
import type { CollectionTemplate } from '@/types/template';
import {
  detectItemCategory,
  getStandaloneRootItem,
  getItemRootCollectionIds,
  buildItemHierarchy,
  isDescendantOf,
} from '@/lib/treeUtils';

export type TreeTab = 'items' | 'collections' | 'templates';

/**
 * Synthesizes dynamic template nodes for a given list of items,
 * partitioned by each item's assigned template blueprint.
 */
function buildTemplateNodesFromItems(
  items: ItemRecord[],
  templates: CollectionTemplate[]
): UnifiedCollectionNode[] {
  const templateMap = new Map<number, ItemRecord[]>();
  for (const item of items) {
    if (item.template_id) {
      if (!templateMap.has(item.template_id)) {
        templateMap.set(item.template_id, []);
      }
      templateMap.get(item.template_id)!.push(item);
    }
  }

  const result: UnifiedCollectionNode[] = [];
  for (const tmpl of templates) {
    const tmplItems = templateMap.get(tmpl.id) || [];
    if (tmplItems.length > 0) {
      const itemTree = buildItemHierarchy(tmplItems, null, true);
      result.push({
        id: -tmpl.id,
        name: tmpl.name,
        description: tmpl.description || `All ${tmpl.name}`,
        icon: tmpl.icon || '📦',
        items: itemTree,
        subCollections: [],
      });
    }
  }
  return result;
}

/**
 * Builds nested parent-child hierarchies of items, safely handling any
 * items whose parent_id might not be present in the subset.
 */
/**
 * Synthesizes dynamic category nodes for a given list of items,
 * partitioned by each root item's template category.
 */
function buildCategoryNodesFromItems(
  items: ItemRecord[],
  allItems: ItemRecord[],
  templates: CollectionTemplate[]
): UnifiedCollectionNode[] {
  const itemLookup = new Map(allItems.map(item => [item.id, item]));
  const categoryMap = new Map<
    number,
    { meta: { id: number; name: string; icon: string }; items: ItemRecord[] }
  >();

  for (const item of items) {
    const rootItem = getStandaloneRootItem(item, allItems, itemLookup);
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
    const categoryTree = buildItemHierarchy(catItems, null, true);
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
 * Primary Tree forest filter orchestrator:
 * - Items tab: groups items by category. If collection filters are active, only
 *   includes items existing within those filtered collection sets.
 * - Collections tab: returns collection hierarchies, pruning down to selected collections
 *   or showing all collections if no specific filter is checked.
 * - Templates tab: returns template hierarchies, pruning down to templates used by
 *   the selected collections or showing all active templates in use.
 */
export function filterTreeForest(
  forest: UnifiedCollectionNode[],
  filterCollectionIds: number[],
  activeTab: TreeTab = 'items',
  allItems: ItemRecord[] = [],
  collections: CollectionRecord[] = [],
  templates: CollectionTemplate[] = []
): UnifiedCollectionNode[] {
  if (activeTab === 'templates') {
    const itemLookup = new Map(allItems.map(item => [item.id, item]));
    const collectionLookup = new Map(collections.map(collection => [collection.id, collection]));
    const targetItems =
      filterCollectionIds.length > 0
        ? allItems.filter((item) => {
            const colIds = getItemRootCollectionIds(item, allItems, itemLookup);
            if (colIds.length === 0) return false;
            return colIds.some(
              (colId) =>
                filterCollectionIds.includes(colId) ||
                filterCollectionIds.some((fId) => isDescendantOf(collections, colId, fId, collectionLookup))
            );
          })
        : allItems;

    return buildTemplateNodesFromItems(targetItems, templates);
  }

  if (activeTab === 'items') {
    const itemLookup = new Map(allItems.map(item => [item.id, item]));
    const collectionLookup = new Map(collections.map(collection => [collection.id, collection]));
    // If specific collection filters are applied, only include items belonging to those collections
    const targetItems =
      filterCollectionIds.length > 0
        ? allItems.filter((item) => {
            const colIds = getItemRootCollectionIds(item, allItems, itemLookup);
            if (colIds.length === 0) return false;
            return colIds.some(
              (colId) =>
                filterCollectionIds.includes(colId) ||
                filterCollectionIds.some((fId) => isDescendantOf(collections, colId, fId, collectionLookup))
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
