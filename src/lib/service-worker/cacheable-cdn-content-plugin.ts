import type { WorkboxPlugin } from 'workbox-core/types.js';

// Caches a response if it's a 200 OR it's a 206 and either the requested Range is not set or it's set to 0- which means all content
class CacheableCdnContentPlugin implements WorkboxPlugin {
    cacheWillUpdate: WorkboxPlugin['cacheWillUpdate'] = async ({ request, response }) => {
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

export { CacheableCdnContentPlugin };
