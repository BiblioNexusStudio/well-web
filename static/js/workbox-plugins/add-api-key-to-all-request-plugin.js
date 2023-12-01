// This plugin is used to add an API key to all outgoing requests.
// eslint-disable-next-line
class AddApiKeyToAllRequestPlugin {
    /**
     * The API key to be added to requests.
     * @type {string|undefined}
     */
    apikey = undefined;

    /**
     * Creates an instance of AddApiKeyToAllRequestPlugin.
     * @param {string|undefined} apikey - The API key to be added to requests.
     */
    constructor(apikey) {
        this.apikey = apikey;
    }

    /**
     * Intercepts fetch requests to add the API key.
     * @param {Object} args - The arguments object.
     * @param {Request} args.request - The original request.
     * @returns {Promise<Request>} A new request with the API key appended.
     */
    requestWillFetch = async (args) => {
        const urlObj = new URL(args.request.url);
        if (this.apikey) {
            urlObj.searchParams.append('api-key', this.apikey);
        }
        return new Request(urlObj.toString(), args.request);
    };
}
