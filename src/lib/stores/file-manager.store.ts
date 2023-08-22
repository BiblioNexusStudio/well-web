import { derived, writable } from 'svelte/store';
import type { BibleVersion, Language, DownloadData, Passages } from '$lib/types/fileManager';

export const bibleData = writable<BibleVersion[]>([]);
export const bibleDataClone = derived(bibleData, (currentBibleData) => {
    return structuredClone(currentBibleData);
});
export const currentBibleVersion = writable<BibleVersion>({
    languageId: '',
    name: '',
    contents: [],
});
export const fileManagerLoading = writable<boolean>(false);
export const languages = writable<Language[]>([]);
export const downloadData = writable<DownloadData>({
    totalSizeToDownload: 0,
    totalSizeToDelete: 0,
    urlsToDownload: [],
    urlsToDelete: [],
});
export const passageData = writable<Passages[]>([]);
export const tableType = writable<string>('bible');
