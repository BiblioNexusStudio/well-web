/**
 * A plugin to handle caching media or text content in workbox caches.
 * Handles partial (206) and full (200) responses appropriately.
 */
// eslint-disable-next-line
class CacheableMediaOrTextContentPlugin {
    /**
     * Function to determine whether to cache a response.
     * @param {Object} params
     * @param {Request} params.request - The request associated with the response.
     * @param {Response} params.response - The response to potentially cache.
     */
    cacheWillUpdate = async ({ request, response }) => {
        const clonedResponse = response.clone();
        if (
            clonedResponse.status === 200 ||
            (clonedResponse.status === 206 &&
                !clonedResponse.headers.get('content-encoding') &&
                (!request.headers.has('Range') || request.headers.get('Range') === 'bytes=0-'))
        ) {
            return new Response(clonedResponse.body, { status: 200, headers: clonedResponse.headers });
        } else {
            // Don't cache opaque responses or partial range responses
            return null;
        }
    };
}
