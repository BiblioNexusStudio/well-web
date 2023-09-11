import { derived, writable } from 'svelte/store';
import { languages } from './file-manager.store';
import type { Language } from '$lib/types/file-manager';
import { browser } from '$app/environment';
import { browserLanguageToISO6393 } from '$lib/utils/language-utils';
import { locale } from 'svelte-i18n';

const storedLanguage = browser ? localStorage.getItem('currentLanguage') : null;
export const currentLanguage = writable<string>(
    storedLanguage || (browser && browserLanguageToISO6393(navigator.language)) || 'eng'
);
currentLanguage.subscribe((value) => {
    locale.set(value);
    browser && localStorage.setItem('currentLanguage', value);
});

export const currentLanguageId = derived(
    [currentLanguage, languages],
    ([$currentLanguage, $languages]) => $languages.find((lang: Language) => lang.iso6393Code === $currentLanguage)?.id
);
