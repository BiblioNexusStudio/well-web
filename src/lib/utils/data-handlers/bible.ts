import { lookupLanguageInfoByCode } from '$lib/stores/current-language.store';
import { MediaType, type ApiBibleVersion, type UrlWithMetadata, type BasePassage } from '$lib/types/file-manager';
import { audioFileTypeForBrowser } from '../browser';
import { fetchFromCacheOrApi, isCachedFromCdn } from '$lib/data-cache';
import { asyncEvery } from '../async-array';
import { range } from '../array';
import { updateRow } from '../data-storage';
import { passageTypeToString } from '../passage-helpers';

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
    bibleVersion: ApiBibleVersion,
    bookId: number,
    chapters: number[] | 'all'
): UrlWithMetadata[] {
    return bibleVersion.contents
        .filter((book) => book.bookId === bookId)
        .flatMap((book) =>
            book.audioUrls.chapters
                .filter((chapter) => chapters === 'all' || chapters.includes(parseInt(chapter.number)))
                .map(
                    (audioUrl) =>
                        ({
                            url: audioUrl[audioFileTypeForBrowser()].url,
                            size: audioUrl[audioFileTypeForBrowser()].size,
                            mediaType: MediaType.audio,
                        } as UrlWithMetadata)
                )
                .concat({ url: book.textUrl, size: book.textSize, mediaType: MediaType.text } as UrlWithMetadata)
        );
}

export async function fetchBibleDataForLanguageCode(languageCode: string | null): Promise<ApiBibleVersion[]> {
    const languageId = lookupLanguageInfoByCode(languageCode)?.id;

    if (!languageId) return [];

    try {
        return await fetchFromCacheOrApi(`bibles/language/${languageId}`);
    } catch (error) {
        // this means the user hasn't cached the Bible data or language is invalid
        return [];
    }
}

// check if the text content is cached for the Bible or the audio URLs are cached for the given chapters
export async function isContentCachedForPassageInBible(passage: BasePassage, bibleVersion: ApiBibleVersion) {
    const book = bibleVersion.contents.find((book) => book.bookId === passage.bookId);
    return (
        (!!book?.textUrl && (await isCachedFromCdn(book?.textUrl))) ||
        (await asyncEvery(range(passage.startChapter, passage.endChapter), async (chapterNumber) => {
            const chapterAudioUrl = book?.audioUrls?.chapters?.find(
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
        recordingVersion.passages[passageTypeToString(passage)] = { url: filePath };
        return bibleRecordings;
    });
}
