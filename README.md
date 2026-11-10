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

## Hosting

The Sites identity remains in `.openai/hosting.json`. Source upload and hosted publication are pending explicit user authorization; the local React app is independently runnable and deployable.
