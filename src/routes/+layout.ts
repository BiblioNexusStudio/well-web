import { browser } from '$app/environment';
import '$lib/i18n';
import { locale, waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';
import { config } from '$lib/stores/config.store';
import type { Configuration } from '$lib/stores/config.store';

export const ssr = false;

export const load: LayoutLoad = async () => {
    const [globalConfig, envConfig] = await Promise.all([
        fetch('/global-config.json').then((r) => r.json()),
        fetch('/env-config.json').then((r) => r.json()),
    ]);
    const configValues: Configuration = Object.assign({}, globalConfig, envConfig);
    config.set(configValues);

    if (browser) {
        locale.set(window.navigator.language);
    }

    await waitLocale();
};
