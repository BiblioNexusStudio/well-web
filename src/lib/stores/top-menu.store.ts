import { writable } from 'svelte/store';

export const isSideMenuOpen = writable<boolean>(false);
