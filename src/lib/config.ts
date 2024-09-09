import { env } from '$env/dynamic/public';

export default env as unknown as Configuration;

interface Configuration {
    PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING: string;
    PUBLIC_ENV: string;
    PUBLIC_COMMIT_SHA: string;
    PUBLIC_IS_ONLINE_CHECK_URL: string;
    PUBLIC_AQUIFER_API_URL: string;
    PUBLIC_AQUIFER_API_KEY: string;
}
