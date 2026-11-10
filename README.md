# Adkar

An offline-first daily remembrance PWA, built with React 19, strict TypeScript and Vite. An iOS-inspired interface adapts to phones, tablets and desktop, with Malayalam, Hindi, English and RTL Arabic.

## Development

Requires Node.js 20.19+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:4173. Development mode does not install a service worker, avoiding stale development assets. To test the installable offline app:

```sh
npm run build
npm run preview
```

The production output is `dist/`. Serve it over HTTPS (localhost is accepted for development). Configure the host to revalidate `sw.js`, `index.html` and `content.json` with `Cache-Control: no-cache`. Keep older hashed assets available briefly when rolling out a release.

## Design and accessibility

The system theme is applied before React renders to avoid a light-theme flash. Live device appearance changes update the app and browser chrome; Settings provides persisted System, Light and Dark overrides. The app uses system UI fonts, native form controls, touch targets, safe-area insets, a translucent mobile tab bar, desktop navigation, and sheet dialogs with native focus containment and Escape support. Reading uses adjustable Arabic text. Destructive actions have confirmation and undo. Reduced-motion and forced-color preferences are respected.

## Structure

- `src/components/`: reading, daily progress, library, settings, dialogs and feedback.
- `src/hooks/`: system appearance, local date rollover, catalog refresh and PWA lifecycle, with event/timer cleanup.
- `src/lib/schema.ts`: runtime schemas and inferred TypeScript types at storage/network boundaries.
- `src/lib/store.ts`: React external store with synchronous persistence and cross-tab synchronization.
- `src/lib/model.ts`: immutable, testable progress and catalog composition logic.
- `src/lib/catalog.ts`: bundled offline fallback, validated network updates and persisted catalog. The catalog never downgrades.
- `src/lib/i18n.ts`: typed translation keys and four-language text; no HTML injection.
- `public/content.json`: the single source of built-in Adkar, also bundled into the app for offline use.
- `vite.config.ts`: production asset precaching, service worker generation and update policy.

Original prototype language, progress, goals, bookmarks and personal Adkar are migrated from the existing `adkar-state` key. Invalid fields fall back individually. Storage errors are shown without crashing the app. Progress uses the device’s local date, refreshes at midnight/foreground, and stays separate for each entry. A personal goal is a tracking preference, not a religiously prescribed repetition count.

## Offline, installation and updates

Open the production app online once and wait for “Available offline.” Install through Chrome/Edge’s Install app option or Safari → Share → Add to Home Screen. Installation behavior depends on browser and OS. There are no remote fonts, CDN assets or runtime content dependencies.

Vite/Workbox precaches the application as a versioned unit. A newly installed release activates automatically and reloads the running app; progress is persisted synchronously before this can happen. Reloads wait while a dialog is open or a field is being edited, preserving unfinished drafts until the interaction completes. App and catalog updates are checked on opening, reconnecting, returning to the foreground, hourly while open, and manually in Settings. Browsers control execution when an app is closed; updates resume when the browser next runs it online.

A bundled catalog keeps the library usable even if the first content fetch fails. New catalog responses are validated before adoption. Invalid/older updates cannot replace the working local catalog. Personal entries are kept separately and merged without ID collisions.

## Add built-in Adkar

Add entries to `public/content.json` and increment its integer `version`. Keep existing IDs stable:

```json
{
  "id": "unique-stable-id",
  "title": { "en": "Title", "ml": "…", "hi": "…", "ar": "…" },
  "arabic": "…",
  "meaning": { "en": "…", "ml": "…", "hi": "…", "ar": "…" },
  "reference": "Source reference"
}
```

Run the build and deploy all of `dist/`. Service-worker revisions are generated automatically. Personal Adkar can be added from Library and are available only on that device. This app has no account or cloud sync; clearing browser data removes local entries and progress.

Ayatul Kursi source reference: https://quran.com/2/255. Localized meanings are explanatory renderings rather than attributed published translations. Have a qualified reviewer check religious text before a broad release.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Browser tests use an isolated Google Chrome profile and start/stop a production preview on port 4173; stop a manually started preview first. Install Google Chrome locally or configure `playwright.config.ts` for an installed Playwright browser. Tests cover state migration, local-day rollover, catalog validation, live appearance changes, bookmarks, add/delete/undo, keyboard focus, RTL/mobile overflow, offline reload, automatic activation of a second real service-worker release, and accessibility scans. Physical iOS/Android installation remains a device validation step.

Dependency versions are locked in `package-lock.json`. Patched glob/minimatch versions are overridden for build tooling. The unpatched deepmerge advisory remains confined to the Workbox build dependency tree; it is not shipped in the app runtime.

## Hosting and continuous deployment

GitHub Pages publishes the production PWA whenever a commit is pushed to `main`. The workflow in `.github/workflows/pages.yml` installs locked dependencies, checks formatting, runs unit tests, type-checks and builds, then deploys only `dist/`. Failed checks prevent publication. It can also be started manually from the Actions tab.

Repository Settings → Pages → Source must be **GitHub Actions**. The workflow reads the repository's Pages base path automatically, including project paths such as `/islamic/`, and uses that path for the application, icons, manifest, catalog and service worker. The current site is https://muhdashiq.com/islamic/.

For a local build matching that project path:

```sh
VITE_BASE_PATH=/islamic/ npm run build
npm run test:pages
```

The Pages browser test uses an isolated Chrome profile on port 4174 to verify assets, catalog requests, install scope and offline reload under `/islamic/`. Ordinary `npm run build` still targets the origin root for local development and other hosting.

The previous Sites identity remains in `.openai/hosting.json`; this GitHub Pages workflow does not use it.

## Comfortable reading

Settings → Reading comfort offers Standard, Large (default), and Extra large app text. Interface type uses relative units and a readable minimum, so labels and instructions grow with that choice. The Arabic reading size is independently adjustable from 22 to 64 pixels, with a live preview and large minus/plus controls. Both settings are saved per device, work offline, and apply to all four languages. Existing saved Arabic-size choices are retained. Fresh installations start with 34-pixel Arabic text.

## Recitation and offline audio

Ayatul Kursi includes Mishary Rashid Alafasy’s matching EveryAyah `Alafasy_128kbps/002255.mp3` recording. Playback starts only after a user gesture. The first play streams immediately and downloads a complete copy in the background; the download button can save it without playing. Only a complete, validated audio response is committed to IndexedDB (`adkar-media`), separate from application caches and progress. Recordings survive application/service-worker upgrades. A saved recording is played from a local Blob URL after reload, including offline. The player can remove it explicitly. Storage failures retain online playback and offer a retry; a failed or cancelled download is never marked saved. As with other browser storage, clearing site data or browser eviction can remove a recording.

The player offers play/pause, seeking, restart, pitch-preserving 0.5–2× speed, verse repeat, and volume/mute on devices with software volume control. Touch devices use physical volume buttons. Media Session integration exposes supported lock-screen/headset controls. Playback and downloads stop when leaving the verse; object URLs, listeners and animation frames are cleaned up. Listening does not increment the personal recitation count. Application-update reloads wait while audio is playing or downloading, as well as while editing.

Word highlighting uses media time rather than wall time, so seeking and speed changes remain synchronized. Arabic pause marks do not consume word indexes. Silence is not assigned an invented highlight, and ordinary text remains selectable with no extra per-word keyboard stops. The meaning view keeps the controls available and explains how to follow the Arabic words.

The 50 published timing segments are taken directly from Collin Fair’s [quran-align release of 24 November 2016](https://github.com/cpfair/quran-align/releases/tag/release-2016-11-24), `Alafasy_128kbps.json`, verse 2:255. This timing data is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the complete license is included in `public/licenses/quran-align.txt`, and attribution is accessible from the player’s more-controls panel. The segments are unmodified. The recording is downloaded directly from [EveryAyah](https://everyayah.com/) on user request; audio binaries are not committed or bundled into the app.

Future built-in entries can add optional `recitation` metadata: stable versioned `id`, localized `reciter`, HTTPS `url`, optional `bytes`, `source`, `timingSource`, and `segments` tuples `[first_word_index, after_last_word_index, start_ms, end_ms]`. Word indexes are zero-based and the end is exclusive. The content schema rejects overlapping timestamps and indexes beyond the verse’s actual words. Increment the catalog version when content changes and update the recitation ID/URL if the recording or timing set changes.

## Daily sessions tracker (source-attributed preview)

Today includes morning/evening, five Salah-specific, bedtime and weekly/regular Quran sessions, locally saved counters, resume, bookmarks, history, privacy controls and optional reminders while the app is running. Existing Library and Ayat al-Kursi audio remain available.

The Quran Arabic is bundled verbatim from Tanzil with attribution and copyright notice. **The feature is not yet a fully verified release:** bilingual editorial review and several evidence checks remain pending. Arabic-only Quran reading is supported; full Quran translations/transliterations are optional future enhancements. Reminders cannot reliably run when this browser PWA is closed. See [tracker architecture, checked references, licensing, and release blockers](docs/tracker.md).
