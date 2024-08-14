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
    userId = undefined;

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

        if (this.userId) {
            modifiedHeaders.append('bn-user-id', this.userId);
        }

        return new Request(urlObj.toString(), {
            method: request.method,
            headers: modifiedHeaders,
            // note: if we ever want to send non-text blobs we'll need to update this
            body: request.body ? await request.clone().text() : null,
            mode: request.mode,
            credentials: request.credentials,
            cache: request.cache,
            redirect: request.redirect,
            referrer: request.referrer,
            integrity: request.integrity,
            keepalive: request.keepalive,
            signal: request.signal,
        });
    };
}
