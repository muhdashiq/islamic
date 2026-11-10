import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

// Serve two real release manifests without rewriting the production build.
// This exercises the browser's service-worker lifecycle, not a mocked hook.
test('a new release activates automatically and keeps saved progress', async ({ page }) => {
  let release = 1;
  const root = path.resolve('dist');
  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    const name = pathname === '/' ? 'index.html' : pathname.slice(1);
    const file = path.resolve(root, name);
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      let bytes = await readFile(file);
      if (release === 2 && name === 'index.html')
        bytes = Buffer.from(
          bytes.toString().replace('</head>', '<meta name="release-test" content="2" /></head>'),
        );
      if (release === 2 && name === 'sw.js')
        bytes = Buffer.from(
          bytes
            .toString()
            .replace(
              /url:"index.html",revision:"[^"]+"/,
              'url:"index.html",revision:"release-test-2"',
            ),
        );
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.webmanifest': 'application/manifest+json',
      };
      res.writeHead(200, {
        'Content-Type': types[path.extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(bytes);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server');
  try {
    await page.goto(`http://127.0.0.1:${address.port}/#recitation/ayatul-kursi`);
    await expect(page.locator('.sidebar-offline')).toContainText('Available offline');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.getByRole('button', { name: 'Mark as recited' }).click();
    await page.getByRole('link', { name: /Library/ }).click();
    await page.getByRole('main').getByRole('button', { name: 'Add Adkar', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Add Adkar' });
    await dialog.getByLabel('Title', { exact: true }).fill('A draft during an update');
    await dialog.getByLabel('Arabic text', { exact: true }).fill('سُبْحَانَ اللَّهِ');
    release = 2;
    await page.evaluate(async () => {
      const changed = new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
      await changed;
    });
    await expect(dialog.getByLabel('Title', { exact: true })).toHaveValue(
      'A draft during an update',
    );
    await expect(page.locator('meta[name="release-test"]')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Save to library' }).click();
    await expect(page.locator('meta[name="release-test"]')).toHaveAttribute('content', '2', {
      timeout: 20000,
    });
    await expect(page.getByText('A draft during an update', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Ayatul Kursi/ }).click();
    await expect(page.getByRole('button', { name: 'Recited', exact: true })).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
