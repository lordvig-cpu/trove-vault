import { test, expect } from '@playwright/test';
import {
  buildContainer,
  buildUniqueContainer,
  insertChild,
  nextNumberedLabel,
  insertSibling,
  removeNode,
  resolveContentTarget,
  splitContainer,
  uniqueLabel,
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
      padding: '0px',
      isCard: false,
      sizing: { type: 'fill' },
      children: [],
    });
    expect(plain.id).toMatch(/^cont-\d+-/);

    const custom = buildContainer({ label: 'Mine', direction: 'column', gap: 8, wrap: false, isCard: true }, 'x', 'row');
    expect(custom).toMatchObject({ label: 'Mine', direction: 'column', gap: 8, wrap: false, isCard: true });
  });

  test('uniqueLabel leaves a free label alone, and only numbers it once taken', () => {
    expect(uniqueLabel('New Container', new Set())).toBe('New Container');
    expect(uniqueLabel('New Container', new Set(['New Container']))).toBe('New Container 2');
    expect(uniqueLabel('New Container', new Set(['New Container', 'New Container 2']))).toBe('New Container 3');
  });

  test('buildUniqueContainer dedupes repeated "Add" clicks (same literal default label each time)', () => {
    let root = freshRoot();
    const add = () => {
      const c = buildUniqueContainer(root, { label: 'New Container' }, 'New Container', 'row');
      root = insertChild(root, 'container-general', c);
      return c;
    };

    const first = add();
    const second = add();
    const third = add();
    expect([first.label, second.label, third.label]).toEqual(['New Container', 'New Container 2', 'New Container 3']);

    // An intentional, already-unique label passes through untouched.
    const named = buildUniqueContainer(root, { label: 'Sidebar' }, 'New Container', 'row');
    expect(named.label).toBe('Sidebar');
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

    // 400px measured width -> two 200px-wide halves, in place (the parent is already a row).
    const result = splitContainer(root, box.id, 'columns', 400);
    expect(result).not.toBeNull();
    const parent = general(result!.root);
    const [first, second] = parent.children.slice(2) as FlexContainerNode[];

    expect(first.id).toBe(box.id);
    expect(second.id).toBe(result!.newId);
    expect([first.label, second.label]).toEqual(['Box', 'Box 2']); // the source keeps its name
    expect(first.sizing).toMatchObject({ type: 'fixed', value: '200px' });
    expect(second.sizing).toMatchObject({ type: 'fixed', value: '200px' });
    expect(first.height).toBeUndefined(); // only the split axis (width) changes
    expect(second.direction).toBe('column'); // alternates with its real (in-place) parent, a row
  });

  test('splitContainer: rows inside a row parent are wrapped so the parent is undisturbed', () => {
    const box = buildContainer({ label: 'Box' }, 'x', 'column');
    const root = insertChild(freshRoot(), 'container-general', box);

    // 300px measured height -> two 150px-tall halves, wrapped (the parent is a row, not a column).
    const result = splitContainer(root, box.id, 'rows', 300)!;
    const parent = general(result.root);
    expect(parent.children).toHaveLength(3); // comp-1, comp-2, and one wrapper in place of the box

    const wrapper = parent.children[2] as FlexContainerNode;
    expect(wrapper.label).toBe('Box Split');
    expect(wrapper.direction).toBe('column');
    expect(wrapper.isSplitWrapper).toBe(true); // structural: never a direct content-placement target
    expect(wrapper.children.map((c) => c.id)).toEqual([box.id, result.newId]);
    expect(parent.direction).toBe('row');

    const [first, second] = wrapper.children as FlexContainerNode[];
    expect(first.height).toBe('150px');
    expect(second.height).toBe('150px');
    expect(first.sizing.type).toBe('fill'); // only the split axis (height) changes; width stays Auto
    expect(second.sizing.type).toBe('fill');
    // Both halves' own direction alternates with their actual parent (the wrapper, direction
    // 'column'): the new half always does, and so does the source here too, since it's empty (an
    // empty box has nothing of its own that alternating its direction could disturb).
    expect(first.direction).toBe('row');
    expect(second.direction).toBe('row');
  });

  test('splitContainer: an empty source alternates direction too; a non-empty one keeps its own', () => {
    // The exact scenario that surfaced the bug: a Row container split into columns, wrapped
    // because its parent (the root) is a column. The new half previously copied the source's own
    // direction ('row') instead of alternating with the wrapper it actually landed in -- and the
    // source itself always kept 'row', even when (as here) splitting it left nothing to disturb.
    const emptyBox = buildContainer({ label: 'Box' }, 'x', 'row');
    const emptyRoot = insertChild(freshRoot(), 'root-container', emptyBox);

    const emptyResult = splitContainer(emptyRoot, emptyBox.id, 'columns', 400)!;
    const emptyWrapper = emptyResult.root.children[1] as FlexContainerNode; // after container-general
    expect(emptyWrapper.isSplitWrapper).toBe(true);
    expect(emptyWrapper.direction).toBe('row'); // columns split -> row wrapper
    const [emptyFirst, emptySecond] = emptyWrapper.children as FlexContainerNode[];
    expect(emptyFirst.id).toBe(emptyBox.id);
    expect(emptyFirst.direction).toBe('column'); // empty -> alternates with its real (wrapper) parent
    expect(emptySecond.direction).toBe('column');

    // Same setup, but the source already has a child of its own: its direction must survive the
    // split untouched, or that child's arrangement would silently flip too.
    const child = buildContainer({ label: 'Child' }, 'x', 'row');
    const fullBox = buildContainer({ label: 'Box', children: [child] }, 'x', 'row');
    const fullRoot = insertChild(freshRoot(), 'root-container', fullBox);

    const fullResult = splitContainer(fullRoot, fullBox.id, 'columns', 400)!;
    const fullWrapper = fullResult.root.children[1] as FlexContainerNode;
    const [fullFirst] = fullWrapper.children as FlexContainerNode[];
    expect(fullFirst.direction).toBe('row'); // non-empty -> unchanged
    expect(fullFirst.children.map((c) => c.id)).toEqual([child.id]); // its child is undisturbed
  });

  test('splitContainer: rows inside a column parent split in place, halving the measured height', () => {
    const box = buildContainer({ label: 'Box' }, 'x', 'row');
    const root = insertChild(freshRoot(), 'root-container', box);

    // The bug this guards against: an Auto-height container has no stored height to derive a half
    // from, so splitting rows must measure the real rendered box instead of falling back to a
    // full-size guess.
    const result = splitContainer(root, box.id, 'rows', 300)!;
    const [, first, second] = result.root.children as FlexContainerNode[]; // after container-general

    expect(first.id).toBe(box.id);
    expect(second.id).toBe(result.newId);
    expect(first.height).toBe('150px');
    expect(second.height).toBe('150px');
    expect(first.sizing.type).toBe('fill'); // width untouched
    expect(second.sizing.type).toBe('fill');
  });

  test('splitContainer: wrapper labels never collide, even across repeated wraps', () => {
    const box = buildContainer({ label: 'Box' }, 'x', 'row');
    const root = insertChild(freshRoot(), 'root-container', box);

    // First split wraps (columns under the column root) -> unnumbered "Box Split".
    const firstResult = splitContainer(root, box.id, 'columns', 400)!;
    const outerWrapper = firstResult.root.children[1] as FlexContainerNode; // after container-general
    expect(outerWrapper.label).toBe('Box Split');

    // Split the original half again, into rows this time -- its new parent (the first wrapper) is
    // a row, so this needs its own wrapper too. Without the fix, that's a second, indistinguishable
    // "Box Split" node right next to the first.
    const secondResult = splitContainer(firstResult.root, box.id, 'rows', 300)!;
    const stillOuterWrapper = secondResult.root.children[1] as FlexContainerNode;
    const innerWrapper = stillOuterWrapper.children[0] as FlexContainerNode;
    expect(stillOuterWrapper.label).toBe('Box Split'); // unaffected by the later, nested split
    expect(innerWrapper.isSplitWrapper).toBe(true);
    expect(innerWrapper.label).toBe('Box Split 2'); // disambiguated instead of colliding
  });

  test('resolveContentTarget redirects a split wrapper to its first half, and leaves everything else alone', () => {
    const box = buildContainer({ label: 'Box' }, 'x', 'row');
    const root = insertChild(freshRoot(), 'root-container', box);
    const result = splitContainer(root, box.id, 'columns', 400)!;
    const wrapper = result.root.children[1] as FlexContainerNode;

    expect(resolveContentTarget(result.root, wrapper.id)).toBe(box.id); // wrapper -> its first half
    expect(resolveContentTarget(result.root, box.id)).toBe(box.id); // an ordinary container -> itself
    expect(resolveContentTarget(result.root, 'no-such-id')).toBe('no-such-id'); // unknown -> unchanged
  });

  test('nextNumberedLabel gives the next free number and never repeats a name', () => {
    expect(nextNumberedLabel('Box', new Set(['Box']))).toBe('Box 2');
    expect(nextNumberedLabel('Box', new Set(['Box', 'Box 2']))).toBe('Box 3');
    expect(nextNumberedLabel('Column 1', new Set(['Column 1']))).toBe('Column 2');
    expect(nextNumberedLabel('Room 101', new Set(['Room 101']))).toBe('Room 102');
    expect(nextNumberedLabel('Column 1', new Set(['Column 1', 'Column 2', 'Column 3']))).toBe('Column 4');
  });

  test('splitting again never accumulates suffixes or repeats a name', () => {
    const box = buildContainer({ label: 'Box' }, 'x', 'column');
    let root = insertChild(freshRoot(), 'container-general', box);

    const first = splitContainer(root, box.id, 'columns', 400)!; // Box | Box 2
    root = first.root;
    const second = splitContainer(root, box.id, 'columns', 400)!; // split the source again: Box | Box 3 | Box 2
    root = second.root;
    const third = splitContainer(root, first.newId, 'columns', 400)!; // split the new half: Box 2 | Box 4
    root = third.root;

    const labels = (general(root).children.slice(2) as FlexContainerNode[]).map((c) => c.label);
    expect(labels).toEqual(['Box', 'Box 3', 'Box 2', 'Box 4']);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.every((label) => !/[()]/.test(label ?? ''))).toBe(true); // no "(1 / 2)" style suffixes
  });

  test('splitContainer refuses the root and unknown containers', () => {
    const root = freshRoot();
    expect(splitContainer(root, 'root-container', 'columns', 400)).toBeNull();
    expect(splitContainer(root, 'no-such-id', 'columns', 400)).toBeNull();
    expect(splitContainer(root, 'comp-1', 'columns', 400)).toBeNull(); // a component is not a container
  });
});
