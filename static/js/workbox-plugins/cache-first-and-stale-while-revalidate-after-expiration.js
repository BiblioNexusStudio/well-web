const TIMESTAMPS_DB_NAME = 'service-worker-cache-timestamps';
const OBJECT_STORE_NAME = 'timestamps';

// This strategy uses IndexedDB to store cache timestamps and cache-busting versions for each request it caches.
// When handling a request, it does the following:
// - Check if entry exists that is more recent than the staleAfterDuration value and matches the version specified by
//   the X-Cache-Bust-Version header, if so use a CacheFirst strategy to return it.
// - If there is not a version matching the X-Cache-Bust-Version header, use a NetworkFirst strategy.
// - If no entry exists or the entry is stale, use a StaleWhileRevalidate strategy to immediately return the cached
//   value but in the background fetch the data from the network to update the cache.
// eslint-disable-next-line
class CacheFirstAndStaleWhileRevalidateAfterExpiration {
    /**
     * Duration after which the cache is considered stale.
     * @type {number|null}
     */
    staleAfterDuration = null;

    /**
     * Name of the cache where responses are stored.
     * @type {string|undefined}
     */
    cacheName = undefined;

    /**
     * Additional plugins to be used with caching strategies.
     * @type {Array<import("workbox-core").WorkboxPlugin>}
     */
    plugins = [];

    /**
     * CacheFirst strategy constructor reference.
     * @type {typeof import("workbox-strategies").CacheFirst|null}
     */
    CacheFirst = null;

    /**
     * NetworkFirst strategy constructor reference.
     * @type {typeof import("workbox-strategies").NetworkFirst|null}
     */
    NetworkFirst = null;

    /**
     * StaleWhileRevalidate strategy constructor reference.
     * @type {typeof import("workbox-strategies").StaleWhileRevalidate|null}
     */
    StaleWhileRevalidate = null;

    /**
     * Constructs the caching strategy with specified options.
     * @param {Object} options
     * @param {number} options.staleAfterDuration - Duration in seconds after which the cache is considered stale.
     * @param {string} options.cacheName - Name of the cache.
     * @param {Array<import("workbox-core").WorkboxPlugin>} options.plugins - Additional plugins for caching strategies.
     * @param {typeof import("workbox-strategies").CacheFirst} options.CacheFirst - Constructor for CacheFirst strategy.
     * @param {typeof import("workbox-strategies").NetworkFirst} options.NetworkFirst - Constructor for NetworkFirst strategy.
     * @param {typeof import("workbox-strategies").StaleWhileRevalidate} options.StaleWhileRevalidate - Constructor for StaleWhileRevalidate strategy.
     */
    constructor({ staleAfterDuration, cacheName, plugins, CacheFirst, NetworkFirst, StaleWhileRevalidate }) {
        this.staleAfterDuration = staleAfterDuration;
        this.cacheName = cacheName;
        this.plugins = plugins;
        this.CacheFirst = CacheFirst;
        this.NetworkFirst = NetworkFirst;
        this.StaleWhileRevalidate = StaleWhileRevalidate;
    }

    async _getDb() {
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

    /**
     * @param {Request} request - The request to check the latest timestamp for.
     * @returns {Promise<{timestamp: number; cacheBustVersion: string;} | undefined>}
     */
    async _getTimestampAndVersion(request) {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
            const store = transaction.objectStore(OBJECT_STORE_NAME);
            const getRequest = store.get(typeof request === 'string' ? request : request.url);
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * @param {Request} request - The request to handle.
     * @param {number} timestamp - The timestamp of the request.
     * @param {string} cacheBustVersion - The cache bust version of the request.
     * @returns {Promise<void>}
     */
    async _setTimestampAndVersion(request, timestamp, cacheBustVersion) {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(OBJECT_STORE_NAME);
            const putRequest = store.put(
                { timestamp, cacheBustVersion },
                typeof request === 'string' ? request : request.url
            );
            putRequest.onsuccess = () => resolve(putRequest.result);
            putRequest.onerror = () => reject(putRequest.error);
        });
    }

    /**
     * Handles the request using the appropriate caching strategy.
     * @param {Object} params
     * @param {Event} params.event - The fetch event.
     * @param {Request} params.request - The request to handle.
     * @returns {Promise<Response>} The response from the cache or fetched from the network.
     */
    handle = async ({ event, request }) => {
        const now = Date.now();
        const requestCacheBustVersion = request.headers.get('X-Cache-Bust-Version') || '1';
        const timestampAndVersion = await this._getTimestampAndVersion(request);
        const timestamp = timestampAndVersion?.timestamp;
        const cacheBustVersion = timestampAndVersion?.cacheBustVersion || '1';
        const age = timestamp ? (now - timestamp) / 1000 : Infinity;
        const isVersionMatch = requestCacheBustVersion === cacheBustVersion;

        if (this.staleAfterDuration && age < this.staleAfterDuration && isVersionMatch) {
            // If it's not stale and the cache-bust version matches, use the cached version.

            // eslint-disable-next-line
            // @ts-ignore: CacheFirst will never be null
            return new this.CacheFirst({ cacheName: this.cacheName, plugins: this.plugins }).handle({ event, request });
        } else if (!isVersionMatch) {
            // If the cache-bust version is a mismatch, get from the network but fall back to the cache (some data
            // better than no data)

            // eslint-disable-next-line
            // @ts-ignore: CacheFirst will never be null
            const response = await new this.NetworkFirst({ cacheName: this.cacheName, plugins: this.plugins }).handle({
                // eslint-disable-next-line
                // @ts-ignore: CacheFirst will never be null
                event,
                request,
            });
            if (response) {
                await this._setTimestampAndVersion(request, now, requestCacheBustVersion);
            }
            return response;
        } else {
            // If the cache-bust version matches but it's stale, do stale while revalidate to fire off a background
            // network request but use the cached version for this specific fetch call.

            // eslint-disable-next-line
            // @ts-ignore: StaleWhileRevalidate will never be null
            const response = await new this.StaleWhileRevalidate({
                cacheName: this.cacheName,
                plugins: this.plugins,
            }).handle({
                // eslint-disable-next-line
                // @ts-ignore: its fine to pass event here
                event,
                request,
            });
            if (response) {
                await this._setTimestampAndVersion(request, now, requestCacheBustVersion);
            }
            return response;
        }
    };
}
