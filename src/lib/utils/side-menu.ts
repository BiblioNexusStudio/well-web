import { isSideMenuOpen } from '$lib/stores/top-menu.store';

export const closeSideMenu = () => {
    isSideMenuOpen.set(false);
};
