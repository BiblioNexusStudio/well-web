import { writable } from 'svelte/store';
import type { BibleBook, language, DownloadData } from '$lib/types/fileManager';

export const bibleData = writable<BibleBook[]>([]);
export const bibleDataClone = writable<BibleBook[]>([]);
export const currentBibleBookClone = writable<BibleBook>({
    languageId: '',
    name: '',
    contents: [],
});
export const currentBibleBook = writable<BibleBook>({
    languageId: '',
    name: '',
    contents: [],
});
export const fileManagerLoading = writable<boolean>(false);
export const languages = writable<language[]>([]);
export const downloadData = writable<DownloadData>({
    totalSizeToDownload: 0,
    totalSizeToDelete: 0,
    urlsToDownload: [],
    urlsToDelete: [],
});
