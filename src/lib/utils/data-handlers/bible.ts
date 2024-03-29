import { lookupLanguageInfoByCode } from '$lib/stores/language.store';
import type { UrlWithMetadata } from '$lib/types/file-manager';
import { audioFileTypeForBrowser } from '../browser';
import { cacheManyFromCdnWithProgress, fetchFromCacheOrApi, isCachedFromApi, isCachedFromCdn } from '$lib/data-cache';
import { asyncEvery, asyncReturnFirst } from '../async-array';
import { range } from '../array';
import { updateRow } from '../data-storage';
import { passageToString } from '../passage-helpers';
import type { ApiBible, BaseBible, BibleBookContentDetails } from '$lib/types/bible-text-content';
import { isOnline } from '$lib/stores/is-online.store';
import { get } from 'svelte/store';
import type { BasePassage } from '$lib/types/passage';
import { MediaType } from '$lib/types/resource';
import { log } from '$lib/logger';
import { biblesEndpoint, biblesForLanguageEndpoint, bookOfBibleEndpoint } from '$lib/api-endpoints';

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

export async function fetchBibleDataForBookCodeAndLanguageCode(
    bookCode: string,
    languageCode: string
): Promise<BibleBookContentDetails | null> {
    try {
        const biblesForLanguage = await fetchBiblesForLanguageCode(languageCode);
        const firstCachedBibleId = await asyncReturnFirst(biblesForLanguage, async (bible) => {
            if (get(isOnline) || (await isCachedFromApi(bookOfBibleEndpoint(bible.id, bookCode)[0]))) {
                return bible.id;
            } else {
                return null;
            }
        });

        if (!firstCachedBibleId) return null;
        return await fetchFromCacheOrApi(...bookOfBibleEndpoint(firstCachedBibleId, bookCode));
    } catch (error) {
        // this means the user hasn't cached the Bible data or language is invalid
        log.exception(error as Error);
        return null;
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

export async function cacheBiblesForPassage(passage: BasePassage, allBookContentDetails: BibleBookContentDetails[]) {
    const urls = allBookContentDetails.flatMap((bookContentDetails) =>
        bibleUrlsWithMetadataForBookAndChapters(bookContentDetails, range(passage.startChapter, passage.endChapter))
    );
    await cacheManyFromCdnWithProgress(urls);
}

export async function bookDataForBibleTab(passage: BasePassage, bibleId: number, isPreferredBible: boolean) {
    const online = get(isOnline);
    try {
        if (!online && !(await isCachedFromApi(bookOfBibleEndpoint(bibleId, passage.bookCode)[0]))) {
            // if it's offline and not cached, it's not valid
            return null;
        } else if ((online && isPreferredBible) || !online) {
            // if it's online and a preferred Bible or offline, we need to get the bookData
            const bookData = await fetchBibleDataForBookCodeAndBibleId(passage.bookCode, bibleId);
            if (online || (await isContentCachedForOffline(passage, bookData))) {
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

async function isContentCachedForOffline(passage: BasePassage, bookData: BibleBookContentDetails | null) {
    if (bookData) {
        const textCached = !!bookData.textUrl && (await isCachedFromCdn(bookData.textUrl));
        if (textCached) {
            return true;
        }
        const audioCached = await asyncEvery(range(passage.startChapter, passage.endChapter), async (chapterNumber) => {
            const chapterAudioUrl = bookData!.audioUrls?.chapters?.find(
                (chapter) => chapter.number === String(chapterNumber)
            )?.[audioFileTypeForBrowser()]?.url;
            return !!chapterAudioUrl && (await isCachedFromCdn(chapterAudioUrl));
        });
        if (audioCached) {
            return true;
        }
    }
    return false;
}

export async function saveBibleRecording(
    language: string,
    version: string,
    versionAbbreviation: string,
    passage: BasePassage,
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
        recordingVersion.passages[passageToString(passage)] = { url: filePath };
        return bibleRecordings;
    });
}
