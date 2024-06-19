import { init } from '$lib/i18n';
import { waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';
import { fetchFromCacheOrApi } from '$lib/data-cache';
import { get } from 'svelte/store';
import { currentLanguageInfo } from '$lib/stores/language.store';
// eslint-disable-next-line
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';
import { log } from '$lib/logger';
import { browserSupported } from '$lib/utils/browser';
import { languages } from '$lib/stores/language.store';
import { parentResources } from '$lib/stores/parent-resource.store';
import { biblesEndpoint, languagesEndpoint, parentResourcesEndpoint } from '$lib/api-endpoints';
import { bibles } from '$lib/stores/bibles.store';
import '$lib/caching-config.js';

export const ssr = false;

export const load: LayoutLoad = async () => {
    try {
        const updateServiceWorker = registerSW({
            onNeedRefresh() {
                // The timeout is here to make the browser happy. For some reason if immediately fired, the new service
                // worker won't be activated.
                setTimeout(updateServiceWorker, 750);
            },
        });

        if (browserSupported) {
            const registration = await navigator.serviceWorker.getRegistration();

            // There's an active SW, but no controller for this tab.
            // This means the user did a hard refresh that we need to recover from.
            if (registration?.active && !navigator.serviceWorker.controller) {
                // Perform a soft reload to load everything from the SW and get
                // a consistent set of resources.
                window.location.reload();
            }
        }

        const [fetchedLanguages, fetchedParentResources, fetchedBibles] = await Promise.all([
            fetchFromCacheOrApi(...languagesEndpoint()),
            fetchFromCacheOrApi(...parentResourcesEndpoint()),
            fetchFromCacheOrApi(...biblesEndpoint()),
        ]);
        languages.set(fetchedLanguages);
        parentResources.set(fetchedParentResources);
        bibles.set(fetchedBibles);

        await init(get(currentLanguageInfo)?.iso6393Code);
        await waitLocale();

        return { browserSupported, error: false };
    } catch (error) {
        log.exception(error as Error);
        return { browserSupported, error: true };
    }
};
