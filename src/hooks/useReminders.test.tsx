import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useReminders } from './useReminders';
import { updateState } from '../lib/store';
import { parseState } from '../lib/schema';
import { sessions, writeTrackerCount } from '../lib/tracker';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it('sends an opt-in local notification and persists deduplication across restarts', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 10, 8, 0));
  vi.stubGlobal('Notification', { permission: 'granted' });
  const showNotification = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', {
    serviceWorker: { getRegistration: vi.fn().mockResolvedValue({ showNotification }) },
  });
  act(() =>
    updateState(() =>
      parseState({ tracker: { reminders: { morning: { enabled: true, time: '08:00' } } } }),
    ),
  );
  const hook = renderHook(() => useReminders());
  await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1));
  expect(showNotification).toHaveBeenCalledWith(
    'Adkar',
    expect.objectContaining({ tag: '2026-11-10:morning' }),
  );
  hook.unmount();
  const restarted = renderHook(() => useReminders());
  await act(async () => {});
  expect(showNotification).toHaveBeenCalledTimes(1);
  restarted.unmount();
});
it('does not notify completed sessions or request permission on startup', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 10, 8, 0));
  const requestPermission = vi.fn();
  vi.stubGlobal('Notification', { permission: 'granted', requestPermission });
  const showNotification = vi.fn();
  vi.stubGlobal('navigator', {
    serviceWorker: { getRegistration: vi.fn().mockResolvedValue({ showNotification }) },
  });
  let state = parseState({ tracker: { reminders: { morning: { enabled: true, time: '08:00' } } } });
  const morning = sessions()[0]!;
  for (const item of morning.items)
    state = writeTrackerCount(state, morning, item, '2026-11-10', item.target);
  act(() => updateState(() => state));
  const hook = renderHook(() => useReminders());
  await act(async () => {});
  expect(showNotification).not.toHaveBeenCalled();
  expect(requestPermission).not.toHaveBeenCalled();
  hook.unmount();
});
