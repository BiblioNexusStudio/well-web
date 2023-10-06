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
    ResourcesApiModule,
    ResourcesApiModuleChapter,
} from '$lib/types/file-manager';
import { audioFileTypeForBrowser } from '$lib/utils/browser';
import { resourceContentApiPath } from '$lib/utils/data-handlers/resources/resource';

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
        display: index === 0 ? true : false,
        isBible: true,
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
export const resourcesApiModule = writable<ResourcesApiModule>({ chapters: [] as ResourcesApiModuleChapter[] });
export const downloadData = derived(
    [biblesModuleBook, footerInputs, resourcesMenu],
    ([biblesModuleBook, footerInputs, resourcesMenu]) => {
        const urlsAndSizesToDownload = [] as UrlWithMetadata[];
        const bibleSelected = resourcesMenu.some(({ selected, isBible }) => selected && isBible);

        if (
            biblesModuleBook.audioUrls.chapters.some((chapter) => chapter.selected) &&
            bibleSelected &&
            footerInputs.text
        ) {
            urlsAndSizesToDownload.push({
                mediaType: 'text',
                url: biblesModuleBook.textUrl,
                size: biblesModuleBook.textSize,
            });
        }

        biblesModuleBook.audioUrls.chapters.forEach((chapter) => {
            if (chapter.selected) {
                if (bibleSelected && footerInputs.audio) {
                    urlsAndSizesToDownload.push({
                        mediaType: 'audio',
                        url: chapter[audioFileTypeForBrowser()].url,
                        size: chapter[audioFileTypeForBrowser()].size,
                    });
                }

                chapter.resourceMenuItems?.forEach((resourceMenuItem) => {
                    if (footerInputs.text) {
                        if (resourceMenuItem.mediaTypeName === 'Text') {
                            if (
                                resourcesMenu.some(
                                    ({ selected, value }) => selected && value === resourceMenuItem.typeName
                                )
                            ) {
                                urlsAndSizesToDownload.push({
                                    mediaType: 'text',
                                    url: resourceContentApiPath(resourceMenuItem),
                                    size: resourceMenuItem.contentSize,
                                });
                            }
                        }
                    }

                    if (footerInputs.audio) {
                        if (resourceMenuItem.mediaTypeName === 'Audio') {
                            if (
                                resourcesMenu.some(
                                    ({ selected, value }) => selected && value === resourceMenuItem.typeName
                                )
                            ) {
                                urlsAndSizesToDownload.push({
                                    mediaType: 'audio',
                                    url: resourceContentApiPath(resourceMenuItem),
                                    size: resourceMenuItem.contentSize,
                                });
                            }
                        }
                    }

                    if (footerInputs.media) {
                        if (resourceMenuItem.mediaTypeName === 'Image') {
                            urlsAndSizesToDownload.push({
                                mediaType: 'images',
                                url: resourceContentApiPath(resourceMenuItem),
                                size: resourceMenuItem.contentSize,
                            });
                        }
                    }
                });
            }
        });

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
