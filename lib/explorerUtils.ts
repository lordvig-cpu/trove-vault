import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';
import { UnifiedCollectionNode } from '@/components/UnifiedExplorerTree';
import { SearchScope } from '@/components/NavigationHeader';

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

export function buildItemHierarchy(items: ItemRecord[], parentId: number | null = null): ItemRecord[] {
  return items
    .filter((item) => (item.parent_id || null) === parentId)
    .map((item) => ({
      ...item,
      children: buildItemHierarchy(items, item.id),
    }));
}

export function isDescendantOf(
  collections: CollectionRecord[],
  candidateId: number,
  ancestorId: number | null
): boolean {
  if (!ancestorId) return false;
  const current = collections.find((c) => c.id === candidateId);
  if (!current || !current.parent_id) return false;
  if (current.parent_id === ancestorId) return true;
  return isDescendantOf(collections, current.parent_id, ancestorId);
}

export function isAncestorOf(
  collections: CollectionRecord[],
  candidateId: number,
  descendantId: number | null
): boolean {
  if (!descendantId) return false;
  return isDescendantOf(collections, descendantId, candidateId);
}

export function buildFilteredUnifiedForest(
  collections: CollectionRecord[],
  allItems: ItemRecord[],
  parentCollectionId: number | null = null,
  activeCollectionId: number | null = null,
  searchQuery: string = '',
  searchScope: SearchScope = 'current'
): UnifiedCollectionNode[] {
  const isSearchingCurrent = searchScope === 'current' && searchQuery.trim() !== '';

  return collections
    .filter((col) => (col.parent_id || null) === parentCollectionId)
    .map((col) => {
      const collectionRawItems = allItems.filter((it) => it.collection_id === col.id);
      const fullItemTree = buildItemHierarchy(collectionRawItems, null);

      const childSubCols = buildFilteredUnifiedForest(
        collections,
        allItems,
        col.id,
        activeCollectionId,
        searchQuery,
        searchScope
      );

      let filteredItems = fullItemTree;
      if (isSearchingCurrent) {
        if (col.id === activeCollectionId || isDescendantOf(collections, col.id, activeCollectionId)) {
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
}