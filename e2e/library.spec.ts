import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Library includes all shared recitations, filters categories and shares bookmarks', async ({
  page,
}) => {
  await page.goto('/#library');
  await expect(page.locator('.library-entry')).toHaveCount(20);
  await page.getByRole('combobox', { name: 'Category' }).selectOption('morning');
  await expect(page.locator('.library-entry')).toHaveCount(8);
  await page.getByRole('searchbox', { name: 'Search your Adkar' }).fill('Ikhlas');
  await expect(page.locator('.library-entry')).toHaveCount(1);
  await page.locator('.entry-open').click();
  await expect(page.getByRole('heading', { name: 'Al-Ikhlas', exact: true })).toBeVisible();
  await expect(page.locator('.quran-verse')).toHaveCount(4);
  await expect(page.locator('.bismillah')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Quran 112:1–4' })).toHaveAttribute(
    'href',
    'https://quran.com/112/1',
  );
  await page.getByRole('button', { name: 'Save bookmark' }).click();
  await page.getByRole('link', { name: 'Today', exact: true }).click();
  await page.getByRole('button', { name: 'Al-Ikhlas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bookmark recitation' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.quran-verse')).toHaveCount(4);
  await expect(page.locator('.tracker-counter [role=status]')).toContainText('0 / 3');
  await page.getByRole('button', { name: 'Tap to count' }).click();
  await page.getByRole('link', { name: /Library/ }).click();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.locator('.library-entry')).toHaveCount(1);
  await expect(page.locator('.entry-meta')).toContainText('0 / 1');
  await page.locator('.entry-open').click();
  await page.getByRole('button', { name: 'Remove bookmark' }).click();
  await page.getByRole('link', { name: 'Today', exact: true }).click();
  await page.getByRole('button', { name: 'Continue recitation' }).click();
  await expect(page.getByRole('button', { name: 'Bookmark recitation' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.locator('.tracker-counter [role=status]')).toContainText('1 / 3');
});

test('complete long Surahs and Malayalam Library remain accessible offline', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#library');
  await page.getByRole('combobox', { name: 'Category' }).selectOption('weekly');
  await expect(page.locator('.library-entry')).toHaveCount(4);
  expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: /Al-Mulk/ }).click();
  await expect(page.locator('.quran-verse')).toHaveCount(30);
  await expect(page.locator('.arabic-text')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.sidebar-offline')).toContainText('Available offline', {
    timeout: 20000,
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.quran-verse')).toHaveCount(30);
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('ml');
  await expect(page.getByRole('heading', { name: 'അൽ മുൽക്ക്', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.setOffline(false);
});
