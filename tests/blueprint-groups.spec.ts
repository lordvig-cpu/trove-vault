import { test, expect } from '@playwright/test';
import { blueprintGroupCounts, blueprintGroups, moveWithinGroup } from '../lib/blueprintGroups';
import { collectPlacedBuiltins, buildBuiltinComponent } from '../lib/layoutContent';
import type { FieldDefinition } from '../types/field';
import type { BuiltinKey, FlexContainerNode } from '../types/layout';

const field = (id: number, label: string, field_type: FieldDefinition['field_type']): FieldDefinition => ({
  id,
  name: label.toLowerCase().replace(/\W+/g, '_'),
  label,
  field_type,
  options: null,
  is_required: false,
  display_order: id,
});

const fields = [
  field(1, 'Game Designer', 'text'),
  field(2, 'Players', 'number'),
  field(3, 'Published', 'date'),
  field(4, 'Sleeved', 'boolean'),
  field(5, 'Publisher', 'text'),
];
const none = { placedFieldIds: new Set<number>(), placedBuiltins: new Set<BuiltinKey>() };
const shape = (groups: ReturnType<typeof blueprintGroups>) =>
  groups.map((g) => `${g.label}: ${g.rows.map((r) => (r.kind === 'builtin' ? `*${r.label}` : r.field.label)).join(', ')}`);

test('groups by kind of data, built-ins first, empty groups left out', () => {
  expect(shape(blueprintGroups({ fields, ...none }))).toEqual([
    'Text: *Name, Game Designer, Publisher',
    'Number: Players',
    'Yes/No: Sleeved',
    'Date: *Created, Published',
    'Image: *Image',
    'Collections: *Collections',
    'Sub-Items: *Sub-items',
  ]);
});

test('search, filter and missing-only prune rows and the groups they empty', () => {
  expect(shape(blueprintGroups({ fields, ...none, query: 'pub' }))).toEqual(['Text: Publisher', 'Date: Published']);
  // a field's key matches too
  expect(shape(blueprintGroups({ fields, ...none, query: 'game_designer' }))).toEqual(['Text: Game Designer']);
  expect(shape(blueprintGroups({ fields, ...none, filter: ['number', 'image'] }))).toEqual(['Number: Players', 'Image: *Image']);
  // the "select none" sentinel matches no group
  expect(blueprintGroups({ fields, ...none, filter: ['__none__'] })).toEqual([]);
  const placed = { placedFieldIds: new Set([1, 2]), placedBuiltins: new Set<BuiltinKey>(['name', 'image', 'collections', 'subitems']) };
  expect(shape(blueprintGroups({ fields, ...placed, unplacedOnly: true }))).toEqual([
    'Text: Publisher',
    'Yes/No: Sleeved',
    'Date: *Created, Published',
  ]);
  // placed rows carry their check
  const text = blueprintGroups({ fields, ...placed })[0];
  expect(text.rows.map((r) => r.placed)).toEqual([true, true, false]);
});

test('group counts include the built-ins', () => {
  expect(blueprintGroupCounts(fields)).toEqual({ text: 3, number: 1, boolean: 1, date: 2, image: 1, collections: 1, subitems: 1 });
});

test('moving a field steps over other groups to its own group-mate', () => {
  expect(moveWithinGroup(fields, 5, 'up')).toEqual([5, 2, 3, 4, 1]);
  expect(moveWithinGroup(fields, 1, 'down')).toEqual([5, 2, 3, 4, 1]);
  expect(moveWithinGroup(fields, 1, 'up')).toBeNull();
  expect(moveWithinGroup(fields, 2, 'down')).toBeNull(); // the only number field
});

test('collectPlacedBuiltins finds built-in values anywhere in the layout', () => {
  const root: FlexContainerNode = {
    id: 'root',
    nodeType: 'container',
    children: [
      { id: 'a', nodeType: 'component', ...buildBuiltinComponent('name') },
      {
        id: 'box',
        nodeType: 'container',
        children: [
          { id: 'b', nodeType: 'component', ...buildBuiltinComponent('created') },
          { id: 'c', nodeType: 'component', componentType: 'field', field_id: 1 },
        ],
      } as FlexContainerNode,
    ],
  } as FlexContainerNode;
  expect([...collectPlacedBuiltins(root)].sort()).toEqual(['created', 'name']);
});

test('followFieldLabels lets placed copies of a field label follow the field, and keeps typed labels', async () => {
  const { followFieldLabels } = await import('../lib/layoutContent');
  const published = field(3, 'Published', 'date');
  const root = {
    id: 'root',
    nodeType: 'container',
    children: [
      { id: 'copy', nodeType: 'component', componentType: 'field', field_id: 3, binding: { kind: 'field', field_id: 3 }, label: 'Published:' },
      { id: 'named', nodeType: 'component', componentType: 'field', field_id: 3, binding: { kind: 'field', field_id: 3 }, name: 'Published:' },
      { id: 'typed', nodeType: 'component', componentType: 'field', field_id: 3, binding: { kind: 'field', field_id: 3 }, label: 'Release date' },
      { id: 'same', nodeType: 'component', componentType: 'field', field_id: 3, binding: { kind: 'field', field_id: 3 }, label: 'Published' },
    ],
  } as FlexContainerNode;
  const byId = (r: FlexContainerNode) => Object.fromEntries(r.children.map((c) => [c.id, c]));

  // At load: only copies equal to the field's current label go
  const loaded = byId(followFieldLabels(root, [published]));
  expect(loaded.copy).toHaveProperty('label', 'Published:');
  expect(loaded.same).not.toHaveProperty('label');
  expect(loaded.typed).toHaveProperty('label', 'Release date');

  // On a rename from "Published:", copies of the old label (and a name equal to it) go too
  const renamed = byId(followFieldLabels(root, [published], { fieldId: 3, oldLabel: 'Published:' }));
  expect(renamed.copy).not.toHaveProperty('label');
  expect(renamed.named).not.toHaveProperty('name');
  expect(renamed.typed).toHaveProperty('label', 'Release date');

  // Nothing to change: the same root comes back
  const clean = { ...root, children: [root.children[2]] } as FlexContainerNode;
  expect(followFieldLabels(clean, [published])).toBe(clean);
});
