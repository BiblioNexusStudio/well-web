import { objectKeys } from '$lib/utils/typesafe-standard-lib';
import { writable } from 'svelte/store';

const defaultConfig = {
    audioRecording: false,
    darkMode: false,
    newFileManager: false,
};

export type FeatureFlag = keyof typeof defaultConfig;
export type FeatureFlagConfig = typeof defaultConfig;

const savedFlags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
const initialFlags = { ...defaultConfig, ...savedFlags };

export const featureFlags = writable<FeatureFlagConfig>(initialFlags);

featureFlags.subscribe((value) => {
    const diffs = objectKeys(value).reduce((acc, key) => {
        if (defaultConfig[key] !== value[key]) acc[key] = value[key];
        return acc;
    }, {} as FeatureFlagConfig);

    if (objectKeys(diffs).length === 0) {
        localStorage.removeItem('featureFlags');
    } else {
        localStorage.setItem('featureFlags', JSON.stringify(diffs));
    }
});
