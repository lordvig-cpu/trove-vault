import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';
import { CollectionTemplate } from '@/types/template';
import { UnifiedCollectionNode } from '@/components/UnifiedTree';
import { SearchScope } from '@/components/NavigationHeader';

export const STANDALONE_COLLECTION_ID = 0;

export interface TreeSearchHighlight {
  itemId: number;
  item: ItemRecord;
  collectionIds: Set<number>;
  ancestorItemIds: Set<number>;
}

/** Count actual item matches, excluding ancestors retained only for context. */
export function getSingleSearchHighlight(
  forest: UnifiedCollectionNode[],
  query: string
): TreeSearchHighlight | null {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return null;

  const matches = new Map<number, TreeSearchHighlight>();
  const visitItem = (item: ItemRecord, collectionId: number, ancestors: number[]) => {
    if (itemMatchesQuery(item, trimmed)) {
      const match = matches.get(item.id) ?? {
        itemId: item.id,
        item,
        collectionIds: new Set<number>(),
        ancestorItemIds: new Set<number>(),
      };
      match.collectionIds.add(collectionId);
      ancestors.forEach((id) => match.ancestorItemIds.add(id));
      matches.set(item.id, match);
    }
    item.children?.forEach((child) => visitItem(child, collectionId, [...ancestors, item.id]));
  };
  const visitCollection = (node: UnifiedCollectionNode) => {
    node.items.forEach((item) => visitItem(item, node.id, []));
    node.subCollections.forEach(visitCollection);
  };
  forest.forEach(visitCollection);
  return matches.size === 1 ? matches.values().next().value! : null;
}

/**
 * Traverses parent item relationships upwards to determine all collections
 * an item belongs to (or inherits from parent ancestors).
 */
export function getItemRootCollectionIds(item: ItemRecord, allItems: ItemRecord[], lookup = new Map(allItems.map(item => [item.id, item]))): number[] {
  const visited = new Set<number>();
  let current: ItemRecord | undefined = item;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.collection_ids?.length) return current.collection_ids;
    if (current.collection_id != null) return [current.collection_id];
    current = current.parent_id ? lookup.get(current.parent_id) : undefined;
  }
  return [];
}

/**
 * Traverses upwards to find the top-level root ancestor item of a standalone item.
 */
export function getStandaloneRootItem(item: ItemRecord, allItems: ItemRecord[], lookup = new Map(allItems.map(item => [item.id, item]))): ItemRecord {
  const visited = new Set<number>();
  let current = item;
  while (current.parent_id && !visited.has(current.id)) {
    visited.add(current.id);
    const parent = lookup.get(current.parent_id);
    if (!parent || visited.has(parent.id)) break;
    current = parent;
  }
  return current;
}

/**
 * Resolves the dynamic category definition for an item based strictly
 * on its assigned template_id from the database.
 */
export function detectItemCategory(
  item: ItemRecord,
  templates: CollectionTemplate[] = []
): { id: number; name: string; icon: string } {
  // 1. Dynamic Database-Driven Grouping
  if (item.template_id) {
    const matchedTemplate = templates.find((t) => t.id === item.template_id);
    if (matchedTemplate) {
      return {
        id: -matchedTemplate.id, // Negative ID marks virtual category nodes
        name: matchedTemplate.name,
        icon: matchedTemplate.icon || '📦',
      };
    }

    // Fallback if templates array is empty or still fetching
    return {
      id: -item.template_id,
      name:
        item.template_id === 2
          ? 'Trading Card Games (TCG)'
          : item.template_id === 3
          ? 'Comic Books & Graphic Novels'
          : `Category #${item.template_id}`,
      icon: item.template_id === 2 ? '🃏' : item.template_id === 3 ? '📚' : '📦',
    };
  }

  // 2. Generic Fallback for unassigned items
  return { id: -999, name: 'Uncategorized Items', icon: '📦' };
}

/**
 * Checks whether an item matches a search string across its name and attributes.
 */
export function itemMatchesQuery(item: ItemRecord, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();

  if (item.name.toLowerCase().includes(q)) return true;

  if (item.attributes) {
    for (const [key, value] of Object.entries(item.attributes)) {
      if (key.toLowerCase().includes(q)) return true;
      if (String(value).toLowerCase().includes(q)) return true;
    }
  }

  return false;
}

/**
 * Recursively filters an item hierarchy, keeping branches that match the query.
 */
export function filterItemHierarchy(items: ItemRecord[], query: string): ItemRecord[] {
  if (!query.trim()) return items;

  const result: ItemRecord[] = [];

  for (const item of items) {
    const matchingChildren = filterItemHierarchy(item.children || [], query);
    const selfMatches = itemMatchesQuery(item, query);

    if (selfMatches || matchingChildren.length > 0) {
      result.push({
        ...item,
        children: matchingChildren,
      });
    }
  }

  return result;
}

/**
 * Builds nested parent-child hierarchies of items based on parent_id.
 */
export function buildItemHierarchy(items: ItemRecord[], parentId: number | null = null, includeOrphans = false): ItemRecord[] {
  const ids = new Set(items.map(item => item.id));
  const children = new Map<number | null, ItemRecord[]>();
  for (const item of items) {
    const parent = includeOrphans && !ids.has(item.parent_id ?? 0) ? null : item.parent_id || null;
    const group = children.get(parent) ?? [];
    group.push(item);
    children.set(parent, group);
  }
  const ancestors = new Set<number>();
  if (parentId !== null) ancestors.add(parentId);
  const build = (parent: number | null): ItemRecord[] => (children.get(parent) ?? []).flatMap(item => {
    if (ancestors.has(item.id)) return [];
    ancestors.add(item.id);
    const nested = build(item.id);
    ancestors.delete(item.id);
    return [{ ...item, children: nested }];
  });
  return build(parentId);
}

/**
 * Checks if collection A is a descendant of collection B.
 */
export function isDescendantOf(collections: CollectionRecord[], candidateId: number, ancestorId: number | null, lookup = new Map(collections.map(collection => [collection.id, collection]))): boolean {
  if (!ancestorId || candidateId <= 0) return false;
  const visited = new Set<number>();
  let current = lookup.get(candidateId);
  while (current?.parent_id && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.parent_id === ancestorId) return true;
    current = lookup.get(current.parent_id);
  }
  return false;
}

/**
 * Builds the complete unified tree forest:
 * 1. Explicit user collections from collections
 * 2. Standalone items partitioned dynamically into category nodes by template.
 */
export function buildFilteredUnifiedForest(
  collections: CollectionRecord[],
  allItems: ItemRecord[],
  parentCollectionId: number | null = null,
  activeCollectionId: number | null = null,
  searchQuery: string = '',
  searchScope: SearchScope = 'current',
  templates: CollectionTemplate[] = []
): UnifiedCollectionNode[] {
  const isSearchingCurrent = searchScope === 'current' && searchQuery.trim() !== '';
  const itemLookup = new Map(allItems.map(item => [item.id, item]));
  const collectionLookup = new Map(collections.map(collection => [collection.id, collection]));
  const collectionsByParent = new Map<number | null, CollectionRecord[]>();
  const itemsByCollection = new Map<number, ItemRecord[]>();
  const standaloneItems: ItemRecord[] = [];
  for (const collection of collections) {
    const parent = collection.parent_id || null;
    const group = collectionsByParent.get(parent) ?? [];
    group.push(collection);
    collectionsByParent.set(parent, group);
  }
  for (const item of allItems) {
    const memberships = getItemRootCollectionIds(item, allItems, itemLookup);
    if (!memberships.length) standaloneItems.push(item);
    for (const id of new Set(memberships)) {
      const group = itemsByCollection.get(id) ?? [];
      group.push(item);
      itemsByCollection.set(id, group);
    }
  }
  const ancestors = new Set<number>();
  const buildCollections = (parent: number | null): UnifiedCollectionNode[] => {


    // 1. Build nested user-defined collection branches
    const forest: UnifiedCollectionNode[] = (collectionsByParent.get(parent) ?? [])
      .filter(col => !ancestors.has(col.id))
      .map((col) => {
        ancestors.add(col.id);
        const fullItemTree = buildItemHierarchy(itemsByCollection.get(col.id) ?? [], null);

        const childSubCols = buildCollections(col.id);
        ancestors.delete(col.id);

        let filteredItems = fullItemTree;
        if (isSearchingCurrent) {
          if (
            col.id === activeCollectionId ||
            isDescendantOf(collections, col.id, activeCollectionId, collectionLookup)
          ) {
            filteredItems = filterItemHierarchy(fullItemTree, searchQuery);
          } else {
            filteredItems = [];
          }
        }

        return {
          ...col,
          items: filteredItems,
          subCollections: childSubCols,
        };
      })
      .filter((colNode) => {
        if (isSearchingCurrent) {
          const belongsToActiveBranch =
            colNode.id === activeCollectionId ||
            isDescendantOf(collections, colNode.id, activeCollectionId, collectionLookup) ||
            isDescendantOf(collections, activeCollectionId ?? 0, colNode.id, collectionLookup);

          if (!belongsToActiveBranch) return false;

          const hasMatches =
            colNode.items.length > 0 || colNode.subCollections.length > 0;
          return hasMatches || colNode.id === activeCollectionId;
        }
        return true;
      });

    return forest;
  };
  const forest = buildCollections(parentCollectionId);

  // 2. Synthesize dynamic category nodes for standalone items (no collection membership)
  if (parentCollectionId === null) {
    if (standaloneItems.length > 0) {
      // Group items under their root ancestor's detected category
      const categoryMap = new Map<
        number,
        { meta: { id: number; name: string; icon: string }; items: ItemRecord[] }
      >();

      for (const item of standaloneItems) {
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

      // Generate a virtual collection node for each active category
      categoryMap.forEach(({ meta, items }) => {
        const categoryFullTree = buildItemHierarchy(items, null);
        let categoryFilteredItems = categoryFullTree;

        if (isSearchingCurrent) {
          if (activeCollectionId === meta.id || activeCollectionId === null) {
            categoryFilteredItems = filterItemHierarchy(categoryFullTree, searchQuery);
          } else {
            categoryFilteredItems = [];
          }
        }

        const categoryNode: UnifiedCollectionNode = {
          id: meta.id,
          name: meta.name,
          description: `All standalone ${meta.name}`,
          icon: meta.icon,
          items: categoryFilteredItems,
          subCollections: [],
        };

        const shouldInclude =
          !isSearchingCurrent ||
          categoryNode.items.length > 0 ||
          activeCollectionId === meta.id;

        if (shouldInclude && categoryNode.items.length > 0) {
          forest.push(categoryNode);
        }
      });
    }
  }

  return forest;
}
