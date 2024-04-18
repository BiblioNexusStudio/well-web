import { writable } from 'svelte/store';

export enum PassagePageMenuEnum {
    guide = 'guide',
    passage = 'passage',
    main = 'main',
    library = 'library',
    bible = 'bible',
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

export function openLibraryMenu() {
    passagePageShownMenu.set(PassagePageMenuEnum.library);
}

export function openBibleMenu() {
    passagePageShownMenu.set(PassagePageMenuEnum.bible);
}

export function closeAllPassagePageMenus() {
    passagePageShownMenu.set(null);
}
