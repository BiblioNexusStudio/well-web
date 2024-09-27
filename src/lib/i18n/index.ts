import { init as svelteI18nInit, register, locale } from 'svelte-i18n';

register('arb', () => import('./locales/arb.json'));
register('eng', () => import('./locales/eng.json'));
register('fra', () => import('./locales/fra.json'));
register('hin', () => import('./locales/hin.json'));
register('ind', () => import('./locales/ind.json'));
register('por', () => import('./locales/por.json'));
register('rus', () => import('./locales/rus.json'));
register('spa', () => import('./locales/spa.json'));
register('swh', () => import('./locales/swh.json'));
register('tpi', () => import('./locales/tpi.json'));
register('zhs', () => import('./locales/zhs.json'));

export async function init(currentLanguageCode: string | undefined) {
    locale.set(currentLanguageCode);
    await svelteI18nInit({
        fallbackLocale: 'eng',
        initialLocale: currentLanguageCode,
    });
}
