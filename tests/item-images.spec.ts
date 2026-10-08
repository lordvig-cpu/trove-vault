import { test, expect } from '@playwright/test';

/* Photo cleanup in lib/data/items.ts: a replaced, removed or deleted item's uploaded photo is deleted from
   storage, but only once the database change has succeeded. supabase-js calls the global fetch, so these
   tests swap in a fake one and run the real data functions against a small in-memory items table. */

type Row = { id: number; parent_id: number | null; attributes: Record<string, unknown> };
const BASE = 'https://placeholder.supabase.co';
const upload = (name: string) => `${BASE}/storage/v1/object/public/item-images/uploads/${name}`;

let rows: Row[] = [];
let removed: string[] = [];
let failWrites = false;
const realFetch = globalThis.fetch;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// A tiny PostgREST / Storage stand-in: just the requests updateItem and deleteItem make
async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  const method = (init?.method ?? 'GET').toUpperCase();
  if (url.pathname.startsWith('/storage/v1/object/item-images') && method === 'DELETE') {
    removed.push(...(JSON.parse(String(init?.body)).prefixes as string[]));
    return json([]);
  }
  if (url.pathname !== '/rest/v1/items') throw new Error(`unexpected request ${method} ${url}`);
  const id = url.searchParams.get('id')?.replace('eq.', '');
  const parents = url.searchParams.get('parent_id')?.match(/\d+/g)?.map(Number);
  if (method === 'GET') {
    const found = rows.filter((r) => (id ? r.id === Number(id) : parents ? parents.includes(r.parent_id ?? -1) : true));
    const wantsObject = new Headers(init?.headers).get('accept')?.includes('vnd.pgrst.object');
    return json(wantsObject ? found[0] ?? null : found);
  }
  if (failWrites) return json({ message: 'write failed', code: 'XX000' }, 500);
  if (method === 'DELETE') {
    // the database's ON DELETE CASCADE on parent_id
    const doomed = new Set([Number(id)]);
    let grew = true;
    while (grew) { grew = false; for (const r of rows) if (r.parent_id !== null && doomed.has(r.parent_id) && !doomed.has(r.id)) { doomed.add(r.id); grew = true; } }
    rows = rows.filter((r) => !doomed.has(r.id));
    return new Response(null, { status: 204 });
  }
  if (method === 'PATCH') {
    const patch = JSON.parse(String(init?.body));
    rows = rows.map((r) => (r.id === Number(id) ? { ...r, ...patch } : r));
    return new Response(null, { status: 204 });
  }
  throw new Error(`unexpected ${method}`);
}

test.beforeAll(() => { globalThis.fetch = fakeFetch as typeof fetch; });
test.afterAll(() => { globalThis.fetch = realFetch; });
test.beforeEach(() => { rows = []; removed = []; failWrites = false; });

const data = () => import('../lib/data/items');
const edit = (over: Partial<Parameters<Awaited<ReturnType<typeof data>>['updateItem']>[0]>) => ({
  id: 1, name: 'One', templateId: null, attributes: {}, imageFile: null, existingImageUrl: null, previousImageUrl: null, ...over,
});

test('imagePathFromUrl only accepts photos this app uploaded', async () => {
  const { imagePathFromUrl } = await import('../lib/storage');
  expect(imagePathFromUrl(upload('a%20b.jpg?x=1'))).toBe('uploads/a b.jpg');
  expect(imagePathFromUrl('https://example.com/photo.jpg')).toBeNull();
  expect(imagePathFromUrl(`${BASE}/storage/v1/object/public/other-bucket/uploads/a.jpg`)).toBeNull();
  expect(imagePathFromUrl(`${BASE}/storage/v1/object/public/item-images/elsewhere/a.jpg`)).toBeNull();
  expect(imagePathFromUrl(null)).toBeNull();
});

test('removing a photo deletes the old file once the item is saved', async () => {
  rows = [{ id: 1, parent_id: null, attributes: { image_url: upload('old.jpg') } }];
  await (await data()).updateItem(edit({ previousImageUrl: upload('old.jpg') }));
  expect(removed).toEqual(['uploads/old.jpg']);
  expect(rows[0].attributes.image_url).toBeUndefined();
});

test('keeping the photo deletes nothing; a photo hosted elsewhere is never deleted', async () => {
  rows = [{ id: 1, parent_id: null, attributes: {} }];
  const { updateItem } = await data();
  await updateItem(edit({ existingImageUrl: upload('keep.jpg'), previousImageUrl: upload('keep.jpg') }));
  await updateItem(edit({ previousImageUrl: 'https://example.com/theirs.jpg' }));
  expect(removed).toEqual([]);
});

test('a failed save keeps the old photo', async () => {
  rows = [{ id: 1, parent_id: null, attributes: { image_url: upload('old.jpg') } }];
  failWrites = true;
  await expect((await data()).updateItem(edit({ previousImageUrl: upload('old.jpg') }))).rejects.toBeTruthy();
  expect(removed).toEqual([]);
});

test('deleting an item deletes its photo and its sub-items\' photos', async () => {
  rows = [
    { id: 1, parent_id: null, attributes: { image_url: upload('root.jpg') } },
    { id: 2, parent_id: 1, attributes: { image_url: upload('child.jpg') } },
    { id: 3, parent_id: 2, attributes: { image_url: upload('grandchild.jpg') } },
    { id: 4, parent_id: 2, attributes: {} },
    { id: 5, parent_id: null, attributes: { image_url: upload('unrelated.jpg') } },
  ];
  await (await data()).deleteItem(1);
  expect(rows.map((r) => r.id)).toEqual([5]);
  expect(removed.sort()).toEqual(['uploads/child.jpg', 'uploads/grandchild.jpg', 'uploads/root.jpg']);
});

test('a failed delete keeps every photo', async () => {
  rows = [{ id: 1, parent_id: null, attributes: { image_url: upload('root.jpg') } }];
  failWrites = true;
  await expect((await data()).deleteItem(1)).rejects.toBeTruthy();
  expect(removed).toEqual([]);
});
