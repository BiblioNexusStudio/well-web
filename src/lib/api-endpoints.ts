import type { ParentResourceId, ParentResourceType } from './types/resource';
import { buildQueryString } from './utils/sveltekit-search-params';

// In order to cache-bust an API endpoint when the response format is changed, increment the number after the endpoint path.
// Note: This is a separate problem from breaking changes and only refers to non-breaking additive changes. It's probably
//       still a good idea to avoid breaking changes where possible, since if an internet-connected client doesn't refresh
//       to get the updated version we don't want them to have errors when they request new endpoints.

// Use one of these endpoints like so (note the spread operator so that the fetch function gets the path and version as
// separate arguments):
//   fetchFromCacheOrApi(...languagesEndpoint())

type ApiStringAndCacheBustVersion = [string, number];

export function languagesEndpoint(): ApiStringAndCacheBustVersion {
    return ['/languages', 3];
}

export function parentResourcesEndpoint(languageId?: number): ApiStringAndCacheBustVersion {
    return [`/resources/parent-resources?languageId=${languageId ?? 1}`, 3];
}

export function biblesEndpoint(): ApiStringAndCacheBustVersion {
    return ['/bibles', 1];
}

export function biblesWithRestrictionsEndpoint(): ApiStringAndCacheBustVersion {
    return ['/bibles?restrictedLicense=true', 1];
}

export function bookOfBibleEndpoint(bibleId: number | null, bookCode: string | null): ApiStringAndCacheBustVersion {
    return [`/bibles/${bibleId}/book/${bookCode}`, 1];
}

export function biblesForLanguageEndpoint(languageId: number | undefined): ApiStringAndCacheBustVersion {
    return [`/bibles/language/${languageId}`, 1];
}

export function biblesForLanguageWithRestrictionsEndpoint(
    languageId: number | undefined
): ApiStringAndCacheBustVersion {
    return [`/bibles/language/${languageId}?restrictedLicense=true`, 1];
}

export function englishWordsWithGreekAlignmentsForBookAndChapter(
    bibleId: number,
    bookCode: string,
    chapter: number
): ApiStringAndCacheBustVersion {
    return [`/bibles/${bibleId}/alignments/greek/book/${bookCode}/chapter/${chapter}`, 1];
}

export function resourcesByLanguageAndBookEndpoint(
    languageId: number | undefined,
    bookCode: string,
    queryParams: string[]
): ApiStringAndCacheBustVersion {
    return [`/resources/language/${languageId}/book/${bookCode}?${queryParams.sort().join('&')}`, 3];
}

export function searchResourcesEndpoint(
    languageId: number | undefined,
    query: string,
    resourceTypes: ParentResourceType[],
    bookCode?: string,
    startChapter?: number,
    endChapter?: number,
    startVerse?: number,
    endVerse?: number,
    offset?: number,
    limit?: number,
    parentResourceId?: number
): ApiStringAndCacheBustVersion {
    const resourceTypesParams = resourceTypes.map((rt) => `resourceTypes=${rt}`).join('&');

    let params = buildQueryString([
        { key: 'languageId', value: languageId, ignoreIfEquals: undefined },
        { key: 'query', value: query, ignoreIfEquals: '' },
        { key: 'bookCode', value: bookCode, ignoreIfEquals: '' },
        { key: 'startChapter', value: startChapter, ignoreIfEquals: 0 },
        { key: 'endChapter', value: endChapter, ignoreIfEquals: 0 },
        { key: 'startVerse', value: startVerse, ignoreIfEquals: 0 },
        { key: 'endVerse', value: endVerse, ignoreIfEquals: 0 },
        { key: 'offset', value: offset, ignoreIfEquals: 0 },
        { key: 'limit', value: limit, ignoreIfEquals: 0 },
        { key: 'parentResourceId', value: parentResourceId, ignoreIfEquals: undefined },
    ]);

    if (resourceTypesParams) {
        params = `${params}&${resourceTypesParams}`;
    }

    return [`/resources/search?${params}`, 3];
}

export function passagesByLanguageAndParentResourceEndpoint(
    languageId: number | undefined,
    parentResourceId: ParentResourceId | undefined
): ApiStringAndCacheBustVersion {
    return [`/passages/language/${languageId}/resource/${parentResourceId}`, 2];
}

export function booksAndChaptersByLanguageAndParentResourceEndpoint(
    languageId: number | undefined,
    parentResourceId: ParentResourceId | undefined
): ApiStringAndCacheBustVersion {
    return [`/resources/content/available-chapters?languageId=${languageId}&parentResourceId=${parentResourceId}`, 2];
}

export function resourceContentForBookAndChapter(
    languageId: number | undefined,
    bookCode: string,
    chapterNumber: number
): ApiStringAndCacheBustVersion {
    return [
        `/resources/content/grouped-by-verse?languageId=${languageId}&bookCode=${bookCode}&chapter=${chapterNumber}`,
        4,
    ];
}

export function bibleBooksByBibleId(bibleId: number | string): ApiStringAndCacheBustVersion {
    return [`/bibles/${bibleId}/books`, 1];
}
