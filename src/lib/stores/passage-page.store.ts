import { writable } from 'svelte/store';

export enum PassagePageMenuEnum {
    guide = 'guide',
    passage = 'passage',
    main = 'main',
    library = 'library',
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

export function closeAllPassagePageMenus() {
    passagePageShownMenu.set(null);
}
