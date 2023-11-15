import type { WorkboxPlugin, RequestWillFetchCallbackParam } from 'workbox-core/types.js';

class AddApiKeyToAllRequestPlugin implements WorkboxPlugin {
    apikey: string;

    constructor(apikey: string) {
        this.apikey = apikey;
    }

    requestWillFetch: WorkboxPlugin['requestWillFetch'] = async (args: RequestWillFetchCallbackParam) => {
        const urlObj = new URL(args.request.url);
        urlObj.searchParams.append('api-key', this.apikey);
        return new Request(urlObj.toString(), args.request);
    };
}

export { AddApiKeyToAllRequestPlugin };
