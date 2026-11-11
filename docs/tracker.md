# Daily Adhkar and Quran tracker — implementation and release status

This feature extends the existing React 19 / TypeScript / Vite PWA. It is a source-attributed preview, **not ready for release as a fully verified Islamic content collection**.

## Architecture and changed files

- `src/components/Tracker.tsx`: Today dashboard, nine session cards covering five categories, dedicated session reading, Arabic sizing and optional meaning/pronunciation configured in Settings, focus mode, contextual counters, bookmarks, history, reminders, export and deletion confirmations. English/Malayalam interface; existing Hindi/Arabic shell retained, but tracker copy falls back to English for these languages.
- `src/lib/tracker.ts`: normalized scheduled instances, daily/weekly keys, formula selection, resume and notification eligibility; Zod validation for persisted tracker state.
- `src/lib/schema.ts`: adds a defaulted, versioned tracker namespace to existing `adkar-state`. Existing library, personal entries, audio preferences, bookmarks and daily goals migrate without modification. Counters are keyed by period/session/formula/recitation; content is not duplicated by session. The original entry/audio model remains compatible.
- `src/lib/tracker-content.ts`: versioned, source-attributed recitation definitions and a normalized reference registry. Session-specific repetitions live in `tracker.ts`, not shared content.
- `src/data/quran.json`: 448 unique verses for Al-Fatihah, Al-Baqarah, Al-Kahf, Al-Mulk and 112–114. Ayat al-Kursi and 2:285–286 reference the same corpus. No generated Quran Arabic.
- `public/licenses/tanzil.txt`: verbatim copyright notice from downloaded text. `vite.config.ts` precaches license text along with the app. No remote font or content fetch is required to read installed tracker content offline.
- `src/hooks/useReminders.ts`: optional notification permission, current device wall-time checks and completion suppression. No backend or activity upload.
- `src/App.tsx`: Today now opens the tracker. Library/audio reading remains available, with `#recitation/ayatul-kursi` as a reloadable direct route.
- `src/styles.css`: existing theme tokens and reading styles, responsive session cards, quiet focus reader, contrast, reduced-motion handling.
- `src/lib/tracker.test.ts`, `e2e/tracker.spec.ts`: content integrity, counts, persistence/migration, local dates, week boundaries, formulas, reminder eligibility, offline restart, rapid duplicate taps, Unicode, accessibility and privacy. Existing browser tests use the explicit library reading route where they test legacy reading/audio behavior.

## Source acquisition and licensing

Downloaded 2026-11-10 from:

https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt&agree=true

The source identifies itself as Tanzil Quran Text (Uthmani, Version 1.1), Copyright (C) 2007–2026 Tanzil Project, Creative Commons Attribution 3.0, with the additional requirement that text remain unmodified. The source SHA-256 is stored in the bundled JSON. Each selected verse string is copied verbatim, including any source-provided opening basmalah. Attribution and the complete downloaded notice are preserved in JSON and the public license file. Source terms: https://tanzil.net/docs/Text_License . The source has 6,236 verse lines; selection used standard Surah verse counts and checked the total before import. Tests pin selected-corpus integrity, which detects later changes but is not an independent scholarly proofread.

Hadith Arabic phrases and citations were checked on Sunnah.com on 2026-11-10. The app links the underlying collection and named grading authority; it does not redistribute complete English hadith translations. Editorial English/Malayalam meanings and pronunciation aids are explicitly drafts. Confirm content reuse terms with source owners before wider commercial distribution. No licensed published Quran translations have been bundled without confirmed permission.

Checked references:

- Morning/evening last three Surahs: Abu Dawud 5082, Hasan (Al-Albani).
- Sayyidul Istighfar: Bukhari 6306.
- Bismillahil-ladhi: Abu Dawud 5088, Sahih (Al-Albani); also checked Tirmidhi 3388.
- Raditu: Tirmidhi 3389, described by at-Tirmidhi as Hasan gharib, does not establish the requested morning three-count. Related Abu Dawud 5072 is graded Da’if by Al-Albani. The app exposes this difference and does not assert a verified prescribed three-count.
- Evening refuge: **Tirmidhi 3604b**, Sahih (Darussalam), Hasan in at-Tirmidhi’s commentary. The unsuffixed 3604 is a different narration.
- Morning/evening hundred-count: Muslim 2692.
- After-Salah forgiveness and peace: Muslim 591.
- Last three Surahs after Salah: Abu Dawud 1523, Sahih (Al-Albani). One each after Salah; morning/evening three-count sessions remain separate to avoid implying each prayer requires three.
- After-Salah formulas: Muslim 597a (33/33/33 + Tawhid) and 596a (33/33/34).
- Bedtime Ayat al-Kursi: Bukhari 2311. Morning/evening and post-Salah evidence is explicitly pending separate grading review, not equated to this narration.
- Bedtime last three Surahs with blowing into hands and wiping the body: Bukhari 5017. Reader explains the three cycles; separate Surah counters do not enforce interleaved order.
- Last two verses at night: Bukhari 5009. Not restricted to the instant before sleep.
- Bedtime 33/33/34: **Muslim 2727a**. Checked Bukhari 6318 has variant count wording, so it is not used to justify this exact formula.
- Al-Mulk: Tirmidhi 2891, Hasan (Darussalam). This narration does not fix a nightly schedule.
- Al-Baqarah at home: Muslim 780. No invented daily/weekly frequency.
- Al-Fatihah in Salah: Bukhari 756. Tracker does not evaluate validity of Salah.

## Privacy and periods

Everything is stored in the existing local storage key. No analytics or sync has been added. The legacy audio subsystem makes user-initiated external audio requests as before. Export is a local JSON download; no upload. Reset today affects daily tracker instances while preserving weekly readings. Delete history removes all tracker counters; clear tracker data additionally clears tracker bookmarks and preferences/reminders. Original library/audio data is intentionally retained and labeled as such. Browser storage eviction or clearing site data can remove progress.

Daily sessions use device-local dates. A foreground/midnight hook refreshes the date and checks at least once per minute; writes use the actual current local date. Weekly personal Quran plans use Monday through Sunday. Al-Kahf can be read any day, with a Friday-only reminder. Mulk/Baqarah/Fatihah have personal weekly tracking goals, not a religious weekly prescription. Optional consistency insights count active daily-session dates over 7 and 30 days without rankings or streak pressure.

## Reminder limitations

The current app has no prayer-time subsystem or native notification bridge. Reminders use explicitly chosen device-local times; no location is collected and no calculation method or Asr convention is assumed. The hook checks every 15 seconds while the app runs, does not catch up missed reminders, deduplicates by local date/session, suppresses completed sessions, and suppresses Friday reminders once Al-Kahf is completed. Closed/suspended browsers cannot guarantee these reminders. Reliable closed-app scheduling and location-based prayer calculation/method selection are **not implemented**. This is stated in preferences. Permission is requested only by an explicit button. Unsupported and denied states are shown.

## Release blockers and remaining validation

1. Quran reading intentionally supports Arabic-only mode, as accepted by the user. Full Quran translations and transliterations are not included and are no longer release requirements. Unavailable meaning/pronunciation controls and placeholder messages are hidden. Any future translations still require permission-compatible sources and review.
2. Qualified bilingual review of editorial dua meanings, pronunciation guides, diacritics and Malayalam UI. These are displayed with a draft notice in evidence details.
3. Qualified evidence review for morning/evening and post-Salah Ayat al-Kursi, Raditu morning three-count and Friday Al-Kahf recommendation, with exact primary-source references and named grading authorities before publishing specific virtues. Al-Kahf currently makes no reward claim.
4. Full independent Quran proofreading against a mushaf. Automated integrity checks validate acquisition and stability, not religious certification.
5. Device validation with VoiceOver/TalkBack, Malayalam/Arabic installed fonts, iOS/Android PWA installation, notification permissions, suspended-app behavior, and real timezone/DST transitions. Automated browser coverage is not equivalent to physical-device certification.
6. Native closed-app local notifications and optional prayer calculation need a separate platform implementation. No misleading calculation controls have been added.
7. Long Surahs render complete verse-by-verse Arabic; per-verse resume, translations, advanced search and virtualization remain future enhancements. Existing Ayat al-Kursi audio stays in Library and has not been duplicated in the new reader.

No lint script exists; use formatting checks, strict TypeScript, unit tests, production build and Playwright browser tests. See the implementation response for actual run results.

## Validation executed

- `npm test`: 28 tests passed across 7 files.
- `npm run typecheck`: passed; also run by production build.
- `npm run build`: passed; tracker/content split into a separate precached chunk, avoiding the previous large-main-chunk warning. Existing Zod annotation warnings are non-fatal.
- `npm run format:check`: passed. No separate lint command is configured.
- `npm run test:e2e`: all 18 Chrome tests passed against the production build, including original audio/offline/update regressions and new tracker flows.
- `TZ=America/New_York npx vitest run src/lib/tracker.test.ts src/hooks/useReminders.test.tsx`: 9 tests passed in an additional local timezone.
- `git diff --check`: passed.
- Inspected the browser-generated Malayalam dark-mode reader screenshot at 390px width with maximum Arabic size; no horizontal overflow. Axe checks passed for the tracker dashboard/reader and existing primary screens.

Browser tests required permission to run the localhost preview and Chrome outside the filesystem sandbox. These results do not constitute scholarly content certification or native iOS/Android device testing.

`python3 scripts/import-tracker-quran.py /path/to/tanzil-download.txt` reproduces the selected corpus from the exact downloaded source. The importer refuses a source hash mismatch. Any new source edition requires deliberate review, versioning and updated integrity expectations.

## Reading settings UX update

Arabic size remains in Settings → Reading comfort with its live preview. Settings → Reading now contains persistent meaning visibility, meaning/pronunciation language and pronunciation visibility. The tracker and Library reader no longer expose size or meaning controls in the reading area. Arabic remains visible when a Library meaning is enabled. The existing `defaultMeaning` preference is reused so users have a single meaning-visibility setting; no progress migration or storage key change is needed. Quran readings continue in Arabic-only mode.

## Reader simplification

The dashboard preview notice, inline evidence notes and reader evidence disclosure have been removed from the reading experience at the user's request. Full source metadata and review notes remain in the versioned content dataset and this report. Required Tanzil source attribution and its license link are available in Settings. Remaining editorial draft notices still accompany optional draft meanings and pronunciation guides.

## Arabic-first tracker display

All tracker reading screens omit translations, inline editorial review notices and the evidence disclosure. Source/review data remains in the versioned dataset. Optional pronunciation remains controlled by Settings; the meaning visibility preference now applies only to Library readings and is labeled accordingly. Tanzil attribution and licensing remain in Settings.

## Shared Library registry

`src/lib/library.ts` builds all 20 existing recitations into normalized Library entries, with a single shared Ayat al-Kursi ID (`ayatul-kursi`) retaining its original localized title, meanings and offline audio metadata. Arabic text comes from the same versioned source corpus used by categories. Each `SessionItem.recitationId` references a Library entry; its legacy `id` remains stable solely for saved session-count keys. Both Library and tracker readers receive the same composed entry objects from App.

Library supports title search, five category filters, category labels, shared bookmarks and complete verse-by-verse Surahs. Dua/dhikr entries no longer inherit a Quran 2:255 citation, verse number or introductory basmalah from the old single-entry reader. `entrySchema` supports long Quran readings and structured verses; personal-entry input remains limited by the existing editor. Category counts stay contextual (e.g. Al-Ikhlas three times in morning, once after Salah), separate from Library personal goals.

Existing `tracker:` bookmarks migrate to shared Library IDs and are deduplicated. Clearing tracker data retains shared Library bookmarks, just as it retains original Library data; tracker export includes shared built-in bookmarks. No progress keys or audio IDs are rewritten. Remote-only catalog additions remain supported; bundled reviewed Library text takes precedence for shared built-ins.

Validation for this change: 31 unit tests and all 20 browser tests passed, including shared-reference coverage, bookmark migration/cross-reader behavior, category filtering, complete Surah reading offline, Malayalam/RTL, existing audio and service-worker updates. Production build and strict TypeScript pass. The Quran corpus is emitted as a separate precached chunk.

## Continuous Quran and expanded audio

`src/components/QuranReader.tsx` is shared by Library and category readers. Verse text flows inline with Arabic verse markers rather than separate verse cards. First-verse basmalahs outside Al-Fatihah are displayed separately, extracted verbatim from the source; timing word indices apply to the remaining verse text. Al-Fatihah 1:1 remains a numbered verse. No Quran text is generated or modified.

`src/lib/quran-audio.ts` maps all 448 unique bundled verses to EveryAyah’s Alafasy_128kbps files. `src/data/quran-audio.json` contains the matching quran-align release-2016-11-24 timestamps and attribution. The importer pins source SHA-256 `55c1353848d8f3140abab72bb5d1d4533476a8219f6241079a425d232f001eb7`. The existing Ayat al-Kursi recording identity/URL/timings remain intact for offline compatibility.

Published non-positive timing spans in 2:164, 2:249 and 18:42 are omitted instead of assigning guessed times; adaptation metadata and affected recordings’ credits identify this. Missing final-word timing for 2:181 remains unhighlighted. Published grouped timing in 2:20 highlights the group. Automated tests check all selected verse word bounds and timestamp ordering, but these machine-generated alignments are not an independent human audio proofread. Actual provider MP3 files for 112:1 and 67:1 were fetched and their audio metadata checked locally.

The existing audio engine is extended with safe ready-recording identity and end callbacks. A paused selection stays paused; playing selections and natural verse endings continue in sequence. Player state is reset between recordings, navigation cancels old downloads and playback, and the final Ayah stops. An automatic transition is marked busy so a pending PWA update does not interrupt the sequence. Existing speed/repeat/seek, Media Session, download and IndexedDB handling are reused. Repeat applies to the selected verse. Audio controls and timing data are lazy-loaded and precached for offline app use. MP3s remain user-initiated, individual Ayah downloads; the app does not claim a full Surah is saved merely because its current verse is saved. No bulk Surah download or gapless concatenation is implemented.

Validation: 35 unit tests cover all verse mappings, source text boundaries/basmalahs, preserved audio IDs and timing limitations. The 22-test browser suite covers the shared reader, inline layout, automatic advancement and final stop, pause/select behavior, seeking/highlighting, offline saved audio, category counters, accessibility, mobile/RTL, and original audio/update flows. Physical-device Safari/Android playback and every verse’s audible alignment still require device/listening review.

## Compact navigation and onboarding

The global footer and visible Today intro/date block are removed. Today retains a visually hidden heading for assistive technology; category reading and History/Reminders retain contextual titles. History is a fourth persistent navigation item (`#history`), and the header bell opens reminders directly (`#reminders`). Routes survive reloads and browser back/forward navigation. Reminder controls continue to require explicit notification permission.

Language selection is available only in Settings and a first-use welcome dialog (`Onboarding.tsx`). It supports all existing UI languages, previews the chosen language immediately, and persists `onboardingComplete` in the existing state. Legacy saved profiles migrate as already onboarded without changing their language/progress; fresh profiles see the language screen. Existing feature browser tests use a returning-user fixture; dedicated onboarding tests use untouched profiles. Mobile navigation uses four equal columns and bottom safe-area padding so the final card remains reachable without a footer.

Navigation/onboarding validation: 36 unit tests and 24 browser tests passed, including first-use language selection, saved-user migration, reminder/history routes, a 320px four-tab menu, accessibility and existing Quran/audio/offline regressions. The welcome-dialog accessibility scan waits for its entrance animation to finish so it checks final rendered contrast rather than a transient fade.

## Contextual reminder defaults

New reminder times default to Morning 06:00, Fajr 05:45, Dhuhr 13:15, Asr 16:30, Maghrib 18:30, Isha 20:00, Evening 17:00, Bedtime 22:00 and Friday Al-Kahf 10:00. These are editable device-local suggestions, not location-calculated prayer times. Existing saved times are preserved. “Use suggested times” explicitly applies the suggestions to all reminder times while preserving enabled/disabled switches. Reminders remain off until enabled.
