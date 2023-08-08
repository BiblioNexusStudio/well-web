import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config } from '$lib/stores/config.store';
import type { Configuration } from '$lib/stores/config.store';

let configuration: Configuration;
let appInsights: ApplicationInsights;
let additionalProperties = {};

config.subscribe((value) => {
    if (!value) return;

    configuration = value;

    appInsights = new ApplicationInsights({
        config: {
            connectionString: configuration.APPLICATION_INSIGHTS.CONNECTION_STRING,
        },
    });

    appInsights.loadAppInsights();

    additionalProperties = {
        source: 'aquifer-web',
        environment: configuration.ENV,
    };
});

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
