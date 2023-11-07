import type { HandlerCallbackOptions, WorkboxPlugin } from 'workbox-core/types';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import type { Strategy } from 'workbox-strategies';

const TIMESTAMPS_DB_NAME = 'service-worker-cache-timestamps';
const OBJECT_STORE_NAME = 'timestamps';

// This strategy uses IndexedDB to store cache timestamps for each request it caches
// When handling a request, it does the following:
// - Check if entry exists that is more recent than the staleAfterDuration value, if so use a CacheFirst strategy to
//   return it.
// - If no entry exists or the entry is stale, use a StaleWhileRevalidate strategy to immediately return the cached
//   value but in the background fetch the data from the network to update the cache.
class CacheFirstAndStaleWhileRevalidateAfterExpiration {
    staleAfterDuration: number;
    cacheName: string;
    plugins: WorkboxPlugin[];

    constructor({
        staleAfterDuration,
        cacheName,
        plugins,
    }: {
        staleAfterDuration: number;
        cacheName: string;
        plugins: WorkboxPlugin[];
    }) {
        this.staleAfterDuration = staleAfterDuration;
        this.cacheName = cacheName;
        this.plugins = plugins;
    }

    async _getDb(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open(TIMESTAMPS_DB_NAME, 1);
            openRequest.onupgradeneeded = () => {
                const db = openRequest.result;
                db.createObjectStore(OBJECT_STORE_NAME);
            };
            openRequest.onsuccess = () => resolve(openRequest.result);
            openRequest.onerror = () => reject(openRequest.error);
        });
    }

    async _getTimestamp(request: string | Request): Promise<number | undefined> {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
            const store = transaction.objectStore(OBJECT_STORE_NAME);
            const getRequest = store.get(typeof request === 'string' ? request : request.url);
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async _setTimestamp(request: string | Request, timestamp: number) {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(OBJECT_STORE_NAME);
            const putRequest = store.put(timestamp, typeof request === 'string' ? request : request.url);
            putRequest.onsuccess = () => resolve(putRequest.result);
            putRequest.onerror = () => reject(putRequest.error);
        });
    }

    handle: Strategy['handle'] = async ({ event, request }: HandlerCallbackOptions) => {
        const now = Date.now();
        const timestamp = await this._getTimestamp(request);
        const age = (now - (timestamp || 0)) / 1000;

        if (age < this.staleAfterDuration) {
            return new CacheFirst({ cacheName: this.cacheName, plugins: this.plugins }).handle({ event, request });
        } else {
            const response = await new StaleWhileRevalidate({
                cacheName: this.cacheName,
                plugins: this.plugins,
            }).handle({
                event,
                request,
            });
            if (response) {
                await this._setTimestamp(request, now);
            }
            return response;
        }
    };
}

export { CacheFirstAndStaleWhileRevalidateAfterExpiration };
