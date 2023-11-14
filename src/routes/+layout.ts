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

export const ssr = false;

export const load: LayoutLoad = async () => {
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

    const fetchedLanguages = await fetchFromCacheOrApi(`languages/`);
    languages.set(fetchedLanguages);

    await init(get(currentLanguageCode));
    await waitLocale();
};
