import bundled from '../../public/content.json';
import { entrySchema, type Entry } from './schema';
import { recitations } from './tracker-content';
import { libraryId } from './recitation-ids';
import { sessions } from './tracker';

// One content record per recitation. Category instances carry only IDs/counts.
// The old catalog supplies existing localized titles, meanings and audio metadata.
export const libraryEntries: Entry[] = Object.values(recitations).map((content) => {
  const id = libraryId(content.id);
  const original = bundled.entries.find((entry) => entry.id === id);
  return entrySchema.parse({
    id,
    title: original?.title ?? { en: content.title, ml: content.titleMl },
    arabic: content.arabic,
    kind: content.type,
    verses: content.verses,
    quran: content.surahNumber
      ? { surah: content.surahNumber, start: content.ayahStart, end: content.ayahEnd }
      : undefined,
    meaning: original?.meaning ?? {},
    reference: content.surahNumber
      ? `Quran ${content.surahNumber}:${content.ayahStart}${content.ayahEnd !== content.ayahStart ? '–' + content.ayahEnd : ''}`
      : undefined,
    transliteration: content.transliteration,
    recitation: original?.recitation,
    sourceVersion: content.sourceVersion,
  });
});
export const libraryById: Record<string, Entry> = Object.fromEntries(
  libraryEntries.map((entry) => [entry.id, entry]),
);

export function composeLibrary(catalog: Entry[]): Entry[] {
  // Never let a stale remote catalog replace the reviewed bundled text.
  const known = new Set(libraryEntries.map((entry) => entry.id));
  return [...libraryEntries, ...catalog.filter((entry) => !known.has(entry.id))];
}
export const libraryCategories = [
  { id: 'morning', title: 'Morning', titleMl: 'പ്രഭാതം', sessions: ['morning'] },
  {
    id: 'salah',
    title: 'After Salah',
    titleMl: 'നമസ്കാര ശേഷം',
    sessions: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
  },
  { id: 'evening', title: 'Evening', titleMl: 'സായാഹ്നം', sessions: ['evening'] },
  { id: 'bedtime', title: 'Bedtime', titleMl: 'ഉറങ്ങുന്നതിന് മുമ്പ്', sessions: ['bedtime'] },
  { id: 'weekly', title: 'Weekly & regular Quran', titleMl: 'ഖുർആൻ പാരായണം', sessions: ['weekly'] },
].map((category) => ({
  ...category,
  entryIds: new Set(
    sessions()
      .filter((session) => category.sessions.includes(session.id))
      .flatMap((session) => session.items.map((item) => item.recitationId!)),
  ),
}));
