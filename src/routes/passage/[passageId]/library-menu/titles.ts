import { ParentResourceName } from '$lib/types/resource';
import { _ as translate } from 'svelte-i18n';
import { get } from 'svelte/store';

export function calculateTitle(parentResourceName: string, isSubtitle = false) {
    const $translate = get(translate);
    switch (parentResourceName) {
        case ParentResourceName.UWTranslationWords:
            return isSubtitle
                ? parseSubtitle($translate('resources.types.uwTranslationWords.value'))
                : parseTitle($translate('resources.types.uwTranslationWords.value'));
        case ParentResourceName.CBBTER:
            return isSubtitle
                ? parseSubtitle($translate('resources.types.CBBTER.value'))
                : parseTitle($translate('resources.types.CBBTER.value'));
        case ParentResourceName.UbsImages:
            return isSubtitle
                ? parseSubtitle($translate('resources.types.ubsImages.value'))
                : parseTitle($translate('resources.types.ubsImages.value'));
        case ParentResourceName.VideoBibleDictionary:
            return isSubtitle
                ? parseSubtitle($translate('resources.types.videoBibleDictionary.value'))
                : parseTitle($translate('resources.types.videoBibleDictionary.value'));
        case ParentResourceName.TyndaleBibleDictionary:
            return isSubtitle
                ? parseSubtitle($translate('resources.types.tyndaleBibleDictionary.value'))
                : parseTitle($translate('resources.types.tyndaleBibleDictionary.value'));
        case ParentResourceName.TyndaleStudyNotes:
            return isSubtitle
                ? parseSubtitle($translate('resources.types.tyndaleStudyNotes.value'))
                : parseTitle($translate('resources.types.tyndaleStudyNotes.value'));
        case ParentResourceName.BiblicaBibleDictionary:
            return isSubtitle
                ? parseSubtitle($translate('resources.types.biblicaBibleDictionary.value'))
                : parseTitle($translate('resources.types.biblicaBibleDictionary.value'));
        case ParentResourceName.BiblicaStudyNotes:
            return isSubtitle
                ? parseSubtitle($translate('resources.types.biblicaStudyNotes.value'))
                : parseTitle($translate('resources.types.biblicaStudyNotes.value'));
        default:
            return null;
    }
}

function parseSubtitle(text: string) {
    const start = text.indexOf('(');
    if (start > 0) {
        return text.substring(start + 1, text.indexOf(')'));
    }
    return '';
}

function parseTitle(text: string) {
    const start = text.indexOf('(');
    if (start > 0 && start > 1) {
        return text.substring(0, start);
    } else {
        // rtl
        return text.substring(text.indexOf(')') + 1, text.length - 1);
    }
}
