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

const API_PATHS_TO_CACHE_AS_CONTENT = [
    API_PATH_FOR_CONTENT,
    API_PATH_FOR_METADATA,
    '/resources/:ID/thumbnail',
    '/bibles/:ID/texts',
];

const API_PATHS_TO_SKIP_CACHING = ['/resources/batch/metadata', '/resources/batch/content/text'];

const CDN_URLS = ['https://cdn.aquifer.bible'];

const cdnUrlRegex = createRegexFromUrlsAndPaths(CDN_URLS);
const apiUrlsToCacheAsContentRegex = createRegexFromUrlsAndPaths(API_URLS, API_PATHS_TO_CACHE_AS_CONTENT);

const apiContentUrlRegex = createRegexFromUrlsAndPaths(API_URLS, [API_PATH_FOR_CONTENT]);
const apiMetadataUrlRegex = createRegexFromUrlsAndPaths(API_URLS, [API_PATH_FOR_METADATA]);

const CACHING_CONFIG = {
    contentCacheKey: 'aquifer-cdn',
    apiCacheKey: 'aquifer-api',
    cdnUrlRegex,
    apiUrlsToCacheAsContentRegex,
    apiContentUrlRegex,
    apiMetadataUrlRegex,
    apiSkipCacheUrlRegex: createRegexFromUrlsAndPaths(API_URLS, API_PATHS_TO_SKIP_CACHING),
    apiUrlRegex: createRegexFromUrlsAndPaths(API_URLS),

    // these are meant for usage in the app to determine what a given URL is
    urlGoesInContentCache,
    isContentUrl,
    isMetadataUrl,
};

/**
 * @param {string} url
 */
function urlGoesInContentCache(url) {
    return cdnUrlRegex.test(url) || apiUrlsToCacheAsContentRegex.test(url);
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
 * @param {string[]} urls - Array of URLs.
 * @param {string[]} [paths=[]] - Array of paths.
 * @returns {RegExp} - Regular expression created from URLs and paths.
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
    const escapedUrls = combined.map((url) => url.replace(/[-/\\^$*?.()|[\]{}]/g, '\\$&').replace(':ID', '\\d+'));
    return new RegExp(`^(${escapedUrls.join('|')}).*`);
}

if (typeof window !== 'undefined') {
    // eslint-disable-next-line
    // @ts-ignore
    window.__CACHING_CONFIG = CACHING_CONFIG;
}
