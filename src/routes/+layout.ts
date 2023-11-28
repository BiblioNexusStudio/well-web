import { init } from '$lib/i18n';
import { waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';
import { languages } from '$lib/stores/file-manager.store';
import { fetchFromCacheOrApi } from '$lib/data-cache';
import { get } from 'svelte/store';
import { currentLanguageCode } from '$lib/stores/current-language.store';
// eslint-disable-next-line
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';
import { log } from '$lib/logger';

export const ssr = false;

export const load: LayoutLoad = async () => {
    try {
        const initializedAt = Date.now();
        const updateServiceWorker = registerSW({
            onNeedRefresh() {
                // if we receive the "SW update" event within 1.5s of the time the app was initialized,
                // we know that the page must have just been refreshed, and we can go ahead and do the
                // service worker update without fear of disturbing the user
                if (Date.now() - initializedAt < 1500) {
                    // The timeout is here to make the browser happy. For some reason if immediately fired, the new service
                    // worker won't be activated.
                    setTimeout(updateServiceWorker, 750);
                }
            },
        });

        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();

            // There's an active SW, but no controller for this tab.
            // This means the user did a hard refresh that we need to recover from.
            if (registration?.active && !navigator.serviceWorker.controller) {
                // Perform a soft reload to load everything from the SW and get
                // a consistent set of resources.
                window.location.reload();
            }
        }

        const fetchedLanguages = await fetchFromCacheOrApi(`languages/`);
        languages.set(fetchedLanguages);

        await init(get(currentLanguageCode));
        await waitLocale();
        return { browserSupported: 'serviceWorker' in navigator, error: false };
    } catch (error) {
        log.exception(error as Error);
        return { browserSupported: 'serviceWorker' in navigator, error: true };
    }
};
