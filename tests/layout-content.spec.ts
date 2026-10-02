import { test, expect } from '@playwright/test';
import {
  TEXT_PRESETS,
  applyTextPreset,
  buildBuiltinComponent,
  bindingPatch,
  mergeTextStyle,
  bindingOf,
  boxLookCss,
  dataKindOf,
  defaultTextStyleFor,
  displayStylesFor,
  effectiveDisplayStyle,
  effectiveTextStyle,
  formatDate,
  isLabelShown,
  labelTextOf,
  resolveValue,
  textStyleCss,
} from '../lib/layoutContent';
import type { FieldDefinition } from '../types/field';
import type { ItemRecord } from '../types/item';
import type { FlexComponentNode } from '../types/layout';

const field = (
  id: number,
  name: string,
  field_type: FieldDefinition['field_type'],
  options: string[] | null = null
): FieldDefinition => ({
  id,
  name,
  label: name.toUpperCase(),
  field_type,
  options,
  is_required: false,
  display_order: id,
});
const fields = [
  field(1, 'title', 'text'),
  field(2, 'players', 'number'),
  field(3, 'owned', 'boolean'),
  field(4, 'rating', 'select', ['Mint', 'Good']),
  field(5, 'released', 'date'),
];
const comp = (extra: Partial<FlexComponentNode>): FlexComponentNode => ({
  id: 'c',
  nodeType: 'component',
  componentType: 'field',
  ...extra,
});
const item: ItemRecord = {
  id: 9,
  parent_id: null,
  name: 'Catan',
  image_url: 'x.png',
  created_at: '2025-03-04T10:00:00Z',
  collection_ids: [1, 2],
  children: [{ id: 10, parent_id: 9, name: 'Cities', attributes: {} }],
  attributes: { title: 'Settlers', players: '4', owned: true, rating: 'Mint', released: '1995-01-01' },
};

test.describe('Content elements (pure)', () => {
  test('bindingOf derives a binding from legacy field_id / note text, and null for placeholders', () => {
    expect(bindingOf(comp({ binding: { kind: 'builtin', key: 'name' } }))).toEqual({ kind: 'builtin', key: 'name' });
    expect(bindingOf(comp({ field_id: 3 }))).toEqual({ kind: 'field', field_id: 3 });
    expect(bindingOf(comp({ componentType: 'note', custom_props: { text: 'Hi' } }))).toEqual({ kind: 'static', text: 'Hi' });
    expect(bindingOf(comp({ componentType: 'table' }))).toBeNull();
    expect(bindingOf(comp({ componentType: 'field', field_id: null }))).toBeNull();
  });

  test('dataKindOf and displayStylesFor follow the data type, default first', () => {
    expect(dataKindOf({ kind: 'field', field_id: 3 }, fields)).toBe('boolean');
    expect(displayStylesFor({ kind: 'field', field_id: 3 }, fields)).toEqual(['checkbox', 'toggle', 'pill', 'yesno']);
    expect(displayStylesFor({ kind: 'field', field_id: 2 }, fields)[0]).toBe('number');
    expect(displayStylesFor({ kind: 'builtin', key: 'image' }, fields)).toEqual(['image-cover', 'image-contain']);
    expect(displayStylesFor({ kind: 'builtin', key: 'collections' }, fields)[0]).toBe('chips');
    expect(displayStylesFor({ kind: 'builtin', key: 'subitems' }, fields)[0]).toBe('list');
    // A deleted field reads as plain text.
    expect(dataKindOf({ kind: 'field', field_id: 99 }, fields)).toBe('text');
  });

  test('effectiveDisplayStyle keeps a valid choice and falls back to the default for an invalid one', () => {
    const binding = { kind: 'field' as const, field_id: 3 };
    expect(effectiveDisplayStyle(comp({ display: { style: 'toggle' } }), binding, fields)).toBe('toggle');
    expect(effectiveDisplayStyle(comp({ display: { style: 'stat' } }), binding, fields)).toBe('checkbox');
    expect(effectiveDisplayStyle(comp({}), binding, fields)).toBe('checkbox');
  });

  test('resolveValue reads built-ins and fields from the item, coercing by field type', () => {
    const data = { item, collectionNames: { 1: 'Board Games', 2: 'Favorites' } };
    expect(resolveValue({ kind: 'builtin', key: 'name' }, data, fields)).toEqual({ kind: 'text', value: 'Catan' });
    expect(resolveValue({ kind: 'builtin', key: 'image' }, data, fields)).toEqual({ kind: 'image', value: 'x.png' });
    expect(resolveValue({ kind: 'builtin', key: 'collections' }, data, fields)).toEqual({
      kind: 'list',
      value: ['Board Games', 'Favorites'],
    });
    expect(resolveValue({ kind: 'builtin', key: 'subitems' }, data, fields)).toEqual({ kind: 'list', value: ['Cities'] });
    expect(resolveValue({ kind: 'field', field_id: 2 }, data, fields)).toEqual({ kind: 'number', value: 4 });
    expect(resolveValue({ kind: 'field', field_id: 3 }, data, fields)).toEqual({ kind: 'boolean', value: true });
    expect(resolveValue({ kind: 'field', field_id: 4 }, data, fields)).toEqual({ kind: 'text', value: 'Mint' });
    expect(resolveValue({ kind: 'static', text: 'Hello' }, data, fields)).toEqual({ kind: 'text', value: 'Hello' });
    // An item with no value for a field gives an empty value, not a sample.
    expect(resolveValue({ kind: 'field', field_id: 1 }, { item: { ...item, attributes: {} } }, fields)).toEqual({
      kind: 'text',
      value: '',
    });
  });

  test('resolveValue gives sample values when there is no item', () => {
    expect(resolveValue({ kind: 'builtin', key: 'name' }, {}, fields)).toEqual({ kind: 'text', value: 'Item Name' });
    expect(resolveValue({ kind: 'field', field_id: 4 }, {}, fields)).toEqual({ kind: 'text', value: 'Mint' });
    expect(resolveValue({ kind: 'field', field_id: 3 }, {}, fields)).toEqual({ kind: 'boolean', value: true });
    expect(resolveValue({ kind: 'builtin', key: 'collections' }, {}, fields).kind).toBe('list');
  });

  test('formatDate formats calendar dates without shifting the day', () => {
    expect(formatDate('2025-06-15', 'date-iso')).toBe('2025-06-15');
    expect(formatDate('2025-06-15', 'date-short')).toBe('Jun 15, 2025');
    expect(formatDate('2025-06-15', 'date-long')).toBe('June 15, 2025');
    expect(formatDate('nonsense', 'date-short')).toBe('nonsense');
  });

  test('labels: shown for fields by default, hidden for built-ins, text falls back through field/built-in', () => {
    const byField = comp({ field_id: 2 });
    const byName = comp({ binding: { kind: 'builtin', key: 'name' } });
    expect(isLabelShown(byField, bindingOf(byField))).toBe(true);
    expect(isLabelShown(byName, bindingOf(byName))).toBe(false);
    expect(isLabelShown({ ...byName, contentLabel: { show: true, position: 'left' } }, bindingOf(byName))).toBe(true);
    expect(labelTextOf(byField, bindingOf(byField), fields)).toBe('PLAYERS');
    expect(labelTextOf({ ...byField, label: 'Seats' }, bindingOf(byField), fields)).toBe('Seats');
    expect(labelTextOf(byName, bindingOf(byName), fields)).toBe('Name');
  });

  test('text style: Name defaults to the title preset, overrides win, unset color is left to the theme', () => {
    expect(defaultTextStyleFor({ kind: 'builtin', key: 'name' })).toEqual(TEXT_PRESETS.title);
    expect(defaultTextStyleFor({ kind: 'field', field_id: 1 })).toEqual(TEXT_PRESETS.body);
    const styled = comp({ binding: { kind: 'builtin', key: 'name' }, textStyle: { fontSize: 40, color: '#FF0000' } });
    const css = textStyleCss(effectiveTextStyle(styled, bindingOf(styled)));
    expect(css.fontSize).toBe('40px');
    expect(css.fontWeight).toBe(800);
    expect(css.color).toBe('#FF0000');
    expect(textStyleCss(TEXT_PRESETS.body).color).toBeUndefined();
    expect(textStyleCss({ transform: 'uppercase', italic: true, underline: true, letterSpacing: 2 })).toMatchObject({
      textTransform: 'uppercase',
      fontStyle: 'italic',
      textDecoration: 'underline',
      letterSpacing: '2px',
    });
  });

  test('boxLookCss draws only what is set, with a neutral border fallback and a soft shadow', () => {
    expect(boxLookCss({})).toEqual({});
    const css = boxLookCss({ background: '#112233', borderWidth: 2, borderRadius: 6, shadowY: 4, shadowBlur: 8 });
    expect(css.backgroundColor).toBe('#112233');
    expect(css.border).toBe('2px solid var(--primary-border-subtle)');
    expect(css.borderRadius).toBe('6px');
    expect(String(css.boxShadow)).toContain('0 4px 8px');
  });

  test('bindingPatch rebinds a component and resets its label and display, keeping its look', () => {
    expect(bindingPatch({ kind: 'builtin', key: 'name' })).toEqual({
      binding: { kind: 'builtin', key: 'name' }, componentType: 'field', field_id: null, label: undefined, display: undefined,
    });
    expect(bindingPatch({ kind: 'field', field_id: 3 })).toMatchObject({ componentType: 'field', field_id: 3 });
    expect(bindingPatch({ kind: 'static', text: 'Hi' })).toMatchObject({ componentType: 'note', field_id: null });
    expect('textStyle' in bindingPatch({ kind: 'field', field_id: 3 })).toBe(false);
  });

  test('applyTextPreset replaces size/weight/spacing but keeps color, alignment and emphasis', () => {
    const current = { fontSize: 99, color: '#FF0000', align: 'center' as const, italic: true, transform: 'uppercase' as const, letterSpacing: 3 };
    const next = applyTextPreset(current, 'body');
    expect(next).toMatchObject({ fontSize: 14, fontWeight: 400, lineHeight: 1.5, color: '#FF0000', align: 'center', italic: true });
    expect(next.transform).toBeUndefined();
    expect(next.letterSpacing).toBeUndefined();
    expect(applyTextPreset(undefined, 'label')).toMatchObject({ fontSize: 11, transform: 'uppercase' });
  });

  test('mergeTextStyle drops unset keys and returns undefined when nothing is left', () => {
    expect(mergeTextStyle({ fontSize: 12, color: '#000000' }, { fontSize: 20 })).toEqual({ fontSize: 20, color: '#000000' });
    expect(mergeTextStyle({ fontSize: 12 }, { fontSize: undefined })).toBeUndefined();
    expect(mergeTextStyle(undefined, { italic: true })).toEqual({ italic: true });
  });

  test('buildBuiltinComponent binds the built-in; Name and Image are bare, the others show a label', () => {
    expect(buildBuiltinComponent('name')).toEqual({ componentType: 'field', binding: { kind: 'builtin', key: 'name' } });
    expect(buildBuiltinComponent('image').contentLabel).toBeUndefined();
    for (const key of ['collections', 'created', 'subitems'] as const) {
      expect(buildBuiltinComponent(key)).toMatchObject({
        binding: { kind: 'builtin', key },
        contentLabel: { show: true, position: 'above' },
      });
    }
    // Every built-in is real: it resolves to a value with a sample, never throws.
    for (const key of ['name', 'image', 'collections', 'created', 'subitems'] as const) {
      expect(resolveValue({ kind: 'builtin', key }, {}, fields)).toBeDefined();
    }
  });
});
