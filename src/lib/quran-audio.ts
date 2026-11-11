import timings from '../data/quran-audio.json';
import type { Entry, Recitation } from './schema';
import { arabicWords } from './audio';

export function verseParts(key: string, text: string) {
  const [surah, ayah] = key.split(':').map(Number);
  // Tanzil includes an unnumbered basmalah in the first verse of these Surahs.
  // Display it above the passage, keeping both substrings verbatim.
  const prefix = surah !== 1 && ayah === 1 ? text.match(/^\S+(?:\s+\S+){3}\s+/u)?.[0] : undefined;
  return { basmalah: prefix?.trimEnd(), text: prefix ? text.slice(prefix.length) : text };
}
const cache = new Map<string, Recitation>();
export function verseRecording(key: string): Recitation {
  const cached = cache.get(key);
  if (cached) return cached;
  const [surah, ayah] = key.split(':').map(Number);
  const segments = (timings.verses as Record<string, number[][]>)[key];
  if (!segments?.length) throw new Error(`Missing Quran audio timing: ${key}`);
  const recording: Recitation = {
    id: `alafasy-128-${surah}-${ayah}-v1`,
    reciter: {
      en: 'Mishary Rashid Alafasy',
      ml: 'മിശാരി റാഷിദ് അൽ അഫാസി',
      hi: 'मिशारी राशिद अल-अफ़ासी',
      ar: 'مشاري راشد العفاسي',
    },
    url: `https://everyayah.com/data/Alafasy_128kbps/${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`,
    source: 'https://everyayah.com/',
    timingSource: timings.source,
    timingNotes: timings.adaptations.nonPositiveSpansOmitted.includes(key)
      ? 'Non-positive timing spans omitted; those words are not highlighted.'
      : undefined,
    segments: segments as Recitation['segments'],
  };
  cache.set(key, recording);
  return recording;
}
export function quranPlaylist(entry: Entry) {
  return (entry.verses ?? []).map((verse) => {
    const parts = verseParts(verse.key, verse.text);
    const recording =
      entry.recitation && entry.verses?.length === 1 ? entry.recitation : verseRecording(verse.key);
    const words = arabicWords(parts.text);
    if (recording.segments.some(([, after]) => after > words.length))
      throw new Error(`Quran timing exceeds word count: ${verse.key}`);
    return { ...verse, ...parts, words, recording };
  });
}
