import { writable } from 'svelte/store';
import { type Setting, SettingShortNameEnum } from '../types/settings';

const showOnlySrvResources: Setting = {
    text: 'Show Only SRV Resources',
    value: true,
    shortName: SettingShortNameEnum.showOnlySrvResources,
};

export const settings = writable<Setting[]>([showOnlySrvResources]);
