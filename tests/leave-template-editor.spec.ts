import { test, expect, type Page } from '@playwright/test';

// Needs a real template with an item in the live project, so every write is blocked.
test.describe('Leaving the template editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/supabase\.co\/(rest|storage)\/v1\//, (route) =>
      ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort()
    );
  });

  const openEditor = async (page: Page) => {
    await page.getByRole('button', { name: 'Open Templates or drag to dock in a sidebar', exact: true }).click();
    await page.locator('aside.nav-flyout-menu .tree-category-row, aside.nav-flyout-menu .tree-category-row-active').first().click({ button: 'right' });
    await page.getByText('Edit Template', { exact: true }).first().click();
    await expect(page.locator('#template-toolbar-slot').getByRole('button', { name: /Custom/ }).first()).toBeVisible();
  };
  const clickAnItem = async (page: Page) => {
    await page.getByRole('button', { name: 'Open Items or drag to dock in a sidebar', exact: true }).click();
    await page.locator('aside.nav-flyout-menu .tree-item').first().click();
  };
  const editorOpen = (page: Page) => page.locator('#template-toolbar-slot-bottom').getByRole('button', { name: 'Save' });

  test('with no changes, opening an item just closes the editor', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await openEditor(page);
    await clickAnItem(page);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(editorOpen(page)).toHaveCount(0);
  });

  test('with a layout change, it asks first; Keep Editing stays, Discard puts the layout back', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await openEditor(page);
    const cached = () => page.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('trovevault_template_layout_')).map(([, v]) => v));
    const before = await cached();
    await page.locator('#template-toolbar-slot').getByRole('button', { name: /Custom/ }).first().click();

    await clickAnItem(page);
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Unsaved Template Changes');
    await dialog.getByRole('button', { name: 'Keep Editing' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(editorOpen(page)).toBeVisible();

    await page.locator('aside.nav-flyout-menu .tree-item').first().click();
    await dialog.getByRole('button', { name: 'Discard Changes' }).click();
    await expect(editorOpen(page)).toHaveCount(0);
    const after = await cached();
    // Nothing was cached before (the stored layout was used); Discard writes that same layout back
    if (before.length) expect(after).toEqual(before);
    else {
      await openEditor(page);
      await clickAnItem(page);
      await expect(page.getByRole('alertdialog')).toHaveCount(0);
    }
  });
});
