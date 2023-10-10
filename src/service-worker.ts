/// <reference lib="WebWorker" />

import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkOnly, CacheFirst, CacheOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { createHandlerBoundToURL, cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { CacheableCdnContentPlugin } from '../src/lib/service-worker/cacheable-cdn-content-plugin';
import { CacheFirstAndStaleWhileRevalidateAfterExpiration } from '../src/lib/service-worker/cache-first-and-stale-while-revalidate-after-expiration';

declare let self: ServiceWorkerGlobalScope;

if (import.meta.env.DEV) {
    self.skipWaiting();
} else {
    self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
    });
}

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

if (!import.meta.env.DEV) {
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

registerRoute(
    /(https:\/\/cdn\.aquifer\.bible.*|https:\/\/aquifer-server-(qa|dev|prod)\.azurewebsites\.net\/resources\/\d+\/(content|metadata))/,
    new CacheFirst({
        cacheName: 'aquifer-cdn',
        plugins: [new CacheableCdnContentPlugin()],
    }),
    'GET'
);

registerRoute(
    /https:\/\/aquifer-server-(qa|dev|prod)\.azurewebsites\.net.*/,
    new CacheFirstAndStaleWhileRevalidateAfterExpiration({
        cacheName: 'aquifer-api',
        staleAfterDuration: 60 * 60 * 24, // time in seconds, 1 day
    }),
    'GET'
);

registerRoute(
    /.*\/__local_recordings\/.*/,
    new CacheOnly({
        cacheName: 'local-recordings',
        plugins: [],
    }),
    'GET'
);
