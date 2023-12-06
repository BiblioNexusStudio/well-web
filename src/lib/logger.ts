import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import config from '$lib/config';
import { browserSupported } from './utils/browser';

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
        if (error && error.name === 'TypeError' && error.message === 'Failed to fetch') {
            // Don't log network errors to app insights (since they can't be avoided)
            console.error(error);
        } else if (!browserSupported) {
            // Don't log errors of unsupported browsers to app insights (since they can't be avoided)
            console.error(error);
        } else if (error) {
            appInsights.trackException({ exception: error }, additionalProperties);
        }
    },
    pageView: (routeId: string) => {
        appInsights.trackPageView({
            name: routeId,
            properties: additionalProperties,
        });
    },
};
