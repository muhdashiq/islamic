import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { parseState } from './schema';
import {
  sessions,
  sessionProgress,
  trackerCount,
  writeTrackerCount,
  resume,
  reminderDue,
  periodKey,
} from './tracker';
import { recitations, references } from './tracker-content';
import quran from '../data/quran.json';
const day = '2026-11-10';
const morning = sessions()[0]!;
const item = morning.items[1]!;
describe('versioned source content', () => {
  it('pins the verbatim Arabic corpus and all verse ranges', () => {
    expect(Object.keys(quran.verses)).toHaveLength(448);
    expect(createHash('sha256').update(JSON.stringify(quran.verses)).digest('hex')).toBe(
      'a68a2b10db787d5626f16fb7cf30ddfe761b9bbe65e582bc80c5082070429bce',
    );
    expect(recitations.baqarah?.verses).toHaveLength(286);
    expect(recitations.kahf?.verses).toHaveLength(110);
    expect(recitations.mulk?.verses).toHaveLength(30);
    expect(recitations['last-two']?.verses?.map((v) => v.key)).toEqual(['2:285', '2:286']);
    for (const s of sessions())
      for (const i of s.items) {
        expect(recitations[i.id]).toBeDefined();
        for (const id of recitations[i.id]!.references)
          expect(references[id]?.url).toMatch(/^https:\/\/sunnah.com\//);
      }
  });
  it('keeps required counts contextual and alternatives independent', () => {
    expect(morning.items).toHaveLength(8);
    expect(sessions().find((s) => s.id === 'evening')?.items).toHaveLength(8);
    for (const s of sessions().filter((s) =>
      ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(s.id),
    )) {
      expect(s.items.find((i) => i.id === 'akbar')?.target).toBe(33);
      expect(s.items.find((i) => i.id === 'tawhid')?.target).toBe(1);
      expect(s.items.find((i) => i.id === 'ikhlas')?.target).toBe(1);
    }
    expect(sessions('34')[1]?.items.find((i) => i.id === 'akbar')?.target).toBe(34);
    expect(sessions('34')[1]?.items.some((i) => i.id === 'tawhid')).toBe(false);
    expect(
      sessions()
        .find((s) => s.id === 'bedtime')
        ?.items.find((i) => i.id === 'akbar')?.target,
    ).toBe(34);
    expect(recitations.raditu?.note).toContain('not a verified prescribed count');
    expect(recitations.kursi?.note).toContain('not equivalent');
  });
});
describe('offline tracker state', () => {
  it('migrates without touching existing progress and restores JSON round trips', () => {
    const old = parseState({ days: { [day]: { 'ayatul-kursi': 7 } }, bookmarks: ['ayatul-kursi'] });
    const saved = writeTrackerCount(old, morning, item, day, 2);
    const loaded = parseState(JSON.parse(JSON.stringify(saved)));
    expect(trackerCount(loaded.tracker, morning, item, day)).toBe(2);
    expect(loaded.days[day]?.['ayatul-kursi']).toBe(7);
    expect(loaded.bookmarks).toEqual(['ayatul-kursi']);
    expect(resume(loaded.tracker, day)?.item.id).toBe(item.id);
  });
  it('isolates sessions, local dates and formula progress, caps counts', () => {
    let state = writeTrackerCount(parseState({}), morning, item, day, 999);
    expect(trackerCount(state.tracker, morning, item, day)).toBe(3);
    expect(trackerCount(state.tracker, morning, item, '2026-11-11')).toBe(0);
    const evening = sessions().find((s) => s.id === 'evening')!;
    expect(trackerCount(state.tracker, evening, item, day)).toBe(0);
    const fajr = sessions()[1]!;
    const akbar = fajr.items.find((i) => i.id === 'akbar')!;
    state = writeTrackerCount(state, fajr, akbar, day, 24);
    state = { ...state, tracker: { ...state.tracker, formula: '34' } };
    expect(trackerCount(state.tracker, sessions('34')[1]!, { ...akbar, target: 34 }, day)).toBe(0);
    state = { ...state, tracker: { ...state.tracker, formula: '33+tawhid' } };
    expect(trackerCount(state.tracker, fajr, akbar, day)).toBe(24);
    expect(sessionProgress(state.tracker, morning, day).completed).toBe(1);
  });
  it('rolls weekly Quran over on Monday with local date arithmetic', () => {
    const weekly = sessions().at(-1)!;
    expect(periodKey(weekly, '2026-11-13')).toBe('2026-11-09');
    const s = writeTrackerCount(parseState({}), weekly, weekly.items[0]!, '2026-11-13', 1);
    expect(trackerCount(s.tracker, weekly, weekly.items[0]!, '2026-11-15')).toBe(1);
    expect(trackerCount(s.tracker, weekly, weekly.items[0]!, '2026-11-16')).toBe(0);
  });
});
describe('personal-time reminders', () => {
  it('uses current local wall time, suppresses completed, duplicate, and missed reminders', () => {
    let state = parseState({
      tracker: { reminders: { morning: { enabled: true, time: '08:00' } } },
    });
    const now = new Date(2026, 10, 10, 8, 0);
    expect(reminderDue(state.tracker, morning, now)).toBe(true);
    expect(reminderDue(state.tracker, morning, new Date(2026, 10, 10, 9, 0))).toBe(false);
    state = { ...state, tracker: { ...state.tracker, notified: [day + ':morning'] } };
    expect(reminderDue(state.tracker, morning, now)).toBe(false);
    state = { ...state, tracker: { ...state.tracker, notified: [] } };
    for (const i of morning.items) state = writeTrackerCount(state, morning, i, day, i.target);
    expect(reminderDue(state.tracker, morning, now)).toBe(false);
  });
  it('only reminds about Al-Kahf on Friday and stops after its completion', () => {
    const weekly = sessions().at(-1)!;
    let s = parseState({ tracker: { reminders: { weekly: { enabled: true, time: '08:00' } } } });
    expect(reminderDue(s.tracker, weekly, new Date(2026, 10, 12, 8))).toBe(false);
    expect(reminderDue(s.tracker, weekly, new Date(2026, 10, 13, 8))).toBe(true);
    s = writeTrackerCount(s, weekly, weekly.items[0]!, '2026-11-13', 1);
    expect(reminderDue(s.tracker, weekly, new Date(2026, 10, 13, 8))).toBe(false);
  });
});
