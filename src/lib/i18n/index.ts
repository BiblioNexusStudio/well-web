import { init as svelteI18nInit, register, locale } from 'svelte-i18n';

register('eng', () => import('./locales/eng.json'));
register('hin', () => import('./locales/hin.json'));
register('tpi', () => import('./locales/tpi.json'));
register('arb', () => import('./locales/arb.json'));
register('swh', () => import('./locales/swh.json'));

export async function init(currentLanguageCode: string | undefined) {
    locale.set(currentLanguageCode);
    await svelteI18nInit({
        fallbackLocale: 'eng',
        initialLocale: currentLanguageCode,
    });
}
