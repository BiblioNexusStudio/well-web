import { derived, writable } from 'svelte/store';
import type { Language, FrontendPassage, FrontendBibleVersion } from '$lib/types/file-manager';
import { calculateUrlsAndSizesToChange } from '$lib/utils/file-manager';
import type { UrlWithSize } from '$lib/data-cache';

export const originalBibleData = writable<FrontendBibleVersion[]>([]);
export const bibleData = writable<FrontendBibleVersion[]>([]);
export const currentBibleVersion = writable<FrontendBibleVersion>({
    languageId: '',
    name: '',
    contents: [],
});
export const fileManagerLoading = writable<boolean>(false);
export const languages = writable<Language[]>([]);
export const originalPassageData = writable<FrontendPassage[]>([]);
export const passageData = writable<FrontendPassage[]>([]);
export const downloadData = derived(
    [bibleData, originalBibleData, passageData, originalPassageData],
    ([bibleData, originalBibleData, passageData, originalPassageData]) => {
        return calculateUrlsAndSizesToChange(bibleData, originalBibleData, passageData, originalPassageData);
    },
    {
        urlsToDownload: [] as UrlWithSize[],
        urlsToDelete: [] as string[],
        totalSizeToDownload: 0,
        totalSizeToDelete: 0,
    }
);
export const tableType = writable<string>('bible');
