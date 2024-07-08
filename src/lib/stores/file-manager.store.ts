import { derived, writable } from 'svelte/store';
import type {
    UrlWithMetadata,
    FooterInputs,
    ResourcesMenuItem,
    BiblesModule,
    BiblesModuleBook,
    ResourcesApiModule,
    ResourcesApiModuleChapter,
    FrontendAudioChapter,
} from '$lib/types/file-manager';
import { calculateUrlsWithMetadataToChange } from '$lib/utils/file-manager';

export const isLoadingResources = writable<boolean>(false);
export const isLoadingParentResources = writable<boolean>(false);
export const isLoadingLanguageFirstBible = writable<boolean>(false);
export const isLoadingBibles = writable<boolean>(false);
export const footerInputs = writable<FooterInputs>({
    text: true,
    audio: true,
    media: true,
});
export const resourcesMenu = writable<ResourcesMenuItem[]>([]);
export const biblesModuleData = writable<BiblesModule[]>([]);
export const bibleDataForResourcesMenu = derived(biblesModuleData, (bibleData) => {
    return bibleData.map((bible, index) => ({
        name: bible.name,
        selected: index === 0 ? true : false,
        display: index === 0 ? true : false,
        isBible: true,
        parentResource: null,
    }));
});
export const selectedBookCode = writable<string | null>(null);
export const biblesModuleBook = writable<BiblesModuleBook>({
    bookCode: '',
    displayName: '',
    textSize: 0,
    audioSize: 0,
    chapterCount: 0,
    isTextUrlCached: false,
    bibleId: null,
    audioUrls: {
        chapters: [] as FrontendAudioChapter[],
    },
});
export const resourcesApiModule = writable<ResourcesApiModule>({ chapters: [] as ResourcesApiModuleChapter[] });
export const downloadData = derived(
    [biblesModuleBook, footerInputs, resourcesMenu],
    ([biblesModuleBook, footerInputs, resourcesMenu]) =>
        calculateUrlsWithMetadataToChange(biblesModuleBook, footerInputs, resourcesMenu),
    {
        urlsToDownload: [] as UrlWithMetadata[],
        urlsToDelete: [] as string[],
        totalSizeToDownload: 0,
        nonMetadataSizeToDownload: 0,
    }
);
