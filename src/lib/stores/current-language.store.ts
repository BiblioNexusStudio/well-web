import { derived, get, writable } from 'svelte/store';
import { languages } from './file-manager.store';
import type { Language } from '$lib/types/file-manager';
import { browser } from '$app/environment';
import { browserLanguageToISO6393, supportedLanguages } from '$lib/utils/language-utils';
import { locale } from 'svelte-i18n';

const storedLanguage = browser ? localStorage.getItem('currentLanguage') : null;
export const currentLanguageCode = writable<string>(
    storedLanguage || (browser && browserLanguageToISO6393(navigator.language)) || 'eng'
);
currentLanguageCode.subscribe((value) => {
    locale.set(value);
    browser && localStorage.setItem('currentLanguage', value);
});

export function lookupLanguageInfoByCode(languageCode: string | null | undefined) {
    if (!languageCode) return null;
    const supportedLanguageInfo = supportedLanguages.find(({ code }) => code === languageCode);
    const fetchedLanguageInfo = get(languages).find((lang: Language) => lang.iso6393Code === languageCode);
    return { ...fetchedLanguageInfo, label: supportedLanguageInfo?.label };
}

export const currentLanguageInfo = derived([currentLanguageCode, languages], ([$currentLanguageCode]) =>
    lookupLanguageInfoByCode($currentLanguageCode)
);
