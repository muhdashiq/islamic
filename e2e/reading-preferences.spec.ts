import { expect, test } from '@playwright/test';

test('older readers can choose interface and Arabic sizes with a persistent live preview', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#settings');
  await expect(page.getByRole('heading', { name: 'Reading comfort' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Large', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Extra large', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'extra-large');
  await page.getByRole('slider', { name: 'Arabic text size', exact: true }).fill('56');
  await expect(page.locator('.reading-preview p')).toHaveCSS('font-size', '56px');
  await page.getByRole('button', { name: 'Larger text', exact: true }).click();
  await expect(page.locator('.reading-preview p')).toHaveCSS('font-size', '58px');
  await page.getByRole('link', { name: 'Today', exact: true }).click();
  await expect(page.locator('.arabic-text')).toHaveCSS('font-size', '58px');
  await expect(page.locator('.sidebar-offline')).toContainText('Available offline');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.arabic-text')).toHaveCSS('font-size', '58px');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'extra-large');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.setOffline(false);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Arabic text size', exact: true })).toHaveValue(
    '58',
  );
  await page.getByRole('button', { name: 'Standard', exact: true }).click();
  await page.getByRole('slider', { name: 'Arabic text size', exact: true }).fill('22');
  await expect(page.getByRole('button', { name: 'Smaller text', exact: true })).toBeDisabled();
});

test('maximum reading sizes fit all supported languages on the smallest screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/#settings');
  await page.getByRole('button', { name: 'Extra large', exact: true }).click();
  await page.getByRole('slider', { name: 'Arabic text size', exact: true }).fill('64');
  await expect(page.getByRole('button', { name: 'Larger text', exact: true })).toBeDisabled();
  for (const language of ['en', 'ml', 'hi', 'ar']) {
    await page.locator('.language-picker select').selectOption(language);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `settings ${language}`,
    ).toBe(true);
    await page.locator('a[href="#today"]').last().click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `reading ${language}`,
    ).toBe(true);
    await page.locator('a[href="#settings"]').click();
  }
  await page.locator('.reading-preview').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/private/tmp/adkar-reading-settings.png' });
});
