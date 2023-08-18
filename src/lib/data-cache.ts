import config from './config';

type Url = string;
type CheckCacheChangeItem = { url: string; expectedSize: number };
type SingleItemProgress = { downloadedSize: number; totalSize: number; done: boolean };
type AllItemsProgress = Record<Url, SingleItemProgress>;

// The workbox `fetch` caching API will create a cache entry as soon as response headers have been returned, rather than
// after the full response has been downloaded. Without these arrays and their usages, isCachedFromApi and
// isCachedFromCdn would return true even when the data isn't fully there yet.
const _partiallyDownloadedCdnUrls: string[] = [];
const _partiallyDownloadedApiPaths: string[] = [];

const fetchFromCacheOrApi = async (path: string) => {
    if (!(await isCachedFromApi(path))) {
        _partiallyDownloadedApiPaths.push(path);
    }
    try {
        const response = await fetch(_apiUrl(path));
        return await response.json();
    } finally {
        _removeFromArray(_partiallyDownloadedApiPaths, path);
    }
};

const fetchFromCacheOrCdn = async (url: Url) => {
    if (!(await isCachedFromCdn(url))) {
        _partiallyDownloadedCdnUrls.push(url);
    }
    try {
        const response = await fetch(url);
        return await response.blob();
    } finally {
        _removeFromArray(_partiallyDownloadedCdnUrls, url);
    }
};

const removeFromApiCache = async (path: string) => {
    const cache = await caches.open('aquifer-api');
    await cache.delete(_apiUrl(path));
};

const removeFromCdnCache = async (url: Url) => {
    const cache = await caches.open('aquifer-cdn');
    await cache.delete(url);
};

// Fetch multiple URLs when online and store them in the cache, tracking progress as the downloads happen.
const cacheManyFromCdnWithProgress = async (
    urls: Url[],
    progressCallback: (progress: AllItemsProgress) => void,
    concurrentRequests = 6
) => {
    const progress: AllItemsProgress = {};
    const queue: string[] = [...urls];

    const updateProgress = (url: Url, downloadedSize: number, totalSize: number, done: boolean) => {
        progress[url] = { downloadedSize, totalSize, done };
        progressCallback(progress);
    };

    const processUrl = async (url: Url) => {
        _partiallyDownloadedCdnUrls.push(url);
        try {
            const cachedSize = await _cachedCdnContentSize(url);
            if (cachedSize) {
                updateProgress(url, cachedSize, cachedSize, true);
                return;
            }

            const response = await fetch(url);

            // Simulate progress updates every second
            const reader = response.body?.getReader();
            const contentLength = response.headers.get('Content-Length');
            let receivedLength = 0;
            if (reader) {
                // eslint-disable-next-line
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    receivedLength += value?.length || 0;
                    updateProgress(url, receivedLength, contentLength ? +contentLength : 0, false);
                    await new Promise((r) => setTimeout(r, 1000)); // Update every second
                }
            }

            updateProgress(url, receivedLength, contentLength ? +contentLength : 0, true);
        } finally {
            _removeFromArray(_partiallyDownloadedCdnUrls, url);
        }
    };

    const processQueue = async () => {
        const workers = Array(concurrentRequests)
            .fill(null)
            .map(async () => {
                while (queue.length > 0) {
                    const url = queue.shift();
                    if (url) await processUrl(url);
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
    return _cachedCdnContentSize != null;
};

// Checks if a fully downloaded cache entry exists for the API path.
const isCachedFromApi = async (path: string) => {
    if (_partiallyDownloadedApiPaths.includes(path)) {
        return false;
    }
    const cache = await caches.open('aquifer-api');
    const response = await cache.match(_apiUrl(path));
    return response != null;
};

const _apiUrl = (path: string) => config.PUBLIC_AQUIFER_API_URL + '/' + (path.startsWith('/') ? path.slice(1) : path);

const _removeFromArray = <T>(array: T[], value: T) => {
    const index = array.indexOf(value);
    if (index > -1) array.splice(index, 1);
};

const _cachedCdnContentSize = async (url: Url, cache: Cache | null = null) => {
    const openedCache = cache || (await caches.open('aquifer-cdn'));
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
};
