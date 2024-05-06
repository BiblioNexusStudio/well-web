export enum SettingShortNameEnum {
    showOnlySrvResources = 'showOnlySrvResources',
}

export enum ParentResourceIdEnum {
    CBBTER = 1,
    TyndaleBibleDictionary = 2,
    UbsImages = 3,
    VideoBibleDictionary = 4,
    TyndaleStudyNotes = 5,
    BiblicaStudyNotes = 6,
    UWTranslationWords = 7,
    TyndaleStudyNotesBookIntros = 8,
    TyndaleStudyNotesBookIntroSummaries = 9,
    UWTranslationManual = 10,
    UWTranslationNotes = 11,
}

export type Setting = {
    value: boolean;
    shortName: SettingShortNameEnum;
    parentResourceIds: ParentResourceIdEnum[];
};
