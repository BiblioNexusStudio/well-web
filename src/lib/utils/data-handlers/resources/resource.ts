import { env } from '$env/dynamic/public';
import { fetchFromCacheOrApi, fetchFromCacheOrCdn } from '$lib/data-cache';
import type { PassageResourceContent } from '$lib/types/passage';
import { MediaType, type ResourceContentMetadata, type ResourceContentTiptap } from '$lib/types/resource';
import { audioFileTypeForBrowser } from '$lib/utils/browser';

export function resourceContentApiPath(resourceContent: PassageResourceContent) {
    if (resourceContent.mediaTypeName === MediaType.Audio) {
        return `resources/${resourceContent.contentId}/content?audioType=${audioFileTypeForBrowser()}`;
    } else {
        return `resources/${resourceContent.contentId}/content`;
    }
}

export function resourceContentApiFullUrl(resourceContent: PassageResourceContent) {
    return env.PUBLIC_AQUIFER_API_URL + resourceContentApiPath(resourceContent);
}

function resourceMetadataApiPath(resourceContent: PassageResourceContent) {
    return `resources/${resourceContent.contentId}/metadata`;
}
export function resourceMetadataApiFullPath(resourceContent: PassageResourceContent) {
    return env.PUBLIC_AQUIFER_API_URL + resourceMetadataApiPath(resourceContent);
}

export async function fetchTiptapForResourceContent(
    resourceContent: PassageResourceContent
): Promise<ResourceContentTiptap | null> {
    try {
        const tiptaps = (await fetchFromCacheOrCdn(resourceContentApiFullUrl(resourceContent))) as
            | ResourceContentTiptap[]
            | null;
        return tiptaps?.length ? tiptaps[0] : null;
    } catch (_) {
        // tiptap data not cached
        return null;
    }
}

export async function fetchMetadataForResourceContent(
    resourceContent: PassageResourceContent
): Promise<ResourceContentMetadata | null> {
    try {
        return (await fetchFromCacheOrApi(resourceMetadataApiPath(resourceContent))) as ResourceContentMetadata | null;
    } catch (_) {
        // metadata not cached
        return null;
    }
}

export async function fetchDisplayNameForResourceContent(
    resourceContent: PassageResourceContent
): Promise<string | null> {
    return (await fetchMetadataForResourceContent(resourceContent))?.displayName || null;
}
