import { derived, get, writable } from 'svelte/store';
import { languages } from './file-manager.store';
import type { Language } from '$lib/types/file-manager';
import { browser } from '$app/environment';
import { browserLanguageToISO6393, supportedLanguages, DirectionCode } from '$lib/utils/language-utils';
import { locale } from 'svelte-i18n';
import { featureFlags } from './feature-flags.store';

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

export function lookupLanguageInfoById(languageId: number) {
    const fetchedLanguageInfo = get(languages).find((lang: Language) => lang.id === languageId);
    const supportedLanguageInfo = supportedLanguages.find(({ code }) => code === fetchedLanguageInfo?.iso6393Code);
    return { ...fetchedLanguageInfo, label: supportedLanguageInfo?.label };
}

export const currentLanguageInfo = derived([currentLanguageCode, languages], ([$currentLanguageCode]) =>
    lookupLanguageInfoByCode($currentLanguageCode)
);

export const currentLanguageDirectionDebugMode = derived(
    featureFlags,
    ($featureFlags) => $featureFlags.currentLanguageDirection
);

export const currentLanguageDirection = derived(
    [currentLanguageCode, currentLanguageDirectionDebugMode],
    ([$currentLanguageCode, $currentLanguageDirectionDebugMode]) => {
        if ($currentLanguageDirectionDebugMode) {
            return DirectionCode.RTL;
        }
        const matchingLanguage = supportedLanguages.find(({ code }) => code === $currentLanguageCode);
        return matchingLanguage?.direction || DirectionCode.LTR;
    }
);
