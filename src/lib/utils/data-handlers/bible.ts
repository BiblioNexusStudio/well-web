import { lookupLanguageInfoByCode } from '$lib/stores/current-language.store';
import { MediaType, type ApiBibleVersion, type UrlWithMetadata } from '$lib/types/file-manager';
import { audioFileTypeForBrowser } from '../browser';
import { fetchFromCacheOrApi } from '$lib/data-cache';

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
