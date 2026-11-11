import { expect, test } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import { recordingFixture } from './audio-fixture';

async function audioFixture(page: import('@playwright/test').Page) {
  const body = recordingFixture(5);
  await page.route('https://everyayah.com/data/Alafasy_128kbps/*.mp3', (route) =>
    route.fulfill({
      status: 200,
      body,
      headers: {
        'content-type': 'audio/wav',
        'content-length': String(body.length),
        'access-control-allow-origin': '*',
        'accept-ranges': 'bytes',
      },
    }),
  );
}

test('continuous Surah text follows timed words and advances through its audio playlist', async ({
  page,
  context,
}) => {
  await audioFixture(page);
  await page.goto('/#recitation/ikhlas');
  await expect(page.locator('.quran-verse')).toHaveCount(4);
  await expect(page.locator('.quran-passage')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.quran-verse').first()).toHaveCSS('display', 'inline');
  await expect(page.locator('.quran-basmalah')).toBeVisible();
  await expect(page.locator('.quran-verse').first().locator('[data-word="0"]')).toHaveText('قُلْ');
  const play = page.getByRole('button', { name: 'Play recitation', exact: true });
  await expect(play).toBeEnabled();
  await play.click();
  await expect(page.locator('.audio-save-status')).toHaveText('Saved for offline listening');
  await page.getByRole('button', { name: 'Pause recitation', exact: true }).click();
  await page.getByRole('slider', { name: 'Seek recitation' }).fill('1');
  await expect(page.locator('[data-verse="112:1"] [data-word="2"]')).toHaveClass(/is-current/);
  await play.click();
  await page.locator('audio').evaluate((el) => {
    (el as HTMLAudioElement).currentTime = 4.8;
  });
  await expect(page.getByRole('combobox', { name: 'Select ayah' })).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Pause recitation', exact: true })).toBeVisible();
  await expect(page.locator('.audio-save-status')).toHaveText('Saved for offline listening');
  await expect(page.locator('.quran-verse.is-playing-verse')).toHaveAttribute(
    'data-verse',
    '112:2',
  );
  await page.getByRole('button', { name: 'Pause recitation', exact: true }).click();
  await page.getByRole('combobox', { name: 'Select ayah' }).selectOption('3');
  await expect(play).toBeEnabled();
  await play.click();
  await page.locator('audio').evaluate((el) => {
    (el as HTMLAudioElement).currentTime = 4.8;
  });
  await expect(play).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Select ayah' })).toHaveValue('3');
  await page.getByRole('combobox', { name: 'Select ayah' }).selectOption('0');
  await expect(page.locator('.audio-save-status')).toHaveText('Saved for offline listening');
  await expect(page.locator('.sidebar-offline')).toContainText('Available offline');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.quran-verse')).toHaveCount(4);
  await expect(page.locator('.audio-save-status')).toHaveText('Saved for offline listening');
  await play.click();
  await expect(page.getByRole('button', { name: 'Pause recitation', exact: true })).toBeVisible();
  await context.setOffline(false);
});

test('Quran audio is available in category readers without completing recitation counts', async ({
  page,
}) => {
  await audioFixture(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Morning Adhkar/ }).click();
  await expect(page.getByRole('button', { name: 'Play recitation', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Play recitation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause recitation', exact: true })).toBeVisible();
  await expect(page.locator('.tracker-counter [role=status]')).toContainText('0 / 1');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Select ayah' })).toHaveValue('0');
  await expect(page.getByRole('button', { name: 'Play recitation', exact: true })).toBeVisible();
  await expect(page.locator('.tracker-counter [role=status]')).toContainText('0 / 3');
  expect((await new AxeBuilder({ page }).include('.tracker-reader').analyze()).violations).toEqual(
    [],
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('.quran-verse')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/quran-continuous-mobile.png', fullPage: true });
});
