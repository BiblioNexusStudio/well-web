import type { ParentResourceName } from './types/resource';

// In order to cache-bust an API endpoint when the response format is changed, increment the number after the endpoint path.
// Note: This is a separate problem from breaking changes and only refers to non-breaking additive changes. It's probably
//       still a good idea to avoid breaking changes where possible, since if an internet-connected client doesn't refresh
//       to get the updated version we don't want them to have errors when they request new endpoints.

// Use one of these endpoints like so (note the spread operator so that the fetch function gets the path and version as
// separate arguments):
//   fetchFromCacheOrApi(...languagesEndpoint())

type ApiStringAndCacheBustVersion = [string, number];

export function languagesEndpoint(): ApiStringAndCacheBustVersion {
    return ['/languages', 2];
}

export function parentResourcesEndpoint(queryParams?: string[]): ApiStringAndCacheBustVersion {
    const url = queryParams ? `/resources/parent-resources?${queryParams.join('&')}` : '/resources/parent-resources';
    return [url, 2];
}

export function biblesEndpoint(): ApiStringAndCacheBustVersion {
    return ['/bibles', 1];
}

export function bookOfBibleEndpoint(bibleId: number | null, bookCode: string | null): ApiStringAndCacheBustVersion {
    return [`/bibles/${bibleId}/book/${bookCode}`, 1];
}

export function biblesForLanguageEndpoint(languageId: number | undefined): ApiStringAndCacheBustVersion {
    return [`/bibles/language/${languageId}`, 1];
}

export function resourcesByLanguageAndBookEndpoint(
    languageId: number | undefined,
    bookCode: string,
    queryParams: string[]
): ApiStringAndCacheBustVersion {
    return [`/resources/language/${languageId}/book/${bookCode}?${queryParams.join('&')}`, 1];
}

export function passagesByLanguageAndParentResourceEndpoint(
    languageId: number | undefined,
    parentResourceName: ParentResourceName
): ApiStringAndCacheBustVersion {
    return [`/passages/language/${languageId}/resource/${parentResourceName}`, 1];
}

export function passageDetailsByIdAndLanguage(
    passageId: number | string,
    languageId: number | undefined
): ApiStringAndCacheBustVersion {
    return [`/passages/${passageId}/language/${languageId}`, 1];
}

export function bibleBooksByBibleId(bibleId: number | string): ApiStringAndCacheBustVersion {
    return [`/bibles/${bibleId}/books`, 1];
}

export function bibleTextByParams(bibleId: number | string, queryParams: string[]): ApiStringAndCacheBustVersion {
    return [`/bibles/${bibleId}/texts?${queryParams.join('&')}`, 1];
}
