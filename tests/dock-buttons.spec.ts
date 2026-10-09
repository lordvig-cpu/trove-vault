import { test, expect } from '@playwright/test';

// A header flyout's Dock to Left / Right adds it as a tab beside what that side panel already shows.
test('docking a second flyout to the same side adds a tab instead of replacing the first', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Open Items or drag to dock in a sidebar', exact: true }).click();
  await page.locator('button[aria-label="Dock Items to Left"]').click();
  await page.waitForTimeout(500);

  await page.getByRole('button', { name: 'Open Collections or drag to dock in a sidebar', exact: true }).click();
  await page.locator('button[aria-label="Dock Collections to Left"]').click();
  await page.waitForTimeout(500);

  const leftTabs = page.locator('.primary-side-panel-left .tree-folder-tab');
  await expect(leftTabs).toHaveCount(2);
  await expect(page.locator('.primary-side-panel-left .tree-header-title')).toHaveText('COLLECTIONS');

  await page.getByRole('button', { name: 'Open Templates or drag to dock in a sidebar', exact: true }).click();
  await page.locator('button[aria-label="Dock Templates to Left"]').click();
  await page.waitForTimeout(500);
  await expect(leftTabs).toHaveCount(3);
});
