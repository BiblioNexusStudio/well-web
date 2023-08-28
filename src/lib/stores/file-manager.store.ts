import { writable } from 'svelte/store';
import type { Language, DownloadData, FrontendPassage, FrontendBibleVersion } from '$lib/types/file-manager';

export const bibleData = writable<FrontendBibleVersion[]>([]);
export const currentBibleVersion = writable<FrontendBibleVersion>({
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
export const passageData = writable<FrontendPassage[]>([]);
export const tableType = writable<string>('bible');
