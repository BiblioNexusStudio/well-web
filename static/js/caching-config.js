// eslint-disable-next-line
// @ts-nocheck

// This file contains caching-related config used by the service worker and the app itself
// For this reason and due to some issues with using one file in both places, the file is symlinked
// into src/lib.

const API_PATH_FOR_METADATA = '/resources/:ID/metadata';
const API_PATH_FOR_CONTENT = '/resources/:ID/content';
const API_URLS = [
    'https://api-bn.aquifer.bible',
    'https://qa.api-bn.aquifer.bible',
    'https://dev.api-bn.aquifer.bible',
    'http://localhost:5257',
];

const API_CONTENT_AND_METADATA_PATHS = [API_PATH_FOR_CONTENT, API_PATH_FOR_METADATA];

const OTHER_API_PATHS_TO_CACHE_AS_CONTENT = ['/resources/:ID/thumbnail', '/bibles/:ID/texts'];

const API_PATHS_TO_SKIP_CACHING = ['/resources/batch/metadata', '/resources/batch/content/text'];

const CDN_URLS = ['https://cdn.aquifer.bible', 'https://aquiferstorage.blob.core.windows.net'];

const cdnUrlRegex = createRegexFromUrlsAndPaths(CDN_URLS);
const apiContentAndMetadataUrlsRegex = createRegexFromUrlsAndPaths(API_URLS, API_CONTENT_AND_METADATA_PATHS);
const otherApiUrlsToCacheAsContentRegex = createRegexFromUrlsAndPaths(API_URLS, OTHER_API_PATHS_TO_CACHE_AS_CONTENT);

const apiContentUrlRegex = createRegexFromUrlsAndPaths(API_URLS, [API_PATH_FOR_CONTENT]);
const apiMetadataUrlRegex = createRegexFromUrlsAndPaths(API_URLS, [API_PATH_FOR_METADATA]);

/**
 * IndexedDBWrapper class for handling IndexedDB operations
 * @template T - Type of the stored value
 */
class IndexedDBWrapper {
    /**
     * Constructor for IndexedDBWrapper
     * @param {string} dbName - Name of the database
     * @param {string} objectStore - Name of the object store
     */
    constructor(dbName, objectStore) {
        this.dbName = dbName;
        this.objectStore = objectStore;
        /** @type {Promise<IDBDatabase> | null} */
        this.dbPromise = null;
    }

    /**
     * Private method to get the database instance (memoized)
     */
    async _getDb() {
        if (this.dbPromise) {
            return this.dbPromise;
        }

        this.dbPromise = new Promise((resolve, reject) => {
            const openRequest = indexedDB.open(this.dbName, 1);
            openRequest.onupgradeneeded = () => {
                const db = openRequest.result;
                db.createObjectStore(this.objectStore);
            };
            openRequest.onsuccess = () => resolve(openRequest.result);
            openRequest.onerror = () => reject(openRequest.error);
        });

        return this.dbPromise;
    }

    /**
     * Method to get a value from the database
     * @param {IDBValidKey} key - Key to retrieve the value
     * @returns {Promise<T | undefined>}
     */
    async get(key) {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.objectStore, 'readonly');
            const store = transaction.objectStore(this.objectStore);
            const getRequest = store.get(key);
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Method to set a value in the database
     * @param {IDBValidKey} key - Key to store the value
     * @param {T} value - Value to be stored
     * @returns {Promise<void>}
     */
    async set(key, value) {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.objectStore, 'readwrite');
            const store = transaction.objectStore(this.objectStore);
            const putRequest = store.put(value, key);
            putRequest.onsuccess = () => resolve(putRequest.result);
            putRequest.onerror = () => reject(putRequest.error);
        });
    }
}

/**
 * @type {IndexedDBWrapper<{ timestamp: number, cacheBustVersion: string }>}
 */
const timestampAndEndpointCacheBustVersionDb = new IndexedDBWrapper('service-worker-cache-timestamps', 'timestamps');

/**
 * @type {IndexedDBWrapper<{ version: number }>}
 */
const contentIdAndVersionDb = new IndexedDBWrapper('service-worker-content-ids-and-versions', 'versions');

/**
 * @type {IndexedDBWrapper<{ version: number }>}
 */
const metadataIdAndVersionDb = new IndexedDBWrapper('service-worker-metadata-ids-and-versions', 'versions');

const CACHING_CONFIG = {
    contentCacheKey: 'aquifer-cdn',
    apiCacheKey: 'aquifer-api',
    cdnUrlRegex,
    apiContentAndMetadataUrlsRegex,
    otherApiUrlsToCacheAsContentRegex,
    timestampAndEndpointCacheBustVersionDb,
    contentIdAndVersionDb,
    metadataIdAndVersionDb,
    apiContentUrlRegex,
    apiMetadataUrlRegex,
    apiSkipCacheUrlRegex: createRegexFromUrlsAndPaths(API_URLS, API_PATHS_TO_SKIP_CACHING),
    apiUrlRegex: createRegexFromUrlsAndPaths(API_URLS),
    contentIdFromMetadataUrl,
    contentIdFromContentUrl,
    splitVersionOutOfUrl,

    // these are meant for usage in the app to determine what a given URL is
    urlGoesInContentCache,
    isContentUrl,
    isMetadataUrl,
};

/**
 * @param {string} url
 */
function urlGoesInContentCache(url) {
    return (
        cdnUrlRegex.test(url) || apiContentAndMetadataUrlsRegex.test(url) || otherApiUrlsToCacheAsContentRegex.test(url)
    );
}

/**
 * @param {string} url
 */
function isContentUrl(url) {
    return apiContentUrlRegex.test(url);
}

/**
 * @param {string} url
 */
function isMetadataUrl(url) {
    return apiMetadataUrlRegex.test(url);
}

/**
 * @param {string} url
 */
function contentIdFromContentUrl(url) {
    const matches = url.match(apiContentUrlRegex) ?? [];
    matches.shift();
    const match = matches.filter(Boolean)[0];
    if (match) {
        return parseInt(match) || null;
    }
    return null;
}

/**
 * @param {string} url
 */
function contentIdFromMetadataUrl(url) {
    const matches = url.match(apiMetadataUrlRegex) ?? [];
    matches.shift();
    const match = matches.filter(Boolean)[0];
    if (match) {
        return parseInt(match) || null;
    }
    return null;
}

/**
 * @param {string[]} urls - Array of URLs.
 * @param {string[]} [paths=[]] - Array of paths.
 */
function createRegexFromUrlsAndPaths(urls, paths = []) {
    const combined = urls
        .map((url) => {
            if (paths.length === 0) {
                return url;
            } else {
                return paths.map((path) => url + path);
            }
        })
        .flat();
    const escapedUrls = combined.map((url) => url.replace(/[-/\\^$*?.()|[\]{}]/g, '\\$&').replaceAll(':ID', '(\\d+)'));
    return new RegExp(`^(?:${escapedUrls.join('|')}).*`);
}

/**
 * @param {string} url
 */
function splitVersionOutOfUrl(url) {
    const urlObject = new URL(url);
    const versionString = urlObject.searchParams.get('version');
    const version = parseInt(versionString ?? '1') || 1;
    urlObject.searchParams.delete('version');
    return { updatedUrl: urlObject.toString(), version };
}

if (typeof window !== 'undefined') {
    // eslint-disable-next-line
    // @ts-ignore
    window.__CACHING_CONFIG = CACHING_CONFIG;
}
