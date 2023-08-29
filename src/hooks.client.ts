import type { HandleClientError } from '@sveltejs/kit';
import { log } from '$lib/logger';

export const handleError = (async ({ error }: { error: Error }) => {
    log.exception({ exception: error });

    throw error;
    // eslint-disable-next-line
    // @ts-ignore
}) satisfies HandleClientError;
