import type { WorkboxPlugin, RequestWillFetchCallbackParam } from 'workbox-core/types.js';

class AddApiKeyToAllRequestPlugin implements WorkboxPlugin {
    apikey: string;

    constructor(apikey: string) {
        this.apikey = apikey;
    }

    requestWillFetch: WorkboxPlugin['requestWillFetch'] = async (args: RequestWillFetchCallbackParam) => {
        const headers = new Headers(args.request.headers);
        headers.set('api-key', this.apikey);
        const newRequest = new Request(args.request, { headers });

        return newRequest;
    };
}

export { AddApiKeyToAllRequestPlugin };
