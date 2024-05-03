import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { type Setting, SettingShortNameEnum, ParentResourceIdEnum } from '../types/settings';

const bibleWellSettingsInLocalStorage = 'BIBLE_WELL_SETTINGS_IN_LOCAL_STORAGE';

const showOnlySrvResources: Setting = {
    value: true,
    shortName: SettingShortNameEnum.showOnlySrvResources,
    parentResourceIds: [ParentResourceIdEnum.CBBTER, ParentResourceIdEnum.VideoBibleDictionary],
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
