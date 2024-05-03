import { writable } from 'svelte/store';
import { type Setting, SettingShortNameEnum, ParentResourceIdEnum } from '../types/settings';

const showOnlySrvResources: Setting = {
    text: 'Show Only SRV Resources',
    value: true,
    shortName: SettingShortNameEnum.showOnlySrvResources,
    parentResourceIds: [ParentResourceIdEnum.CBBTER, ParentResourceIdEnum.VideoBibleDictionary],
};

export const settings = writable<Setting[]>([showOnlySrvResources]);
