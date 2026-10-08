import { test, expect } from '@playwright/test';
import { hexAlphaPercent, hexToRgba, normalizeHex, normalizeHexAlpha, withAlphaPercent } from '../lib/color';
import {
  createDefaultFlexLayout,
  defaultChildDirection,
  formatBoxValue,
  normalizeAlign,
  normalizeJustify,
  parseBoxValue,
  parsePxValue,
  resolveDirection,
  resolvePaddingCss,
  type FlexDirection,
} from '../types/layout';
import { toFieldDefinition, toItemRecord, toItemTemplate, toRecord } from '../lib/data/mappers';
import { detectItemCategory, itemMatchesQuery, UNCATEGORIZED_CATEGORY_ID } from '../lib/treeUtils';
import { DEFAULT_TEMPLATE_ICON, type ItemTemplate } from '../types/template';
import type { ItemRecord } from '../types/item';

/* Small pure helpers that the editor, the data layer and the trees all lean on. */

test.describe('colors (lib/color.ts)', () => {
  test('normalizeHex accepts 3 or 6 hex digits, with or without #, and nothing else', () => {
    expect(normalizeHex('abc')).toBe('#AABBCC');
    expect(normalizeHex(' #1a2b3c ')).toBe('#1A2B3C');
    expect(normalizeHex('#abcd')).toBeNull();
    expect(normalizeHex('12345')).toBeNull();
    expect(normalizeHex('#ggg')).toBeNull();
    expect(normalizeHex(0x112233)).toBeNull();
  });

  test('normalizeHexAlpha keeps a real alpha and drops an opaque FF', () => {
    expect(normalizeHexAlpha('#11223380')).toBe('#11223380');
    expect(normalizeHexAlpha('#112233ff')).toBe('#112233');
    expect(normalizeHexAlpha('abcf')).toBe('#AABBCC');
    expect(normalizeHexAlpha('abc8')).toBe('#AABBCC88');
    expect(normalizeHexAlpha('#abc')).toBe('#AABBCC');
    expect(normalizeHexAlpha('#12345')).toBeNull();
  });

  test('alpha percent and hex alpha convert both ways', () => {
    expect(hexAlphaPercent('#112233')).toBe(100);
    expect(hexAlphaPercent('#11223380')).toBe(50);
    expect(withAlphaPercent('#112233', 100)).toBe('#112233');
    expect(withAlphaPercent('#112233', 50)).toBe('#11223380');
    expect(withAlphaPercent('#11223380', 100)).toBe('#112233'); // an existing alpha is replaced
    expect(withAlphaPercent('#112233', 150)).toBe('#112233'); // clamped
    expect(withAlphaPercent('#112233', -5)).toBe('#11223300');
    for (const p of [0, 1, 25, 50, 99, 100]) expect(hexAlphaPercent(withAlphaPercent('#ABCDEF', p))).toBe(p);
  });

  test('hexToRgba', () => {
    expect(hexToRgba('#112233')).toBe('rgba(17, 34, 51, 1)');
    expect(hexToRgba('#11223380')).toBe('rgba(17, 34, 51, 0.5)');
  });
});

test.describe('layout values (types/layout.ts)', () => {
  test('alignment accepts the canonical and the old flex-* spellings', () => {
    expect(normalizeAlign('flex-start')).toBe('start');
    expect(normalizeAlign('flex-end')).toBe('end');
    expect(normalizeAlign('center')).toBe('center');
    expect(normalizeAlign(undefined)).toBe('stretch');
    expect(normalizeAlign('bogus')).toBe('stretch');
    expect(normalizeJustify('between')).toBe('between');
    expect(normalizeJustify('around')).toBe('around');
    expect(normalizeJustify('flex-end')).toBe('end');
    expect(normalizeJustify(null)).toBe('start');
    expect(normalizeJustify('stretch')).toBe('start');
  });

  test('parsePxValue reads plain px lengths only', () => {
    expect(parsePxValue('16px')).toBe(16);
    expect(parsePxValue(' 1.5PX ')).toBe(1.5);
    expect(parsePxValue('16')).toBe(16);
    expect(parsePxValue(12)).toBe(12);
    expect(parsePxValue('10%')).toBeNull();
    expect(parsePxValue('calc(10px + 2px)')).toBeNull();
    expect(parsePxValue('')).toBeNull();
    expect(parsePxValue(null)).toBeNull();
  });

  test('resolvePaddingCss renders blank, legacy numbers and lengths', () => {
    expect(resolvePaddingCss(undefined)).toBe('0px');
    expect(resolvePaddingCss('')).toBe('0px');
    expect(resolvePaddingCss(8)).toBe('8px');
    expect(resolvePaddingCss('10%')).toBe('10%');
    expect(resolvePaddingCss('8px 16px')).toBe('8px 16px');
  });

  test('parseBoxValue expands 1-4 value shorthands; junk reads as 0px', () => {
    expect(parseBoxValue('16px')).toEqual({ top: '16px', right: '16px', bottom: '16px', left: '16px' });
    expect(parseBoxValue('8px 16px')).toEqual({ top: '8px', right: '16px', bottom: '8px', left: '16px' });
    expect(parseBoxValue('1px 2px 3px')).toEqual({ top: '1px', right: '2px', bottom: '3px', left: '2px' });
    expect(parseBoxValue('1 2 3 4')).toEqual({ top: '1px', right: '2px', bottom: '3px', left: '4px' });
    expect(parseBoxValue(12)).toEqual({ top: '12px', right: '12px', bottom: '12px', left: '12px' });
    expect(parseBoxValue('auto 10%')).toEqual({ top: '0px', right: '10%', bottom: '0px', left: '10%' });
    expect(parseBoxValue('10PX')).toEqual({ top: '10px', right: '10px', bottom: '10px', left: '10px' });
    expect(parseBoxValue(null)).toEqual({ top: '0px', right: '0px', bottom: '0px', left: '0px' });
  });

  test('formatBoxValue gives the shortest shorthand and round-trips', () => {
    for (const v of ['16px', '8px 16px', '1px 2px 3px 4px', '0px 10%']) expect(formatBoxValue(parseBoxValue(v))).toBe(v);
    expect(formatBoxValue(parseBoxValue('1px 2px 3px'))).toBe('1px 2px 3px 2px');
    expect(formatBoxValue(parseBoxValue('5px 5px 5px 5px'))).toBe('5px');
  });

  test('every container is a row or a column; new containers alternate with their parent', () => {
    const root = createDefaultFlexLayout([]).root;
    const withDirection = (direction: FlexDirection) => ({ ...root, direction });
    expect(resolveDirection(withDirection('row'))).toBe('row');
    expect(resolveDirection(withDirection('none'))).toBe('row');
    expect(resolveDirection(withDirection('none'), true)).toBe('column');
    expect(defaultChildDirection(withDirection('column'))).toBe('row');
    expect(defaultChildDirection(withDirection('row'))).toBe('column');
    expect(defaultChildDirection(withDirection('none'), true)).toBe('row'); // the Body stacks vertically
    expect(defaultChildDirection(withDirection('none'))).toBe('column');
  });
});

test.describe('row mappers (lib/data/mappers.ts)', () => {
  const itemRow = {
    id: 1, template_id: null, parent_id: null, name: 'One', attributes: null, sys_active: null, sys_created_by: null,
    sys_updated_by: null, sys_created_at: null, sys_updated_at: null, created_at: null,
  };
  const fieldRow = {
    id: 5, template_id: 2, name: 'grade', label: 'Grade', field_type: 'select', options: null, is_required: false,
    display_order: 0, sys_created_at: null, sys_updated_at: null,
  };
  const templateRow = {
    id: 2, user_id: null, name: 'Comics', description: null, icon: null, is_system_preset: false, sys_created_at: null,
    sys_updated_at: null, layout_config: null,
  };

  test('JSON columns that are not plain objects read as empty attributes', () => {
    expect(toRecord(null)).toEqual({});
    expect(toRecord([1, 2])).toEqual({});
    expect(toRecord('text')).toEqual({});
    expect(toRecord({ a: 1 })).toEqual({ a: 1 });
    expect(toItemRecord({ ...itemRow, attributes: [1] }).attributes).toEqual({});
    expect(toItemRecord(itemRow).created_at).toBeUndefined();
  });

  test('a field row gets a known type and only string options', () => {
    expect(toFieldDefinition(fieldRow).field_type).toBe('select');
    expect(toFieldDefinition({ ...fieldRow, field_type: 'hologram' }).field_type).toBe('text');
    expect(toFieldDefinition({ ...fieldRow, options: ['A', 1, 'B', null] }).options).toEqual(['A', 'B']);
    expect(toFieldDefinition({ ...fieldRow, options: { a: 1 } }).options).toBeNull();
  });

  test('a template row gets the default icon and carries fields only when given', () => {
    const template = toItemTemplate(templateRow);
    expect(template.icon).toBe(DEFAULT_TEMPLATE_ICON);
    expect(template.layout_config).toBeNull();
    expect('fields' in template).toBe(false);
    expect(toItemTemplate({ ...templateRow, icon: '📚' }, []).fields).toEqual([]);
    expect(toItemTemplate({ ...templateRow, icon: '📚' }).icon).toBe('📚');
  });
});

test.describe('tree categories and search (lib/treeUtils.ts)', () => {
  const item = (over: Partial<ItemRecord> = {}): ItemRecord => ({ id: 1, name: 'Amazing Fantasy #15', parent_id: null, attributes: {}, ...over });
  const comics: ItemTemplate = { id: 7, name: 'Comics', description: null, icon: '📚', is_system_preset: false };

  test('an item is grouped under its template, whatever its id', () => {
    expect(detectItemCategory(item({ template_id: 7 }), [comics])).toEqual({ id: -7, name: 'Comics', icon: '📚' });
    // templates not loaded yet: a generic name, never a guess from hard-coded ids
    expect(detectItemCategory(item({ template_id: 2 }), [])).toEqual({ id: -2, name: 'Category #2', icon: DEFAULT_TEMPLATE_ICON });
    expect(detectItemCategory(item({ template_id: 999 }), [{ ...comics, id: 999 }]).id).toBe(-999);
    expect(detectItemCategory(item(), [comics]).id).toBe(UNCATEGORIZED_CATEGORY_ID);
  });

  test('item search matches the name and attribute values, ignoring case', () => {
    const it = item({ attributes: { publisher: 'Marvel', grade: 9.8 } });
    expect(itemMatchesQuery(it, '')).toBe(true);
    expect(itemMatchesQuery(it, 'amazing')).toBe(true);
    expect(itemMatchesQuery(it, 'MARVEL')).toBe(true);
    expect(itemMatchesQuery(it, '9.8')).toBe(true);
    expect(itemMatchesQuery(it, 'dc comics')).toBe(false);
  });
});

test('a typed template icon keeps only its first visible character (lib/templateIcons.ts)', async () => {
  const { firstGrapheme } = await import('../lib/templateIcons');
  expect(firstGrapheme('🦖 dinosaurs')).toBe('🦖');
  expect(firstGrapheme('  🖼️')).toBe('🖼️'); // emoji + variation selector stays whole
  expect(firstGrapheme('👨‍👩‍👧 family')).toBe('👨‍👩‍👧'); // a joined emoji is one character
  expect(firstGrapheme('Abc')).toBe('A');
  expect(firstGrapheme('   ')).toBeNull();
});
