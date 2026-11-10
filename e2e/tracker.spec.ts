import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('dashboard sessions, reading, persisted count, offline resume and reset', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Today’s recitations' })).toBeVisible();
  await expect(page.locator('.tracker-session')).toHaveCount(9);
  await page.getByRole('button', { name: 'Continue recitation' }).click();
  await expect(page.getByRole('heading', { name: 'Ayat al-Kursi', exact: true })).toBeVisible();
  await expect(page.locator('.tracker-reading-body .arabic-text')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('button', { name: 'Tap to count' }).click();
  await expect(page.getByRole('button', { name: 'Completed', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Tap to count' }).dblclick();
  await expect(page.locator('.tracker-counter [role=status]')).toContainText('1 / 3');
  await page.getByRole('button', { name: 'Bookmark recitation' }).click();
  await expect(page.locator('.sidebar-offline')).toContainText('Available offline', {
    timeout: 20000,
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Continue recitation' }).click();
  await expect(page.getByRole('heading', { name: 'Al-Ikhlas', exact: true })).toBeVisible();
  await expect(page.locator('.tracker-counter [role=status]')).toContainText('1 / 3');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('.tracker-counter [role=status]')).toContainText('1 / 3');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('.tracker-counter [role=status]')).toContainText('0 / 3');
  await context.setOffline(false);
});
test('Malayalam, mobile layouts, dark mode and accessibility', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 23, 20)');
  expect((await new AxeBuilder({ page }).include('.tracker').analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Continue recitation' }).click();
  expect((await new AxeBuilder({ page }).include('.tracker').analyze()).violations).toEqual([]);
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('ml');
  await expect(page.getByRole('heading', { name: 'പ്രഭാത അദ്കാർ' })).toBeVisible();
  await page.getByRole('button', { name: 'അടുത്തത്', exact: true }).click();
  await page.getByRole('button', { name: 'അടുത്തത്', exact: true }).click();
  await page.getByRole('button', { name: 'അടുത്തത്', exact: true }).click();
  await page.getByRole('button', { name: 'അടുത്തത്', exact: true }).click();
  await page.locator('.tracker-toolbar').getByRole('combobox').selectOption('ml');
  await expect(page.locator('.tracker-reading-body .meaning-text')).toContainText('അല്ലാഹുവേ');
  await page.getByLabel('ഉച്ചാരണം').check();
  await expect(page.locator('.tracker-reading-body')).toContainText('അല്ലാഹുമ്മ');
  await page.getByLabel('അറബി അക്ഷരവലുപ്പം').fill('64');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/tracker-malayalam-dark.png', fullPage: true });
});
test('reminders are opt-in and data deletion preserves original library', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tracker preferences' }).click();
  await expect(page.getByText(/while Adkar is open/)).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: 'Morning Adhkar', exact: true }),
  ).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Morning Adhkar', exact: true }).check();
  await page.reload();
  await page.getByRole('button', { name: 'Tracker preferences' }).click();
  await expect(page.getByRole('checkbox', { name: 'Morning Adhkar', exact: true })).toBeChecked();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export data' }).click();
  expect((await download).suggestedFilename()).toMatch(/^adkar-.*\.json$/);
  await page.getByRole('button', { name: 'Clear all tracker data' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Morning Adhkar', exact: true }),
  ).not.toBeChecked();
  await page.getByRole('link', { name: /Library/ }).click();
  await expect(page.getByText('Ayatul Kursi', { exact: true })).toBeVisible();
});
