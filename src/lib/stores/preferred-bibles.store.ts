import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const storedBibleIds = browser ? localStorage.getItem('preferredBibleIds') : null;
export const preferredBibleIds = writable<number[]>(storedBibleIds ? JSON.parse(storedBibleIds) : []);
preferredBibleIds.subscribe((value) => {
    browser && localStorage.setItem('preferredBibleIds', JSON.stringify(value));
});
