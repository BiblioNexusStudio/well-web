import { writable } from 'svelte/store';
import type { PassagesForBook } from '../types/passage-form';

export const selectedId = writable<string>('default');
export const selectedBookIndex = writable<number | 'default'>('default');
export const passagesByBook = writable<PassagesForBook[]>([]);
export const data = writable({} as { passagesByBook?: PassagesForBook[] });
