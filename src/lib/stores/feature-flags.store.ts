import { objectKeys } from '$lib/utils/typesafe-standard-lib';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const defaultConfig = {
    audioRecording: false,
    darkMode: false,
    currentLanguageDirection: false,
};

export type FeatureFlag = keyof typeof defaultConfig;
export type FeatureFlagConfig = typeof defaultConfig;

let savedFlags = {};

if (browser) {
    savedFlags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
}

const initialFlags = { ...defaultConfig, ...savedFlags };

export const featureFlags = writable<FeatureFlagConfig>(initialFlags);

featureFlags.subscribe((value) => {
    const diffs = objectKeys(value).reduce((acc, key) => {
        if (defaultConfig[key] !== value[key]) acc[key] = value[key];
        return acc;
    }, {} as FeatureFlagConfig);

    if (browser) {
        if (objectKeys(diffs).length === 0) {
            localStorage.removeItem('featureFlags');
        } else {
            localStorage.setItem('featureFlags', JSON.stringify(diffs));
        }
    }
});
