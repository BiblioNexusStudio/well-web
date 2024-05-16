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

export const fileManagerLoading = writable<boolean>(false);
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
    textUrl: '',
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

const limitChapters = {
    JOB: ['1', '2'],
    MAT: [
        '1',
        '4',
        '5',
        '6',
        '7',
        '10',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
        '23',
        '24',
        '26',
        '27',
        '28',
    ],
    LUK: ['1', '2', '3', '4', '5', '6', '7', '8', '16', '17', '18'],
    JHN: ['4'],
    ACT: ['7', '8', '9', '10', '11', '12', '13', '14', '17', '18', '19', '20', '21'],
};
export const allowedBooks = ['GEN', 'JOB', 'MAT', 'MRK', 'LUK', 'JHN', 'ACT'];

export function limitChaptersIfNecessary(code: string | null, data: typeof biblesModuleBook) {
    data.update((data) => {
        if (data.audioUrls) {
            data.audioUrls.chapters = data.audioUrls.chapters.filter(({ number }) => {
                if (code && Object.keys(limitChapters).includes(code)) {
                    const bookCode = code as keyof typeof limitChapters;
                    return limitChapters[bookCode].includes(number);
                }
                return true;
            });
        }
        return data;
    });
}
