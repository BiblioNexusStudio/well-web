import { parentResourceIdToInfoMap } from '$lib/stores/parent-resource.store';
import {
    MediaType,
    type ApiParentResource,
    type ResourceContentInfo,
    ParentResourceType,
    type ResourceContentInfoWithMetadata,
} from '$lib/types/resource';
import { groupBy, sortByKey } from '$lib/utils/array';
import { asyncMap } from '$lib/utils/async-array';
import {
    fetchDisplayNameForResourceContent,
    fetchMetadataForResourceContent,
    fetchTiptapForResourceContent,
    resourceContentApiFullUrl,
    resourceThumbnailApiFullUrl,
} from '$lib/utils/data-handlers/resources/resource';
import { parseTiptapJsonToHtml } from '$lib/utils/tiptap-parsers';
import { objectEntries } from '$lib/utils/typesafe-standard-lib';
import { get } from 'svelte/store';

export interface LibraryResourceGrouping {
    parentResource: ApiParentResource;
    resources: ResourceContentInfoWithMetadata[];
}

const RESOURCE_TYPE_ORDER: ParentResourceType[] = [
    ParentResourceType.Images,
    ParentResourceType.Videos,
    ParentResourceType.StudyNotes,
    ParentResourceType.Dictionary,
];

export async function buildLibraryResourceGroupingsWithMetadata(allResources: ResourceContentInfo[]) {
    const parentResourceIdMap = get(parentResourceIdToInfoMap);
    const groupingMap = groupBy(
        allResources,
        (r) => r.parentResourceId,
        (v) => v
    );
    const groupings = await asyncMap(objectEntries(groupingMap), async ([parentResourceId, resources]) => {
        const resourcesWithMetadata = await asyncMap(resources, async (resource) => {
            if (resource.mediaType === MediaType.Image) {
                return {
                    ...resource,
                    url: resourceContentApiFullUrl(resource),
                    displayName: await fetchDisplayNameForResourceContent(resource),
                };
            } else if (resource.mediaType === MediaType.Video) {
                const metadata = await fetchMetadataForResourceContent(resource);
                return {
                    ...resource,
                    url: resourceContentApiFullUrl(resource),
                    thumbnailUrl: resourceThumbnailApiFullUrl(resource),
                    displayName: metadata?.displayName,
                    duration: metadata?.metadata?.['duration'] as number | undefined,
                };
            } else {
                return {
                    ...resource,
                    displayName: await fetchDisplayNameForResourceContent(resource),
                };
            }
        });
        return {
            parentResource: parentResourceIdMap[parentResourceId]!,
            resources: sortByKey(resourcesWithMetadata, 'displayName'),
            loadedResourceContent: {},
        };
    });
    groupings.sort((a, b) => {
        return (
            RESOURCE_TYPE_ORDER.indexOf(a.parentResource.resourceType) -
            RESOURCE_TYPE_ORDER.indexOf(b.parentResource.resourceType)
        );
    });
    return groupings;
}

export async function loadTextContent(resource: ResourceContentInfoWithMetadata) {
    const tiptap = await fetchTiptapForResourceContent(resource);
    if (tiptap) {
        return parseTiptapJsonToHtml(tiptap.tiptap);
    }
    return null;
}
