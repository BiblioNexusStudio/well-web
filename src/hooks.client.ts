import type { HandleClientError } from '@sveltejs/kit';
import { log } from '$lib/logger';

export const handleError = (async ({ error }) => {
    log.exception(error);

    throw error;
}) satisfies HandleClientError;
