import { describe, expect, it } from 'vitest';
import { libraryEntries } from './library';
import { quranPlaylist, verseParts, verseRecording } from './quran-audio';
import { recitationSchema } from './schema';
import { segmentAt } from './audio';
import timings from '../data/quran-audio.json';

describe('Quran audio/text alignment', () => {
  it('provides matching recording/timestamps for every bundled Quran verse', () => {
    const keys = new Set<string>();
    for (const entry of libraryEntries.filter((entry) => entry.quran)) {
      const playlist = quranPlaylist(entry);
      expect(playlist).toHaveLength(entry.verses!.length);
      for (const verse of playlist) {
        keys.add(verse.key);
        expect(recitationSchema.safeParse(verse.recording).success, verse.key).toBe(true);
        expect(
          verse.recording.segments.every(([, after]) => after <= verse.words.length),
          verse.key,
        ).toBe(true);
        expect(verse.recording.url).toMatch(
          /https:\/\/everyayah.com\/data\/Alafasy_128kbps\/\d{6}\.mp3$/,
        );
        expect(verse.words.join(' ')).toBe(verse.text);
      }
    }
    expect(keys.size).toBe(448);
  });
  it('separates the unnumbered basmalah without shifting first-verse highlights', () => {
    const entry = libraryEntries.find((entry) => entry.id === 'ikhlas')!;
    const first = quranPlaylist(entry)[0]!;
    expect(first.words).toHaveLength(4);
    expect(`${first.basmalah} ${first.text}`).toBe(entry.verses![0]!.text);
    expect(first.words[0]).toBe('قُلْ');
    expect(segmentAt(first.recording.segments, 0.1)).toBe(0);
    const fatihah = libraryEntries.find((entry) => entry.id === 'fatihah')!;
    expect(verseParts('1:1', fatihah.verses![0]!.text).basmalah).toBeUndefined();
    expect(quranPlaylist(fatihah)[0]?.words).toHaveLength(4);
  });
  it('retains the original Ayat al-Kursi URL for offline recordings', () => {
    const entry = libraryEntries.find((entry) => entry.id === 'ayatul-kursi')!;
    expect(quranPlaylist(entry)[0]?.recording).toBe(entry.recitation);
    expect(verseRecording('2:255').segments).toEqual(entry.recitation?.segments);
  });
  it('does not invent precision for overlapping or omitted timing spans', () => {
    expect(timings.adaptations.nonPositiveSpansOmitted).toEqual(['18:42', '2:164', '2:249']);
    const segment = verseRecording('2:20').segments.find(([first, after]) => after - first > 1);
    expect(segment).toBeDefined();
    expect(segmentAt(verseRecording('112:1').segments, 0)).toBe(-1);
    const last = verseRecording('2:181').segments.at(-1)!;
    expect(segmentAt(verseRecording('2:181').segments, last[3] / 1000 + 0.1)).toBe(-1);
  });
});
