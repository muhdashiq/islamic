import { describe, expect, it } from 'vitest';
import { countFor, dayKey, increment, mergeEntries, progress, setCount } from './model';
import { parseState, catalogSchema } from './schema';
import { bundledCatalog } from './catalog';
const entry = bundledCatalog.entries[0]!;
describe('daily progress', () => {
  it('uses local calendar dates and rolls counts over without deleting history', () => {
    const original = parseState({});
    const state = increment(original, entry.id, '2026-11-10');
    expect(countFor(original, entry.id, '2026-11-10')).toBe(0);
    expect(countFor(state, entry.id, '2026-11-10')).toBe(1);
    expect(countFor(state, entry.id, '2026-11-11')).toBe(0);
    expect(dayKey(new Date(2026, 0, 2, 0, 1))).toBe('2026-01-02');
  });
  it('calculates completion against the selected goal for every entry', () => {
    const state = increment(increment(parseState({ target: 2 }), entry.id), entry.id);
    expect(progress(state, [entry, { ...entry, id: 'second' }]).percent).toBe(50);
    expect(progress(setCount(state, entry.id, 0), [entry]).percent).toBe(0);
  });
  it('deduplicates catalog IDs while retaining personal entries', () => {
    expect(mergeEntries([entry], [entry, { ...entry, id: 'personal' }])).toHaveLength(2);
  });
});
describe('persisted data and content boundaries', () => {
  it('migrates original prototype state without losing progress or bookmarks', () => {
    const migrated = parseState({
      lang: 'ml',
      target: 3,
      fontSize: 29,
      days: { '2026-11-10': { 'ayatul-kursi': 2 } },
      custom: [],
      bookmarks: ['ayatul-kursi'],
    });
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.theme).toBe('system');
    expect(migrated.days['2026-11-10']?.['ayatul-kursi']).toBe(2);
    expect(migrated.bookmarks).toContain('ayatul-kursi');
  });
  it('recovers invalid preferences and rejects malformed custom text', () => {
    const state = parseState({
      theme: 'unknown',
      lang: 'unknown',
      target: -3,
      custom: [{ id: 'bad' }],
    });
    expect(state.theme).toBe('system');
    expect(state.lang).toBe('en');
    expect(state.target).toBe(1);
    expect(state.custom).toEqual([]);
  });
  it('rejects duplicate IDs and missing Arabic before accepting a remote catalog', () => {
    expect(catalogSchema.safeParse({ version: 2, entries: [entry, entry] }).success).toBe(false);
    expect(
      catalogSchema.safeParse({ version: 2, entries: [{ ...entry, arabic: '' }] }).success,
    ).toBe(false);
    expect(catalogSchema.safeParse({ version: 2, entries: [] }).success).toBe(false);
  });
});
