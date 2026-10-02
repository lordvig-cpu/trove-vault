import { test, expect } from '@playwright/test';
import { RECIPES, buildRecipe, type RecipeId } from '../lib/layoutRecipes';
import { layoutCacheKey, resolveSavedLayout } from '../lib/layoutStorage';
import { bindingOf } from '../lib/layoutContent';
import { collectLabels } from '../lib/layoutTree';
import {
  createDefaultFlexLayout,
  isFlexLayoutConfig,
  type FlexComponentNode,
  type FlexContainerNode,
} from '../types/layout';
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
const fields = [field(1, 'Designer', 'text'), field(2, 'Players', 'number'), field(3, 'Owned', 'boolean')];

const allContainers = (node: FlexContainerNode): FlexContainerNode[] =>
  node.children.flatMap((c) => (c.nodeType === 'container' ? [c, ...allContainers(c)] : []));
const allComponents = (node: FlexContainerNode): FlexComponentNode[] =>
  node.children.flatMap((c) => (c.nodeType === 'container' ? allComponents(c) : [c]));
const boundFieldIds = (node: FlexContainerNode) =>
  allComponents(node).flatMap((c) => {
    const b = bindingOf(c);
    return b?.kind === 'field' ? [b.field_id] : [];
  });

test.describe('Simple template recipes (pure)', () => {
  test('every recipe builds a current layout whose Body is the usual column root', () => {
    for (const { id } of RECIPES) {
      const layout = buildRecipe(id, fields);
      expect(isFlexLayoutConfig(layout)).toBe(true);
      expect(layout.root).toMatchObject({ id: 'root-container', direction: 'column' });
      expect(layout.root.children.length).toBeGreaterThan(0);
    }
  });

  test('container names are unique within a built layout', () => {
    for (const { id } of RECIPES) {
      const root = buildRecipe(id, fields).root;
      const labels = [root, ...allContainers(root)].map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
      expect(collectLabels(root).size).toBe(new Set(labels).size);
    }
  });

  test('classic: header card, a details card with every field, and a sub-items card', () => {
    const root = buildRecipe('classic', fields).root;
    expect((root.children as FlexContainerNode[]).map((c) => c.label)).toEqual(['Header Card', 'Details', 'Sub-items']);
    expect(boundFieldIds(root).sort()).toEqual([1, 2, 3]);
    const kinds = allComponents(root).map((c) => bindingOf(c)).filter((b) => b?.kind === 'builtin');
    expect(kinds).toEqual(expect.arrayContaining([
      { kind: 'builtin', key: 'image' },
      { kind: 'builtin', key: 'name' },
      { kind: 'builtin', key: 'subitems' },
    ]));
  });

  test('spec sheet: number fields become a stat row, the rest go in the specifications card', () => {
    const root = buildRecipe('specSheet', fields).root;
    const names = (root.children as FlexContainerNode[]).map((c) => c.label);
    expect(names).toEqual(['Title Card', 'Stat Row', 'Specifications']);
    const stats = root.children.find((c) => c.nodeType === 'container' && c.label === 'Stat Row') as FlexContainerNode;
    expect(boundFieldIds(stats)).toEqual([2]);
    const specs = root.children.find((c) => c.nodeType === 'container' && c.label === 'Specifications') as FlexContainerNode;
    expect(boundFieldIds(specs).sort()).toEqual([1, 3]);
  });

  test('gallery: one card holding a fixed-width poster beside the name and an inline details list', () => {
    const root = buildRecipe('gallery', fields).root;
    expect((root.children as FlexContainerNode[]).map((c) => c.label)).toEqual(['Gallery']);
    const row = (root.children[0] as FlexContainerNode).children[0] as FlexContainerNode;
    expect(row).toMatchObject({ label: 'Gallery Row', direction: 'row' });
    const [poster, details] = row.children as FlexContainerNode[];
    expect(poster).toMatchObject({ label: 'Poster', sizing: { type: 'fixed', value: '320px' } });
    expect((poster.children[0] as FlexComponentNode).display).toEqual({ style: 'image-cover', aspectRatio: '3 / 4' });
    expect(details).toMatchObject({ label: 'Poster Details', sizing: { type: 'fill' } });
    expect(boundFieldIds(details).sort()).toEqual([1, 2, 3]);
  });

  test('recipes adapt to the template: no number fields means no stat row, no fields means no details card', () => {
    const textOnly = [field(1, 'Designer', 'text')];
    expect((buildRecipe('specSheet', textOnly).root.children as FlexContainerNode[]).map((c) => c.label)).toEqual([
      'Title Card',
      'Specifications',
    ]);
    const none = buildRecipe('classic', []).root;
    expect((none.children as FlexContainerNode[]).map((c) => c.label)).toEqual(['Header Card', 'Sub-items']);
    expect(() => (['classic', 'specSheet', 'gallery'] as RecipeId[]).forEach((id) => buildRecipe(id, []))).not.toThrow();
  });
});

test.describe('Saved layout resolution (pure)', () => {
  const a = createDefaultFlexLayout([{ id: 1, label: 'A' }]);
  const b = createDefaultFlexLayout([{ id: 2, label: 'B' }]);

  test('the browser copy wins, then the stored copy, then nothing', () => {
    expect(resolveSavedLayout(a, b)).toBe(a);
    expect(resolveSavedLayout(null, b)).toBe(b);
    expect(resolveSavedLayout(null, null)).toBeNull();
  });

  test('an invalid or old-format copy is skipped, not used', () => {
    expect(resolveSavedLayout({ version: 1, root: {} }, b)).toBe(b);
    expect(resolveSavedLayout('garbage', undefined)).toBeNull();
    expect(resolveSavedLayout({ version: 2 }, b)).toBe(b);
  });

  test('the cache key is per template', () => {
    expect(layoutCacheKey(7)).toBe('trovevault_template_layout_7');
  });
});
