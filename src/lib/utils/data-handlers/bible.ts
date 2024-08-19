import { currentLanguageInfo, lookupLanguageInfoByCode } from '$lib/stores/language.store';
import type { UrlWithMetadata } from '$lib/types/file-manager';
import { audioFileTypeForBrowser } from '../browser';
import {
    METADATA_ONLY_FAKE_FILE_SIZE,
    apiUrl,
    cacheManyContentUrlsWithProgress,
    fetchFromCacheOrApi,
    isCachedFromApi,
    isCachedAsContent,
} from '$lib/data-cache';
import { asyncEvery, asyncFilter, asyncSome } from '../async-array';
import { range } from '../array';
import type { ApiBible, ApiBibleBook, BaseBible, BibleBookContentDetails } from '$lib/types/bible';
import { isOnline } from '$lib/stores/is-online.store';
import { get } from 'svelte/store';
import type { BibleSection } from '$lib/types/bible';
import { MediaType } from '$lib/types/resource';
import { log } from '$lib/logger';
import {
    bibleBooksByBibleId,
    biblesEndpoint,
    biblesForLanguageEndpoint,
    biblesForLanguageWithRestrictionsEndpoint,
    biblesWithRestrictionsEndpoint,
    bookOfBibleEndpoint,
} from '$lib/api-endpoints';

function bibleUrlsWithMetadataForBookAndChapters(
    bookData: BibleBookContentDetails,
    chapters: number[] | 'all'
): UrlWithMetadata[] {
    return (
        bookData.audioUrls?.chapters
            .filter((chapter) => chapters === 'all' || chapters.includes(parseInt(chapter.number)))
            .map(
                (audioUrl) =>
                    ({
                        url: audioUrl[audioFileTypeForBrowser()].url,
                        size: audioUrl[audioFileTypeForBrowser()].size,
                        mediaType: MediaType.Audio,
                    }) as UrlWithMetadata
            )
            .concat({
                url: bibleBookUrl(bookData.bibleId, bookData.bookCode),
                size: bookData.textSize,
                mediaType: MediaType.Text,
            } as UrlWithMetadata) || []
    );
}

// returns a list of localized Bible books and for each chapter the corresponding chapter data
// when offline, returns only the Bible books that are cached
export async function bibleChaptersByBookAvailable(online: boolean, preferredBibleIds: number[]) {
    const allBibles = await fetchAllBibles();
    const languageId = get(currentLanguageInfo)?.id;
    const currentLanguagePreferredBibleId = allBibles.find(
        (b) => preferredBibleIds.includes(b.id) && b.languageId === languageId
    );
    const preferredBibleId = allBibles.find((b) => preferredBibleIds.includes(b.id));
    const bibleBookandChapterInfo = await getBibleBooksByBibleId(
        currentLanguagePreferredBibleId?.id ?? preferredBibleId?.id ?? 1
    );
    if (online) {
        return bibleBookandChapterInfo;
    }
    return await asyncFilter(bibleBookandChapterInfo, async (bookAndChapterInfo) => {
        return await asyncSome(preferredBibleIds, async (bibleId) => {
            if (await isCachedFromApi(bookOfBibleEndpoint(bibleId, bookAndChapterInfo.code)[0])) {
                const textUrl = bibleBookUrl(bibleId, bookAndChapterInfo.code);
                return await isCachedAsContent(textUrl);
            }
            return false;
        });
    });
}

// returns all Bibles that are available
// when offline, returns only Bibles that have at least one book cached
export async function availableBibles(online: boolean) {
    const allBibles = await fetchAllBibles();
    if (online) {
        return allBibles;
    } else {
        return await asyncFilter(allBibles, async (bible) => {
            if (await isCachedFromApi(bibleBooksByBibleId(bible.id)[0])) {
                const bibleBookandChapterInfo = await getBibleBooksByBibleId(bible.id);
                return await asyncSome(bibleBookandChapterInfo, async (bookAndChapterInfo) => {
                    if (await isCachedFromApi(bookOfBibleEndpoint(bible.id, bookAndChapterInfo.code)[0])) {
                        const textUrl = bibleBookUrl(bible.id, bookAndChapterInfo.code);
                        return await isCachedAsContent(textUrl);
                    }
                    return false;
                });
            }
            return false;
        });
    }
}

export async function fetchAllBibles(): Promise<BaseBible[]> {
    try {
        const [bibles, restrictedBibles] = await Promise.all([
            fetchFromCacheOrApi(...biblesEndpoint()),
            fetchFromCacheOrApi(...biblesWithRestrictionsEndpoint()),
        ]);
        return [...bibles, ...restrictedBibles];
    } catch (error) {
        log.exception(error as Error);
        return [];
    }
}

export async function fetchBiblesForLanguageCode(languageCode: string): Promise<ApiBible[]> {
    const languageId = lookupLanguageInfoByCode(languageCode)?.id;

    if (!languageId) return [];

    try {
        const [bibles, restrictedBibles] = await Promise.all([
            fetchFromCacheOrApi(...biblesForLanguageEndpoint(languageId)),
            fetchFromCacheOrApi(...biblesForLanguageWithRestrictionsEndpoint(languageId)),
        ]);
        return [...bibles, ...restrictedBibles];
    } catch (error) {
        log.exception(error as Error);
        return [];
    }
}

export function bibleBookUrl(bibleId: number, bookCode: string) {
    return apiUrl(`/bibles/${bibleId}/texts?bookCode=${bookCode}`);
}

export async function fetchBibleDataForBookCodeAndBibleId(
    bookCode: string,
    bibleId: number
): Promise<BibleBookContentDetails | null> {
    try {
        const basicDetails = await fetchFromCacheOrApi(...bookOfBibleEndpoint(bibleId, bookCode));
        return { ...basicDetails, bibleId };
    } catch (error) {
        // this means the user hasn't cached the Bible data or bible id is invalid
        log.exception(error as Error);
        return null;
    }
}

export async function cacheBiblesForBibleSection(
    bibleSection: BibleSection,
    allBookContentDetails: BibleBookContentDetails[]
) {
    const urls = allBookContentDetails.flatMap((bookContentDetails) =>
        bibleUrlsWithMetadataForBookAndChapters(
            bookContentDetails,
            range(bibleSection.startChapter, bibleSection.endChapter)
        )
    );
    await cacheManyContentUrlsWithProgress(urls);
}

export async function cacheBibleMetadata(bibleIds: number[]) {
    const urls = bibleIds.map((bibleId) => ({
        url: apiUrl(bibleBooksByBibleId(bibleId)[0]),
        size: METADATA_ONLY_FAKE_FILE_SIZE,
        mediaType: MediaType.Text,
    }));
    await cacheManyContentUrlsWithProgress(urls);
}

export async function bookDataForBibleTab(bibleSection: BibleSection, bibleId: number, isPreferredBible: boolean) {
    const online = get(isOnline);
    try {
        if (!online && !(await isCachedFromApi(bookOfBibleEndpoint(bibleId, bibleSection.bookCode)[0]))) {
            // if it's offline and not cached, it's not valid
            return null;
        } else if ((online && isPreferredBible) || !online) {
            // if it's online and a preferred Bible or offline, we need to get the bookData
            const bookData = await fetchBibleDataForBookCodeAndBibleId(bibleSection.bookCode, bibleId);
            if (online || (await isContentCachedForOffline(bibleSection, bookData))) {
                return bookData;
            }
        }
        return null;
    } catch (error) {
        // stuff not cached
        log.exception(error as Error);
        return null;
    }
}

async function isContentCachedForOffline(bibleSection: BibleSection, bookData: BibleBookContentDetails | null) {
    if (bookData) {
        const textUrl = bibleBookUrl(bookData.bibleId, bookData.bookCode);
        const textCached = await isCachedAsContent(textUrl);
        if (textCached) {
            return true;
        }
        const audioCached = await asyncEvery(
            range(bibleSection.startChapter, bibleSection.endChapter),
            async (chapterNumber) => {
                const chapterAudioUrl = bookData!.audioUrls?.chapters?.find(
                    (chapter) => chapter.number === String(chapterNumber)
                )?.[audioFileTypeForBrowser()]?.url;
                return !!chapterAudioUrl && (await isCachedAsContent(chapterAudioUrl));
            }
        );
        if (audioCached) {
            return true;
        }
    }
    return false;
}

const memoizedBibleBookCodesToName = new Map<number, Map<string, string>>();

export async function getBibleBookCodesToName(languageId: number, retry = true): Promise<Map<string, string>> {
    if (memoizedBibleBookCodesToName.has(languageId)) {
        return memoizedBibleBookCodesToName.get(languageId)!;
    }

    const bibleData = (await fetchFromCacheOrApi(...biblesForLanguageEndpoint(languageId))) as ApiBible[];
    if (bibleData[0]) {
        const result = new Map(bibleData[0].books.map(({ displayName, bookCode }) => [bookCode, displayName]));
        memoizedBibleBookCodesToName.set(languageId, result);
        return result;
    } else {
        if (retry && languageId !== 1) {
            return getBibleBookCodesToName(1, false);
        }
        return new Map();
    }
}

async function getBibleBooksByBibleId(bibleId: number) {
    return (await fetchFromCacheOrApi(...bibleBooksByBibleId(bibleId))) as Promise<ApiBibleBook[]>;
}

export function bibleBooksByBibleIdFullUrl(bibleId: number) {
    return apiUrl(bibleBooksByBibleId(bibleId)[0]);
}
