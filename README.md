## Description

Well Web is the official front-end web app to access content in the Aquifer.

It's designed as a PWA (Progressive Web App) allowing a user to download
content to their device and use it in an offline environment.

## Installation

```bash
$ yarn install
```

## Setup

Use the appropriate config vars for your env (to specify the API URL among other things)

```bash
# local server
$ yarn use-config local

# dev server
$ yarn use-config dev-local
```

## Running the app

```bash
# development
$ yarn run dev - --open

# production mode (required to test PWA functionality)
$ yarn run build && serve -s build
```

## Lint

```bash
# lint
$ yarn run lint
```

## Test

```bash
# unit tests
$ yarn run test
```

## Feature Flags

To add a new feature flag, go to `feature-flags.store.ts` and add your flag to the `defaultConfig`.

To toggle feature flags, open the feature flag modal by:

-   On desktop, add `#ff` to the end of the address bar
-   On mobile, tap the following sequence on the screen: Top Left, Top Right, Top Right, Bottom Left

## Generate APK

This is useful for distributing the app to users who may not have internet access.

### Automated Build

Use `yarn apk:build` to run the manual steps in order, as well as handle the signing key stored in Azure Key Vault. See
below for the options available for preloading content.

```bash
$ yarn apk:build language=eng bible=BSB book=mark audio=true resources=true
```

### Manual Build

1. You have to preload the files into the static diretory.

-   language: the language code of the content you want to preload
-   bible: the bible code of the content you want to preload
-   book: bible chapter to preload
-   audio: true/false to preload audio files
-   resources: true/false to preload resource files

```bash
$ yarn apk:preload-content language=eng bible=BSB book=mark audio=true resources=true
```

2. Build the app

```bash
$ yarn run build
```

3. Generate assets from `resources/*.png` files

```bash
$ npx capacitor-assets generate --android
```

4. Sync the app into the capacitor android project

```bash
$ npx cap sync android
```

5. Using Android Studio, build the APK

```bash
$ npx cap open android
```
