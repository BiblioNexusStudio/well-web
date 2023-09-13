import { init as svelteI18nInit, register, locale } from 'svelte-i18n';

register('eng', () => import('./locales/eng.json'));
register('hin', () => import('./locales/hin.json'));
register('tpi', () => import('./locales/tpi.json'));

export async function init(currentLanguage: string | undefined) {
    locale.set(currentLanguage);
    await svelteI18nInit({
        fallbackLocale: 'eng',
        initialLocale: currentLanguage,
    });
}
