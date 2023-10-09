import type { WorkboxPlugin } from 'workbox-core/types.js';

// Caches a response if it's a 200 OR it's a 206 (or opaque code 0) and has the Range set to 0- which means all content
class CacheableCdnContentPlugin implements WorkboxPlugin {
    cacheWillUpdate: WorkboxPlugin['cacheWillUpdate'] = async ({ request, response }) => {
        if (response.status === 200) {
            return response;
        } else if ((response.status === 206 || response.status === 0) && request.headers.get('Range') === 'bytes=0-') {
            return response;
        } else {
            return null;
        }
    };
}

export { CacheableCdnContentPlugin };
