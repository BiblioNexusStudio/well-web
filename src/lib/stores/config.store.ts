import { readable } from 'svelte/store';
import { env } from '$env/dynamic/public';

export const config = readable<Configuration>(env as Configuration);

export interface Configuration {
    PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING: string;
    PUBLIC_ENV: string;
    PUBLIC_AQUIFER_API_URL: string;
}
