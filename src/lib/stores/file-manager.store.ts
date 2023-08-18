import { writable } from 'svelte/store';
import type { BibleBook, language } from '$lib/types/fileManager';

export const bibleData = writable<BibleBook[]>([]);
export const bibleDataClone = writable<BibleBook[]>([]);
export const currentBibleBook = writable<BibleBook>({
    languageId: '',
    name: '',
    contents: [],
});
export const fileManagerLoading = writable<boolean>(false);
export const languages = writable<language[]>([]);
