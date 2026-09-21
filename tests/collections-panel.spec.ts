import { test, expect, type Page } from '@playwright/test';

async function dock(page: Page, name: string, side: 'left' | 'right') {
  const trigger = page.getByRole('button', { name: `Open ${name} or drag to dock in a sidebar`, exact: true });
  const rect = (await trigger.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(side === 'left' ? 100 : 1180, 400, { steps: 15 });
  await expect(page.locator('.dock-drop-overlay')).toBeVisible();
  await page.mouse.up();
  await expect(page.locator('.dock-drop-overlay')).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('uc_animations_enabled', 'false'));
  await page.route('**/rest/v1/**', route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').pop();
    const data = table === 'collections' ? [
      { id: 1, name: 'Games', parent_id: null },
      { id: 2, name: 'Favorites', parent_id: 1 },
    ] : table === 'items' ? [
      { id: 1, name: 'Board game', parent_id: null, attributes: {} },
      { id: 2, name: 'Expansion pack', parent_id: 1, attributes: {} },
      { id: 3, name: 'Standalone item', parent_id: null, attributes: {} },
    ] : table === 'item_collections' ? [{ item_id: 1, collection_id: 2 }] : [];
    return route.fulfill({ json: Number(url.searchParams.get('offset') ?? 0) ? [] : data });
  });
  await page.goto('/');
});

test('Collections flyout preserves collection and nested item actions', async ({ page }) => {
  // Establish an interactive page before sending global keyboard events.
  await page.getByRole('button', { name: 'Open Items or drag to dock in a sidebar', exact: true }).click();
  await expect(page.locator('aside.nav-flyout-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('aside.nav-flyout-menu')).toHaveCount(0);
  await page.keyboard.press('Control+k');
  await expect(page.locator('aside.nav-flyout-menu').getByRole('textbox', { name: 'Search items', exact: true })).toBeFocused();
  await page.keyboard.press('Control+l');
  await expect(page.locator('aside.nav-flyout-menu').getByRole('textbox', { name: 'Search collections and items' })).toBeFocused();
  const panel = page.locator('aside.nav-flyout-menu');
  await expect(panel.getByRole('tab', { name: 'Collections', exact: true })).toBeVisible();
  await expect(panel.getByRole('tab', { name: 'Items', exact: true })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Standalone item', exact: true })).toHaveCount(0);
  const item = panel.getByRole('button', { name: 'Board game', exact: true });
  await expect(item).toBeVisible();
  const nestedItem = panel.getByRole('button', { name: 'Expansion pack', exact: true });
  await expect(nestedItem).toBeVisible();
  await nestedItem.locator('..').getByRole('button', { name: 'Open actions' }).hover();
  await page.locator('[data-tree-menu]:not([inert])').getByRole('button', { name: /Rename Item/ }).click();
  await expect(page.locator('[data-tree-menu]:not([inert]) input')).toHaveValue('Expansion pack');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await item.locator('..').getByRole('button', { name: 'Open actions' }).hover();
  const menu = page.locator('[data-tree-menu]:not([inert])');
  for (const action of ['Add Sub-Item', 'Rename Item', 'Edit Item', 'Delete Item']) {
    await expect(menu.getByRole('button', { name: new RegExp(action) })).toBeVisible();
  }
  await menu.getByRole('button', { name: /Rename Item/ }).click();
  await expect(menu.locator('input')).toHaveValue('Board game');
  await page.keyboard.press('Escape');
  await menu.getByRole('button', { name: /Edit Item/ }).click();
  await expect(page.locator('.item-modal-backdrop')).toBeVisible();
  await page.keyboard.press('Escape');
  await panel.getByRole('button', { name: 'Advanced Search & Filters', exact: true }).click();
  const search = page.locator('.searchMenuShell:not([inert])');
  await search.locator('input[type="checkbox"]').first().check();
  await expect(search.locator('input[type="checkbox"]').first()).toBeChecked();
});

test('Collections flyout stays interactive beside the pinned Items panel and supports header dragging', async ({ page }) => {
  await dock(page, 'Items', 'left');
  await page.getByRole('button', { name: 'Pin Primary Side Bar', exact: true }).click();
  await page.getByRole('button', { name: 'Open Collections or drag to dock in a sidebar', exact: true }).click();
  const flyout = page.locator('aside.nav-flyout-menu');
  const collection = flyout.getByRole('button', { name: 'Games', exact: true });
  await collection.locator('..').getByRole('button', { name: 'Open actions' }).hover();
  const menu = page.locator('[data-tree-menu]:not([inert])');
  await expect(menu).toHaveCSS('z-index', '70');
  await menu.getByRole('button', { name: /Rename Collection/ }).click();
  await expect(menu.locator('input')).toHaveValue('Games');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  const grip = flyout.getByTitle('Drag to dock panel');
  const rect = (await grip.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(1180, 400, { steps: 15 });
  await expect(page.locator('.dock-drop-overlay')).toBeVisible();
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Collections is already docked in the secondary (right) panel' })).toBeVisible();
  await expect(flyout).toHaveCount(0);
});

for (const side of ['left', 'right'] as const) {
  test(`Collections and Items coexist with independent searches, Collections on ${side}`, async ({ page }) => {
    await dock(page, 'Collections', side);
    await dock(page, 'Items', side === 'left' ? 'right' : 'left');
    const collections = page.locator('aside').filter({ has: page.getByRole('tab', { name: 'Collections', exact: true }) });
    const itemsPanel = page.locator('aside').filter({ has: page.getByRole('tab', { name: 'Items', exact: true }) });
    await expect(collections).toHaveCount(1);
    await expect(itemsPanel).toHaveCount(1);
    await page.keyboard.press('Control+k');
    await expect(itemsPanel.getByRole('textbox')).toBeFocused();
    await page.keyboard.press('Control+l');
    await expect(collections.getByRole('textbox')).toBeFocused();
    const rightPanel = side === 'right' ? collections : itemsPanel;
    const gearPositions = await rightPanel.getByRole('button', { name: 'Open actions', exact: true })
      .evaluateAll(gears => gears.map(gear => gear.getBoundingClientRect().left));
    expect(gearPositions.length).toBeGreaterThan(2);
    expect(Math.max(...gearPositions) - Math.min(...gearPositions)).toBeLessThanOrEqual(1);
    const nestedActions = rightPanel.getByRole('button', { name: 'Expansion pack', exact: true })
      .locator('..').getByRole('button', { name: 'Open actions', exact: true });
    const rootRow = rightPanel.getByRole('button', { name: 'Board game', exact: true }).locator('..');
    const gearBox = (await rootRow.getByRole('button', { name: 'Open actions', exact: true }).boundingBox())!;
    const arrowBox = (await rootRow.getByRole('button', { name: 'Collapse item', exact: true }).boundingBox())!;
    expect(arrowBox.x - (gearBox.x + gearBox.width)).toBeGreaterThanOrEqual(8);
    await nestedActions.hover();
    await page.locator('[data-tree-menu]:not([inert])').getByRole('button', { name: /Rename Item/ }).click();
    await expect(page.locator('[data-tree-menu]:not([inert]) input')).toHaveValue('Expansion pack');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await collections.getByRole('textbox', { name: 'Search collections and items' }).fill('Board');
    await itemsPanel.getByRole('textbox', { name: 'Search items', exact: true }).fill('Standalone');
    await expect(collections.getByRole('button', { name: 'Board game', exact: true })).toBeVisible();
    await expect(itemsPanel.getByRole('button', { name: 'Standalone item', exact: true })).toBeVisible();
    await expect(collections.getByRole('textbox')).toHaveValue('Board');
    // Moving into an occupied sidebar swaps the two trees without losing their queries.
    await expect(itemsPanel.getByRole('button', { name: 'Swap ITEMS and COLLECTIONS', exact: true }))
      .toHaveAttribute('title', 'Swap ITEMS and COLLECTIONS');
    const swap = collections.getByRole('button', { name: 'Swap COLLECTIONS and ITEMS', exact: true });
    await expect(swap).toHaveAttribute('title', 'Swap COLLECTIONS and ITEMS');
    await swap.click();
    await expect(collections.getByRole('textbox')).toHaveValue('Board');
    await expect(itemsPanel.getByRole('textbox')).toHaveValue('Standalone');
  });
}
