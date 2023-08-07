import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config } from '$lib/stores/config.store';
import { get } from 'svelte/store';

const configuration = get(config);
const appInsights = new ApplicationInsights({
    config: {
        connectionString: configuration.APPLICATION_INSIGHTS.CONNECTION_STRING,
    },
});

appInsights.loadAppInsights();

const additionalProperties = {
    source: 'aquifer-web',
    environment: configuration.ENV,
};

export const log = {
    exception: (ex: any) => {
        appInsights.trackException(ex, additionalProperties);
    },
    pageView: (routeId: string) => {
        appInsights.trackPageView({
            name: routeId,
            properties: additionalProperties,
        });
    },
};
