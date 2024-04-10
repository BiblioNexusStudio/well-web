import { ParentResourceName } from '$lib/types/resource';
import { _ as translate } from 'svelte-i18n';
import { get } from 'svelte/store';

export function calculateTitle(parentResourceName: string) {
    const $translate = get(translate);
    switch (parentResourceName) {
        case ParentResourceName.UWTranslationWords:
            return $translate('resources.types.uwTranslationWords.value');
        case ParentResourceName.CBBTER:
            return $translate('resources.types.CBBTER.value');
        case ParentResourceName.UbsImages:
            return $translate('resources.types.ubsImages.value');
        case ParentResourceName.VideoBibleDictionary:
            return $translate('resources.types.videoBibleDictionary.value');
        case ParentResourceName.TyndaleBibleDictionary:
            return $translate('resources.types.tyndaleBibleDictionary.value');
        case ParentResourceName.TyndaleStudyNotes:
            return $translate('resources.types.tyndaleStudyNotes.value');
        case ParentResourceName.BiblicaBibleDictionary:
            return $translate('resources.types.biblicaBibleDictionary.value');
        case ParentResourceName.BiblicaStudyNotes:
            return $translate('resources.types.biblicaStudyNotes.value');
        default:
            return null;
    }
}
