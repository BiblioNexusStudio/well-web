import { get, writable } from 'svelte/store';
import { PassagePageTabEnum } from '../../routes/view-content/data-fetchers';
import { currentGuide } from './parent-resource.store';
import { selectedBibleSection } from './passage-form.store';

export enum PassagePageMenuEnum {
    guide = 'guide',
    passage = 'passage',
    main = 'main',
    library = 'library',
    bible = 'bible',
    settings = 'settings',
    share = 'share',
    resources = 'resources',
}

export const passagePageShownMenu = writable<PassagePageMenuEnum | null>(null);

export function openGuideMenu() {
    passagePageShownMenu.set(PassagePageMenuEnum.guide);
}

export function openPassageMenu() {
    passagePageShownMenu.set(PassagePageMenuEnum.passage);
}

export function openMainMenu() {
    passagePageShownMenu.set(PassagePageMenuEnum.main);
}

export function openBibleMenu() {
    passagePageShownMenu.set(PassagePageMenuEnum.bible);
}

export function openSettingsMenu() {
    passagePageShownMenu.set(PassagePageMenuEnum.settings);
}

export function openShareMenu() {
    passagePageShownMenu.set(PassagePageMenuEnum.share);
}

export function recalculatePanesAndMenus(tab: PassagePageTabEnum, callback?: () => void) {
    if (tab === PassagePageTabEnum.LibraryMenu) {
        passagePageShownMenu.set(PassagePageMenuEnum.library);
    } else if (tab === PassagePageTabEnum.Resources) {
        passagePageShownMenu.set(PassagePageMenuEnum.resources);
    } else if (
        tab === PassagePageTabEnum.Guide &&
        (get(currentGuide) === undefined || get(selectedBibleSection) === null)
    ) {
        openGuideMenu();
    } else if (tab === PassagePageTabEnum.MainMenu) {
        openMainMenu();
    } else if (tab === PassagePageTabEnum.Bible && get(selectedBibleSection) === null) {
        openBibleMenu();
    } else {
        passagePageShownMenu.set(null);
    }
    callback?.();
}
