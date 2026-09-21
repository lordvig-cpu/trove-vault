import { test, expect } from '@playwright/test';
import { createDefaultFlexLayout } from '../types/layout';

test('nested container drag highlights clear on drop and cancellation', async ({ page }) => {
  const template = { id: 1, name: 'Highlight test', layout_config: createDefaultFlexLayout([]) };
  await page.route('**/rest/v1/**', route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').pop();
    if (Number(url.searchParams.get('offset') ?? 0) > 0) return route.fulfill({ json: [] });
    return route.fulfill({ json: table === 'item_templates'
      ? (route.request().headers().accept?.includes('vnd.pgrst.object') ? template : [template])
      : table === 'items' ? [{ id: 1, name: 'Example', template_id: 1, parent_id: null, attributes: {} }] : [] });
  });
  await page.goto('/');
  await page.locator('header button', { hasText: /templates/i }).click();
  await page.getByRole('button', { name: 'Open actions', exact: true }).first().click();
  await page.getByRole('button', { name: /Edit Template/ }).click();
  const root = page.locator('[data-container-id="root-container"]');
  const child = root.locator('[data-container-id]').first();
  await expect(child).toBeVisible();
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  const ring = /ring-offset-2/;
  await root.dispatchEvent('dragover', { dataTransfer: transfer });
  await expect(root).toHaveClass(ring);
  await child.dispatchEvent('dragover', { dataTransfer: transfer });
  await expect(child).toHaveClass(ring);
  await expect(root).not.toHaveClass(ring);
  await child.dispatchEvent('drop', { dataTransfer: transfer });
  await expect(child).not.toHaveClass(ring);
  await expect(root).not.toHaveClass(ring);
  await child.dispatchEvent('dragover', { dataTransfer: transfer });
  await page.evaluate(() => window.dispatchEvent(new Event('dragend')));
  await expect(child).not.toHaveClass(ring);
});
