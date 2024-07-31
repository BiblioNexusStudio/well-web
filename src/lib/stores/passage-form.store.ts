import { writable } from 'svelte/store';

export const selectedBookIndex = writable<number | 'default'>('default');
