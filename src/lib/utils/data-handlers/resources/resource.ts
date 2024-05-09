import { env } from '$env/dynamic/public';
import { fetchFromCacheOrCdn } from '$lib/data-cache';
import { log } from '$lib/logger';
import type { FileManagerResourceContentInfo } from '$lib/types/file-manager';
import {
    MediaType,
    type ResourceContentInfo,
    type ResourceContentMetadata,
    type ResourceContentTiptap,
} from '$lib/types/resource';
import { audioFileTypeForBrowser } from '$lib/utils/browser';

export function resourceContentApiPath(resourceContent: ResourceContentInfo | FileManagerResourceContentInfo) {
    const mediaType = 'mediaType' in resourceContent ? resourceContent.mediaType : resourceContent.mediaTypeName;
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    if (mediaType === MediaType.Audio) {
        return `resources/${id}/content?audioType=${audioFileTypeForBrowser()}`;
    } else {
        return `resources/${id}/content`;
    }
}

export function resourceContentApiFullUrl(resourceContent: ResourceContentInfo | FileManagerResourceContentInfo) {
    return env.PUBLIC_AQUIFER_API_URL + resourceContentApiPath(resourceContent);
}

export function resourceThumbnailApiFullUrl(resourceContent: ResourceContentInfo | FileManagerResourceContentInfo) {
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    return env.PUBLIC_AQUIFER_API_URL + `resources/${id}/thumbnail`;
}

export function resourceMetadataApiFullPath(resourceContent: ResourceContentInfo | FileManagerResourceContentInfo) {
    const id = 'id' in resourceContent ? resourceContent.id : resourceContent.contentId;
    return env.PUBLIC_AQUIFER_API_URL + `resources/${id}/metadata`;
}

export async function fetchTiptapForResourceContent(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo
): Promise<ResourceContentTiptap | null> {
    try {
        const tiptaps = (await fetchFromCacheOrCdn(resourceContentApiFullUrl(resourceContent))) as
            | ResourceContentTiptap[]
            | null;
        return tiptaps?.[0] ?? null;
    } catch (error) {
        // tiptap data not cached
        log.exception(error as Error);
        return null;
    }
}

export async function fetchMetadataForResourceContent(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo
): Promise<ResourceContentMetadata | null> {
    try {
        return (await fetchFromCacheOrCdn(
            resourceMetadataApiFullPath(resourceContent)
        )) as ResourceContentMetadata | null;
    } catch (error) {
        // metadata not cached
        log.exception(error as Error);
        return null;
    }
}

export async function fetchDisplayNameForResourceContent(
    resourceContent: ResourceContentInfo | FileManagerResourceContentInfo
): Promise<string | null> {
    return (await fetchMetadataForResourceContent(resourceContent))?.displayName || null;
}

export function resourceDisplayNameSorter(a: { displayName: string | null }, b: { displayName: string | null }) {
    const passageRegex = /.*(\d+)(?:\.|:)(\d+)-?(\d+)?.*/;
    const aMatch = a.displayName?.match(passageRegex);
    const bMatch = b.displayName?.match(passageRegex);
    if (aMatch && bMatch) {
        const aId = parseInt(aMatch[1]!) * 1000000 + parseInt(aMatch[2]!) * 1000 + parseInt(aMatch[3] ?? '0');
        const bId = parseInt(bMatch[1]!) * 1000000 + parseInt(bMatch[2]!) * 1000 + parseInt(bMatch[3] ?? '0');
        return aId - bId;
    } else if (a.displayName && b.displayName) {
        return a.displayName.localeCompare(b.displayName);
    } else {
        return 0;
    }
}
