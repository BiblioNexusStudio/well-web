import { writable } from 'svelte/store';
import type { FrontendPassagesByBook } from '$lib/types/passage';

export const selectedId = writable<string>('default');
export const selectedBookIndex = writable<number | 'default'>('default');
export const passagesByBook = writable<FrontendPassagesByBook[]>([]);
export const data = writable({} as { passagesByBook?: FrontendPassagesByBook[] });
