import { env } from '$env/dynamic/public';
import { fetchFromCacheOrApi } from '$lib/data-cache';
import type { PassageResourceContent } from '$lib/types/passage';
import type { ResourceContentMetadata } from '$lib/types/resource';

export function resourceContentApiPath(resourceContent: PassageResourceContent) {
    return `resources/${resourceContent.contentId}/content`;
}

export function resourceMetadataApiPath(resourceContent: PassageResourceContent) {
    return `resources/${resourceContent.contentId}/metadata`;
}

export async function fetchDisplayNameForResourceContent(
    resourceContent: PassageResourceContent
): Promise<string | null> {
    try {
        return (
            ((await fetchFromCacheOrApi(resourceMetadataApiPath(resourceContent))) as ResourceContentMetadata | null)
                ?.displayName || null
        );
    } catch (_) {
        // metadata not cached
        return null;
    }
}

export function resourceContentApiFullUrl(resourceContent: PassageResourceContent) {
    return env.PUBLIC_AQUIFER_API_URL + resourceContentApiPath(resourceContent);
}
