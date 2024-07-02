import { apiUrl, fetchContentOrMetadataBatchFromCacheAndNetwork } from '$lib/data-cache';
import { parentResourceIdToInfoMap } from '$lib/stores/parent-resource.store';
import {
    MediaType,
    type ApiParentResource,
    type ResourceContentInfo,
    ParentResourceType,
    type ResourceContentInfoWithMetadata,
    type ResourceContentMetadata,
} from '$lib/types/resource';
import { filterBooleanByKey, groupBy } from '$lib/utils/array';
import { asyncMap } from '$lib/utils/async-array';
import {
    sortByDisplayName,
    resourceContentApiFullUrl,
    resourceMetadataApiFullUrl,
    resourceThumbnailApiFullUrl,
} from '$lib/utils/data-handlers/resources/resource';
import { objectEntries } from '$lib/utils/typesafe-standard-lib';
import { get } from 'svelte/store';

export interface LibraryResourceGrouping {
    parentResource: ApiParentResource;
    resources: ResourceContentInfoWithMetadata[];
}

export interface LibraryResourceSubgrouping {
    displayName: string;
    resources: ResourceContentInfoWithMetadata[];
}

const RESOURCE_TYPE_ORDER: ParentResourceType[] = [
    ParentResourceType.Images,
    ParentResourceType.Videos,
    ParentResourceType.Guide,
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
        const idsToVersions = new Map<number, number>();
        resources.forEach((r) => idsToVersions.set(r.id, r.version));

        const metadatasById = await fetchContentOrMetadataBatchFromCacheAndNetwork<ResourceContentMetadata>(
            apiUrl('/resources/batch/metadata'),
            resources.map((r) => r.id),
            (id) => resourceMetadataApiFullUrl({ id, version: idsToVersions.get(id)!, mediaType: MediaType.Text }),
            (response) => response,
            true,
            100
        );
        const resourcesWithMetadata = resources.map((resource) => {
            if (resource.mediaType === MediaType.Image) {
                return {
                    ...resource,
                    url: resourceContentApiFullUrl(resource),
                    displayName: metadatasById.get(resource.id)?.displayName,
                };
            } else if (resource.mediaType === MediaType.Video) {
                const metadata = metadatasById.get(resource.id);
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
                    displayName: metadatasById.get(resource.id)?.displayName,
                };
            }
        });
        return {
            parentResource: parentResourceIdMap[parentResourceId],
            resources: sortByDisplayName(resourcesWithMetadata),
        };
    });
    return filterBooleanByKey(groupings, 'parentResource').sort((a, b) => {
        return (
            RESOURCE_TYPE_ORDER.indexOf(a.parentResource.resourceType) -
            RESOURCE_TYPE_ORDER.indexOf(b.parentResource.resourceType)
        );
    });
}
