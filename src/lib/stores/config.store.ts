import { writable, readable } from 'svelte/store';

export const config = writable<Configuration>();

export interface Configuration {
    APPLICATION_INSIGHTS: {
        CONNECTION_STRING: string;
    };
    ENV: string;
    AQUIFER_API_URL: string;
}
