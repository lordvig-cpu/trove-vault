import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/rest/v1/**', route => route.fulfill({ json: [] }));
  await page.addInitScript(() => localStorage.setItem('uc_animations_enabled', 'false'));
});

test('panel bounds, keyboard resizing, cancellation and hidden focus', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  const primary = page.locator('aside.primary-side-panel');
  const secondary = page.locator('aside.secondary-side-panel');
  await expect(primary).toHaveAttribute('inert', '');
  await expect(secondary).toHaveAttribute('inert', '');
  await page.getByRole('button', { name: 'Toggle Left Panel', exact: true }).click();
  const handle = page.getByRole('separator', { name: 'Primary panel width' });
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(1250, box.y + box.height / 2, { steps: 20 });
  await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-valuenow', '1232');
  await page.setViewportSize({ width: 800, height: 650 });
  await expect(handle).toHaveAttribute('aria-valuenow', '752');
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(handle).toHaveAttribute('aria-valuenow', '742');
  await page.keyboard.press('Home');
  await expect(handle).toHaveAttribute('aria-valuenow', '304');
  await handle.dispatchEvent('pointerdown', { button: 0, pointerId: 77 });
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 77 })));
  await expect.poll(() => page.evaluate(() => document.body.style.cursor)).toBe('');
  await page.getByRole('button', { name: 'Toggle Left Panel', exact: true }).click();
  await expect(primary).toHaveAttribute('inert', '');
  expect(await primary.evaluate(element => {
    const button = element.querySelector('button');
    button?.focus();
    return !!button && document.activeElement === button;
  })).toBe(false);
  await page.getByRole('button', { name: 'Show Bottom Panel', exact: true }).click();
  const bottom = page.getByRole('separator', { name: 'Bottom panel height' });
  await bottom.focus();
  await page.keyboard.press('End');
  expect(Number(await bottom.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(650 - 56 - 56 - 48);
  await page.setViewportSize({ width: 800, height: 500 });
  await expect.poll(async () => Number(await bottom.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(500 - 56 - 56 - 48);
  expect(errors).toEqual([]);
});

test('seed preferences persist and synchronize across tabs', async ({ page, context }) => {
  await page.goto('/');
  const other = await context.newPage();
  await other.route('**/rest/v1/**', route => route.fulfill({ json: [] }));
  await other.goto('/');
  await page.getByRole('textbox', { name: 'Primary', exact: true }).fill('a1b2c3');
  await page.getByRole('textbox', { name: 'Primary', exact: true }).blur();
  await expect(other.getByRole('textbox', { name: 'Primary', exact: true })).toHaveValue('#A1B2C3');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Primary', exact: true })).toHaveValue('#A1B2C3');
});

test('intro has no initial video request and honors reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const videos: string[] = [];
  page.on('request', request => { if (request.url().endsWith('.mp4')) videos.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('video')).not.toHaveAttribute('src');
  await expect(page.getByRole('button', { name: 'Play TroveVault introduction' })).toHaveCount(0);
  expect(videos).toEqual([]);
});

test('diagnostic route is unavailable in production', async ({ page }) => {
  const response = await page.goto('/test_connection');
  expect(response?.status()).toBe(404);
});

test('explorer rows and action menus are usable from the keyboard', async ({ page }) => {
  await page.route('**/rest/v1/**', route => {
    const table = new URL(route.request().url()).pathname.split('/').pop();
    const from = Number(new URL(route.request().url()).searchParams.get('offset') ?? 0);
    const rows = table === 'items' ? [{ id: 1, name: 'Keyboard item', parent_id: null, attributes: {} }] : [];
    return route.fulfill({ json: from ? [] : rows });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Items or drag to dock in a sidebar', exact: true }).click();
  const row = page.getByRole('button', { name: 'Keyboard item', exact: true });
  await row.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Keyboard item', exact: true })).toBeVisible();
  // Selecting an item intentionally closes the unpinned explorer flyout.
  await page.getByRole('button', { name: 'Open Items or drag to dock in a sidebar', exact: true }).click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  const actions = row.locator('..').getByRole('button', { name: 'Open actions' });
  await actions.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-explorer-menu]:not([inert])')).toBeVisible();
  await expect(page.locator('[data-explorer-menu]:not([inert]) button').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(actions).toBeFocused();
  await expect(page.locator('[data-explorer-menu]:not([inert])')).toHaveCount(0);
});

test('preferences remain usable when storage writes fail', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  });
  const input = page.getByRole('textbox', { name: 'Primary', exact: true });
  await input.fill('123abc');
  await input.blur();
  await expect(input).toHaveValue('#123ABC');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(input).toHaveValue('#0077FF');
});

test('intro video is fetched on interaction, not on initial render', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('uc_animations_enabled', 'true'));
  const videos: string[] = [];
  page.on('request', request => { if (request.url().endsWith('.mp4')) videos.push(request.url()); });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Play TroveVault introduction' });
  await expect(trigger).toBeVisible();
  await expect(page.locator('video')).not.toHaveAttribute('src');
  expect(videos).toEqual([]);
  await trigger.hover();
  await expect.poll(() => videos.length).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(trigger).toHaveCount(0);
  await expect(page.locator('video')).toHaveJSProperty('paused', true);
});
