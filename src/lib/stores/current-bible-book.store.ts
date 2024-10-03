import { writable } from 'svelte/store';

export const currentBibleBook = writable<string | null>(null);
