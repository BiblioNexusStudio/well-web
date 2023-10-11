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
    ResourcesApiModule,
    ResourcesApiModuleChapter,
    FrontendAudioChapter,
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
    isTextUrlCached: false,
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
        totalSizeToDelete: 0,
    }
);
