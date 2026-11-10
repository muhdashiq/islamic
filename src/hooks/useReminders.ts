import { useEffect, useRef } from 'react';
import { useAppState, updateState } from '../lib/store';
import { reminderDue, sessions } from '../lib/tracker';
import { dayKey } from '../lib/model';
export function useReminders() {
  const { tracker } = useAppState();
  const running = useRef(false);
  useEffect(() => {
    let active = true;
    const check = async () => {
      if (running.current || !active) return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      running.current = true;
      try {
        const now = new Date();
        for (const session of sessions(tracker.formula)) {
          if (!reminderDue(tracker, session, now)) continue;
          const key = `${dayKey(now)}:${session.id}`;
          try {
            const registration = await navigator.serviceWorker?.getRegistration();
            if (!active) return;
            if (!registration) continue;
            await registration.showNotification('Adkar', {
              body: 'A quiet moment for remembrance, when you are ready.',
              tag: key,
            });
            updateState((s) => ({
              ...s,
              tracker: {
                ...s.tracker,
                notified: [...s.tracker.notified.filter((k) => k.startsWith(dayKey(now))), key],
              },
            }));
          } catch {
            /* Unsupported notifications remain explicitly labeled in preferences. */
          }
        }
      } finally {
        running.current = false;
      }
    };
    void check();
    const timer = window.setInterval(() => void check(), 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [tracker]);
}
