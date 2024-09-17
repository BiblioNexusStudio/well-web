import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import config from '$lib/config';
import { browserSupported } from './utils/browser';
import { browser } from '$app/environment';
import type { WellFetchError } from './data-cache';
import { currentLanguageInfo } from './stores/language.store';
import { get } from 'svelte/store';

export const userInfo: { id?: string } = {};

export const appInsightsEnabled = browser && config.PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING;

const stringDimensionsToJsonObject = (str: string) => {
    const parts = str.split(',');

    const result: { [key: string]: string } = {};

    for (let i = 0; i < parts.length; i += 2) {
        const key = parts[i];
        const value = parts[i + 1];

        if (key !== undefined && value !== undefined) {
            result[key] = value;
        }
    }

    return result;
};

const appInsights = new ApplicationInsights({
    config: {
        connectionString: config.PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING,
    },
});

if (appInsightsEnabled) {
    appInsights.loadAppInsights();
    userInfo.id = appInsights.context?.user.id;
} else if (browser) {
    // eslint-disable-next-line
    console.warn('No app insights connection string available.');
}

export function getAdditionalProperties() {
    return {
        ...getBrowserAndScreenSize(),
        source: 'well-web',
        environment: config.PUBLIC_ENV,
        commitSha: config.PUBLIC_COMMIT_SHA,
        selectedLanguage: get(currentLanguageInfo)?.iso6393Code,
    };
}

function getBrowserAndScreenSize() {
    if (browser) {
        return {
            browserWidth: window.innerWidth,
            browserHeight: window.innerHeight,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
        };
    }
    return {};
}

export const log = {
    exception: (error: Error | undefined) => {
        // eslint-disable-next-line
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
                    ...(url ? { url, cacheBustVersion } : null),
                    ...getAdditionalProperties(),
                }
            );
        }
    },
    pageView: (routeId: string) => {
        appInsights.trackPageView({
            name: routeId,
            properties: getAdditionalProperties(),
        });
    },
    trackEvent: (eventName: string, dimensions: string | undefined) => {
        browser &&
            appInsights.trackEvent({
                name: eventName,
                properties: {
                    ...getAdditionalProperties(),
                    ...(dimensions && stringDimensionsToJsonObject(dimensions)),
                },
            });
    },
};
