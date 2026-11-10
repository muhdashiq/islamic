import { z } from 'zod';

export const languageSchema = z.enum(['en', 'ml', 'hi', 'ar']);
export type Language = z.infer<typeof languageSchema>;
export type Theme = 'system' | 'light' | 'dark';
const localizedText = z.object({
  en: z.string().max(12000).optional(),
  ml: z.string().max(12000).optional(),
  hi: z.string().max(12000).optional(),
  ar: z.string().max(12000).optional(),
});
export const entrySchema = z.object({
  id: z.string().min(1).max(150),
  title: localizedText.extend({ en: z.string().trim().min(1).max(120) }),
  arabic: z.string().trim().min(1).max(12000),
  meaning: localizedText.default({}),
  reference: z.string().max(200).optional(),
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
  lang: languageSchema.catch('en'),
  theme: z.enum(['system', 'light', 'dark']).catch('system'),
  target: z.number().int().min(1).max(1000).catch(1),
  fontSize: z.number().int().min(22).max(44).catch(30),
  days: z
    .record(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.record(z.string(), z.number().int().nonnegative()),
    )
    .catch({}),
  custom: z.array(entrySchema).catch([]),
  bookmarks: z.array(z.string()).catch([]),
  defaultMeaning: z.boolean().catch(false),
});
export type AppState = z.infer<typeof stateSchema>;
export const DEFAULT_STATE: AppState = stateSchema.parse({});
export function parseState(value: unknown): AppState {
  const result = stateSchema.safeParse(value);
  return result.success ? result.data : { ...DEFAULT_STATE };
}
