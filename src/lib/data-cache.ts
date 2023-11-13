import config from './config';
import type { Url, UrlWithMetadata } from './types/file-manager';
import type { StaticUrlsMap } from './types/static-mapping';
import staticUrls from '$lib/static-urls-map.json' assert { type: 'json' };
import { asyncForEach } from './utils/async-array';

// Because we need to download metadata alongside content but we don't know ahead of time what the size of the payload
// will be, we're defaulting it to 768 bytes (3/4 of a KB). Most metadata sizes as of now seem to be between 0-1000
// bytes so this seems like a reasonable default.
export const METADATA_ONLY_FAKE_FILE_SIZE = 768;

type CheckCacheChangeItem = { url: Url; expectedSize: number };
type SingleItemProgress = { downloadedSize: number; totalSize: number; done: boolean; metadataOnly?: boolean };
export type AllItemsProgress = Record<Url, SingleItemProgress>;

// The workbox `fetch` caching API will create a cache entry as soon as response headers have been returned, rather than
// after the full response has been downloaded. Without these arrays and their usages, isCachedFromApi and
// isCachedFromCdn would return true even when the data isn't fully there yet.
const partiallyDownloadedCdnUrls: string[] = [];
const partiallyDownloadedApiPaths: string[] = [];
const cdnRegex =
    /(https:\/\/cdn\.aquifer\.bible.*|https:\/\/((qa|dev)\.)?api\.aquifer\.bible\/resources\/\d+\/(content|metadata|thumbnail))/;
export const staticUrlsMap: StaticUrlsMap = staticUrls;

export async function fetchFromCacheOrApi(path: string) {
    if (!(await isCachedFromApi(path))) {
        partiallyDownloadedApiPaths.push(path);
    }
    try {
        const url = apiUrl(path).replace(/\/$/, '');
        const response = await fetch(cachedOrRealUrl(url));
        return await response.json();
    } finally {
        removeFromArray(partiallyDownloadedApiPaths, path);
    }
}

export async function fetchFromCacheOrCdn(url: Url, type: 'blob' | 'json' = 'json') {
    if (!(await isCachedFromCdn(url))) {
        partiallyDownloadedCdnUrls.push(url);
    }
    try {
        const response = await fetch(cachedOrRealUrl(url));
        return await (type === 'blob' ? response.blob() : response.json());
    } finally {
        removeFromArray(partiallyDownloadedCdnUrls, url);
    }
}

export async function removeFromApiCache(path: string) {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    const cache = await caches.open('aquifer-api');
    await cache.delete(apiUrl(path));
}

export async function removeFromCdnCache(url: Url) {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    const cache = await caches.open('aquifer-cdn');
    await cache.delete(url);
}

export async function clearEntireCache() {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    await asyncForEach(await caches.keys(), async (key) => {
        await caches.delete(key);
    });

    const dbs = await indexedDB.databases();
    dbs.forEach((db) => {
        db.name && indexedDB.deleteDatabase(db.name);
    });

    const swRegistration = await navigator.serviceWorker.getRegistration();
    if (swRegistration) {
        swRegistration.unregister();
        location.reload();
    }
}

export function cachedOrRealUrl(url: Url) {
    return url in staticUrlsMap ? (staticUrlsMap[url] as string) : url;
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
    const queue = [...urls];

    progressCallback(progress);

    const updateProgress = (url: Url, downloadedSize: number, totalSize: number, done: boolean) => {
        progress[url] = {
            downloadedSize:
                progress[url].metadataOnly && done
                    ? Math.min(METADATA_ONLY_FAKE_FILE_SIZE, downloadedSize)
                    : downloadedSize,
            totalSize: progress[url].metadataOnly ? METADATA_ONLY_FAKE_FILE_SIZE : totalSize || progress[url].totalSize,
            done,
        };
        progressCallback(progress);
    };

    const processUrl = async (url: Url, expectedSize: number) => {
        const cdnUrl = url.match(cdnRegex);

        if (cdnUrl) {
            partiallyDownloadedCdnUrls.push(url);
        } else {
            partiallyDownloadedApiPaths.push(url);
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
        } finally {
            if (cdnUrl) {
                removeFromArray(partiallyDownloadedCdnUrls, url);
            } else {
                removeFromArray(partiallyDownloadedApiPaths, url);
            }
        }
    };

    const processQueue = async () => {
        const workers = Array(concurrentRequests)
            .fill(null)
            .map(async () => {
                while (queue.length > 0) {
                    const { url, size } = queue.shift() as UrlWithMetadata;
                    if (url) await processUrl(url, size);
                }
            });
        await Promise.all(workers);
    };

    await processQueue();
}

// Given a list of URLs and the expected sizes (which comes from the API), determine if any of the cached data has
// different sizes and therefore needs to be re-downloaded. This won't always catch cache changes since it's possible
// for different content to have the same sizes, but it should be good enough for our use cases (data isn't changing
// that much).
export async function findStaleDataInCdnCache(items: CheckCacheChangeItem[]) {
    const cache = await caches.open('aquifer-cdn');
    return items.filter(async ({ url, expectedSize }) => expectedSize !== (await cachedCdnContentSize(url, cache)));
}

// Checks if a fully downloaded cache entry exists for the URL.
export async function isCachedFromCdn(url: Url) {
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
    return response != null;
}

// Checks if a fully downloaded cache entry exists for the API path.
export async function isCachedFromApi(path: string) {
    if (partiallyDownloadedApiPaths.includes(path)) {
        return false;
    }
    if (apiUrl(path) in staticUrlsMap) {
        return true;
    }
    if (!('serviceWorker' in navigator)) {
        return false;
    }
    const cache = await caches.open('aquifer-api');
    const response = await cache.match(apiUrl(path));
    return response != null;
}

function apiUrl(path: string) {
    return config.PUBLIC_AQUIFER_API_URL + (path.startsWith('/') ? path.slice(1) : path);
}

function removeFromArray<T>(array: T[], value: T) {
    const index = array.indexOf(value);
    if (index > -1) array.splice(index, 1);
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
