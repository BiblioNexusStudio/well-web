// This strategy uses IndexedDB to store resource content ids and the current version that is cached by the app. Then
// when metadata or content is requested with a version that differs from the stored version, it can use NetworkFirst
// to try to get the fresh content/metadata.
//
// It expects that when content and metadata is requested, a `version` search param is on the URL. This version number
// should come from whatever initial API request returned the content id.
//
// When handling a request, it does the following:
// - Check that the URL is either a content URL or metadata URL. If not, do a normal CacheFirst.
// - Extract the resource content id and version from the URL. Use the id to lookup the current version from IndexedDB.
//   If no stored version exists, default to 1.
// - If the version on the URL was -1, then use StaleWhileRevalidate. This lets us ensure fresh data in situations
//   where we don't have access to the current version number.
// - If the version on the URL did not match the current version from IndexedDB, use NetworkFirst. Save the version
//   number in IndexedDB.
// - Otherwise use CacheFirst.
//
// Note: When the `version` search param is found on the URL it's stripped off before making actual requests. It's only
//       meant for client-side usage and would mess up the ability to fallback to cached data if the version number
//       changed and the client requests the content offline.

// eslint-disable-next-line
class ContentAndMetadataNetworkFirstWhenVersionOutdated {
    /**
     * Constructs the caching strategy with specified options.
     * @param {Object} options
     * @param {string} options.cacheName - Name of the cache.
     * @param {Array<import("workbox-core").WorkboxPlugin>} options.plugins - Additional plugins for caching strategies.
     * @param {typeof import("workbox-strategies").CacheFirst} options.CacheFirst - Constructor for CacheFirst strategy.
     * @param {typeof import("workbox-strategies").NetworkFirst} options.NetworkFirst - Constructor for NetworkFirst strategy.
     * @param {typeof import("workbox-strategies").StaleWhileRevalidate} options.StaleWhileRevalidate - Constructor for StaleWhileRevalidate strategy.
     * @param {contentIdFromMetadataUrl} options.contentIdFromMetadataUrl - Function to determine if a URL is a metadata URL
     * @param {contentIdFromContentUrl} options.contentIdFromContentUrl - Function to determine if a URL is a content URL
     * @param {splitVersionOutOfUrl} options.splitVersionOutOfUrl
     * @param {typeof NetworkOrCacheUsedPlugin} options.NetworkOrCacheUsedPlugin
     * @param {IndexedDBWrapper<{version: number;}>} options.contentIdAndVersionDb
     * @param {IndexedDBWrapper<{version: number;}>} options.metadataIdAndVersionDb
     */
    constructor({
        cacheName,
        plugins,
        CacheFirst,
        NetworkFirst,
        StaleWhileRevalidate,
        NetworkOrCacheUsedPlugin,
        contentIdFromMetadataUrl,
        contentIdFromContentUrl,
        contentIdAndVersionDb,
        metadataIdAndVersionDb,
        splitVersionOutOfUrl,
    }) {
        this.cacheName = cacheName;
        this.plugins = plugins;
        this.contentIdFromMetadataUrl = contentIdFromMetadataUrl;
        this.contentIdFromContentUrl = contentIdFromContentUrl;
        this.splitVersionOutOfUrl = splitVersionOutOfUrl;
        this.contentIdAndVersionDb = contentIdAndVersionDb;
        this.metadataIdAndVersionDb = metadataIdAndVersionDb;
        this.NetworkOrCacheUsedPlugin = NetworkOrCacheUsedPlugin;
        this.CacheFirst = CacheFirst;
        this.NetworkFirst = NetworkFirst;
        this.StaleWhileRevalidate = StaleWhileRevalidate;
    }

    /**
     * @param {number} id
     * @param {'metadata' | 'content'} type - Determines which store to use
     * @param {boolean} isCached - Used to determine if we should default to version 1 or undefined
     * @returns {Promise<number | undefined>}
     */
    async _getVersionFromId(id, type, isCached) {
        if (type === 'metadata') {
            return (await this.metadataIdAndVersionDb.get(id))?.version ?? (isCached ? 1 : undefined);
        } else {
            return (await this.contentIdAndVersionDb.get(id))?.version ?? (isCached ? 1 : undefined);
        }
    }

    /**
     * @param {number} id
     * @param {number} version
     * @param {'metadata' | 'content'} type - Determines which store to use
     * @returns {Promise<void>}
     */
    async _setVersionForId(id, version, type) {
        if (type === 'metadata') {
            return await this.metadataIdAndVersionDb.set(id, { version });
        } else {
            return await this.contentIdAndVersionDb.set(id, { version });
        }
    }

    /**
     * Handles the request using the appropriate caching strategy.
     * @param {Object} params
     * @param {Event} params.event - The fetch event.
     * @param {Request|string} params.request - The request to handle.
     */
    handle = async ({ event, request }) => {
        const cache = await caches.open(this.cacheName);
        const url = typeof request === 'string' ? request : request.url;
        const metadataContentId = this.contentIdFromMetadataUrl(url);
        const contentContentId = this.contentIdFromContentUrl(url);

        if (metadataContentId || contentContentId) {
            const { updatedUrl, version: requestedVersion } = this.splitVersionOutOfUrl(url);
            const requestWithoutVersionSearchParam = new Request(updatedUrl, {
                ...(typeof request === 'string' ? null : request),
            });

            // By using `version=-1`, we can indicate that certain requests don't have acccess to the current version
            // and therefore we should use StaleWhileRevalidate to immediately use the cached version but pull from the
            // network in the background.
            if (requestedVersion === -1) {
                return new this.StaleWhileRevalidate({
                    cacheName: this.cacheName,
                    plugins: this.plugins,
                }).handle({
                    // eslint-disable-next-line
                    // @ts-ignore: its fine to pass event here
                    event,
                    request: requestWithoutVersionSearchParam,
                });
            }

            const inCache = !!(await cache.match(requestWithoutVersionSearchParam));
            const type = metadataContentId ? 'metadata' : 'content';
            const id = metadataContentId ?? contentContentId ?? 0;
            const currentVersion = await this._getVersionFromId(id, type, !!inCache);

            let usedNetwork = false;

            if (currentVersion !== requestedVersion) {
                const networkFirstResponse = await new this.NetworkFirst({
                    cacheName: this.cacheName,
                    plugins: [
                        ...this.plugins,
                        new this.NetworkOrCacheUsedPlugin((used) => {
                            usedNetwork = used;
                        }),
                    ],
                }).handle({
                    // eslint-disable-next-line
                    // @ts-ignore: it's fine to pass event here
                    event,
                    request: requestWithoutVersionSearchParam,
                });

                if (usedNetwork) {
                    await this._setVersionForId(id, requestedVersion, type);
                }

                return networkFirstResponse;
            } else {
                return new this.CacheFirst({ cacheName: this.cacheName, plugins: this.plugins }).handle({
                    // eslint-disable-next-line
                    // @ts-ignore: it's fine to pass event here
                    event,
                    request: requestWithoutVersionSearchParam,
                });
            }
        }

        return new this.CacheFirst({ cacheName: this.cacheName, plugins: this.plugins }).handle({
            // eslint-disable-next-line
            // @ts-ignore: it's fine to pass event here
            event,
            request,
        });
    };
}
