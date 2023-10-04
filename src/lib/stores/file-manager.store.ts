import { derived, writable } from 'svelte/store';
import type {
    Language,
    FrontendPassage,
    FrontendBibleVersion,
    UrlWithMetadata,
    FooterInputs,
    ResourcesMenuItem,
    BiblesModule,
    BiblesModuleBook,
    ApiAudioChapter,
} from '$lib/types/file-manager';
import { audioFileTypeForBrowser } from '$lib/utils/browser';

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
export const tableType = writable<string>('bible');
export const footerInputs = writable<FooterInputs>({
    text: true,
    audio: false,
    media: false,
});
export const resourcesMenu = writable<ResourcesMenuItem[]>([]);
export const biblesModuleData = writable<BiblesModule[]>([]);
export const bibleDataForResourcesMenu = derived(biblesModuleData, (bibleData) => {
    return bibleData.map((bible, index) => ({
        name: bible.name,
        value: bible.name,
        selected: index === 0 ? true : false,
    }));
});
export const selectedBookCode = writable<string | null>(null);
export const biblesModuleBook = writable<BiblesModuleBook>({
    bookCode: '',
    displayName: '',
    textSize: 0,
    audioSize: 0,
    chapterCount: 0,
    textUrl: '',
    audioUrls: {
        chapters: [] as ApiAudioChapter[],
    },
});
export const downloadData = derived(
    [biblesModuleBook, footerInputs],
    ([biblesModuleBook, footerInputs]) => {
        const urlsAndSizesToDownload = [] as UrlWithMetadata[];

        if (biblesModuleBook.audioUrls.chapters.some((chapter) => chapter.selected)) {
            urlsAndSizesToDownload.push({
                mediaType: 'text',
                url: biblesModuleBook.textUrl,
                size: biblesModuleBook.textSize,
            });
        }

        if (footerInputs.audio) {
            biblesModuleBook.audioUrls.chapters.forEach((chapter) => {
                if (chapter.selected) {
                    urlsAndSizesToDownload.push({
                        mediaType: 'audio',
                        url: chapter[audioFileTypeForBrowser()].url,
                        size: chapter[audioFileTypeForBrowser()].size,
                    });
                }
            });
        }

        return {
            urlsToDelete: [],
            urlsToDownload: urlsAndSizesToDownload,
            totalSizeToDelete: 0,
            totalSizeToDownload: urlsAndSizesToDownload.reduce((acc, { size }) => size + acc, 0),
        };
    },
    {
        urlsToDownload: [] as UrlWithMetadata[],
        urlsToDelete: [] as string[],
        totalSizeToDownload: 0,
        totalSizeToDelete: 0,
    }
);
