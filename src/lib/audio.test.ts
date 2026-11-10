import { describe, expect, it, vi, afterEach } from 'vitest';
import { arabicWords, clock, segmentAt } from './audio';
import { bundledCatalog } from './catalog';
import { entrySchema } from './schema';
import { downloadRecording } from './audio-storage';
const entry = bundledCatalog.entries[0]!;
const recitation = entry.recitation!;
afterEach(() => vi.unstubAllGlobals());
describe('synchronized word timing', () => {
  it('preserves all verse text while excluding pause marks from the 50 timing indexes', () => {
    const words = arabicWords(entry.arabic);
    expect(words).toHaveLength(50);
    expect(words.join(' ')).toBe(entry.arabic);
    expect(recitation.segments).toHaveLength(50);
    recitation.segments.forEach(([start, after], index) => {
      expect(start).toBe(index);
      expect(after).toBe(index + 1);
    });
  });
  it('uses real media timestamps, leaves pauses unhighlighted and handles seeking backwards', () => {
    expect(segmentAt(recitation.segments, 0)).toBe(-1);
    expect(segmentAt(recitation.segments, 0.5)).toBe(0);
    expect(segmentAt(recitation.segments, 0.985)).toBe(-1);
    expect(segmentAt(recitation.segments, 42)).toBe(42);
    expect(segmentAt(recitation.segments, 0.5)).toBe(0);
    expect(segmentAt(recitation.segments, 52)).toBe(-1);
  });
  it('rejects timings extending beyond the verse or overlapping in time', () => {
    expect(
      entrySchema.safeParse({
        ...entry,
        recitation: { ...recitation, segments: [[0, 51, 0, 1000]] },
      }).success,
    ).toBe(false);
    expect(
      entrySchema.safeParse({
        ...entry,
        recitation: {
          ...recitation,
          segments: [
            [0, 1, 0, 1000],
            [1, 2, 500, 1500],
          ],
        },
      }).success,
    ).toBe(false);
  });
  it('formats media time without NaN or negative output', () => {
    expect(clock(61.9)).toBe('1:01');
    expect(clock(NaN)).toBe('0:00');
    expect(clock(-5)).toBe('0:00');
  });
});
describe('complete offline audio downloads', () => {
  it('accepts a full readable audio response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(new Uint8Array([1, 2, 3]), {
            headers: { 'content-type': 'audio/mpeg', 'content-length': '3' },
          }),
      ),
    );
    const blob = await downloadRecording(recitation.url, new AbortController().signal, vi.fn());
    expect(blob.size).toBe(3);
    expect(blob.type).toBe('audio/mpeg');
  });
  it('rejects truncated and partial HTTP responses instead of marking them saved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(new Uint8Array([1, 2]), {
            headers: { 'content-type': 'audio/mpeg', 'content-length': '3' },
          }),
      ),
    );
    await expect(
      downloadRecording(recitation.url, new AbortController().signal, vi.fn()),
    ).rejects.toThrow('Incomplete');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(new Uint8Array([1]), {
            status: 206,
            headers: { 'content-type': 'audio/mpeg' },
          }),
      ),
    );
    await expect(
      downloadRecording(recitation.url, new AbortController().signal, vi.fn()),
    ).rejects.toThrow('failed');
  });
  it('rejects an HTML error page returned with a successful HTTP code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('<html>Error</html>', { headers: { 'content-type': 'text/html' } }),
      ),
    );
    await expect(
      downloadRecording(recitation.url, new AbortController().signal, vi.fn()),
    ).rejects.toThrow('Invalid audio');
  });
});
