# Well Web

The public app for reading content in the [Aquifer](https://aquifer.bible):
Bible texts, translation guides, dictionaries, study notes, images, and
videos. It's an offline-first **PWA** (and Capacitor Android app) that lets
users download content to their device for use without connectivity. It's a
SvelteKit SPA backed by `Aquifer.API` in the
[aquifer-server](https://github.com/eten-tech/aquifer-server) repo — see the
[ecosystem overview](https://github.com/eten-tech/aquifer-server/blob/master/docs/ecosystem.md)
for how it fits with the other apps.

## Quickstart

```bash
# 1. Install dependencies
yarn install

# 2. Select a config (writes the root .env)
yarn use-config dev-local   # local app against the dev API
# yarn use-config local     # local app against a locally-running Aquifer.API

# 3. Run
yarn dev -- --open
```

Available configs are the `config/.env.*` files (`local`, `dev-local`, `dev`,
`qa`, `prod`).

**PWA/service worker behavior requires a production build:**

```bash
yarn build && serve -s build
```

## Lint and test

```bash
yarn lint
yarn test
```

## Feature flags

Toggle with `#ff` appended to the URL (desktop) or tapping Top Left → Top
Right → Top Right → Bottom Left (mobile). Flags are defined in
`src/lib/stores/feature-flags.store.ts` — see
[docs/architecture.md](docs/architecture.md#feature-flags).

## Documentation

| Doc | What's in it |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Config, route map, API/cache-bust conventions, offline model, feature flags |
| [docs/service-workers.md](docs/service-workers.md) | The Workbox caching architecture and the API versioning contract |
| [docs/android-apk.md](docs/android-apk.md) | Building the Android APK with preloaded content |
| [aquifer-server docs](https://github.com/eten-tech/aquifer-server/tree/master/docs) | Ecosystem map and the APIs this app consumes |
