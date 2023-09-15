import { writable } from 'svelte/store';

const defaultConfig = {
    audioRecording: false,
};

export type FeatureFlag = keyof typeof defaultConfig;
export type FeatureFlagConfig = typeof defaultConfig;

const savedFlags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
const initialFlags = { ...defaultConfig, ...savedFlags };

export const featureFlags = writable<FeatureFlagConfig>(initialFlags);

featureFlags.subscribe((value) => {
    const diffs = (Object.keys(value) as FeatureFlag[]).reduce((acc, key) => {
        if (defaultConfig[key] !== value[key]) acc[key] = value[key];
        return acc;
    }, {} as FeatureFlagConfig);
    localStorage.setItem('featureFlags', JSON.stringify(diffs));
});
