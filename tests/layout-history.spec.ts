import { test, expect } from '@playwright/test';
import { COALESCE_WINDOW_MS, MAX_HISTORY, emptyHistory, recordEdit, redo, undo } from '../lib/layoutHistory';
import { insertChild, buildContainer, updateContainer } from '../lib/layoutTree';
import { createDefaultFlexLayout, FlexGap, TemplateFlexLayoutConfig } from '../types/layout';

const base = (): TemplateFlexLayoutConfig => createDefaultFlexLayout([{ id: 1, label: 'Alpha' }]);
const withGap = (layout: TemplateFlexLayoutConfig, gap: FlexGap): TemplateFlexLayoutConfig => ({
  ...layout,
  root: updateContainer(layout.root, layout.root.id, { gap }),
});
const withNewContainer = (layout: TemplateFlexLayoutConfig): TemplateFlexLayoutConfig => ({
  ...layout,
  root: insertChild(layout.root, layout.root.id, buildContainer({}, 'New', 'row')),
});

test.describe('Layout undo / redo history (pure)', () => {
  test('undo returns the previous layout, redo brings the undone one back', () => {
    const a = base();
    const b = withNewContainer(a);
    const history = recordEdit(emptyHistory, a, b, 1000);

    const undone = undo(history, b);
    expect(undone?.layout).toBe(a);
    expect(undone?.history.past).toHaveLength(0);

    const redone = redo(undone!.history, a);
    expect(redone?.layout).toBe(b);
    expect(redone?.history.past).toEqual([a]);
    expect(redone?.history.future).toHaveLength(0);
  });

  test('undo and redo do nothing when there is no history', () => {
    expect(undo(emptyHistory, base())).toBeNull();
    expect(redo(emptyHistory, base())).toBeNull();
  });

  test('a new edit after an undo clears the redo stack', () => {
    const a = base();
    const b = withNewContainer(a);
    const undone = undo(recordEdit(emptyHistory, a, b, 1000), b)!;
    const c = withNewContainer(a);
    const next = recordEdit(undone.history, a, c, 5000);
    expect(next.future).toHaveLength(0);
    expect(next.past).toEqual([a]);
  });

  test('a quick run of tweaks on the same nodes is one step', () => {
    const a = base();
    const b = withGap(a, 4);
    const c = withGap(b, 8);
    const d = withGap(c, 12);
    let history = recordEdit(emptyHistory, a, b, 1000);
    history = recordEdit(history, b, c, 1000 + COALESCE_WINDOW_MS - 1);
    history = recordEdit(history, c, d, 1000 + COALESCE_WINDOW_MS + 10);
    expect(history.past).toEqual([a]);
    expect(undo(history, d)?.layout).toBe(a);
  });

  test('tweaks separated by a pause are separate steps', () => {
    const a = base();
    const b = withGap(a, 4);
    const c = withGap(b, 8);
    let history = recordEdit(emptyHistory, a, b, 1000);
    history = recordEdit(history, b, c, 1000 + COALESCE_WINDOW_MS + 1);
    expect(history.past).toEqual([a, b]);
  });

  test('adding a node is its own step even right after a tweak', () => {
    const a = base();
    const b = withGap(a, 4);
    const c = withNewContainer(b);
    let history = recordEdit(emptyHistory, a, b, 1000);
    history = recordEdit(history, b, c, 1010);
    expect(history.past).toEqual([a, b]);
  });

  test('the first edit after an undo starts a new step, even inside the window', () => {
    const a = base();
    const b = withGap(a, 4);
    const undone = undo(recordEdit(emptyHistory, a, b, 1000), b)!;
    const c = withGap(a, 16);
    const next = recordEdit(undone.history, a, c, 1001);
    expect(next.past).toEqual([a]);
  });

  test('history is capped at MAX_HISTORY steps, dropping the oldest', () => {
    let layout = base();
    let history = emptyHistory;
    const first = layout;
    for (let i = 0; i < MAX_HISTORY + 20; i++) {
      const next = withNewContainer(layout);
      history = recordEdit(history, layout, next, i * 10_000);
      layout = next;
    }
    expect(history.past).toHaveLength(MAX_HISTORY);
    expect(history.past).not.toContain(first);
  });
});
