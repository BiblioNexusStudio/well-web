import { get, writable } from 'svelte/store';
import { ContentTabEnum } from '../../routes/view-content/data-fetchers';
import { currentGuide } from './parent-resource.store';
import { currentBibleSection } from './passage-form.store';

export enum PassagePageMenuEnum {
    guide = 'guide',
    passage = 'passage',
    main = 'main',
    library = 'library',
    bible = 'bible',
    settings = 'settings',
    share = 'share',
    resources = 'resources',
    feedback = 'feedback',
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

export function openFeedbackMenu() {
    passagePageShownMenu.set(PassagePageMenuEnum.feedback);
}

export function recalculatePanesAndMenus(tab: ContentTabEnum, callback?: () => void) {
    if (tab === ContentTabEnum.LibraryMenu) {
        passagePageShownMenu.set(PassagePageMenuEnum.library);
    } else if (tab === ContentTabEnum.Resources) {
        passagePageShownMenu.set(PassagePageMenuEnum.resources);
    } else if (tab === ContentTabEnum.Guide && (get(currentGuide) === undefined || get(currentBibleSection) === null)) {
        openGuideMenu();
    } else if (tab === ContentTabEnum.MainMenu) {
        openMainMenu();
    } else if (tab === ContentTabEnum.Bible && get(currentBibleSection) === null) {
        openBibleMenu();
    } else {
        passagePageShownMenu.set(null);
    }
    callback?.();
}
