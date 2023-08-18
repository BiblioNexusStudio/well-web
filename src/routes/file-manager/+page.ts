import type { PageLoad } from './$types';
import type { language as languageInterface } from '$lib/types/fileManager';
import { language } from '$lib/stores/language.store';
import { get } from 'svelte/store';
import { fetchFromCacheOrApi } from '$lib/data-cache';

export const load = (async () => {
    try {
        const languages = await fetchFromCacheOrApi(`languages/`);

        if (get(language).length > 0) {
            const { id } = languages.find((lang: languageInterface) => lang.iso6393Code === get(language));
            const bibles = await fetchFromCacheOrApi(`bibles/language/${id}`);

            return {
                languages,
                bibles,
            };
        }

        return {
            languages,
        };
    } catch (error) {
        console.error(error);
    }
}) satisfies PageLoad;
