import config from './config';
import type { Url, UrlWithMetadata } from './types/file-manager';
import type { StaticUrlsMap } from './types/static-mapping';
import staticUrls from '$lib/static-urls-map.json' assert { type: 'json' };
import { asyncUnorderedForEach } from './utils/async-array';
import { MediaType, type DownloadTtContent } from './types/resource';
import { chunk } from './utils/array';
import { log } from './logger';
import { objectValues } from './utils/typesafe-standard-lib';

// Because we need to download metadata alongside content but we don't know ahead of time what the size of the payload
// will be, we're defaulting it to 768 bytes (3/4 of a KB). Most metadata sizes as of now seem to be between 0-1000
// bytes so this seems like a reasonable default.
export const METADATA_ONLY_FAKE_FILE_SIZE = 768;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

type SingleItemProgress = { downloadedSize: number; totalSize: number; done: boolean; metadataOnly?: boolean };
export type AllItemsProgress = Record<Url, SingleItemProgress>;

interface BatchedUrl {
    idsToUrls: Record<number, UrlWithMetadata>;
    baseUrl: Url;
}

// The workbox `fetch` caching API will create a cache entry as soon as response headers have been returned, rather than
// after the full response has been downloaded. Without this set, isCachedFromApi and isCachedAsContent would return
// true even when the data isn't fully there yet.
const partiallyDownloadedUrls = new Set<string>();

export const staticUrlsMap: StaticUrlsMap = staticUrls;

export class WellFetchError extends Error {
    url?: string;
    cacheBustVersion?: number;
}

export async function fetchFromCacheOrApi(path: string, cacheBustVersion: number) {
    const url = apiUrl(path);
    if (!(await isCachedFromApi(path))) {
        partiallyDownloadedUrls.add(url);
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
    } catch (error) {
        const castError = error as Error;
        const fetchError = new WellFetchError(castError.message, { cause: castError.cause });
        fetchError.stack = castError.stack;
        fetchError.url = url;
        fetchError.cacheBustVersion = cacheBustVersion;
        throw fetchError;
    } finally {
        partiallyDownloadedUrls.delete(url);
    }
}

export async function fetchContentFromCacheOrNetwork<T>(url: Url) {
    if (!(await isCachedAsContent(url))) {
        partiallyDownloadedUrls.add(url);
    }
    try {
        const response = await fetch(cachedOrRealUrl(url));
        if (response.status >= 400) {
            throw new Error('Bad HTTP response');
        }
        contentCachedUrls.delete(url);
        return (await response.json()) as T;
    } catch (error) {
        const castError = error as Error;
        const fetchError = new WellFetchError(castError.message, { cause: castError.cause });
        fetchError.stack = castError.stack;
        fetchError.url = url;
        throw fetchError;
    } finally {
        partiallyDownloadedUrls.delete(url);
    }
}

export async function removeFromApiCache(path: string) {
    const url = apiUrl(path);
    if (!('serviceWorker' in navigator)) {
        return;
    }
    const cache = await getApiCache();
    await cache.delete(url);
    apiCachedUrls.delete(url);
}

export async function removeFromContentCache(url: Url) {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    const cache = await getContentCache();
    await cache.delete(url);
    contentCachedUrls.delete(url);
}

export async function clearEntireCache() {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    await asyncUnorderedForEach(await caches.keys(), async (key) => {
        await caches.delete(key);
    });

    apiCachedUrls.clear();
    contentCachedUrls.clear();

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
    }
    location.reload();
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
export async function cacheManyContentUrlsWithProgress(
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

    const processUrl = async (url: Url, expectedSize: number, hasInlineMedia: boolean = false) => {
        partiallyDownloadedUrls.add(url);

        try {
            if (url in staticUrlsMap) {
                updateProgress(url, expectedSize, expectedSize, true);
                return;
            }

            let cachedSize: number | null = null;

            if (window.__CACHING_CONFIG.urlGoesInContentCache(url)) {
                cachedSize = await contentCacheDataSize(url);
            } else {
                cachedSize = await apiCacheDataSize(url);
            }

            if (cachedSize) {
                updateProgress(url, cachedSize, cachedSize, true);
                return;
            }

            await retryRequest(async () => {
                const response = await fetch(url);
                const responseClone = response.clone();
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

                if (hasInlineMedia) {
                    const resources = await responseClone.json();
                    resources.forEach((data: { tiptap: { content: DownloadTtContent[] } }) => {
                        if (data && data.tiptap && data.tiptap.content) {
                            data?.tiptap?.content?.forEach((content: DownloadTtContent) => {
                                if (
                                    content.type.toUpperCase() === MediaType.Video.toUpperCase() ||
                                    content.type.toUpperCase() === MediaType.Image.toUpperCase()
                                ) {
                                    queue.push({
                                        mediaType:
                                            content.type.toUpperCase() === MediaType.Video.toUpperCase()
                                                ? MediaType.Video
                                                : MediaType.Image,
                                        url: content.attrs?.src,
                                        size: 0,
                                        hasInlineMedia: false,
                                    });
                                }
                            });
                        }
                    });
                }

                updateProgress(url, receivedLength, contentLength ? +contentLength : 0, true);
            });
        } finally {
            partiallyDownloadedUrls.delete(url);
        }
    };

    const processBatch = async (baseUrl: Url, idsToUrls: Record<number, UrlWithMetadata>) => {
        const batchIds: number[] = [];
        await asyncUnorderedForEach(Object.entries(idsToUrls), async ([id, urlWithMetadata]) => {
            try {
                partiallyDownloadedUrls.add(urlWithMetadata.url);

                if (urlWithMetadata.url in staticUrlsMap) {
                    updateProgress(urlWithMetadata.url, urlWithMetadata.size, urlWithMetadata.size, true);
                    partiallyDownloadedUrls.delete(urlWithMetadata.url);
                    return;
                }

                const cachedSize = await contentCacheDataSize(urlWithMetadata.url);
                if (cachedSize !== null) {
                    updateProgress(urlWithMetadata.url, cachedSize, cachedSize, true);
                    partiallyDownloadedUrls.delete(urlWithMetadata.url);
                } else {
                    batchIds.push(parseInt(id));
                }
            } catch (error) {
                log.exception(error as Error);
                partiallyDownloadedUrls.delete(urlWithMetadata.url);
            }
        });

        if (batchIds.length > 0) {
            const isMetadata = objectValues(idsToUrls)[0]?.url.includes('metadata') ?? false;

            try {
                await retryRequest(async () => {
                    await fetchContentOrMetadataBatchFromNetwork(
                        baseUrl,
                        batchIds,
                        (id) => idsToUrls[id]?.url,
                        (response) => (isMetadata ? response : response.content),
                        isMetadata,
                        (id) => {
                            const urlWithMetadata = idsToUrls[id];
                            if (urlWithMetadata) {
                                updateProgress(urlWithMetadata.url, urlWithMetadata.size, urlWithMetadata.size, true);
                                partiallyDownloadedUrls.delete(urlWithMetadata.url);
                            }
                        }
                    );
                });
            } catch (error) {
                // likely a network error
                log.exception(error as Error);
            }
        }

        Object.values(idsToUrls).forEach((urlWithMetadata) => {
            partiallyDownloadedUrls.delete(urlWithMetadata.url);
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
                        const { url, size, hasInlineMedia } = urlWithMetadataOrBatchUrl as UrlWithMetadata;
                        if (url) await processUrl(url, size, hasInlineMedia);
                    }
                }
            });
        await Promise.all(workers);
    };

    await processQueue();
    apiCachedUrls.clear();
    contentCachedUrls.clear();
}

// Take a batch of ids and apply them to the base URL as `ids` query params, fetch that batch then populate the cache
// using the key and value functions. Returns a map of id to fetched value.
async function fetchContentOrMetadataBatchFromNetwork(
    batchUrl: string,
    ids: number[],
    calculateNonBatchUrl: (id: number) => string | undefined,
    calculateValueToCache: (response: { id: number; content: object }) => object,
    isMetadata: boolean,
    completedCallback?: (id: number) => void
) {
    const cache = await getContentCache();
    const idsParams = ids.map((id) => `ids=${id}`).join('&');
    const url = `${batchUrl}?${idsParams}`;
    const response = await fetch(url);
    const json = (await response.json()) as { id: number; content: object }[];

    const output = new Map<number, object>();

    // Iterate through the array returned by the batch endpoint and insert each item into the cache.
    // The cache key is meant to be the original URL that the item would've had, so for all intents and
    // purposes it's as if we hit the original URL itself and cached the response.
    await asyncUnorderedForEach(json, async (response) => {
        const key = calculateNonBatchUrl(response.id);
        const value = calculateValueToCache(response);
        output.set(response.id, value);
        if (key && value) {
            const { updatedUrl, version } = window.__CACHING_CONFIG.splitVersionOutOfUrl(key);
            await cache.put(updatedUrl, new Response(JSON.stringify(value)));
            if (isMetadata) {
                await window.__CACHING_CONFIG.metadataIdAndVersionDb.set(response.id, { version });
            } else {
                await window.__CACHING_CONFIG.contentIdAndVersionDb.set(response.id, { version });
            }
        }
        completedCallback?.(response.id);
    });

    contentCachedUrls.clear();

    return output;
}

// Take a list of ids and detect which ones have been cached and which ones have not. For the uncached ones, use the
// batch function to fetch them quickly. For the cached ones, use the normal fetch functions. Returns a map of id to fetched value.
export async function fetchContentOrMetadataBatchFromCacheAndNetwork<T>(
    batchUrl: string,
    ids: number[],
    calculateNonBatchUrl: (id: number) => string | undefined,
    calculateValueToCache: (response: { id: number; content: object }) => object,
    isMetadata: boolean,
    chunkSize: number
) {
    const cached = [] as { url: string; id: number }[];
    const uncached = [] as number[];

    await asyncUnorderedForEach(ids, async (id) => {
        const url = calculateNonBatchUrl(id);
        if (url && (await isCachedAsContent(url))) {
            cached.push({ id, url });
        } else {
            uncached.push(id);
        }
    });

    const chunked = chunk(uncached, chunkSize);
    const output = new Map<number, T | null>();

    await Promise.all([
        asyncUnorderedForEach(cached, async ({ id, url }) => {
            output.set(id, await fetchContentFromCacheOrNetwork(url));
        }),
        asyncUnorderedForEach(chunked, async (chunk) => {
            try {
                const chunkIdsToContent = await fetchContentOrMetadataBatchFromNetwork(
                    batchUrl,
                    chunk,
                    calculateNonBatchUrl,
                    calculateValueToCache,
                    isMetadata
                );
                for (const [id, value] of chunkIdsToContent.entries()) {
                    output.set(id, (value as T | undefined | null) ?? null);
                }
            } catch {
                // not cached, that's fine
            }
        }),
    ]);

    return output;
}

function isTextBatchableUrl(url: UrlWithMetadata) {
    return url.mediaType === MediaType.Text && window.__CACHING_CONFIG.isContentUrl(url.url) && !url.hasInlineMedia;
}

function isMetadataBatchableUrl(url: UrlWithMetadata) {
    return window.__CACHING_CONFIG.isMetadataUrl(url.url);
}

export async function getApiCache() {
    return await caches.open(window.__CACHING_CONFIG.apiCacheKey);
}

export async function getContentCache() {
    return await caches.open(window.__CACHING_CONFIG.contentCacheKey);
}

const contentCachedUrls: Map<string, boolean> = new Map();
const apiCachedUrls: Map<string, boolean> = new Map();

// Checks if a fully downloaded cache entry exists for the URL.
// Ignores `version` search param since that is used by the Service Worker middleware and isn't included in the cache key.
export async function isCachedAsContent(url: Url) {
    if (!url) return false;
    const urlObject = new URL(url);
    urlObject.searchParams.delete('version');
    url = urlObject.toString();
    if (contentCachedUrls.has(url)) {
        return contentCachedUrls.get(url)!;
    }
    if (partiallyDownloadedUrls.has(url)) {
        return false;
    }
    if (url in staticUrlsMap) {
        return true;
    }
    if (!('serviceWorker' in navigator)) {
        return false;
    }
    const cache = await getContentCache();
    const response = await cache.match(url);
    const isCached = response != null;
    contentCachedUrls.set(url, isCached);
    return isCached;
}

// Checks if a fully downloaded cache entry exists for the API path.
export async function isCachedFromApi(path: string) {
    const url = apiUrl(path);
    if (apiCachedUrls.has(url)) {
        return apiCachedUrls.get(url)!;
    }
    if (partiallyDownloadedUrls.has(url)) {
        return false;
    }
    if (url in staticUrlsMap) {
        return true;
    }
    if (!('serviceWorker' in navigator)) {
        return false;
    }
    const cache = await getApiCache();
    const response = await cache.match(url);
    const isCached = response != null;
    apiCachedUrls.set(url, isCached);
    return isCached;
}

export function apiUrl(path: string) {
    return (config.PUBLIC_AQUIFER_API_URL + (path.startsWith('/') ? path.slice(1) : path)).replace(/\/$/, '');
}

async function contentCacheDataSize(url: Url, cache: Cache | null = null) {
    if (!('serviceWorker' in navigator)) {
        return null;
    }
    const openedCache = cache || (await getContentCache());
    const response = await openedCache.match(url);
    if (response) {
        const blob = await response.blob();
        return blob.size;
    }
    return null;
}

async function apiCacheDataSize(url: Url, cache: Cache | null = null) {
    if (!('serviceWorker' in navigator)) {
        return null;
    }
    const openedCache = cache || (await getApiCache());
    const response = await openedCache.match(url);
    if (response) {
        const blob = await response.blob();
        return blob.size;
    }
    return null;
}
