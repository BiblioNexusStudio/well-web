import {
    MediaType,
    type ApiPassage,
    type ApiPassageResource,
    type ResourceContentSteps,
    type ResourceContentUrl,
    type UrlWithMetadata,
} from '$lib/types/file-manager';
import { audioFileTypeForBrowser } from '../../browser';

export function cbbterUrlsWithMetadataForPassage(passage: ApiPassage) {
    return [
        ...passage.resources,
        ...passage.resources.flatMap(({ supportingResources }) => supportingResources ?? []),
    ].flatMap((resource) =>
        extractUrlWithMetadataFromCbbterText(resource)
            .concat(extractUrlsWithMetadataFromCbbterAudio(resource))
            .concat(extractUrlWithMetadataFromImages(resource))
    );
}

function extractUrlWithMetadataFromCbbterText(resource: ApiPassageResource): UrlWithMetadata[] {
    if (resource.content && resource.type === 1 && resource.mediaType === 1) {
        const textContent = resource.content.content as ResourceContentUrl;
        return [
            {
                mediaType: MediaType.text,
                url: textContent.url,
                size: resource.content.contentSize,
            },
        ];
    } else {
        return [];
    }
}

function extractUrlsWithMetadataFromCbbterAudio(resource: ApiPassageResource): UrlWithMetadata[] {
    if (resource.content && resource.type === 1 && resource.mediaType === 2) {
        const audioContent = resource.content.content as ResourceContentSteps;
        return audioContent.steps.map((step) => ({
            mediaType: MediaType.audio,
            url: step[audioFileTypeForBrowser()].url,
            size: step[audioFileTypeForBrowser()].size,
        }));
    } else {
        return [];
    }
}

function extractUrlWithMetadataFromImages(resource: ApiPassageResource): UrlWithMetadata[] {
    if (resource.content && resource.mediaType === 4) {
        const imagesContent = resource.content.content as ResourceContentUrl;
        return [
            {
                mediaType: MediaType.images,
                url: imagesContent.url,
                size: resource.content.contentSize,
            },
        ];
    } else {
        return [];
    }
}
