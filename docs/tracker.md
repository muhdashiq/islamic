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
