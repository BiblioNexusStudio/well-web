export enum SettingShortNameEnum {
    showOnlySrvResources = 'showOnlySrvResources',
}

export enum GuideShortNameEnum {
    CBBTER = 'CBBTER',
    UWTranslationNotes = 'UWTranslationNotes',
}

export type Setting = {
    text: string;
    value: boolean;
    shortName: SettingShortNameEnum;
};
