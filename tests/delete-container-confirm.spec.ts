import { test, expect } from '@playwright/test';

// Needs a real template in the live project, so every write is blocked.
test.beforeEach(async ({ page }) => {
  await page.route(/supabase\.co\/(rest|storage)\/v1\//, (route) =>
    ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort()
  );
});

test('deleting a container that holds content asks first and lists what goes with it', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Open Templates or drag to dock in a sidebar', exact: true }).click();
  await page.locator('aside.nav-flyout-menu .tree-category-row, aside.nav-flyout-menu .tree-category-row-active').first().click({ button: 'right' });
  await page.getByText('Edit: Template', { exact: true }).first().click();

  const bar = page.locator('#template-toolbar-slot');
  const deleteBtn = bar.getByRole('button', { name: 'Delete Container' });
  await expect(deleteBtn).toBeVisible();
  const containers = page.locator('[data-container-id]');
  const before = await containers.count();

  await deleteBtn.click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Are you sure you want to delete');
  expect(await dialog.getByRole('list', { name: 'Also deleted' }).getByRole('listitem').count()).toBeGreaterThan(0);

  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(containers).toHaveCount(before);

  await deleteBtn.click();
  await dialog.getByRole('button', { name: 'Delete Container' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(containers).toHaveCount(before - 1);
});
