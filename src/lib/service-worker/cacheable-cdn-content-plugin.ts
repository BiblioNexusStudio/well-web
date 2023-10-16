import type { WorkboxPlugin } from 'workbox-core/types.js';

// Caches a response if it's a 200 OR it's a 206 (or opaque code 0) and either the requested Range is not set or it's set to 0- which means all content
class CacheableCdnContentPlugin implements WorkboxPlugin {
    cacheWillUpdate: WorkboxPlugin['cacheWillUpdate'] = async ({ request, response }) => {
        if (response.status === 200) {
            return response;
        } else if (
            response.status === 0 &&
            (!request.headers.has('Range') || request.headers.get('Range') === 'bytes=0-')
        ) {
            return response;
        } else if (
            response.status === 206 &&
            !response.headers.get('content-encoding') &&
            (!request.headers.has('Range') || request.headers.get('Range') === 'bytes=0-')
        ) {
            return new Response(response.body, { status: 200, headers: response.headers });
        } else {
            return null;
        }
    };
}

export { CacheableCdnContentPlugin };
