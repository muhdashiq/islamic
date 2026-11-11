import { expect, test } from '@playwright/test';

test('system appearance changes live and persists explicit overrides', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/#recitation/ayatul-kursi');
  const bodyBackground = () =>
    page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await bodyBackground()).toBe('rgb(245, 245, 240)');
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await bodyBackground()).toBe('rgb(16, 23, 20)');
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await bodyBackground()).toBe('rgb(245, 245, 240)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
test('personal Adkar, bookmarks, recitation, reset undo and deletion undo', async ({ page }) => {
  await page.goto('/#recitation/ayatul-kursi');
  await page.getByRole('button', { name: 'Mark as recited' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('button', { name: 'Reset count' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('button', { name: 'Save bookmark' }).click();
  await page.getByRole('link', { name: /Library/ }).click();
  await page.getByRole('main').getByRole('button', { name: 'Add Adkar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Adkar' });
  await dialog.getByLabel('Title', { exact: true }).fill('My remembrance');
  await dialog.getByLabel('Arabic text', { exact: true }).fill('سُبْحَانَ اللَّهِ');
  await dialog.getByLabel(/Meaning \(optional/).fill('Glory be to Allah');
  await dialog.getByRole('button', { name: 'Save to library' }).click();
  await expect(page.getByText('My remembrance', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove My remembrance' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText('My remembrance', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('My remembrance', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('My remembrance', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.getByText('Ayatul Kursi', { exact: true })).toBeVisible();
  await expect(page.getByText('My remembrance', { exact: true })).toHaveCount(0);
});
test('production installation caches app and preserves progress across offline reload', async ({
  page,
  context,
}) => {
  await page.goto('/#recitation/ayatul-kursi');
  await expect(page.locator('.sidebar-offline')).toContainText('Available offline', {
    timeout: 20000,
  });
  await page.getByRole('button', { name: 'Mark as recited' }).click();
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ayatul Kursi' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recited', exact: true })).toBeVisible();
  await expect(page.locator('.network-status')).toContainText('Offline');
  await context.setOffline(false);
});
test('small devices, RTL and larger text fit without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/#recitation/ayatul-kursi');
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('link', { name: 'الإعدادات', exact: true }).click();
  await page.getByRole('button', { name: 'تكبير النص', exact: true }).click();
  await page.goto('/#recitation/ayatul-kursi');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'الإعدادات', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'المظهر', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('keyboard can open and dismiss the add sheet and restore focus', async ({ page }) => {
  await page.goto('/#library');
  const add = page.getByRole('main').getByRole('button', { name: 'Add Adkar', exact: true });
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Add Adkar' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(add).toBeFocused();
});

test('responsive light and dark screens are readable in all four languages', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#recitation/ayatul-kursi');
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${width} ${colorScheme}`,
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.screenshot({ path: '/private/tmp/adkar-react-desktop-light.png', fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: '/private/tmp/adkar-react-desktop-dark.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/private/tmp/adkar-react-mobile-dark.png', fullPage: true });
  for (const lang of ['ml', 'hi', 'ar', 'en']) {
    await page.locator('.language-picker select').selectOption(lang);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      lang,
    ).toBe(true);
  }
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.screenshot({ path: '/private/tmp/adkar-react-mobile-settings.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('mobile reading controls stay usable while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/#recitation/ayatul-kursi');
  await expect(page.locator('.sidebar-offline')).toContainText('Available offline');
  await page.screenshot({ path: '/private/tmp/adkar-mobile-top.png' });
  await page.getByRole('button', { name: 'Mark as recited' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Mark as recited' })).toBeInViewport();
  await page.screenshot({ path: '/private/tmp/adkar-mobile-reading.png' });
  await page.getByRole('button', { name: 'Mark as recited' }).click();
  await expect(page.getByRole('button', { name: 'Recited', exact: true })).toBeVisible();
});
