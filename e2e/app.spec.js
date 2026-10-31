import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('shows defaults and the computed hourly wage', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Hourly Wage Calculator' })).toBeVisible();
  await expect(page.getByLabel('Hours per week')).toHaveValue('37.5');
  await expect(page.getByTestId('hourly')).toHaveText('€12.31');
});

test('recalculates when salary changes', async ({ page }) => {
  await page.getByLabel('Monthly salary (gross)').fill('3000');
  await expect(page.getByTestId('hourly')).toHaveText('€18.46');
});

test('supports monthly hours', async ({ page }) => {
  await page.getByRole('group').getByText('Per month').click();
  await page.getByLabel('Hours per month').fill('160');
  await expect(page.getByTestId('hourly')).toHaveText('€12.50');
});

test('shows a hint for invalid input', async ({ page }) => {
  await page.getByLabel('Monthly salary (gross)').fill('');
  await expect(page.getByTestId('hourly')).toHaveCount(0);
  await expect(page.getByText(/Enter a monthly salary/)).toBeVisible();
});

test('converts yearly salary', async ({ page }) => {
  await page.getByLabel('Yearly salary (gross)').fill('36000');
  await expect(page.getByTestId('yearly-monthly')).toHaveText('€3,000.00');
  await expect(page.getByTestId('yearly-hourly')).toHaveText('€18.46');
});

test.describe('dark mode', () => {
  test('toggle switches theme and persists across reloads', async ({ page }) => {
    const html = page.locator('html');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(html).toHaveClass(/dark/);
    await page.reload();
    await expect(html).toHaveClass(/dark/);
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test.describe('system preference', () => {
    test.use({ colorScheme: 'dark' });

    test('follows the system preference by default', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('html')).toHaveClass(/dark/);
    });
  });

  test('uses dark background colours', async ({ page }) => {
    const main = page.locator('main');
    const light = await main.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect
      .poll(() => main.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(light);
  });
});

test.describe('layout', () => {
  test('is wider on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    const box = await page.locator('main > div').boundingBox();
    expect(box.width).toBeGreaterThan(900);
  });

  test('stays within the viewport on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
