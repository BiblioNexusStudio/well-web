// <reference path="../static/js/caching-config.js" />

// This strategy uses IndexedDB to store cache timestamps and cache-busting versions for each request it caches.
//
// When handling a request, it does the following:
// - Check if entry exists that is more recent than the staleAfterDuration value and matches the version specified by
//   the X-Cache-Bust-Version header, if so use a CacheFirst strategy to return it.
// - If there is not a version matching the X-Cache-Bust-Version header, use a NetworkFirst strategy.
// - If no entry exists or the entry is stale, use a StaleWhileRevalidate strategy to immediately return the cached
//   value but in the background fetch the data from the network to update the cache.
//
// eslint-disable-next-line
class CacheFirstAndStaleWhileRevalidateAfterExpiration {
    /**
     * Constructs the caching strategy with specified options.
     * @param {Object} options
     * @param {number} options.staleAfterDuration - Duration in seconds after which the cache is considered stale.
     * @param {string} options.cacheName - Name of the cache.
     * @param {Array<import("workbox-core").WorkboxPlugin>} options.plugins - Additional plugins for caching strategies.
     * @param {typeof import("workbox-strategies").CacheFirst} options.CacheFirst - Constructor for CacheFirst strategy.
     * @param {typeof import("workbox-strategies").NetworkFirst} options.NetworkFirst - Constructor for NetworkFirst strategy.
     * @param {typeof import("workbox-strategies").StaleWhileRevalidate} options.StaleWhileRevalidate - Constructor for StaleWhileRevalidate strategy.
     * @param {IndexedDBWrapper<{timestamp: number; cacheBustVersion: string;}>} options.timestampsDb - DB containing timestamps
     */
    constructor({
        staleAfterDuration,
        cacheName,
        plugins,
        timestampsDb,
        CacheFirst,
        NetworkFirst,
        StaleWhileRevalidate,
    }) {
        this.staleAfterDuration = staleAfterDuration;
        this.cacheName = cacheName;
        this.plugins = plugins;
        this.CacheFirst = CacheFirst;
        this.NetworkFirst = NetworkFirst;
        this.StaleWhileRevalidate = StaleWhileRevalidate;
        this.timestampsDb = timestampsDb;
    }

    /**
     * Handles the request using the appropriate caching strategy.
     * @param {Object} params
     * @param {Event} params.event - The fetch event.
     * @param {Request|string} params.request - The request to handle.
     */
    handle = async ({ event, request }) => {
        const now = Date.now();
        const url = typeof request === 'string' ? request : request.url;
        const requestCacheBustVersion =
            typeof request === 'string' ? '1' : request.headers.get('X-Cache-Bust-Version') || '1';
        const timestampAndEndpointCacheBustVersion = await this.timestampsDb.get(url);
        const timestamp = timestampAndEndpointCacheBustVersion?.timestamp;
        const cacheBustVersion = timestampAndEndpointCacheBustVersion?.cacheBustVersion || '1';
        const age = timestamp ? (now - timestamp) / 1000 : Infinity;
        const isVersionMatch = requestCacheBustVersion === cacheBustVersion;

        if (this.staleAfterDuration && age < this.staleAfterDuration && isVersionMatch) {
            // If it's not stale and the cache-bust version matches, use the cached version.

            return new this.CacheFirst({ cacheName: this.cacheName, plugins: this.plugins }).handle({
                // eslint-disable-next-line
                // @ts-ignore: it's fine to pass event here
                event,
                request,
            });
        } else if (!isVersionMatch) {
            // If the cache-bust version is a mismatch, get from the network but fall back to the cache (some data
            // better than no data)

            const response = await new this.NetworkFirst({ cacheName: this.cacheName, plugins: this.plugins }).handle({
                // eslint-disable-next-line
                // @ts-ignore: it's fine to pass event here
                event,
                request,
            });
            if (response) {
                await this.timestampsDb.set(url, {
                    timestamp: now,
                    cacheBustVersion: requestCacheBustVersion,
                });
            }
            return response;
        } else {
            // If the cache-bust version matches but it's stale, do stale while revalidate to fire off a background
            // network request but use the cached version for this specific fetch call.

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
                await this.timestampsDb.set(url, {
                    timestamp: now,
                    cacheBustVersion: requestCacheBustVersion,
                });
            }
            return response;
        }
    };
}
