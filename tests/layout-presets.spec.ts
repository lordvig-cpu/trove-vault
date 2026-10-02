import { test, expect } from '@playwright/test';
import { buildPreset, defaultEntries, entryLabel, type PresetEntry } from '../lib/layoutPresets';
import { bindingOf } from '../lib/layoutContent';
import { collectLabels, insertChild } from '../lib/layoutTree';
import { createDefaultFlexLayout, type FlexComponentNode, type FlexContainerNode } from '../types/layout';
import type { FieldDefinition } from '../types/field';

const field = (id: number, label: string, field_type: FieldDefinition['field_type']): FieldDefinition => ({
  id,
  name: label.toLowerCase(),
  label,
  field_type,
  options: null,
  is_required: false,
  display_order: id,
});
const fields = [field(1, 'Designer', 'text'), field(2, 'Players', 'number'), field(3, 'Owned', 'boolean'), field(4, 'Playtime', 'number')];
const freshRoot = (): FlexContainerNode => createDefaultFlexLayout(fields).root;
const entry = (id: number): PresetEntry => ({ kind: 'field', field_id: id });
const containers = (node: FlexContainerNode): FlexContainerNode[] =>
  node.children.flatMap((c) => (c.nodeType === 'container' ? [c, ...containers(c)] : []));
const components = (node: FlexContainerNode): FlexComponentNode[] =>
  node.children.flatMap((c) => (c.nodeType === 'container' ? components(c) : [c]));

test.describe('Pre-defined content builders (pure)', () => {
  test('defaultEntries: a header gets the usual three built-ins, a stat row the number fields, a list every field', () => {
    expect(defaultEntries('header', fields)).toEqual([
      { kind: 'builtin', key: 'image' },
      { kind: 'builtin', key: 'name' },
      { kind: 'builtin', key: 'collections' },
    ]);
    expect(defaultEntries('statRow', fields)).toEqual([entry(2), entry(4)]);
    expect(defaultEntries('fieldList', fields)).toHaveLength(4);
  });

  test('field list (split): a column of rows, each a caption on the left and the bound value on the right', () => {
    const list = buildPreset(freshRoot(), { kind: 'fieldList', entries: [entry(1), entry(2)] }, fields);
    expect(list).toMatchObject({ nodeType: 'container', label: 'Field List', direction: 'column' });
    expect(list.children).toHaveLength(2);

    const row = list.children[0] as FlexContainerNode;
    expect(row).toMatchObject({ nodeType: 'container', label: 'Designer', direction: 'row', justify: 'between' });
    const [left, right] = row.children as FlexComponentNode[];
    expect(bindingOf(left)).toEqual({ kind: 'static', text: 'Designer' });
    expect(bindingOf(right)).toEqual({ kind: 'field', field_id: 1 });
    expect(right.contentLabel).toEqual({ show: false, position: 'above' });
    expect(right.textStyle?.align).toBe('right');
  });

  test('field list (inline): one bound element per entry with its label beside it, no extra containers', () => {
    const list = buildPreset(freshRoot(), { kind: 'fieldList', entries: [entry(1), { kind: 'builtin', key: 'name' }], style: 'inline' }, fields);
    expect(containers(list)).toHaveLength(0);
    const [first, second] = list.children as FlexComponentNode[];
    expect(first.contentLabel).toEqual({ show: true, position: 'left' });
    expect(bindingOf(second)).toEqual({ kind: 'builtin', key: 'name' });
  });

  test('header: a fixed-width picture container beside a fill-width text container', () => {
    const header = buildPreset(freshRoot(), { kind: 'header', entries: defaultEntries('header', fields) }, fields);
    expect(header).toMatchObject({ label: 'Header', direction: 'row' });
    const [pictureBox, textBox] = header.children as FlexContainerNode[];
    expect(pictureBox).toMatchObject({ label: 'Header Image', sizing: { type: 'fixed', value: '160px' } });
    const picture = pictureBox.children[0] as FlexComponentNode;
    expect(bindingOf(picture)).toEqual({ kind: 'builtin', key: 'image' });
    expect(picture.display).toEqual({ style: 'image-cover', aspectRatio: '1 / 1' });
    expect(textBox).toMatchObject({ label: 'Header Text', sizing: { type: 'fill' } });
    expect((textBox.children as FlexComponentNode[]).map((c) => bindingOf(c))).toEqual([
      { kind: 'builtin', key: 'name' },
      { kind: 'builtin', key: 'collections' },
    ]);
  });

  test('header without an image has no picture container', () => {
    const header = buildPreset(freshRoot(), { kind: 'header', entries: [{ kind: 'builtin', key: 'name' }] }, fields);
    expect((header.children as FlexContainerNode[]).map((c) => c.label)).toEqual(['Header Text']);
  });

  test('stat row: one card per entry, the number shown as a big stat with its label above', () => {
    const row = buildPreset(freshRoot(), { kind: 'statRow', entries: [entry(2), entry(4)] }, fields);
    expect(row).toMatchObject({ label: 'Stat Row', direction: 'row', wrap: true });
    expect((row.children as FlexContainerNode[]).map((c) => c.label)).toEqual(['Players Card', 'Playtime Card']);
    const card = row.children[0] as FlexContainerNode;
    expect(card).toMatchObject({ isCard: true, padding: '12px', sizing: { type: 'fill' } });
    const value = card.children[0] as FlexComponentNode;
    expect(value.display).toEqual({ style: 'stat' });
    expect(value.contentLabel).toEqual({ show: true, position: 'above' });
    expect(value.textStyle).toMatchObject({ fontSize: 28, fontWeight: 800 });
  });

  test('container names are unique within the layout, so a second preset becomes "Field List 2"', () => {
    let root = freshRoot();
    const first = buildPreset(root, { kind: 'fieldList', entries: [entry(1)] }, fields);
    root = insertChild(root, 'container-general', first);
    const second = buildPreset(root, { kind: 'fieldList', entries: [entry(1)] }, fields);
    expect(first.label).toBe('Field List');
    expect(second.label).toBe('Field List 2');
    expect((second.children[0] as FlexContainerNode).label).toBe('Designer 2');
    // Within one preset no two containers repeat a name either.
    const all = containers(buildPreset(freshRoot(), { kind: 'statRow', entries: [entry(2), entry(2)] }, fields)).map((c) => c.label);
    expect(new Set(all).size).toBe(all.length);
    expect(collectLabels(root).has('Field List')).toBe(true);
  });

  test('entries whose field no longer exists are skipped; built-ins always stay', () => {
    const list = buildPreset(freshRoot(), { kind: 'fieldList', entries: [entry(99), entry(1), { kind: 'builtin', key: 'name' }], style: 'inline' }, fields);
    expect(components(list).map((c) => bindingOf(c))).toEqual([
      { kind: 'field', field_id: 1 },
      { kind: 'builtin', key: 'name' },
    ]);
  });

  test('entryLabel names built-ins and fields', () => {
    expect(entryLabel({ kind: 'builtin', key: 'subitems' }, fields)).toBe('Sub-items');
    expect(entryLabel(entry(3), fields)).toBe('Owned');
  });
});
