import { writable } from 'svelte/store';

export const isOnline = writable<boolean>(false);
