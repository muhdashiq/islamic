import { z } from 'zod';
import { arabicWords } from './audio';
import { trackerSchema } from './tracker';
import { bookmarkId } from './recitation-ids';

export const languageSchema = z.enum(['en', 'ml', 'hi', 'ar']);
export type Language = z.infer<typeof languageSchema>;
export type Theme = 'system' | 'light' | 'dark';
const localizedText = z.object({
  en: z.string().max(12000).optional(),
  ml: z.string().max(12000).optional(),
  hi: z.string().max(12000).optional(),
  ar: z.string().max(12000).optional(),
});
export const recitationSchema = z.object({
  id: z.string().min(1).max(150),
  reciter: localizedText.extend({ en: z.string().min(1).max(150) }),
  url: z.url().refine((url) => url.startsWith('https://'), 'Audio must use HTTPS'),
  bytes: z.number().int().positive().optional(),
  source: z.url(),
  timingSource: z.url(),
  timingNotes: z.string().max(300).optional(),
  segments: z
    .array(
      z.tuple([
        z.number().int().nonnegative(),
        z.number().int().positive(),
        z.number().int().nonnegative(),
        z.number().int().positive(),
      ]),
    )
    .min(1)
    .max(5000)
    .refine(
      (segments) =>
        segments.every(
          ([first, after, start, end], index) =>
            after > first && end > start && (index === 0 || start >= segments[index - 1]![3]),
        ),
      'Invalid audio timing ranges',
    ),
});
export type Recitation = z.infer<typeof recitationSchema>;
export const entrySchema = z
  .object({
    id: z.string().min(1).max(150),
    title: localizedText.extend({ en: z.string().trim().min(1).max(120) }),
    arabic: z.string().trim().min(1).max(250000),
    kind: z.enum(['surah', 'ayah', 'dua', 'dhikr']).optional(),
    verses: z
      .array(z.object({ key: z.string(), text: z.string() }))
      .max(286)
      .optional(),
    quran: z
      .object({
        surah: z.number().int().min(1).max(114),
        start: z.number().int().positive(),
        end: z.number().int().positive(),
      })
      .optional(),
    transliteration: z.object({ en: z.string(), ml: z.string() }).optional(),
    sourceVersion: z.string().optional(),
    meaning: localizedText.default({}),
    reference: z.string().max(200).optional(),
    recitation: recitationSchema.optional(),
  })
  .superRefine((entry, ctx) => {
    const count = arabicWords(entry.arabic).length;
    if (entry.recitation?.segments.some(([, after]) => after > count))
      ctx.addIssue({
        code: 'custom',
        path: ['recitation', 'segments'],
        message: 'Audio timings exceed verse word count',
      });
  });
export type Entry = z.infer<typeof entrySchema>;
export const catalogSchema = z.object({
  version: z.number().int().nonnegative(),
  entries: z
    .array(entrySchema)
    .min(1)
    .refine(
      (entries) => new Set(entries.map((e) => e.id)).size === entries.length,
      'Duplicate entry IDs',
    ),
});
export type Catalog = z.infer<typeof catalogSchema>;
export const stateSchema = z.object({
  schemaVersion: z.literal(2).default(2),
  tracker: trackerSchema.catch(() => trackerSchema.parse({})),
  onboardingComplete: z.boolean().catch(false),
  lang: languageSchema.catch('en'),
  theme: z.enum(['system', 'light', 'dark']).catch('system'),
  target: z.number().int().min(1).max(1000).catch(1),
  fontSize: z.number().int().min(22).max(64).catch(34),
  interfaceSize: z.enum(['standard', 'large', 'extra-large']).catch('large'),
  days: z
    .record(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.record(z.string(), z.number().int().nonnegative()),
    )
    .catch({}),
  custom: z.array(entrySchema).catch([]),
  bookmarks: z.array(z.string()).catch([]),
  defaultMeaning: z.boolean().catch(false),
  playbackRate: z.number().min(0.5).max(2).catch(1),
  audioLoop: z.boolean().catch(false),
  audioVolume: z.number().min(0).max(1).catch(1),
});
export type AppState = z.infer<typeof stateSchema>;
export const DEFAULT_STATE: AppState = stateSchema.parse({});
export function parseState(value: unknown): AppState {
  const result = stateSchema.safeParse(value);
  if (!result.success) return { ...DEFAULT_STATE };
  const legacyUser =
    typeof value === 'object' &&
    value !== null &&
    !('onboardingComplete' in value) &&
    Object.keys(value).length > 0;
  return {
    ...result.data,
    onboardingComplete: result.data.onboardingComplete || legacyUser,
    bookmarks: [...new Set(result.data.bookmarks.map(bookmarkId))],
  };
}
