import { describe, expect, it } from 'vitest';
import { composeLibrary, libraryById, libraryCategories, libraryEntries } from './library';
import { recitations } from './tracker-content';
import { libraryId } from './recitation-ids';
import { parseState, entrySchema } from './schema';
import { sessions, trackerCount, writeTrackerCount } from './tracker';
import { bundledCatalog } from './catalog';

describe('shared Library content', () => {
  it('includes every recitation once and resolves all category references', () => {
    expect(libraryEntries).toHaveLength(Object.keys(recitations).length);
    expect(new Set(libraryEntries.map((entry) => entry.id)).size).toBe(libraryEntries.length);
    for (const source of Object.values(recitations)) {
      expect(libraryById[libraryId(source.id)]?.arabic).toBe(source.arabic);
    }
    for (const session of [...sessions(), ...sessions('34')]) {
      for (const item of session.items) expect(libraryById[item.recitationId]).toBeDefined();
    }
    expect(libraryCategories).toHaveLength(5);
    expect(libraryCategories.find((category) => category.id === 'morning')?.entryIds.size).toBe(8);
    expect(
      libraryCategories.find((category) => category.id === 'salah')?.entryIds.has('tawhid'),
    ).toBe(true);
  });
  it('keeps legacy Ayat al-Kursi identity/audio and renders complete long Surahs', () => {
    const kursi = libraryById['ayatul-kursi']!;
    expect(kursi.recitation).toEqual(bundledCatalog.entries[0]?.recitation);
    expect(entrySchema.safeParse(kursi).success).toBe(true);
    expect(libraryById.baqarah?.verses).toHaveLength(286);
    expect(libraryById.kahf?.verses).toHaveLength(110);
    expect(libraryById.mulk?.verses).toHaveLength(30);
    expect(libraryById.istighfar?.quran).toBeUndefined();
    expect(libraryById.istighfar?.kind).toBe('dua');
    const extra = { ...bundledCatalog.entries[0]!, id: 'remote-extra' };
    expect(composeLibrary([...bundledCatalog.entries, extra])).toHaveLength(
      libraryEntries.length + 1,
    );
    expect(
      composeLibrary(bundledCatalog.entries).filter((entry) => entry.id === kursi.id),
    ).toHaveLength(1);
  });
  it('migrates shared bookmarks without losing session counts or Library progress', () => {
    const migrated = parseState({
      bookmarks: ['tracker:kursi', 'ayatul-kursi', 'tracker:ikhlas'],
      days: { '2026-11-11': { 'ayatul-kursi': 4 } },
    });
    expect(migrated.bookmarks).toEqual(['ayatul-kursi', 'ikhlas']);
    const morning = sessions()[0]!;
    const saved = writeTrackerCount(migrated, morning, morning.items[0]!, '2026-11-11', 1);
    const restored = parseState(JSON.parse(JSON.stringify(saved)));
    expect(restored.days['2026-11-11']?.['ayatul-kursi']).toBe(4);
    expect(trackerCount(restored.tracker, morning, morning.items[0]!, '2026-11-11')).toBe(1);
    expect(
      trackerCount(restored.tracker, sessions()[1]!, sessions()[1]!.items[2]!, '2026-11-11'),
    ).toBe(0);
  });
});
