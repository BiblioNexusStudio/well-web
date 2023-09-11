import { init as svelteI18nInit, register } from 'svelte-i18n';

register('eng', () => import('./locales/eng.json'));
register('hin', () => import('./locales/hin.json'));
register('tpi', () => import('./locales/tpi.json'));

export function init(currentLanguage: string | undefined) {
    svelteI18nInit({
        fallbackLocale: 'eng',
        initialLocale: currentLanguage,
    });
}
