import { test, expect, type Page } from '@playwright/test';
import { createDefaultFlexLayout } from '../types/layout';

/* With the Layout tree hidden, a node's gear flyout opens as a floating window (lib/floatingNodeMenu.ts):
   at the pointer for a canvas right-click, under the toolbar gear for a click on it. Every request is mocked. */

async function openEditorWithLayoutHidden(page: Page) {
  const template = { id: 1, name: 'Floating test', layout_config: createDefaultFlexLayout([]) };
  await page.route('**/rest/v1/**', route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').pop();
    if (Number(url.searchParams.get('offset') ?? 0) > 0) return route.fulfill({ json: [] });
    return route.fulfill({ json: table === 'item_templates'
      ? (route.request().headers().accept?.includes('vnd.pgrst.object') ? template : [template])
      : table === 'items' ? [{ id: 1, name: 'Example', template_id: 1, parent_id: null, attributes: {} }] : [] });
  });
  await page.addInitScript(() => localStorage.setItem('uc_animations_enabled', 'false'));
  await page.goto('/');
  await page.locator('header button', { hasText: /templates/i }).click();
  await page.getByRole('button', { name: 'Open actions', exact: true }).first().click();
  await page.getByRole('button', { name: /Edit: Template/ }).click();
  const child = page.locator('[data-container-id="root-container"] [data-container-id]').first();
  await expect(child).toBeVisible();
  return child;
}

test('right-clicking the canvas with the Layout tree hidden opens a floating, draggable, closable menu', async ({ page }) => {
  const child = await openEditorWithLayoutHidden(page);
  const floating = page.locator('.menuShellFloating');
  const box = (await child.boundingBox())!;
  const at = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + 6) };

  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect(floating).toBeVisible();
  // titled with just the container's own name
  const childName = createDefaultFlexLayout([]).root.children.find((c) => c.nodeType === 'container')!.label!;
  await expect(floating.locator('.menuShellHead .headerTitle')).toHaveText(childName);
  const opened = (await floating.boundingBox())!;
  expect(Math.abs(opened.x - at.x)).toBeLessThan(8);
  expect(Math.abs(opened.y - at.y)).toBeLessThan(8);
  // The Layout tree is not opened for it
  await expect(page.locator('.tree-gear-trigger-pinned')).toHaveCount(0);

  // Drag by the title bar
  const title = floating.locator('.menuShellHead .headerPill');
  const t = (await title.boundingBox())!;
  await page.mouse.move(t.x + 40, t.y + t.height / 2);
  await page.mouse.down();
  await page.mouse.move(t.x + 240, t.y + 120, { steps: 6 });
  await page.mouse.up();
  const dragged = (await floating.boundingBox())!;
  expect(Math.round(dragged.x - opened.x)).toBe(200);
  // (vertically it may stop short: like every flyout it stays clear of the footer)
  expect(dragged.y).toBeGreaterThan(opened.y + 60);

  // Clicking elsewhere keeps it; its close button closes it
  await page.mouse.click(20, 900);
  await expect(floating).toBeVisible();
  await floating.getByRole('button', { name: /^Close / }).click();
  await expect(floating).toHaveCount(0);

  // Escape closes it too
  await page.mouse.click(at.x, at.y, { button: 'right' });
  await expect(floating).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(floating).toHaveCount(0);
});

test('the toolbar gear floats the menu under itself on Properties, and closes it again', async ({ page }) => {
  const child = await openEditorWithLayoutHidden(page);
  await child.click({ position: { x: 20, y: 6 } });
  const gear = page.locator('#template-toolbar-slot button[data-gear-trigger]');
  const floating = page.locator('.menuShellFloating');

  await gear.click();
  await expect(floating).toBeVisible();
  await expect(floating.getByRole('tab', { name: 'Properties' })).toHaveAttribute('aria-selected', 'true');
  await expect(gear).toHaveAttribute('aria-expanded', 'true');
  const g = (await gear.boundingBox())!;
  const f = (await floating.boundingBox())!;
  expect(f.y).toBeGreaterThan(g.y + g.height);

  await gear.click();
  await expect(floating).toHaveCount(0);
  await expect(gear).toHaveAttribute('aria-expanded', 'false');
});

test('hiding the Layout panel with a pinned menu open turns it into the floating menu, same spot and tab', async ({ page }) => {
  await openEditorWithLayoutHidden(page);
  await page.getByRole('button', { name: 'Toggle Left Panel' }).click();
  const gear = page.locator('.primary-side-panel [data-tree-gear]').nth(1);
  await gear.click();
  const menu = page.locator('.menuShellSplit:not(.menuShellFloating):not(.hoverHint)').last();
  await menu.getByRole('tab', { name: 'Properties' }).click();
  const before = (await menu.boundingBox())!;

  await page.getByRole('button', { name: 'Toggle Left Panel' }).click();
  const floating = page.locator('.menuShellFloating');
  await expect(floating).toBeVisible();
  await expect(floating.getByRole('tab', { name: 'Properties' })).toHaveAttribute('aria-selected', 'true');
  const after = (await floating.boundingBox())!;
  expect(Math.abs(after.x - before.x)).toBeLessThan(4);
  expect(Math.abs(after.y - before.y)).toBeLessThan(4);
  // the tree row's menu let go of its pin
  await expect(page.locator('.tree-gear-trigger-pinned')).toHaveCount(0);
});
