import { test, expect } from '@playwright/test';
import {
  buildContainer,
  insertChild,
  insertSibling,
  removeNode,
  splitContainer,
  updateComponent,
  updateContainer,
} from '../lib/layoutTree';
import { createDefaultFlexLayout, findFlexNode, FlexContainerNode } from '../types/layout';

// root (column) -> container-general (row, card) -> comp-1, comp-2
const fields = [
  { id: 1, label: 'Alpha' },
  { id: 2, label: 'Beta' },
];
const freshRoot = (): FlexContainerNode => createDefaultFlexLayout(fields).root;
const general = (root: FlexContainerNode) => findFlexNode(root, 'container-general') as FlexContainerNode;
const childIds = (container: FlexContainerNode) => container.children.map((c) => c.id);

test.describe('Layout tree operations (pure)', () => {
  test('buildContainer applies defaults and lets options override them', () => {
    const plain = buildContainer({}, 'Container Box', 'row');
    expect(plain).toMatchObject({
      nodeType: 'container',
      label: 'Container Box',
      direction: 'row',
      gap: 0,
      wrap: true,
      align: 'stretch',
      justify: 'start',
      padding: 0,
      isCard: false,
      sizing: { type: 'fill' },
      children: [],
    });
    expect(plain.id).toMatch(/^cont-\d+-/);

    const custom = buildContainer({ label: 'Mine', direction: 'column', gap: 8, wrap: false, isCard: true }, 'x', 'row');
    expect(custom).toMatchObject({ label: 'Mine', direction: 'column', gap: 8, wrap: false, isCard: true });
  });

  test('insertChild appends to the target container, falls back to the root, and does not mutate', () => {
    const root = freshRoot();
    const box = buildContainer({ label: 'Box' }, 'x', 'row');

    const nested = insertChild(root, 'container-general', box);
    expect(childIds(general(nested))).toEqual(['comp-1', 'comp-2', box.id]);
    expect(childIds(general(root))).toEqual(['comp-1', 'comp-2']); // original untouched

    const fallback = insertChild(root, 'no-such-id', box);
    expect(childIds(fallback)).toEqual(['container-general', box.id]);
  });

  test('insertSibling places a node before or after the target', () => {
    const root = freshRoot();
    const node = buildContainer({ label: 'New' }, 'x', 'row');

    const before = insertSibling(root, 'container-general', 'comp-2', 'before', node);
    expect(childIds(general(before))).toEqual(['comp-1', node.id, 'comp-2']);

    const after = insertSibling(root, 'container-general', 'comp-1', 'after', node);
    expect(childIds(general(after))).toEqual(['comp-1', node.id, 'comp-2']);

    const first = insertSibling(root, 'container-general', 'comp-1', 'before', node);
    expect(childIds(general(first))).toEqual([node.id, 'comp-1', 'comp-2']);

    const missing = insertSibling(root, 'container-general', 'nope', 'after', node);
    expect(childIds(general(missing))).toEqual(['comp-1', 'comp-2']);
  });

  test('updateContainer and updateComponent change only the matching node', () => {
    const root = freshRoot();

    const renamed = updateContainer(root, 'container-general', { label: 'Renamed', gap: 12 });
    expect(general(renamed)).toMatchObject({ label: 'Renamed', gap: 12 });
    expect(childIds(general(renamed))).toEqual(['comp-1', 'comp-2']);
    expect(general(root).label).toBe('General Information');

    const relabeled = updateComponent(root, 'comp-2', { label: 'Changed' });
    expect(findFlexNode(relabeled, 'comp-2')).toMatchObject({ label: 'Changed' });
    expect(findFlexNode(relabeled, 'comp-1')).toMatchObject({ label: 'Alpha' });

    expect(updateContainer(root, 'no-such-id', { label: 'x' })).toEqual(root);
    expect(updateComponent(root, 'no-such-id', { label: 'x' })).toEqual(root);
  });

  test('removeNode removes a component or a whole container, never the root', () => {
    const root = freshRoot();
    const box = buildContainer({ label: 'Box' }, 'x', 'row');
    const withBox = insertChild(root, 'container-general', box);

    expect(childIds(general(removeNode(root, 'comp-1')))).toEqual(['comp-2']);
    expect(childIds(general(removeNode(withBox, box.id)))).toEqual(['comp-1', 'comp-2']);

    const withoutGeneral = removeNode(root, 'container-general');
    expect(withoutGeneral.children).toEqual([]);
    expect(withoutGeneral.id).toBe('root-container');
  });

  test('splitContainer: columns inside a row parent become two side-by-side halves', () => {
    const box = buildContainer({ label: 'Box' }, 'x', 'column');
    const root = insertChild(freshRoot(), 'container-general', box);

    const result = splitContainer(root, box.id, 'columns');
    expect(result).not.toBeNull();
    const parent = general(result!.root);
    const [first, second] = parent.children.slice(2) as FlexContainerNode[];

    expect(first.id).toBe(box.id);
    expect(second.id).toBe(result!.newId);
    expect([first.label, second.label]).toEqual(['Box (1 / 2)', 'Box (2 / 2)']);
    expect(first.sizing).toMatchObject({ type: 'fixed', value: '50%' });
    expect(second.sizing).toMatchObject({ type: 'fixed', value: '50%' });
  });

  test('splitContainer: rows inside a row parent are wrapped so the parent is undisturbed', () => {
    const box = buildContainer({ label: 'Box' }, 'x', 'column');
    const root = insertChild(freshRoot(), 'container-general', box);

    const result = splitContainer(root, box.id, 'rows')!;
    const parent = general(result.root);
    expect(parent.children).toHaveLength(3); // comp-1, comp-2, and one wrapper in place of the box

    const wrapper = parent.children[2] as FlexContainerNode;
    expect(wrapper.label).toBe('Box Split');
    expect(wrapper.direction).toBe('column');
    expect(wrapper.children.map((c) => c.id)).toEqual([box.id, result.newId]);
    expect(parent.direction).toBe('row');
  });

  test('splitContainer refuses the root and unknown containers', () => {
    const root = freshRoot();
    expect(splitContainer(root, 'root-container', 'columns')).toBeNull();
    expect(splitContainer(root, 'no-such-id', 'columns')).toBeNull();
    expect(splitContainer(root, 'comp-1', 'columns')).toBeNull(); // a component is not a container
  });
});
