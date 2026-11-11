import { expect, test } from './fixtures';

test('GitHub Pages subpath supports assets, catalog, installation and offline reload', async ({
  page,
  context,
}) => {
  const failures: string[] = [];
  const requestedPaths: string[] = [];
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.hostname === 'localhost' && response.status() >= 400) failures.push(url.pathname);
  });
  page.on('request', (request) => requestedPaths.push(new URL(request.url()).pathname));
  await page.goto('./#recitation/ayatul-kursi');
  await expect(page.getByRole('heading', { name: 'Ayatul Kursi' })).toBeVisible();
  await expect(page.locator('.sidebar-offline')).toContainText('Available offline');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/islamic/manifest.webmanifest',
  );
  const manifestResponse = await page.request.get('./manifest.webmanifest');
  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe('/islamic/');
  expect(manifest.scope).toBe('/islamic/');
  expect(manifest.icons.every((icon: { src: string }) => icon.src.startsWith('/islamic/'))).toBe(
    true,
  );
  expect(
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope),
  ).toBe('http://localhost:4174/islamic/');
  await expect.poll(() => requestedPaths.includes('/islamic/content.json')).toBe(true);
  expect(
    requestedPaths.some((path) => path === '/content.json' || path.startsWith('/assets/')),
  ).toBe(false);
  await page.getByRole('button', { name: 'Mark as recited' }).click();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ayatul Kursi' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recited', exact: true })).toBeVisible();
  expect(failures).toEqual([]);
});
