// Caches a response if it's a 200 OR it's a 206 and either the requested Range is not set or it's set to 0- which means all content
// eslint-disable-next-line
class CacheableMediaOrTextContentPlugin {
    /**
     * Function to determine whether to cache a response.
     * @param {Object} params
     * @param {Request} params.request - The request associated with the response.
     * @param {Response} params.response - The response to potentially cache.
     * @returns {Promise<Response|null>} A response to cache or null if not caching.
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
