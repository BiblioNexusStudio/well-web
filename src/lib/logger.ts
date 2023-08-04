import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { config } from '$lib/stores/config.store';
import { get } from 'svelte/store';

const logSource: string = 'aquifer-web';
const appInsights = new ApplicationInsights({
    config: {
        connectionString: get(config).APPLICATION_INSIGHTS.CONNECTION_STRING,
    },
});

appInsights.loadAppInsights();

export const log = {
    exception: (ex: any) => {
        appInsights.trackException(ex, {
            source: logSource,
        });
    },
    pageView: (routeId: string) => {
        appInsights.trackPageView({
            name: routeId,
            properties: {
                source: logSource,
            },
        });
    },
};
