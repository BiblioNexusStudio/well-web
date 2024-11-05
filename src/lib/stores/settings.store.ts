import { get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { type Setting, SettingShortNameEnum } from '../types/settings';
import { featureFlags } from './feature-flags.store';

const bibleWellSettingsInLocalStorage = 'BIBLE_WELL_SETTINGS_IN_LOCAL_STORAGE';

let isFiaSite = false;

if (browser) {
    isFiaSite = window.location.origin.toLowerCase().includes('fia') || get(featureFlags).forceFiaMode;
}

const showOnlySrvResources: Setting = {
    value: isFiaSite,
    shortName: SettingShortNameEnum.showOnlySrvResources,
};

const showCommunityResources: Setting = {
    value: true,
    shortName: SettingShortNameEnum.showCommunityResources,
};

const showAiResources: Setting = {
    value: true,
    shortName: SettingShortNameEnum.showAiResources,
};

const defaultSettings = [showCommunityResources, showAiResources, showOnlySrvResources];

let savedSettings: Setting[] = [];

if (browser) {
    savedSettings = JSON.parse(localStorage.getItem(bibleWellSettingsInLocalStorage) || '[]');
}

const initialSettings = defaultSettings.map((setting) => {
    const savedSetting = savedSettings.find((savedSetting: Setting) => savedSetting.shortName === setting.shortName);
    return { ...setting, value: savedSetting?.value ?? setting.value };
});

export const settings = writable<Setting[]>(initialSettings);

featureFlags.subscribe(($flags) => {
    if ($flags.forceFiaMode) {
        settings.update(($settings) =>
            $settings.map((s) =>
                s.shortName === SettingShortNameEnum.showOnlySrvResources ? { ...s, value: true } : s
            )
        );
    }
});

settings.subscribe(($settings) => {
    if (browser) {
        localStorage.setItem(bibleWellSettingsInLocalStorage, JSON.stringify($settings));
    }
});
