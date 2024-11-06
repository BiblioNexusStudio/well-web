export enum SettingShortNameEnum {
    showOnlySrvResources = 'showOnlySrvResources',
    showCommunityResources = 'showCommunityResources',
    showAiResources = 'showAiResources',
}

export type Setting = {
    value: boolean;
    shortName: SettingShortNameEnum;
};
