import { MediaType, type ApiBibleVersion, type UrlWithMetadata } from '$lib/types/file-manager';
import { audioFileTypeForBrowser } from '../browser';

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
