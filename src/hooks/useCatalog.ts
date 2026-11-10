import { useCallback, useEffect, useState } from 'react';
import { fetchCatalog, loadCatalog } from '../lib/catalog';
export type UpdateStatus = 'idle' | 'checking' | 'success' | 'offline' | 'error';
export function useCatalog(online: boolean, updateApp: () => Promise<void>) {
  const [catalog, setCatalog] = useState(loadCatalog);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const refresh = useCallback(
    async (manual = false) => {
      if (!navigator.onLine) {
        if (manual) setStatus('offline');
        return;
      }
      if (manual) setStatus('checking');
      try {
        const [, next] = await Promise.all([updateApp(), fetchCatalog()]);
        setCatalog(next);
        if (manual) setStatus('success');
      } catch {
        if (manual) setStatus('error');
      }
    },
    [updateApp],
  );
  useEffect(() => {
    if (online) void refresh();
    const visible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 3_600_000);
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [online, refresh]);
  return { catalog, status, refresh };
}
