import { test, expect, type Locator } from '@playwright/test';

async function expectTopmost(locator: Locator) {
  await expect.poll(() => locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  })).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('uc_animations_enabled', 'false'));
  await page.route('**/rest/v1/**', route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').pop();
    const data = table === 'collections' ? [{ id: 1, name: 'Test collection', parent_id: null }]
      : table === 'items' ? [{ id: 1, name: 'Stacking item', parent_id: null, attributes: {} }]
      : [];
    return route.fulfill({ json: Number(url.searchParams.get('offset') ?? 0) ? [] : data });
  });
  await page.goto('/');
});

for (const location of ['flyout', 'left', 'right'] as const) {
  test(`menus retain their lower layer beside the ${location} explorer`, async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open Explorer or drag to dock in a sidebar', exact: true });
    if (location === 'flyout') {
      await trigger.click();
    } else {
      const rect = (await trigger.boundingBox())!;
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down();
      await page.mouse.move(location === 'left' ? 100 : 1180, 400, { steps: 15 });
      await expect(page.locator('.dock-drop-overlay')).toBeVisible();
      await page.mouse.up();
      await expect(page.locator('.dock-drop-overlay')).toHaveCount(0);
    }
    const row = page.getByRole('button', { name: 'Stacking item', exact: true });
    await row.locator('..').getByRole('button', { name: 'Open actions' }).hover();
    const menu = page.locator('[data-explorer-menu]:not([inert])');
    await expect(menu).toHaveCSS('z-index', location === 'flyout' ? '70' : '45');
    const rename = menu.getByRole('button', { name: /Rename Item/ });
    await expectTopmost(rename);
    await rename.click();
    await expect(menu.locator('input')).toHaveValue('Stacking item');
    await page.keyboard.press('Escape'); // Cancel rename first.
    await page.keyboard.press('Escape'); // Then close the menu.

    await page.getByRole('button', { name: 'Advanced Search & Filters', exact: true }).click();
    const search = page.locator('.searchMenuShell:not([inert])');
    await expect(search).toHaveCSS('z-index', location === 'flyout' ? '70' : '45');
    const checkbox = search.locator('input[type="checkbox"]').first();
    await expectTopmost(checkbox);
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });
}

test('hover lifts only sticky categories and leaves navigation / handles stable', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open Explorer or drag to dock in a sidebar', exact: true });
  await expect(trigger).toHaveCSS('z-index', '50');
  await trigger.hover();
  await expect(trigger).toHaveCSS('z-index', '50');
  await trigger.click();
  const category = page.locator('.explorer-category-sticky-header').first();
  await category.hover();
  await expect(category).toHaveCSS('z-index', '40');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Toggle Left Panel', exact: true }).click();
  const handle = page.getByRole('separator', { name: 'Primary panel width' });
  await handle.hover();
  await expect(handle).toHaveCSS('z-index', '50');
});

test('item and template modals cover navigation and all overlay tiers', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Explorer or drag to dock in a sidebar', exact: true }).click();
  const row = page.getByRole('button', { name: 'Stacking item', exact: true });
  await row.locator('..').getByRole('button', { name: 'Open actions' }).hover();
  await page.locator('[data-explorer-menu]').getByRole('button', { name: /Edit Item/ }).click();
  const backdrop = page.locator('.item-modal-backdrop');
  await expect(backdrop).toHaveCSS('z-index', '400');
  expect(await backdrop.evaluate(element => element.contains(document.elementFromPoint(25, 25)))).toBe(true);
  expect(await backdrop.evaluate(element => element.contains(document.elementFromPoint(25, window.innerHeight - 25)))).toBe(true);
  // Read the real computed tiers using hidden probes; do not alter overlay behavior.
  expect(await page.evaluate(() => {
    return ['seed-color-popover', 'dock-drop-overlay'].map(className => {
      const probe = document.createElement('div');
      probe.className = className;
      probe.style.visibility = 'hidden';
      document.body.append(probe);
      const z = Number(getComputedStyle(probe).zIndex);
      probe.remove();
      return z;
    });
  })).toEqual([300, 150]);
  await page.keyboard.press('Escape');
  await expect(backdrop).toHaveCount(0);
  await page.locator('.col-dropdown-trigger').click();
  await page.locator('.col-dropdown-item').filter({ hasText: 'Test collection' }).click();
  await page.getByRole('button', { name: /Templates/ }).click();
  await expect(page.locator('.field-modal-backdrop')).toHaveCSS('z-index', '400');
  expect(await page.locator('.field-modal-backdrop').evaluate(element => element.contains(document.elementFromPoint(25, 25)))).toBe(true);
});
