import { browser } from '$app/environment';
import { init } from '$lib/i18n';
import { locale, waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';
import { languages } from '$lib/stores/file-manager.store';
import { fetchFromCacheOrApi } from '$lib/data-cache';
import { get } from 'svelte/store';
import { currentLanguage } from '$lib/stores/current-language.store';

export const ssr = false;

export const load: LayoutLoad = async () => {
    if (browser) {
        locale.set(window.navigator.language);
    }
    const fetchedLanguages = await fetchFromCacheOrApi(`languages/`);
    languages.set(fetchedLanguages);

    init(get(currentLanguage));

    await waitLocale();
};
