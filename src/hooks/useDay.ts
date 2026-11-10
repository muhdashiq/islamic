import { useEffect, useState } from 'react';
import { dayKey } from '../lib/model';
export function useDay(): string {
  const [day, setDay] = useState(dayKey);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      setDay(dayKey());
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(schedule, Math.min(midnight.getTime() - now.getTime() + 100, 60_000));
    };
    schedule();
    document.addEventListener('visibilitychange', schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, []);
  return day;
}
