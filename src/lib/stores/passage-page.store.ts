import { writable } from 'svelte/store';

export const passagePageMenusObject = writable<PassagePageMenusObject>({
    showGuideMenu: false,
    showPassageMenu: false,
    showMainMenu: false,
    showLibraryMenu: false,
});

export function openGuideMenu() {
    passagePageMenusObject.update(() => {
        return {
            showPassageMenu: false,
            showGuideMenu: true,
            showMainMenu: false,
            showLibraryMenu: false,
        };
    });
}

export function openPassageMenu() {
    passagePageMenusObject.update(() => {
        return {
            showPassageMenu: true,
            showGuideMenu: false,
            showMainMenu: false,
            showLibraryMenu: false,
        };
    });
}

export function openMainMenu() {
    passagePageMenusObject.update(() => {
        return {
            showPassageMenu: false,
            showGuideMenu: false,
            showMainMenu: true,
            showLibraryMenu: false,
        };
    });
}

export function openLibraryMenu() {
    passagePageMenusObject.update(() => {
        return {
            showPassageMenu: false,
            showGuideMenu: false,
            showMainMenu: false,
            showLibraryMenu: true,
        };
    });
}

export function closeAllPassagePageMenus() {
    passagePageMenusObject.update(() => {
        return {
            showPassageMenu: false,
            showGuideMenu: false,
            showMainMenu: false,
            showLibraryMenu: false,
        };
    });
}

interface PassagePageMenusObject {
    showGuideMenu: boolean;
    showPassageMenu: boolean;
    showMainMenu: boolean;
    showLibraryMenu: boolean;
}
