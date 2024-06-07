import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import config from '$lib/config';
import { browserSupported } from './utils/browser';
import { browser } from '$app/environment';
import type { WellFetchError } from './data-cache';

const appInsights = new ApplicationInsights({
    config: {
        connectionString: config.PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING,
    },
});

if (config.PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING) {
    appInsights.loadAppInsights();
} else {
    console.warn('No app insights connection string available.');
}

const additionalProperties = {
    source: 'well-web',
    environment: config.PUBLIC_ENV,
};

export const log = {
    exception: (error: Error | undefined) => {
        console.error(error);
        if (
            error &&
            (error.message.includes('Failed to fetch') ||
                error.message.includes('Load failed') ||
                error.message.includes('NetworkError when attempting to fetch'))
        ) {
            // Don't log network errors to app insights (since they can't be avoided)
        } else if (!browserSupported) {
            // Don't log errors of unsupported browsers to app insights (since they can't be avoided)
        } else if (error) {
            const { url, cacheBustVersion } =
                'url' in error ? (error as WellFetchError) : { url: null, cacheBustVersion: null };
            appInsights.trackException(
                { exception: error },
                {
                    ...additionalProperties,
                    ...(url ? { url, cacheBustVersion } : null),
                    commitSha: config.PUBLIC_COMMIT_SHA,
                }
            );
        }
    },
    pageView: (routeId: string) => {
        appInsights.trackPageView({
            name: routeId,
            properties: additionalProperties,
        });
    },
    trackEvent: (eventName: string) => {
        browser &&
            appInsights.trackEvent({
                name: eventName,
                properties: {
                    ...additionalProperties,
                },
            });
    },
};
