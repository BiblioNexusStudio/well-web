import { lookupLanguageInfoByCode } from '$lib/stores/current-language.store';
import { MediaType, type UrlWithMetadata } from '$lib/types/file-manager';
import { audioFileTypeForBrowser } from '../browser';
import { fetchFromCacheOrApi, isCachedFromApi, isCachedFromCdn } from '$lib/data-cache';
import { asyncEvery, asyncReturnFirst } from '../async-array';
import { range } from '../array';
import { updateRow } from '../data-storage';
import { passageToString } from '../passage-helpers';
import type { ApiBible, BibleBookContentDetails } from '$lib/types/bible-text-content';
import { isOnline } from '$lib/stores/is-online.store';
import { get } from 'svelte/store';
import type { BasePassage } from '$lib/types/passage';

type BibleRecordingPassage = { url: string };
type BibleRecordingVersion = {
    passages: Record<string, BibleRecordingPassage>;
    language: string;
    version: string;
    versionAbbreviation: string;
};
type BibleRecordingVersions = { bibleRecordingVersions: BibleRecordingVersion[] };

const bibleRecordingsKey = 'bibleRecordings';

export function bibleUrlsWithMetadataForBookAndChapters(
    bookData: BibleBookContentDetails,
    chapters: number[] | 'all'
): UrlWithMetadata[] {
    return bookData.audioUrls.chapters
        .filter((chapter) => chapters === 'all' || chapters.includes(parseInt(chapter.number)))
        .map(
            (audioUrl) =>
                ({
                    url: audioUrl[audioFileTypeForBrowser()].url,
                    size: audioUrl[audioFileTypeForBrowser()].size,
                    mediaType: MediaType.audio,
                }) as UrlWithMetadata
        )
        .concat({ url: bookData.textUrl, size: bookData.textSize, mediaType: MediaType.text } as UrlWithMetadata);
}

export async function fetchBibleDataForBookCodeAndLanguageCode(
    bookCode: string,
    languageCode: string
): Promise<BibleBookContentDetails | null> {
    try {
        const biblesForLanguage = await fetchBiblesForLanguageCode(languageCode);
        const firstCachedBibleId = await asyncReturnFirst(biblesForLanguage, async (bible) => {
            if (get(isOnline) || (await isCachedFromApi(`bibles/${bible.id}/book/${bookCode}`))) {
                return bible.id;
            } else {
                return null;
            }
        });

        if (!firstCachedBibleId) return null;
        return await fetchFromCacheOrApi(`bibles/${firstCachedBibleId}/book/${bookCode}`);
    } catch (error) {
        // this means the user hasn't cached the Bible data or language is invalid
        console.error(error);
        return null;
    }
}

export async function fetchBiblesForLanguageCode(languageCode: string): Promise<ApiBible[]> {
    const languageId = lookupLanguageInfoByCode(languageCode)?.id;

    if (!languageId) return [];

    try {
        return await fetchFromCacheOrApi(`bibles/language/${languageId}`);
    } catch (_) {
        return [];
    }
}

export async function fetchBibleDataForBookCodeAndBibleId(
    bookCode: string,
    bibleId: number
): Promise<BibleBookContentDetails | null> {
    try {
        return await fetchFromCacheOrApi(`bibles/${bibleId}/book/${bookCode}`);
    } catch (error) {
        // this means the user hasn't cached the Bible data or bible id is invalid
        return null;
    }
}

// check if the text content is cached for the Bible or the audio URLs are cached for the given chapters
export async function isContentCachedForPassageInBible(passage: BasePassage, bookData: BibleBookContentDetails) {
    return (
        (!!bookData.textUrl && (await isCachedFromCdn(bookData.textUrl))) ||
        (await asyncEvery(range(passage.startChapter, passage.endChapter), async (chapterNumber) => {
            const chapterAudioUrl = bookData.audioUrls?.chapters?.find(
                (chapter) => chapter.number === String(chapterNumber)
            )?.[audioFileTypeForBrowser()]?.url;
            return !!chapterAudioUrl && (await isCachedFromCdn(chapterAudioUrl));
        }))
    );
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
