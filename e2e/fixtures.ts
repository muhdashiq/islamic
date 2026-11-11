import { test as base, expect, type Page } from '@playwright/test';

// Existing feature tests use a returning-user profile. First-use setup is tested
// separately in onboarding.spec.ts with an untouched browser context.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      if (localStorage.getItem('adkar-state') === null)
        localStorage.setItem('adkar-state', JSON.stringify({ onboardingComplete: true }));
    });
    await use(page);
  },
});
export { expect };

export async function setLanguage(page: Page, language: string) {
  const hash = new URL(page.url()).hash || '#today';
  await page.locator('a[href="#settings"]').click();
  await page.locator('#app-language').selectOption(language);
  await page.evaluate((hash) => {
    location.hash = hash;
  }, hash);
}
