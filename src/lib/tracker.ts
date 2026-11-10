import { z } from 'zod';
import type { AppState } from './schema';
import { dayKey } from './model';
export const trackerSchema = z.object({
  version: z.literal(1).default(1),
  counts: z
    .record(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.record(z.string(), z.number().int().min(0).max(1000)),
    )
    .catch({}),
  last: z.object({ session: z.string(), item: z.string() }).nullable().catch(null),
  transliteration: z.boolean().catch(false),
  language: z.enum(['en', 'ml']).catch('en'),
  haptics: z.boolean().catch(false),
  formula: z.enum(['33+tawhid', '34']).catch('33+tawhid'),
  reminders: z
    .record(
      z.string(),
      z.object({ enabled: z.boolean(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }),
    )
    .catch({}),
  notified: z.array(z.string()).catch([]),
});
export type TrackerState = z.infer<typeof trackerSchema>;
export interface SessionItem {
  id: string;
  target: number;
}
export interface Session {
  id: string;
  title: string;
  titleMl: string;
  time: string;
  items: SessionItem[];
  weekly?: boolean;
}
const i = (id: string, target = 1): SessionItem => ({ id, target });
const three = (target: number) => ['ikhlas', 'falaq', 'nas'].map((id) => i(id, target));
export function sessions(formula: TrackerState['formula'] = '33+tawhid'): Session[] {
  const prayer = [
    i('astaghfirullah', 3),
    i('salam'),
    i('kursi'),
    ...three(1),
    i('subhanallah', 33),
    i('alhamdulillah', 33),
    i('akbar', formula === '34' ? 34 : 33),
    ...(formula === '34' ? [] : [i('tawhid')]),
  ];
  return [
    {
      id: 'morning',
      title: 'Morning Adhkar',
      titleMl: 'പ്രഭാത അദ്കാർ',
      time: 'Morning · after Fajr is a convenient time',
      items: [
        i('kursi'),
        ...three(3),
        i('istighfar'),
        i('bismillah', 3),
        i('raditu', 3),
        i('praise', 100),
      ],
    },
    ...['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((title) => ({
      id: title.toLowerCase(),
      title: `After ${title}`,
      titleMl: `${{ Fajr: 'സുബ്ഹ്', Dhuhr: 'ദുഹ്ർ', Asr: 'അസർ', Maghrib: 'മഗ്‌രിബ്', Isha: 'ഇശാഅ്' }[title]} നമസ്കാര ശേഷം`,
      time: 'After the obligatory Salah',
      items: prayer,
    })),
    {
      id: 'evening',
      title: 'Evening Adhkar',
      titleMl: 'സായാഹ്ന അദ്കാർ',
      time: 'Evening · timing has scholarly differences; after Asr is a common choice',
      items: [
        i('kursi'),
        ...three(3),
        i('istighfar'),
        i('bismillah', 3),
        i('refuge', 3),
        i('praise', 100),
      ],
    },
    {
      id: 'bedtime',
      title: 'Before sleeping',
      titleMl: 'ഉറങ്ങുന്നതിന് മുമ്പ്',
      time: 'At bedtime · last two verses may be read during the night',
      items: [
        i('kursi'),
        i('last-two'),
        ...three(3),
        i('subhanallah', 33),
        i('alhamdulillah', 33),
        i('akbar', 34),
      ],
    },
    {
      id: 'weekly',
      title: 'Weekly & regular Quran',
      titleMl: 'ഖുർആൻ പാരായണം',
      time: 'Al-Kahf on Friday · other recitations at your own pace',
      weekly: true,
      items: [i('kahf'), i('mulk'), i('baqarah'), i('fatihah')],
    },
  ];
}
export function periodKey(session: Session, day: string) {
  if (!session.weekly) return day;
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return dayKey(date);
}
export function instanceKey(session: Session, item: SessionItem, formula: TrackerState['formula']) {
  // Changing formula preserves each alternative independently.
  const isPrayer = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(session.id);
  return `${session.id}:${isPrayer ? formula + ':' : ''}${item.id}`;
}
export function trackerCount(
  tracker: TrackerState,
  session: Session,
  item: SessionItem,
  day: string,
) {
  return Math.min(
    item.target,
    tracker.counts[periodKey(session, day)]?.[instanceKey(session, item, tracker.formula)] ?? 0,
  );
}
export function writeTrackerCount(
  state: AppState,
  session: Session,
  item: SessionItem,
  day: string,
  count: number,
): AppState {
  const key = periodKey(session, day);
  return {
    ...state,
    tracker: {
      ...state.tracker,
      last: { session: session.id, item: item.id },
      counts: {
        ...state.tracker.counts,
        [key]: {
          ...state.tracker.counts[key],
          [instanceKey(session, item, state.tracker.formula)]: Math.max(
            0,
            Math.min(item.target, Math.floor(count)),
          ),
        },
      },
    },
  };
}
export function sessionProgress(tracker: TrackerState, session: Session, day: string) {
  const completed = session.items.filter(
    (item) => trackerCount(tracker, session, item, day) >= item.target,
  ).length;
  return {
    completed,
    total: session.items.length,
    percent: Math.round((completed / session.items.length) * 100),
  };
}
export function resume(tracker: TrackerState, day: string) {
  const all = sessions(tracker.formula);
  const last = all.find((s) => s.id === tracker.last?.session);
  if (last) {
    const item = last.items.find((i) => i.id === tracker.last?.item);
    if (item && trackerCount(tracker, last, item, day) < item.target)
      return { session: last, item };
    const unfinished = last.items.find((i) => trackerCount(tracker, last, i, day) < i.target);
    if (unfinished) return { session: last, item: unfinished };
  }
  for (const session of all) {
    const item = session.items.find((i) => trackerCount(tracker, session, i, day) < i.target);
    if (item) return { session, item };
  }
  return null;
}
export function reminderDue(tracker: TrackerState, session: Session, now: Date) {
  const reminder = tracker.reminders[session.id];
  if (!reminder?.enabled || (session.weekly && now.getDay() !== 5)) return false;
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const key = `${dayKey(now)}:${session.id}`;
  // No catch-up bursts after sleep, reload or timezone travel.
  const complete = session.weekly
    ? trackerCount(tracker, session, session.items[0]!, dayKey(now)) >= 1
    : sessionProgress(tracker, session, dayKey(now)).percent === 100;
  return reminder.time === time && !complete && !tracker.notified.includes(key);
}
