# Architecture

`well-web` is the public-facing app for reading Aquifer content: Bible
texts, translation guides, dictionaries, study notes, images, and videos. It
ships as an installable **PWA** and as an **Android APK** (via Capacitor), and
is designed **offline-first** — users download content to their device and
use it without connectivity. It calls `Aquifer.API` in the
[aquifer-server](https://github.com/eten-tech/aquifer-server) repo with an API
key; see the
[ecosystem overview](https://github.com/eten-tech/aquifer-server/blob/master/docs/ecosystem.md)
for how it fits with the other apps.

## Stack

- **SvelteKit 1 + Svelte 4**, static adapter (pure SPA)
- **Vite 5**, **TailwindCSS 3 + DaisyUI 4**
- **Workbox 7** service worker (custom caching — see
  [service-workers.md](service-workers.md))
- **Capacitor 5** for the Android wrapper
- **svelte-i18n**, Application Insights
- Deployed to **Azure Static Web Apps** (Dev/QA/Prod) via GitHub Actions

## Configuration

Same pattern as content-manager-web: `yarn use-config <name>` merges
`config/.env.global` + `config/.env.<name>` into the root `.env`. Available:
`local`, `dev-local`, `dev`, `qa`, `prod`. Note `dev-local` (local app, dev
API) also writes `static/local-development-env.js`, which the service worker
needs in dev mode — see
[service-workers.md](service-workers.md#local-development-gotchas).

`config/service-worker-pwa.config.ts` defines the PWA manifest injected into
the service worker at build time.

## Route map

| Route | Purpose |
|---|---|
| `/` | Landing / entry |
| `select-language` | First-run language selection (drives all content) |
| `view-content/[guideId]/[bibleSection]` | **The main viewer** — a single route whose sub-menus switch between Bible text, guide content, library resources, chat/feedback, settings, and quick-share for the selected passage |
| `file-manager` | Browse/delete downloaded content (the offline library) |
| `about` | App info |

## Talking to the API

- All endpoint paths live in `src/lib/api-endpoints.ts`. Each returns a
  `[path, cacheBustVersion]` tuple; the version is appended to the request so
  that **additive response changes can invalidate cached responses**
  client-side. When you change what an endpoint returns, increment its number
  — the comment at the top of that file explains the policy.
- Requests go through `src/lib/data-cache.ts` (`fetchFromCacheOrApi`-style
  helpers), which layers app-side caching on top of the service worker's
  HTTP caching.
- The API key and `bn-*` headers are attached **in the service worker**
  (`add-api-key-to-all-request-plugin.js`), not in app code — this keeps the
  key off the main thread and applies it uniformly, including to range
  requests for audio.

## Offline model (the short version)

1. The service worker precaches the app shell and intercepts all API/CDN
   requests, applying different Workbox strategies per URL class
   (content/metadata, thumbnails/Bible texts, CDN media, skip-list).
2. Content and metadata URLs carry versions; the SW serves cached content
   unless the version is outdated, in which case it goes to the network.
   Version bookkeeping lives in IndexedDB.
3. Users explicitly download content for offline use; `file-manager` manages
   what's stored. `is-online.store.ts` tracks connectivity (with
   `PUBLIC_IS_ONLINE_CHECK_URL` as the probe).

Full details: [service-workers.md](service-workers.md).

## Feature flags

Defined in `src/lib/stores/feature-flags.store.ts` (`defaultConfig`), persisted
to localStorage, e.g. `darkMode`, `forceRTLMode`, `forceFiaMode`. To toggle:
append `#ff` to the URL on desktop, or on mobile tap Top Left → Top Right →
Top Right → Bottom Left.

## Content rendering

Resource content is Tiptap/ProseMirror JSON rendered with the shared
`aquifer-tiptap` package (GitHub dependency) plus app-specific extensions in
`src/lib/utils/tiptap-extensions/`. Bible passages, audio (with per-verse
timestamps), and media come from the API and CDN; zip downloads are handled
with `unzipit` (`utils/unzip.ts`).

## Android APK

The Capacitor wrapper in `android/` packages the static build as an APK,
primarily for distributing pre-loaded content to users without internet
access. See [android-apk.md](android-apk.md) for the build process.

## Notable implementation details

- **`patch-package`** is used for dependency fixes (`patches/`) — check that
  directory before upgrading patched packages.
- **Service worker ↔ main thread bridging**: the SW can't touch the DOM, so
  the App Insights user ID is passed via `postMessage` and offline telemetry
  is queued with Workbox background sync.
- The app deliberately supports **old browsers/devices**; avoid modern-only
  APIs without a fallback.

---
_Last verified: 2026-08-03_
