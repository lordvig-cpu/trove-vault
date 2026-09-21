import { test, expect } from '@playwright/test';
import { fetchAllPages } from '../lib/fetchAllPages';
import { buildItemHierarchy, buildFilteredUnifiedForest, getItemRootCollectionIds, getStandaloneRootItem } from '../lib/treeUtils';
import { filterTreeForest } from '../lib/filterTreeForest';
import type { ItemRecord } from '../types/item';

const item = (id: number, parent_id: number | null = null, collection_ids: number[] = []): ItemRecord => ({ id, parent_id, collection_ids, name: `Item ${id}`, attributes: {} });

test('pagination reads beyond both the usual cap and a smaller server cap', async () => {
  const source = Array.from({ length: 2505 }, (_, id) => ({ id }));
  for (const cap of [1000, 317]) {
    const result = await fetchAllPages((from, to) => Promise.resolve({ data: source.slice(from, Math.min(to + 1, from + cap)), error: null }));
    expect(result).toEqual(source);
  }
});

test('pagination rejects partial results on error or cancellation', async () => {
  let page = 0;
  await expect(fetchAllPages(() => Promise.resolve(++page === 1 ? { data: [1], error: null } : { data: null, error: { message: 'offline' } }))).rejects.toThrow('offline');
  const controller = new AbortController();
  controller.abort();
  await expect(fetchAllPages(() => Promise.resolve({ data: [], error: null }), controller.signal)).rejects.toThrow();
});

test('indexed hierarchy preserves ordering and optionally promotes missing parents', () => {
  const items = [item(3, 1), item(1), item(2, 1), item(4, 99)];
  expect(buildItemHierarchy(items).map(node => node.id)).toEqual([1]);
  expect(buildItemHierarchy(items)[0].children?.map(node => node.id)).toEqual([3, 2]);
  expect(buildItemHierarchy(items, null, true).map(node => node.id)).toEqual([1, 4]);
  expect(buildItemHierarchy(items, 1).map(node => node.id)).toEqual([3, 2]);
});

test('membership inheritance, multi-collection items and standalone grouping survive indexing', () => {
  const items = [item(1, null, [10, 20]), item(2, 1), item(3)];
  const collections = [{ id: 10, name: 'A', parent_id: null }, { id: 20, name: 'B', parent_id: 10 }];
  const forest = buildFilteredUnifiedForest(collections, items);
  expect(getItemRootCollectionIds(items[1], items)).toEqual([10, 20]);
  expect(forest[0].items[0].children?.[0].id).toBe(2);
  expect(forest[0].subCollections[0].items[0].id).toBe(1);
  expect(forest.find(node => node.id < 0)?.items[0].id).toBe(3);
  const categories = filterTreeForest(forest, [10], 'items', items, collections, []);
  expect(categories.flatMap(node => node.items.map(item => item.id))).toEqual([1]);
});

test('malformed parent cycles terminate', () => {
  const items = [item(1, 2), item(2, 1)];
  expect(getItemRootCollectionIds(items[0], items)).toEqual([]);
  expect(getStandaloneRootItem(items[0], items).id).toBe(2);
  expect(buildItemHierarchy(items, 1)).toHaveLength(1);
});
