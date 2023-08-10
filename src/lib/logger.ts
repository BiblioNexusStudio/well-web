import { ApplicationInsights, type IExceptionTelemetry } from '@microsoft/applicationinsights-web';
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
            connectionString: configuration.PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING,
        },
    });

    appInsights.loadAppInsights();

    additionalProperties = {
        source: 'aquifer-web',
        environment: configuration.PUBLIC_ENV,
    };
});

export const log = {
    exception: (ex: IExceptionTelemetry) => {
        appInsights.trackException(ex, additionalProperties);
    },
    pageView: (routeId: string) => {
        appInsights.trackPageView({
            name: routeId,
            properties: additionalProperties,
        });
    },
};
