import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('first-use language setup persists and language moves exclusively to Settings', async ({
  page,
}) => {
  await page.goto('/');
  const onboarding = page.getByRole('dialog', { name: 'Welcome to Adkar' });
  await expect(onboarding).toBeVisible();
  await onboarding.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations({ subtree: true }).map((animation) => animation.finished),
    );
  });
  expect((await new AxeBuilder({ page }).include('dialog[open]').analyze()).violations).toEqual([]);
  await page.locator('#onboarding-language').selectOption('ml');
  await expect(page.getByRole('dialog', { name: 'അദ്കാറിലേക്ക് സ്വാഗതം' })).toBeVisible();
  await page.getByRole('button', { name: 'തുടരുക', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ml');
  await expect(page.locator('.topbar select')).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(0);
  await expect(page.locator('.tracker-heading')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ml');
  await page.locator('a[href="#settings"]').click();
  await expect(page.locator('#app-language')).toHaveValue('ml');
  await page.locator('#app-language').selectOption('en');
  await page.locator('a[href="#history"]').click();
  await expect(page.getByRole('heading', { name: 'History', exact: true })).toBeVisible();
  await expect(page.locator('a[href="#history"]')).toHaveAttribute('aria-current', 'page');
  await page.locator('.topbar a[href="#reminders"]').click();
  await expect(page.getByRole('heading', { name: 'Reminders', exact: true })).toBeVisible();
  await expect(page.getByText(/Optional device-time reminders/)).toBeVisible();
  await page.locator('.main-nav a[href="#today"]').click();
  await expect(page.locator('.tracker-welcome')).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  await expect(page.locator('.main-nav a')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.main-nav a[href="#history"]')).toBeInViewport();
  await page.screenshot({ path: 'test-results/compact-dashboard.png' });
});

test('existing saved users retain their language and skip onboarding', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'adkar-state',
      JSON.stringify({
        lang: 'ar',
        days: { '2026-11-10': { 'ayatul-kursi': 3 } },
        bookmarks: ['ayatul-kursi'],
      }),
    ),
  );
  await page.goto('/');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.topbar select')).toHaveCount(0);
  await page.locator('a[href="#history"]').click();
  await expect(page.getByRole('heading', { name: 'السجل', exact: true })).toBeVisible();
});
