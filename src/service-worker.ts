/// <reference lib="WebWorker" />
// <reference path="../static/js/workbox-plugins/add-api-key-to-all-request-plugin.js" />
// <reference path="../static/js/workbox-plugins/cache-first-and-stale-while-revalidate-after-expiration.js" />
// <reference path="../static/js/workbox-plugins/cacheable-media-or-text-content-plugin.js" />
// <reference path="../static/js/workbox-plugins/newtork-or-cache-used-plugin.js" />
// <reference path="../static/js/caching-config.js" />

// In an ideal world we would use a module-based approach for this file, enabling us to do
// `import ... from 'workbox-...';` and also have import metadata injected like `import.meta.env.DEPLOY_ENV`.
// When the app is built, the build process bundles all of the imported code and replaces the import metadata
// with hardcoded values, so the built version of the service worker works flawlessly in any browser.
// However, running in local dev mode (i.e. `yarn dev`) doesn't bundle the code. This means that the browser
// receives the raw module-based code with `import ...` and all. Currently, Chrome is the only browser that
// supports module features for service workers, so this means that Firefox/Safari/Edge can't be used in dev
// mode.
//
// The best solution currently is to use "classic" mode in VitePWAs dev options and use `importScripts` in this
// service worker. We include the workbox library code we need in our codebase (meh, I know) and also need to
// keep our workbox plugin code in pure JS files (since the TS can't be easily compiled on the fly). This
// approach works well, but requires some extra thought in order for types to keep working. The workbox types
// need to be pulled in and applied for each workbox library (see below) and our workbox plugin code must be
// typed with JSDoc.

importScripts(
    // workbox core
    'external-js/workbox/workbox-v7.0.0/workbox-core.prod.js',

    // additional workbox libraries (order matters)
    'external-js/workbox/workbox-v7.0.0/workbox-routing.prod.js',
    'external-js/workbox/workbox-v7.0.0/workbox-strategies.prod.js',
    'external-js/workbox/workbox-v7.0.0/workbox-background-sync.prod.js',
    'external-js/workbox/workbox-v7.0.0/workbox-precaching.prod.js',
    'external-js/workbox/workbox-v7.0.0/workbox-range-requests.prod.js',

    // internal plugins. note that they're referenced at the top of the file to import the JSDoc types.
    'js/workbox-plugins/add-api-key-to-all-request-plugin.js',
    'js/workbox-plugins/cache-first-and-stale-while-revalidate-after-expiration.js',
    'js/workbox-plugins/cacheable-media-or-text-content-plugin.js',
    'js/workbox-plugins/content-and-metadata-network-first-when-version-outdated.js',
    'js/workbox-plugins/network-or-cache-used-plugin.js',
    'js/caching-config.js'
);

import type * as WorkboxCore from 'workbox-core';
import type * as WorkboxRouting from 'workbox-routing';
import type * as WorkboxStrategies from 'workbox-strategies';
import type * as WorkboxBackgroundSync from 'workbox-background-sync';
import type * as WorkboxPrecahing from 'workbox-precaching';
import type * as WorkboxRangeRequests from 'workbox-range-requests';

declare let self: ServiceWorkerGlobalScope;
declare let workbox: {
    core: typeof WorkboxCore;
    routing: typeof WorkboxRouting;
    strategies: typeof WorkboxStrategies;
    backgroundSync: typeof WorkboxBackgroundSync;
    precaching: typeof WorkboxPrecahing;
    rangeRequests: typeof WorkboxRangeRequests;
};

const { clientsClaim } = workbox.core;
const { registerRoute, NavigationRoute } = workbox.routing;
const { NetworkOnly, CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { BackgroundSyncPlugin } = workbox.backgroundSync;
const { createHandlerBoundToURL, cleanupOutdatedCaches, precacheAndRoute } = workbox.precaching;
const { RangeRequestsPlugin } = workbox.rangeRequests;

declare let localDevelopmentEnvVars: { PUBLIC_AQUIFER_API_KEY: string } | undefined;

let isLocalDevelopment = false;
let isDev = false;
let isQa = false;
let apiKey: string | undefined = '';

// When building for production, Vite will replace these `process.env`s with their static values.
// In development, the code will still be `process.env...`, which will blow up, triggering the catch block.
// This lets us detect if we're in local development mode, and then grab the env values from the local filesystem.
try {
    isDev = process.env.DEPLOY_ENV === 'dev';
    isQa = process.env.DEPLOY_ENV === 'qa';
    apiKey = process.env.PUBLIC_AQUIFER_API_KEY;
} catch {
    isLocalDevelopment = true;
    isDev = true;
    try {
        importScripts('local-development-env.js');
        apiKey = localDevelopmentEnvVars?.PUBLIC_AQUIFER_API_KEY;
    } catch {
        console.error("Looks like you're running locally but forgot to run `yarn use-config dev-local` first.");
        throw new Error("Looks like you're running locally but forgot to run `yarn use-config dev-local` first.");
    }
}

const API_CACHE_DURATION_IN_HOURS = isQa || isDev ? 1 : 24;
const addApiKeyToAllRequestPlugin = new AddApiKeyToAllRequestPlugin(apiKey);

self.addEventListener('message', (event) => {
    if (event.data?.appInsightsUserId) {
        addApiKeyToAllRequestPlugin.appInsightsUserId = event.data.appInsightsUserId;
    }
});

if (isLocalDevelopment) {
    self.skipWaiting();
} else {
    self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
    });
}

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

if (!isLocalDevelopment) {
    registerRoute(new NavigationRoute(createHandlerBoundToURL('/')));
}

registerRoute(
    /https:\/\/.*\.applicationinsights\.azure\.com.*/,
    new NetworkOnly({
        plugins: [
            new BackgroundSyncPlugin('application-insights-syncer', {
                maxRetentionTime: 60 * 24 * 14, // time in minutes, 2 weeks
            }),
        ],
    }),
    'POST'
);

const contentAndMetadataCachingHandler = new ContentAndMetadataNetworkFirstWhenVersionOutdated({
    cacheName: CACHING_CONFIG.contentCacheKey,
    plugins: [new CacheableMediaOrTextContentPlugin(), new RangeRequestsPlugin(), addApiKeyToAllRequestPlugin],
    CacheFirst,
    NetworkFirst,
    StaleWhileRevalidate,
    NetworkOrCacheUsedPlugin,
    metadataIdAndVersionDb,
    contentIdAndVersionDb,
    contentIdFromMetadataUrl: CACHING_CONFIG.contentIdFromMetadataUrl,
    contentIdFromContentUrl: CACHING_CONFIG.contentIdFromContentUrl,
    splitVersionOutOfUrl: CACHING_CONFIG.splitVersionOutOfUrl,
});

const otherContentCachingHandler = new CacheFirst({
    cacheName: CACHING_CONFIG.contentCacheKey,
    plugins: [new CacheableMediaOrTextContentPlugin(), new RangeRequestsPlugin(), addApiKeyToAllRequestPlugin],
});

const apiCachingHandler = new CacheFirstAndStaleWhileRevalidateAfterExpiration({
    cacheName: CACHING_CONFIG.apiCacheKey,
    staleAfterDuration: 60 * 60 * API_CACHE_DURATION_IN_HOURS,
    plugins: [addApiKeyToAllRequestPlugin],
    timestampsDb: CACHING_CONFIG.timestampAndEndpointCacheBustVersionDb,
    CacheFirst,
    NetworkFirst,
    StaleWhileRevalidate,
});

// content and metadata should be cached as content
registerRoute(CACHING_CONFIG.apiContentAndMetadataUrlsRegex, contentAndMetadataCachingHandler, 'GET');

// CDN URLs should be cached as content
registerRoute(CACHING_CONFIG.cdnUrlRegex, otherContentCachingHandler, 'GET');

// some other API paths should be cached as content
registerRoute(CACHING_CONFIG.otherApiUrlsToCacheAsContentRegex, otherContentCachingHandler, 'GET');

// some paths should not be cached
registerRoute(
    CACHING_CONFIG.apiSkipCacheUrlRegex,
    new NetworkOnly({
        plugins: [addApiKeyToAllRequestPlugin],
    }),
    'GET'
);

// cache everything else under the API
registerRoute(CACHING_CONFIG.apiUrlRegex, apiCachingHandler, 'GET');

// don't cache POSTs
registerRoute(
    CACHING_CONFIG.apiUrlRegex,
    new NetworkOnly({
        plugins: [addApiKeyToAllRequestPlugin],
    }),
    'POST'
);
