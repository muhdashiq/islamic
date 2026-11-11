import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test('primary screens and add sheet pass accessibility checks in light and dark', async ({
  page,
}) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    for (const view of ['today', 'library', 'settings']) {
      await page.goto(`/#${view}`);
      await expect(page.locator('main h1')).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
        `${colorScheme} ${view}`,
      ).toEqual([]);
    }
    await page.goto('/#library');
    await page.getByRole('main').getByRole('button', { name: 'Add Adkar', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Add Adkar' })).toBeVisible();
    await page.getByRole('dialog', { name: 'Add Adkar' }).evaluate(async (dialog) => {
      await Promise.all(dialog.getAnimations().map((animation) => animation.finished));
    });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
      `${colorScheme} sheet`,
    ).toEqual([]);
    await page.keyboard.press('Escape');
  }
});
