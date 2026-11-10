import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useTheme } from './useTheme';
it('follows live system changes and respects an explicit override', () => {
  let dark = false;
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return dark;
      },
      addEventListener: (_name: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_name: string, fn: () => void) => listeners.delete(fn),
    })),
  );
  const { result, rerender, unmount } = renderHook(
    ({ theme }: { theme: 'system' | 'light' | 'dark' }) => useTheme(theme),
    { initialProps: { theme: 'system' } },
  );
  expect(result.current).toBe(false);
  act(() => {
    dark = true;
    listeners.forEach((fn) => fn());
  });
  expect(result.current).toBe(true);
  rerender({ theme: 'light' });
  expect(result.current).toBe(false);
  expect(document.documentElement.dataset.theme).toBe('light');
  rerender({ theme: 'dark' });
  expect(result.current).toBe(true);
  unmount();
  expect(listeners.size).toBe(0);
  vi.unstubAllGlobals();
});
