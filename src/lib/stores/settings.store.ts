import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { type Setting, SettingShortNameEnum } from '../types/settings';
import { ParentResourceName } from '$lib/types/resource';

const bibleWellSettingsInLocalStorage = 'BIBLE_WELL_SETTINGS_IN_LOCAL_STORAGE';

const showOnlySrvResources: Setting = {
    value: true,
    shortName: SettingShortNameEnum.showOnlySrvResources,
    parentResources: [ParentResourceName.CBBTER, ParentResourceName.VideoBibleDictionary],
};

const defaultSettings = [showOnlySrvResources];

let savedSettings: Setting[] = [];

if (browser) {
    savedSettings = JSON.parse(localStorage.getItem(bibleWellSettingsInLocalStorage) || '[]');
}

const initialSettings = defaultSettings.map((setting) => {
    const savedSetting = savedSettings.find((savedSetting: Setting) => savedSetting.shortName === setting.shortName);
    return savedSetting || setting;
});

export const settings = writable<Setting[]>(initialSettings);

settings.subscribe((value) => {
    if (browser) {
        localStorage.setItem(bibleWellSettingsInLocalStorage, JSON.stringify(value));
    }
});
