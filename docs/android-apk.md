# Android APK Build

well-web ships as an Android APK (Capacitor) primarily for distributing the
app with **preloaded content** to users who may never have internet access.

## Automated build

`yarn apk:build` runs all the manual steps below in order and handles the
signing key stored in Azure Key Vault. Options control what content is
preloaded:

```bash
yarn apk:build language=eng bible=BSB book=mark audio=true resources=true
```

## Manual build

1. Preload content files into the static directory:

    - `language`: language code of the content to preload
    - `bible`: Bible code of the content to preload
    - `book`: Bible book to preload
    - `audio`: true/false to preload audio files
    - `resources`: true/false to preload resource files

    ```bash
    yarn apk:preload-content language=eng bible=BSB book=mark audio=true resources=true
    ```

2. Build the app:

    ```bash
    yarn build
    ```

3. Generate assets from `resources/*.png` files:

    ```bash
    npx capacitor-assets generate --android
    ```

4. Sync the app into the Capacitor Android project:

    ```bash
    npx cap sync android
    ```

5. Build the APK in Android Studio:

    ```bash
    npx cap open android
    ```

The scripts behind these steps live in `scripts/` (`build-android-apk.js`,
`preload-files-to-static.js`, `preload-files-clean-up.js`).

---
_Last verified: 2026-08-03_
