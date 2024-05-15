import config from './config';
import type { Url, UrlWithMetadata } from './types/file-manager';
import type { StaticUrlsMap } from './types/static-mapping';
import staticUrls from '$lib/static-urls-map.json' assert { type: 'json' };
import { asyncForEach } from './utils/async-array';
import { MediaType } from './types/resource';
import { chunk, removeFromArray } from './utils/array';
import { log } from './logger';

// Because we need to download metadata alongside content but we don't know ahead of time what the size of the payload
// will be, we're defaulting it to 768 bytes (3/4 of a KB). Most metadata sizes as of now seem to be between 0-1000
// bytes so this seems like a reasonable default.
export const METADATA_ONLY_FAKE_FILE_SIZE = 768;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

type CheckCacheChangeItem = { url: Url; expectedSize: number };
type SingleItemProgress = { downloadedSize: number; totalSize: number; done: boolean; metadataOnly?: boolean };
export type AllItemsProgress = Record<Url, SingleItemProgress>;

interface BatchedUrl {
    idsToUrls: Record<number, UrlWithMetadata>;
    baseUrl: Url;
}

// The workbox `fetch` caching API will create a cache entry as soon as response headers have been returned, rather than
// after the full response has been downloaded. Without these arrays and their usages, isCachedFromApi and
// isCachedFromCdn would return true even when the data isn't fully there yet.
const partiallyDownloadedCdnUrls: string[] = [];
const partiallyDownloadedApiUrls: string[] = [];
const apiContentRegex = /https:\/\/((qa|dev)\.)?api-bn\.aquifer\.bible\/resources\/\d+\/content/;
const apiMetadataRegex = /https:\/\/((qa|dev)\.)?api-bn\.aquifer\.bible\/resources\/\d+\/metadata/;
const apiThumbnailRegex = /https:\/\/((qa|dev)\.)?api-bn\.aquifer\.bible\/resources\/\d+\/thumbnail/;
const cdnRegex = /https:\/\/cdn\.aquifer\.bible.*/;
export const staticUrlsMap: StaticUrlsMap = staticUrls;

export async function fetchFromCacheOrApi(path: string, cacheBustVersion: number) {
    const url = apiUrl(path);
    if (!(await isCachedFromApi(path))) {
        partiallyDownloadedApiUrls.push(url);
    }
    try {
        const response = await fetch(cachedOrRealUrl(url), {
            // Set this header for the service worker layer to use. It will get stripped off before the request is
            // actually made against the API.
            headers: { 'X-Cache-Bust-Version': cacheBustVersion.toString() },
        });
        if (response.status >= 400) {
            throw new Error('Bad HTTP response');
        }
        apiCachedUrls.delete(url);
        return await response.json();
    } finally {
        removeFromArray(partiallyDownloadedApiUrls, url);
    }
}

export async function fetchFromCacheOrCdn(url: Url, type: 'blob' | 'json' = 'json') {
    if (!(await isCachedFromCdn(url))) {
        partiallyDownloadedCdnUrls.push(url);
    }
    try {
        const response = await fetch(cachedOrRealUrl(url));
        if (response.status >= 400) {
            throw new Error('Bad HTTP response');
        }
        cdnCachedUrls.delete(url);
        return await (type === 'blob' ? response.blob() : response.json());
    } finally {
        removeFromArray(partiallyDownloadedCdnUrls, url);
    }
}

export async function removeFromApiCache(path: string) {
    const url = apiUrl(path);
    if (!('serviceWorker' in navigator)) {
        return;
    }
    const cache = await caches.open('aquifer-api');
    await cache.delete(url);
    apiCachedUrls.delete(url);
}

export async function removeFromCdnCache(url: Url) {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    const cache = await caches.open('aquifer-cdn');
    await cache.delete(url);
    cdnCachedUrls.delete(url);
}

export async function clearEntireCache() {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    await asyncForEach(await caches.keys(), async (key) => {
        await caches.delete(key);
    });

    apiCachedUrls.clear();
    cdnCachedUrls.clear();

    if (indexedDB.databases) {
        const dbs = await indexedDB.databases();
        dbs.forEach((db) => {
            db.name && indexedDB.deleteDatabase(db.name);
        });
    }

    localStorage.clear();
    sessionStorage.clear();

    const swRegistration = await navigator.serviceWorker.getRegistration();
    if (swRegistration) {
        swRegistration.unregister();
        location.reload();
    }
}

export function cachedOrRealUrl(url: Url) {
    return url in staticUrlsMap ? (staticUrlsMap[url] as string) : url;
}

// Retry with exponential backoff
async function retryRequest(fn: () => Promise<void>, remainingRetries = MAX_RETRIES, delay = RETRY_DELAY_MS) {
    try {
        return await fn();
    } catch (error) {
        if (remainingRetries > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retryRequest(fn, remainingRetries - 1, delay * 2.5);
        } else {
            throw error;
        }
    }
}

// Fetch multiple URLs when online and store them in the cache, tracking progress as the downloads happen.
export async function cacheManyFromCdnWithProgress(
    urls: UrlWithMetadata[],
    progressCallback: (progress: AllItemsProgress) => void = () => {
        // no-op by default
    },
    concurrentRequests = 6
) {
    const progress: AllItemsProgress = urls.reduce(
        (output, { url, size, metadataOnly }) => ({
            ...output,
            [url]: {
                downloadedSize: 0,
                totalSize: metadataOnly ? METADATA_ONLY_FAKE_FILE_SIZE : size,
                done: false,
                metadataOnly,
            },
        }),
        {}
    );

    const textBatchUrls: BatchedUrl[] = chunk(urls.filter(isTextBatchableUrl), 10).map((urlsInBatch) => ({
        idsToUrls: Object.fromEntries(urlsInBatch.map((url) => [url.contentId, url])),
        baseUrl: apiUrl('resources/batch/content/text'),
    }));
    const metadataBatchUrls: BatchedUrl[] = chunk(urls.filter(isMetadataBatchableUrl), 100).map((urlsInBatch) => ({
        idsToUrls: Object.fromEntries(urlsInBatch.map((url) => [url.contentId, url])),
        baseUrl: apiUrl('resources/batch/metadata'),
    }));
    const nonBatchUrls = urls.filter((url) => !isTextBatchableUrl(url) && !isMetadataBatchableUrl(url));
    const queue = [...textBatchUrls, ...metadataBatchUrls, ...nonBatchUrls];

    progressCallback(progress);

    const updateProgress = (url: Url, downloadedSize: number, totalSize: number, done: boolean) => {
        const currentProgress = progress[url];
        if (currentProgress) {
            progress[url] = {
                downloadedSize:
                    currentProgress.metadataOnly && done
                        ? Math.min(METADATA_ONLY_FAKE_FILE_SIZE, downloadedSize)
                        : downloadedSize,
                totalSize: currentProgress.metadataOnly
                    ? METADATA_ONLY_FAKE_FILE_SIZE
                    : totalSize || currentProgress.totalSize,
                done,
            };
        }
        progressCallback(progress);
    };

    const processUrl = async (url: Url, expectedSize: number) => {
        const cdnUrl =
            url.match(cdnRegex) ||
            url.match(apiContentRegex) ||
            url.match(apiMetadataRegex) ||
            url.match(apiThumbnailRegex);

        if (cdnUrl) {
            partiallyDownloadedCdnUrls.push(url);
        } else {
            partiallyDownloadedApiUrls.push(url);
        }

        try {
            if (url in staticUrlsMap) {
                updateProgress(url, expectedSize, expectedSize, true);
                return;
            }

            let cachedSize: number | null = null;

            if (cdnUrl) {
                cachedSize = await cachedCdnContentSize(url);
            } else {
                cachedSize = await cachedApiContentSize(url);
            }

            if (cachedSize) {
                updateProgress(url, cachedSize, cachedSize, true);
                return;
            }

            await retryRequest(async () => {
                const response = await fetch(url);
                const reader = response.body?.getReader();
                const contentLength = response.headers.get('Content-Length');
                let receivedLength = 0;
                if (reader) {
                    let lastProgressTime = Date.now();
                    // eslint-disable-next-line
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        receivedLength += value?.length || 0;
                        const now = Date.now();
                        if (now - lastProgressTime >= 100) {
                            updateProgress(url, receivedLength, contentLength ? +contentLength : 0, false);
                            lastProgressTime = now;
                        }
                    }
                }
                updateProgress(url, receivedLength, contentLength ? +contentLength : 0, true);
            });
        } finally {
            if (cdnUrl) {
                removeFromArray(partiallyDownloadedCdnUrls, url);
            } else {
                removeFromArray(partiallyDownloadedApiUrls, url);
            }
        }
    };

    const processBatch = async (baseUrl: Url, idsToUrls: Record<number, UrlWithMetadata>) => {
        const batchIds: number[] = [];
        await asyncForEach(Object.entries(idsToUrls), async ([id, urlWithMetadata]) => {
            try {
                partiallyDownloadedCdnUrls.push(urlWithMetadata.url);

                if (urlWithMetadata.url in staticUrlsMap) {
                    updateProgress(urlWithMetadata.url, urlWithMetadata.size, urlWithMetadata.size, true);
                    removeFromArray(partiallyDownloadedCdnUrls, urlWithMetadata.url);
                    return;
                }

                const cachedSize = await cachedCdnContentSize(urlWithMetadata.url);
                if (cachedSize !== null) {
                    updateProgress(urlWithMetadata.url, cachedSize, cachedSize, true);
                    removeFromArray(partiallyDownloadedCdnUrls, urlWithMetadata.url);
                } else {
                    batchIds.push(parseInt(id));
                }
            } catch (error) {
                log.exception(error as Error);
                removeFromArray(partiallyDownloadedCdnUrls, urlWithMetadata.url);
            }
        });

        if (batchIds.length > 0) {
            try {
                await retryRequest(async () => {
                    const response = await fetch(baseUrl + `?${batchIds.map((id) => `ids=${id}`).join('&')}`);
                    const json = (await response.json()) as { id: number; content: object }[];
                    const cache = await caches.open('aquifer-cdn');

                    // Iterate through the array returned by the batch endpoint and insert each item into the cache.
                    // The cache key will be the original URL that the item would've had, so for all intents and
                    // purposes it's as if we hit the original URL itself and cached the response.
                    await asyncForEach(json, async (response) => {
                        const urlWithMetadata = idsToUrls[response.id];
                        if (urlWithMetadata) {
                            if (baseUrl.includes('metadata')) {
                                await cache.put(urlWithMetadata.url, new Response(JSON.stringify(response)));
                            } else {
                                await cache.put(urlWithMetadata.url, new Response(JSON.stringify(response.content)));
                            }
                            updateProgress(urlWithMetadata.url, urlWithMetadata.size, urlWithMetadata.size, true);
                            removeFromArray(partiallyDownloadedCdnUrls, urlWithMetadata.url);
                        }
                    });
                });
            } catch (error) {
                // likely a network error
                log.exception(error as Error);
            }
        }

        Object.values(idsToUrls).forEach((urlWithMetadata) => {
            removeFromArray(partiallyDownloadedCdnUrls, urlWithMetadata.url);
        });
    };

    const processQueue = async () => {
        const workers = Array(concurrentRequests)
            .fill(null)
            .map(async () => {
                while (queue.length > 0) {
                    const urlWithMetadataOrBatchUrl = queue.shift();
                    if ((urlWithMetadataOrBatchUrl as BatchedUrl).idsToUrls) {
                        const { baseUrl, idsToUrls } = urlWithMetadataOrBatchUrl as BatchedUrl;
                        await processBatch(baseUrl, idsToUrls);
                    } else {
                        const { url, size } = urlWithMetadataOrBatchUrl as UrlWithMetadata;
                        if (url) await processUrl(url, size);
                    }
                }
            });
        await Promise.all(workers);
    };

    await processQueue();
    apiCachedUrls.clear();
    cdnCachedUrls.clear();
}

// Given a list of URLs and the expected sizes (which comes from the API), determine if any of the cached data has
// different sizes and therefore needs to be re-downloaded. This won't always catch cache changes since it's possible
// for different content to have the same sizes, but it should be good enough for our use cases (data isn't changing
// that much).
export async function findStaleDataInCdnCache(items: CheckCacheChangeItem[]) {
    const cache = await caches.open('aquifer-cdn');
    return items.filter(async ({ url, expectedSize }) => expectedSize !== (await cachedCdnContentSize(url, cache)));
}

function isTextBatchableUrl(url: UrlWithMetadata) {
    return url.mediaType === MediaType.Text && url.url.match(apiContentRegex);
}

function isMetadataBatchableUrl(url: UrlWithMetadata) {
    return url.url.match(apiMetadataRegex);
}

const cdnCachedUrls = new Map();
const apiCachedUrls = new Map();

// Checks if a fully downloaded cache entry exists for the URL.
export async function isCachedFromCdn(url: Url) {
    if (cdnCachedUrls.has(url)) {
        return cdnCachedUrls.get(url);
    }
    if (partiallyDownloadedCdnUrls.includes(url)) {
        return false;
    }
    if (url in staticUrlsMap) {
        return true;
    }
    if (!('serviceWorker' in navigator)) {
        return false;
    }
    const cache = await caches.open('aquifer-cdn');
    const response = await cache.match(url);
    const isCached = response != null;
    cdnCachedUrls.set(url, isCached);
    return isCached;
}

// Checks if a fully downloaded cache entry exists for the API path.
export async function isCachedFromApi(path: string) {
    const url = apiUrl(path);
    if (apiCachedUrls.has(url)) {
        return apiCachedUrls.get(url);
    }
    if (partiallyDownloadedApiUrls.includes(url)) {
        return false;
    }
    if (url in staticUrlsMap) {
        return true;
    }
    if (!('serviceWorker' in navigator)) {
        return false;
    }
    const cache = await caches.open('aquifer-api');
    const response = await cache.match(url);
    const isCached = response != null;
    apiCachedUrls.set(url, isCached);
    return isCached;
}

export function apiUrl(path: string) {
    return (config.PUBLIC_AQUIFER_API_URL + (path.startsWith('/') ? path.slice(1) : path)).replace(/\/$/, '');
}

async function cachedCdnContentSize(url: Url, cache: Cache | null = null) {
    if (!('serviceWorker' in navigator)) {
        return null;
    }
    const openedCache = cache || (await caches.open('aquifer-cdn'));
    const response = await openedCache.match(url);
    if (response) {
        const blob = await response.blob();
        return blob.size;
    }
    return null;
}

async function cachedApiContentSize(url: Url, cache: Cache | null = null) {
    if (!('serviceWorker' in navigator)) {
        return null;
    }
    const openedCache = cache || (await caches.open('aquifer-api'));
    const response = await openedCache.match(url);
    if (response) {
        const blob = await response.blob();
        return blob.size;
    }
    return null;
}
