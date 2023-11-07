/// <reference lib="WebWorker" />

import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkOnly, CacheFirst, CacheOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { createHandlerBoundToURL, cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { CacheableCdnContentPlugin } from '../src/lib/service-worker/cacheable-cdn-content-plugin';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { CacheFirstAndStaleWhileRevalidateAfterExpiration } from '../src/lib/service-worker/cache-first-and-stale-while-revalidate-after-expiration';
import { AddApiKeyToAllRequestPlugin } from '../src/lib/service-worker/add-api-key-to-all-request-plugin';

declare let self: ServiceWorkerGlobalScope;

const isQa = import.meta.env.DEPLOY_ENV === 'qa';
const isDev = import.meta.env.DEPLOY_ENV === 'dev';
const API_CACHE_DURATION_IN_HOURS = isQa || isDev ? 1 : 24;
const addApiKeyToAllRequestPlugin = new AddApiKeyToAllRequestPlugin(import.meta.env.PUBLIC_AQUIFER_API_KEY);

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
    /https:\/\/(dev|qa)?\.?api\.aquifer\.bible.*/,
    new CacheFirst({
        cacheName: 'aquifer-cdn',
        plugins: [new CacheableCdnContentPlugin(), new RangeRequestsPlugin(), addApiKeyToAllRequestPlugin],
    }),
    'GET'
);

registerRoute(
    /https:\/\/aquifer-server-(qa|dev|prod)\.azurewebsites\.net.*/,
    new CacheFirstAndStaleWhileRevalidateAfterExpiration({
        cacheName: 'aquifer-api',
        staleAfterDuration: 60 * 60 * API_CACHE_DURATION_IN_HOURS,
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
