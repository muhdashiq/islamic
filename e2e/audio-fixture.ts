import type { Page } from '@playwright/test';

/** A local silent WAV exercises real browser decoding without relying on an external CDN. */
export function recordingFixture(seconds = 52): Buffer {
  const rate = 8000;
  const bytes = seconds * rate * 2;
  const wav = Buffer.alloc(44 + bytes);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + bytes, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(bytes, 40);
  return wav;
}
export async function mockRecording(page: Page): Promise<void> {
  const body = recordingFixture();
  await page.route('https://everyayah.com/data/Alafasy_128kbps/002255.mp3', (route) => {
    const match = route
      .request()
      .headers()
      .range?.match(/^bytes=(\d+)-(\d*)$/);
    const start = match ? Number(match[1]) : 0;
    const end = match?.[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
    const partial = body.subarray(start, end + 1);
    return route.fulfill({
      status: match ? 206 : 200,
      body: partial,
      headers: {
        'content-type': 'audio/wav',
        'content-length': String(partial.length),
        'access-control-allow-origin': '*',
        'accept-ranges': 'bytes',
        ...(match ? { 'content-range': `bytes ${start}-${end}/${body.length}` } : {}),
      },
    });
  });
}
