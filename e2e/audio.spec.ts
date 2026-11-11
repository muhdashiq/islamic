import AxeBuilder from '@axe-core/playwright';
import { expect, test, setLanguage } from './fixtures';
import { mockRecording } from './audio-fixture';

test('playback highlights timed words, supports media controls and persists offline audio', async ({
  page,
  context,
}) => {
  await mockRecording(page);
  let requests = 0;
  page.on('request', (request) => {
    if (request.url().includes('everyayah.com')) requests++;
  });
  await page.goto('/#recitation/ayatul-kursi');
  const play = page.getByRole('button', { name: 'Play recitation', exact: true });
  await expect(play).toBeEnabled();
  expect(requests).toBe(0);
  await play.click();
  await expect(page.getByRole('button', { name: 'Pause recitation', exact: true })).toBeVisible();
  await expect(page.locator('.audio-save-status')).toHaveText('Saved for offline listening');
  await expect(page.locator('.verse-word.is-current')).toHaveCount(1);
  await expect(page.getByRole('progressbar', { name: 'TODAY’S PROGRESS' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await page.getByRole('combobox', { name: 'Playback speed' }).selectOption('1.5');
  expect(await page.locator('audio').evaluate((el) => (el as HTMLAudioElement).playbackRate)).toBe(
    1.5,
  );
  await page.getByRole('button', { name: 'Repeat verse', exact: true }).click();
  expect(await page.locator('audio').evaluate((el) => (el as HTMLAudioElement).loop)).toBe(true);
  await page.getByRole('button', { name: 'Pause recitation', exact: true }).click();
  await page.getByRole('slider', { name: 'Seek recitation' }).fill('20.5');
  await expect(page.locator('[data-word="22"]')).toHaveClass(/is-current/);
  await page.getByRole('button', { name: 'Restart verse', exact: true }).click();
  await expect(page.locator('.audio-times')).toContainText('0:00');
  await page.getByRole('button', { name: 'More audio controls' }).click();
  await page.getByRole('slider', { name: 'Volume', exact: true }).fill('0.5');
  expect(await page.locator('audio').evaluate((el) => (el as HTMLAudioElement).volume)).toBe(0.5);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'More audio controls' })).toBeFocused();
  await expect(page.locator('.sidebar-offline')).toContainText('Available offline');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.audio-save-status')).toHaveText('Saved for offline listening');
  expect(await page.locator('audio').getAttribute('src')).toMatch(/^blob:/);
  await page.getByRole('button', { name: 'Play recitation', exact: true }).click();
  await expect
    .poll(() => page.locator('audio').evaluate((el) => (el as HTMLAudioElement).currentTime))
    .toBeGreaterThan(0.1);
  await expect(page.locator('.verse-word.is-current')).toHaveCount(1);
  await page.getByRole('button', { name: 'Pause recitation', exact: true }).click();
  await page.getByRole('button', { name: 'More audio controls' }).click();
  await page.getByRole('button', { name: /Remove download/ }).click();
  await expect(page.locator('.audio-save-status')).toContainText('Saves on first play');
  await page.getByRole('button', { name: 'Play recitation', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Connect to the internet');
});

test('repeat loops at the end and navigation stops playback', async ({ page }) => {
  await mockRecording(page);
  await page.goto('/#recitation/ayatul-kursi');
  await page.getByRole('button', { name: 'Play recitation', exact: true }).click();
  await expect(page.locator('.audio-save-status')).toHaveText('Saved for offline listening');
  await page.getByRole('button', { name: 'Repeat verse', exact: true }).click();
  await page.getByRole('slider', { name: 'Seek recitation' }).fill('51.8');
  await expect
    .poll(() => page.locator('audio').evaluate((el) => (el as HTMLAudioElement).currentTime))
    .toBeLessThan(2);
  await expect(page.getByRole('button', { name: 'Pause recitation', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Library/ }).click();
  await expect
    .poll(() =>
      page.evaluate(() => [...document.querySelectorAll('audio')].some((audio) => !audio.paused)),
    )
    .toBe(false);
});

test('failed downloads show retry feedback without false saved status', async ({ page }) => {
  await page.route('https://everyayah.com/**', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.goto('/#recitation/ayatul-kursi');
  await page.getByRole('button', { name: 'Save audio offline' }).click();
  await expect(page.getByRole('alert')).toContainText('Couldn’t download');
  await expect(page.locator('.audio-save-status')).not.toHaveText('Saved for offline listening');
  await mockRecording(page);
  await page.getByRole('button', { name: 'Save audio offline' }).click();
  await expect(page.locator('.audio-save-status')).toHaveText('Saved for offline listening');
});

test('audio controls pass accessibility scans and fit small RTL and dark screens', async ({
  page,
}) => {
  await mockRecording(page);
  await page.goto('/#recitation/ayatul-kursi');
  await page.getByRole('button', { name: 'Save audio offline' }).click();
  await expect(page.locator('.audio-save-status')).toHaveText('Saved for offline listening');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.getByRole('button', { name: 'More audio controls' }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const results = await new AxeBuilder({ page })
        .include('.reading-card')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
      ).toEqual([]);
      await page.keyboard.press('Escape');
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByRole('button', { name: 'Play recitation', exact: true }).click();
  await page.locator('.audio-player').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/private/tmp/adkar-audio-mobile.png' });
  await page.getByRole('button', { name: 'Pause recitation', exact: true }).click();
  for (const lang of ['ar', 'ml', 'hi', 'en']) {
    await setLanguage(page, lang);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
