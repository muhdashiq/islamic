import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { bundledCatalog, fetchCatalog, loadCatalog } from './catalog';
beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());
it('retains bundled content when persisted content is corrupt', () => {
  localStorage.setItem('adkar-catalog', '{broken');
  expect(loadCatalog()).toEqual(bundledCatalog);
});
it('rejects invalid network updates without replacing a working catalog', async () => {
  localStorage.setItem('adkar-catalog', JSON.stringify(bundledCatalog));
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ version: 3, entries: [] }))),
  );
  await expect(fetchCatalog()).rejects.toThrow();
  expect(loadCatalog()).toEqual(bundledCatalog);
});
it('imports valid entries and will not downgrade a newer catalog', async () => {
  const newer = {
    version: 4,
    entries: [...bundledCatalog.entries, { ...bundledCatalog.entries[0]!, id: 'new-entry' }],
  };
  localStorage.setItem('adkar-catalog', JSON.stringify(newer));
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(bundledCatalog))),
  );
  expect((await fetchCatalog()).version).toBe(4);
});
