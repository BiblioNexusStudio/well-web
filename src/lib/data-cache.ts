import config from './config';
import type { Url, UrlWithMetadata } from './types/file-manager';
import type { StaticUrlsMap } from './types/static-mapping';
import staticUrls from '$lib/static-urls-map.json' assert { type: 'json' };

type CheckCacheChangeItem = { url: Url; expectedSize: number };
type SingleItemProgress = { downloadedSize: number; totalSize: number; done: boolean };
export type AllItemsProgress = Record<Url, SingleItemProgress>;

// The workbox `fetch` caching API will create a cache entry as soon as response headers have been returned, rather than
// after the full response has been downloaded. Without these arrays and their usages, isCachedFromApi and
// isCachedFromCdn would return true even when the data isn't fully there yet.
const _partiallyDownloadedCdnUrls: string[] = [];
const _partiallyDownloadedApiPaths: string[] = [];
const cdnRegex =
    'https://cdn.aquifer.bible.*|https://aquifer-server-(qa|dev|prod).azurewebsites.net/resources/\\d+/content|metadata|thumbnail';
export const staticUrlsMap: StaticUrlsMap = staticUrls;

const fetchFromCacheOrApi = async (path: string) => {
    if (!(await isCachedFromApi(path))) {
        _partiallyDownloadedApiPaths.push(path);
    }
    try {
        const url = _apiUrl(path).replace(/\/$/, '');
        const response = await fetch(cachedOrRealUrl(url));
        return await response.json();
    } finally {
        _removeFromArray(_partiallyDownloadedApiPaths, path);
    }
};

const fetchFromCacheOrCdn = async (url: Url, type: 'blob' | 'json' = 'json') => {
    if (!(await isCachedFromCdn(url))) {
        _partiallyDownloadedCdnUrls.push(url);
    }
    try {
        const response = await fetch(cachedOrRealUrl(url));
        return await (type === 'blob' ? response.blob() : response.json());
    } finally {
        _removeFromArray(_partiallyDownloadedCdnUrls, url);
    }
};

const removeFromApiCache = async (path: string) => {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    const cache = await caches.open('aquifer-api');
    await cache.delete(_apiUrl(path));
};

const removeFromCdnCache = async (url: Url) => {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    const cache = await caches.open('aquifer-cdn');
    await cache.delete(url);
};

const cachedOrRealUrl = (url: Url) => (url in staticUrlsMap ? (staticUrlsMap[url] as string) : url);

// Fetch multiple URLs when online and store them in the cache, tracking progress as the downloads happen.
const cacheManyFromCdnWithProgress = async (
    urls: UrlWithMetadata[],
    progressCallback: (progress: AllItemsProgress) => void = () => {
        // no-op by default
    },
    concurrentRequests = 6
) => {
    const progress: AllItemsProgress = urls.reduce(
        (output, { url, size }) => ({
            ...output,
            [url]: {
                downloadedSize: 0,
                totalSize: size,
                done: false,
            },
        }),
        {}
    );
    const queue = [...urls];

    progressCallback(progress);

    const updateProgress = (url: Url, downloadedSize: number, totalSize: number, done: boolean) => {
        progress[url] = { downloadedSize, totalSize, done };
        progressCallback(progress);
    };

    const processUrl = async (url: Url, expectedSize: number) => {
        const cdnUrl = url.match(cdnRegex);

        if (cdnUrl) {
            _partiallyDownloadedCdnUrls.push(url);
        } else {
            _partiallyDownloadedApiPaths.push(url);
        }

        try {
            if (url in staticUrlsMap) {
                updateProgress(url, expectedSize, expectedSize, true);
                return;
            }

            let cachedSize: number | null = null;

            if (cdnUrl) {
                cachedSize = await _cachedCdnContentSize(url);
            } else {
                cachedSize = await _cachedApiContentSize(url);
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
                _removeFromArray(_partiallyDownloadedCdnUrls, url);
            } else {
                _removeFromArray(_partiallyDownloadedApiPaths, url);
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
};

// Given a list of URLs and the expected sizes (which comes from the API), determine if any of the cached data has
// different sizes and therefore needs to be re-downloaded. This won't always catch cache changes since it's possible
// for different content to have the same sizes, but it should be good enough for our use cases (data isn't changing
// that much).
const findStaleDataInCdnCache = async (items: CheckCacheChangeItem[]) => {
    const cache = await caches.open('aquifer-cdn');
    return items.filter(async ({ url, expectedSize }) => expectedSize !== (await _cachedCdnContentSize(url, cache)));
};

// Checks if a fully downloaded cache entry exists for the URL.
const isCachedFromCdn = async (url: Url) => {
    if (_partiallyDownloadedCdnUrls.includes(url)) {
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
};

// Checks if a fully downloaded cache entry exists for the API path.
const isCachedFromApi = async (path: string) => {
    if (_partiallyDownloadedApiPaths.includes(path)) {
        return false;
    }
    if (_apiUrl(path) in staticUrlsMap) {
        return true;
    }
    if (!('serviceWorker' in navigator)) {
        return false;
    }
    const cache = await caches.open('aquifer-api');
    const response = await cache.match(_apiUrl(path));
    return response != null;
};

const _apiUrl = (path: string) => config.PUBLIC_AQUIFER_API_URL + (path.startsWith('/') ? path.slice(1) : path);

const _removeFromArray = <T>(array: T[], value: T) => {
    const index = array.indexOf(value);
    if (index > -1) array.splice(index, 1);
};

const _cachedCdnContentSize = async (url: Url, cache: Cache | null = null) => {
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
};

const _cachedApiContentSize = async (url: Url, cache: Cache | null = null) => {
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
};

export {
    fetchFromCacheOrApi,
    fetchFromCacheOrCdn,
    findStaleDataInCdnCache,
    removeFromApiCache,
    removeFromCdnCache,
    isCachedFromApi,
    isCachedFromCdn,
    cacheManyFromCdnWithProgress,
    cachedOrRealUrl,
};
