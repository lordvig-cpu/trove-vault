import { CollectionRecord } from '@/types/collection2';
import { ItemRecord } from '@/types/item2';
import { CollectionTemplate } from '@/types/template2';
import { UnifiedCollectionNode } from '@/components/UnifiedExplorerTree2';
import { SearchScope } from '@/components/NavigationHeader2';

export const STANDALONE_COLLECTION_ID = 0;

/**
 * Traverses parent item relationships to determine whether an item
 * belongs to an explicit collection or is a standalone root item.
 */
export function getItemRootCollectionId(
  item: ItemRecord,
  allItems: ItemRecord[]
): number | null {
  if (item.collection_id !== null && item.collection_id !== undefined) {
    return item.collection_id;
  }
  if (!item.parent_id) {
    return null;
  }
  const parent = allItems.find((i) => i.id === item.parent_id);
  if (!parent) return null;
  return getItemRootCollectionId(parent, allItems);
}

/**
 * Traverses upwards to find the top-level root ancestor item of a standalone item.
 */
export function getStandaloneRootItem(
  item: ItemRecord,
  allItems: ItemRecord[]
): ItemRecord {
  if (!item.parent_id) return item;
  const parent = allItems.find((i) => i.id === item.parent_id);
  if (!parent) return item;
  return getStandaloneRootItem(parent, allItems);
}

/**
 * Resolves the dynamic category definition for an item based STRICTLY 
 * on its assigned template_id from the database.
 */
export function detectItemCategory(
  item: ItemRecord,
  templates: CollectionTemplate[] = []
): { id: number; name: string; icon: string } {
  // 1. Dynamic Database-Driven Grouping (Supports infinite templates)
  if (item.template_id) {
    const matchedTemplate = templates.find((t) => t.id === item.template_id);
    if (matchedTemplate) {
      return {
        id: -matchedTemplate.id, // Negative ID proxies the template for the modal
        name: matchedTemplate.name,
        icon: matchedTemplate.icon || '📦',
      };
    }
    
    // If templates haven't loaded into context yet, preserve the ID
    return {
      id: -item.template_id,
      name: 'Loading Category...',
      icon: '📦',
    };
  }

  // 2. Generic Fallback for items without a template_id
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
export function buildItemHierarchy(
  items: ItemRecord[],
  parentId: number | null = null
): ItemRecord[] {
  return items
    .filter((item) => (item.parent_id || null) === parentId)
    .map((item) => ({
      ...item,
      children: buildItemHierarchy(items, item.id),
    }));
}

/**
 * Checks if collection A is a descendant of collection B.
 */
export function isDescendantOf(
  collections: CollectionRecord[],
  candidateId: number,
  ancestorId: number | null
): boolean {
  if (!ancestorId || candidateId <= 0) return false;
  const current = collections.find((c) => c.id === candidateId);
  if (!current || !current.parent_id) return false;
  if (current.parent_id === ancestorId) return true;
  return isDescendantOf(collections, current.parent_id, ancestorId);
}

/**
 * Checks if collection A is an ancestor of collection B.
 */
export function isAncestorOf(
  collections: CollectionRecord[],
  candidateId: number,
  descendantId: number | null
): boolean {
  if (!descendantId || candidateId <= 0) return false;
  return isDescendantOf(collections, descendantId, candidateId);
}

/**
 * Builds the complete unified tree forest:
 * 1. Explicit user collections from collections2
 * 2. Standalone items partitioned dynamically into category folders by template.
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

  // 1. Build nested user-defined collection branches
  const forest: UnifiedCollectionNode[] = collections
    .filter((col) => (col.parent_id || null) === parentCollectionId)
    .map((col) => {
      const collectionRawItems = allItems.filter(
        (it) => getItemRootCollectionId(it, allItems) === col.id
      );
      const fullItemTree = buildItemHierarchy(collectionRawItems, null);

      const childSubCols = buildFilteredUnifiedForest(
        collections,
        allItems,
        col.id,
        activeCollectionId,
        searchQuery,
        searchScope,
        templates
      );

      let filteredItems = fullItemTree;
      if (isSearchingCurrent) {
        if (
          col.id === activeCollectionId ||
          isDescendantOf(collections, col.id, activeCollectionId)
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
          isDescendantOf(collections, colNode.id, activeCollectionId) ||
          isAncestorOf(collections, colNode.id, activeCollectionId);

        if (!belongsToActiveBranch) return false;

        const hasMatches =
          colNode.items.length > 0 || colNode.subCollections.length > 0;
        return hasMatches || colNode.id === activeCollectionId;
      }
      return true;
    });

  // 2. Synthesize dynamic category folders for standalone items (collection_id IS NULL)
  if (parentCollectionId === null) {
    const standaloneItems = allItems.filter(
      (it) => getItemRootCollectionId(it, allItems) === null
    );

    if (standaloneItems.length > 0) {
      // Group items under their root ancestor's detected category
      const categoryMap = new Map<
        number,
        { meta: { id: number; name: string; icon: string }; items: ItemRecord[] }
      >();

      for (const item of standaloneItems) {
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