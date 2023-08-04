import { readable } from 'svelte/store';

const [globalConfig, envConfig] = await Promise.all([
    fetch('/global-config.json').then((r) => r.json()),
    fetch('/env-config.json').then((r) => r.json()),
]);
const configValues: Configuration = Object.assign({}, globalConfig, envConfig);

export const config = readable(configValues);

interface Configuration {
    APPLICATION_INSIGHTS: {
        CONNECTION_STRING: string;
    };
    ENV: string;
    AQUIFER_API_URL: string;
}
