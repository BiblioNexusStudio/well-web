// This plugin is used to add an API key to all outgoing requests.
// eslint-disable-next-line
class AddApiKeyToAllRequestPlugin {
    /**
     * The API key to be added to requests.
     * @type {string|undefined}
     */
    apikey;

    /**
     * The user id from App Insights context.
     * @type {string|undefined}
     */
    appInsightsUserId = undefined;

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
     */
    requestWillFetch = async (args) => {
        const { request } = args;
        const urlObj = new URL(request.url);
        if (this.apikey) {
            urlObj.searchParams.append('api-key', this.apikey);
        }

        const modifiedHeaders = new Headers(request.headers);
        modifiedHeaders.delete('X-Cache-Bust-Version');
        modifiedHeaders.append('bn-source', 'bible-well');

        if (this.appInsightsUserId) {
            modifiedHeaders.append('bn-user-id', this.appInsightsUserId);
        }

        return new Request(urlObj.toString(), {
            ...request,
            headers: modifiedHeaders,
        });
    };
}
