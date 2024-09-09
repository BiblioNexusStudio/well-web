import { derived, get, writable } from 'svelte/store';
import type { Language } from '$lib/types/file-manager';
import { browser } from '$app/environment';
import { browserLanguageToISO6393, DirectionCode } from '$lib/utils/language-utils';
import { locale } from 'svelte-i18n';
import { featureFlags } from './feature-flags.store';

export const languages = writable<Language[]>([]);
export const supportedLanguages = derived(languages, ($languages) => $languages.filter((l) => l.enabled));
const storedLanguage = browser ? localStorage.getItem('currentLanguage') : null;
const currentLanguageCode = writable<string>(
    storedLanguage || (browser && browserLanguageToISO6393(navigator.language)) || 'eng'
);
currentLanguageCode.subscribe((value) => {
    locale.set(value);
    browser && localStorage.setItem('currentLanguage', value);
});

export function lookupLanguageInfoById(languageId: number) {
    if (!languageId) return null;
    return get(languages).find(({ id }) => id === languageId);
}

export const currentLanguageInfo = derived([currentLanguageCode, languages], ([$currentLanguageCode, $languages]) =>
    $languages.find(({ iso6393Code }) => iso6393Code === $currentLanguageCode)
);

const currentLanguageDirectionDebugMode = derived(featureFlags, ($featureFlags) => $featureFlags.forceRTLMode);

export const currentLanguageDirection = derived(
    [currentLanguageInfo, currentLanguageDirectionDebugMode],
    ([$currentLanguageInfo, $currentLanguageDirectionDebugMode]) => {
        if ($currentLanguageDirectionDebugMode) {
            return DirectionCode.RTL;
        }
        return $currentLanguageInfo?.scriptDirection || DirectionCode.LTR;
    }
);

export function updateCurrentLanguageCode(code: string) {
    currentLanguageCode.set(code);
}
