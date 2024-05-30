export enum SettingShortNameEnum {
    showOnlySrvResources = 'showOnlySrvResources',
}

export type Setting = {
    value: boolean;
    shortName: SettingShortNameEnum;
};
