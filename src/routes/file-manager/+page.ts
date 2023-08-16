import type { PageLoad } from './$types';
import type { language as languageInterface } from '$lib/types/fileManager';
import { PUBLIC_AQUIFER_API_URL } from '$env/static/public';
import { language } from '$lib/stores/language.store';
import { get } from 'svelte/store';

export const load = (async ({ fetch }) => {
    try {
        const response = await fetch(`${PUBLIC_AQUIFER_API_URL}/languages/`);
        const languages = await response.json();

        if (get(language).length > 0) {
            const { id } = languages.find(
                (lang: languageInterface) => lang.iso6393Code === get(language)
            );
            const biblesResponse = await fetch(`${PUBLIC_AQUIFER_API_URL}/bibles/language/${id}`);
            const bibles = await biblesResponse.json();

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
