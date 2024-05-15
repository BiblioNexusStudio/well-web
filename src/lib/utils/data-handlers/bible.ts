import { currentLanguageInfo, lookupLanguageInfoByCode } from '$lib/stores/language.store';
import type { UrlWithMetadata } from '$lib/types/file-manager';
import { audioFileTypeForBrowser } from '../browser';
import {
    METADATA_ONLY_FAKE_FILE_SIZE,
    apiUrl,
    cacheManyFromCdnWithProgress,
    fetchFromCacheOrApi,
    isCachedFromApi,
    isCachedFromCdn,
} from '$lib/data-cache';
import { asyncEvery, asyncFilter, asyncSome } from '../async-array';
import { range } from '../array';
import { updateRow } from '../data-storage';
import { bibleSectionToString } from '../bible-section-helpers';
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
    bookOfBibleEndpoint,
} from '$lib/api-endpoints';

type BibleRecordingPassage = { url: string };
type BibleRecordingVersion = {
    passages: Record<string, BibleRecordingPassage>;
    language: string;
    version: string;
    versionAbbreviation: string;
};
type BibleRecordingVersions = { bibleRecordingVersions: BibleRecordingVersion[] };

const bibleRecordingsKey = 'bibleRecordings';

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
            .concat({ url: bookData.textUrl, size: bookData.textSize, mediaType: MediaType.Text } as UrlWithMetadata) ||
        []
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
                const textUrl = (
                    (await fetchFromCacheOrApi(
                        ...bookOfBibleEndpoint(bibleId, bookAndChapterInfo.code)
                    )) as BibleBookContentDetails
                ).textUrl;
                return await isCachedFromCdn(textUrl);
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
                        const textUrl = (
                            (await fetchFromCacheOrApi(
                                ...bookOfBibleEndpoint(bible.id, bookAndChapterInfo.code)
                            )) as BibleBookContentDetails
                        ).textUrl;
                        return await isCachedFromCdn(textUrl);
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
        return await fetchFromCacheOrApi(...biblesEndpoint());
    } catch (error) {
        log.exception(error as Error);
        return [];
    }
}

export async function fetchBiblesForLanguageCode(languageCode: string): Promise<ApiBible[]> {
    const languageId = lookupLanguageInfoByCode(languageCode)?.id;

    if (!languageId) return [];

    try {
        return await fetchFromCacheOrApi(...biblesForLanguageEndpoint(languageId));
    } catch (error) {
        log.exception(error as Error);
        return [];
    }
}

export async function fetchBibleDataForBookCodeAndBibleId(
    bookCode: string,
    bibleId: number
): Promise<BibleBookContentDetails | null> {
    try {
        return await fetchFromCacheOrApi(...bookOfBibleEndpoint(bibleId, bookCode));
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
    await cacheManyFromCdnWithProgress(urls);
}

export async function cacheBibleMetadata(bibleIds: number[]) {
    const urls = bibleIds.map((bibleId) => ({
        url: apiUrl(bibleBooksByBibleId(bibleId)[0]),
        size: METADATA_ONLY_FAKE_FILE_SIZE,
        mediaType: MediaType.Text,
    }));
    await cacheManyFromCdnWithProgress(urls);
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
        const textCached = !!bookData.textUrl && (await isCachedFromCdn(bookData.textUrl));
        if (textCached) {
            return true;
        }
        const audioCached = await asyncEvery(
            range(bibleSection.startChapter, bibleSection.endChapter),
            async (chapterNumber) => {
                const chapterAudioUrl = bookData!.audioUrls?.chapters?.find(
                    (chapter) => chapter.number === String(chapterNumber)
                )?.[audioFileTypeForBrowser()]?.url;
                return !!chapterAudioUrl && (await isCachedFromCdn(chapterAudioUrl));
            }
        );
        if (audioCached) {
            return true;
        }
    }
    return false;
}

export async function getBibleBookCodesToName(languageId: number | null = null, retry = true) {
    const bibleData = (await fetchFromCacheOrApi(
        ...biblesForLanguageEndpoint(languageId || get(currentLanguageInfo)?.id)
    )) as ApiBible[];
    if (bibleData[0]) {
        return bibleData[0].books.reduce(
            (output, { displayName, bookCode }) => ({ ...output, [bookCode]: displayName }),
            {} as Record<string, string>
        );
    } else {
        if (retry && (languageId !== 1 || get(currentLanguageInfo)?.id !== 1)) {
            return getBibleBookCodesToName(1, false);
        }
    }
}

async function getBibleBooksByBibleId(bibleId: number) {
    return (await fetchFromCacheOrApi(...bibleBooksByBibleId(bibleId))) as Promise<ApiBibleBook[]>;
}

export function bibleBooksByBibleIdFullUrl(bibleId: number) {
    return apiUrl(bibleBooksByBibleId(bibleId)[0]);
}

export async function saveBibleRecording(
    language: string,
    version: string,
    versionAbbreviation: string,
    bibleSection: BibleSection,
    filePath: string
) {
    await updateRow(bibleRecordingsKey, (current: object) => {
        const bibleRecordings = current as BibleRecordingVersions;
        bibleRecordings.bibleRecordingVersions ||= [];
        let recordingVersion = bibleRecordings.bibleRecordingVersions.find(
            (b) => b.language === language && b.version === version && b.versionAbbreviation === versionAbbreviation
        );
        if (!recordingVersion) {
            recordingVersion = { language, version, versionAbbreviation, passages: {} };
            bibleRecordings.bibleRecordingVersions.push(recordingVersion!);
        }
        recordingVersion.passages[bibleSectionToString(bibleSection)] = { url: filePath };
        return bibleRecordings;
    });
}
