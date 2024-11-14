/**
 * A Workbox plugin that tracks whether a network request or cache was used to fulfill a request.
 * Provides callback functionality that other plugins can hook into to know how a requst was fulfilled.
 */
// eslint-disable-next-line
class NetworkOrCacheUsedPlugin {
    /**
     * @param {(usedNetwork: boolean) => void} callback - Callback function to be invoked with the network usage information.
     */
    constructor(callback) {
        this.callback = callback;
    }

    /**
     * Lifecycle method called before making a network request.
     * Sets the `usedNetwork` flag to false.
     * @param {Object} options
     * @param {Request} options.request
     * @param {ExtendableEvent} options.event
     */
    requestWillFetch = async ({ request }) => {
        this.usedNetwork = false;
        return request;
    };

    /**
     * Lifecycle method called when a cached response is about to be used.
     * Sets the `usedNetwork` flag to false.
     * @param {Object} options
     * @param {Response} [options.cachedResponse]
     * @param {Request} options.request
     * @param {ExtendableEvent} options.event
     */
    cachedResponseWillBeUsed = async (options) => {
        this.usedNetwork = false;
        return options.cachedResponse;
    };

    /**
     * Lifecycle method called when a network request succeeds.
     * Sets the `usedNetwork` flag to true.
     * @param {Object} options
     * @param {Response} options.response
     * @param {Request} options.request
     * @param {ExtendableEvent} options.event
     */
    fetchDidSucceed = async ({ response }) => {
        this.usedNetwork = true;
        return response;
    };

    /**
     * Lifecycle method called before the handler responds.
     * Invokes the callback function with the `usedNetwork` flag and returns the response.
     * @param {Object} options
     * @param {Response} options.response - The response that will be returned.
     * @param {Request} options.request
     * @param {ExtendableEvent} options.event
     */
    handlerWillRespond = async ({ response }) => {
        this.callback(this.usedNetwork || false);
        return response;
    };
}
