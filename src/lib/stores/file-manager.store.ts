import { derived, writable } from 'svelte/store';
import type {
    Language,
    FrontendPassage,
    FrontendBibleVersion,
    UrlWithMetadata,
    FooterInputs,
} from '$lib/types/file-manager';
import { calculateUrlsWithMetadataToChange } from '$lib/utils/file-manager';

export const originalBibleData = writable<FrontendBibleVersion[]>([]);
export const bibleData = writable<FrontendBibleVersion[]>([]);
export const currentBibleVersion = writable<FrontendBibleVersion>({
    languageId: 0,
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
        return calculateUrlsWithMetadataToChange(bibleData, originalBibleData, passageData, originalPassageData);
    },
    {
        urlsToDownload: [] as UrlWithMetadata[],
        urlsToDelete: [] as string[],
        totalSizeToDownload: 0,
        totalSizeToDelete: 0,
    }
);
export const tableType = writable<string>('bible');
export const footerInputs = writable<FooterInputs>({
    text: false,
    audio: false,
    media: false,
});
