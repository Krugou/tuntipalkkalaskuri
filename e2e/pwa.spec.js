import { expect, test } from '@playwright/test';

test('serves a valid web manifest with icons', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();

  const res = await request.get(new URL(href, page.url()).toString());
  expect(res.ok()).toBe(true);
  const manifest = await res.json();

  expect(manifest.name).toBe('Hourly Wage Calculator');
  expect(manifest.display).toBe('standalone');
  const sizes = manifest.icons.map((i) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);

  for (const icon of manifest.icons) {
    const r = await request.get(new URL(icon.src, page.url()).toString());
    expect(r.ok(), icon.src).toBe(true);
    expect(r.headers()['content-type']).toContain('image/png');
  }
});

test('links favicon and apple touch icon', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('link[rel="icon"]')).not.toHaveCount(0);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#4f46e5');
});

test('registers a service worker and works offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Reload so the page is controlled by the service worker before going offline.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('hourly')).toHaveText('€12.31');
  await context.setOffline(false);
});
