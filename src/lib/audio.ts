import type { Recitation } from './schema';

/** Pause marks stay with the preceding word and never consume a timing index. */
export function arabicWords(text: string): string[] {
  const words: string[] = [];
  for (const part of text.trim().split(/\s+/u)) {
    if (/[\u0621-\u064a\u0671]/u.test(part) || !words.length) words.push(part);
    else words[words.length - 1] += ` ${part}`;
  }
  return words;
}

/** Keep silence unhighlighted. Timings are media milliseconds, independent of speed. */
export function segmentAt(segments: Recitation['segments'], seconds: number): number {
  const ms = seconds * 1000;
  return segments.findIndex(([, , start, end]) => ms >= start && ms < end);
}
export function clock(seconds: number): string {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
