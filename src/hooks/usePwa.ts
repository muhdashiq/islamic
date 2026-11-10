import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export type OfflineStatus = 'preparing' | 'ready' | 'unavailable';
export function usePwa() {
  const [online, setOnline] = useState(navigator.onLine);
  const [offline, setOffline] = useState<OfflineStatus>('preparing');
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(
    () =>
      matchMedia('(display-mode: standalone)').matches ||
      !!(navigator as Navigator & { standalone?: boolean }).standalone,
  );
  const registration = useRef<ServiceWorkerRegistration | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    let reloadRequested = false;
    let reloadTimer: ReturnType<typeof setTimeout> | undefined;
    const maybeReload = () => {
      const focused = document.activeElement;
      const editing =
        focused instanceof HTMLInputElement ||
        focused instanceof HTMLTextAreaElement ||
        focused instanceof HTMLSelectElement;
      if (reloadRequested && !editing && !document.querySelector('dialog[open]'))
        window.location.reload();
    };
    const afterInteraction = () => {
      clearTimeout(reloadTimer);
      reloadTimer = setTimeout(maybeReload, 0);
    };
    document.addEventListener('focusout', afterInteraction);
    document.addEventListener('close', afterInteraction, true);
    const onOnline = () => setOnline(navigator.onLine);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOnline);
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) setOffline('unavailable');
    else
      registerSW({
        immediate: true,
        onNeedReload() {
          if (alive) {
            reloadRequested = true;
            maybeReload();
          }
        },
        onOfflineReady() {
          if (alive) setOffline('ready');
        },
        onRegisteredSW(_url, reg) {
          registration.current = reg;
          if (reg?.active && navigator.serviceWorker.controller && alive) setOffline('ready');
        },
        onRegisterError() {
          if (alive) setOffline('unavailable');
        },
      });
    return () => {
      alive = false;
      clearTimeout(reloadTimer);
      document.removeEventListener('focusout', afterInteraction);
      document.removeEventListener('close', afterInteraction, true);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOnline);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const update = useCallback(async () => {
    await registration.current?.update();
  }, []);
  const install = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }, [installEvent]);
  return { online, offline, installed, canInstall: !!installEvent, install, update };
}
