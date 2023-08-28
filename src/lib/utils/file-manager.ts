import { downloadData } from '$lib/stores/file-manager.store';
import { isCachedFromCdn } from '$lib/data-cache';
import { asyncEvery, asyncForEach } from './async-array';
import { audioFileTypeForBrowser } from './browser';
import type {
    ApiPassage,
    FrontendBibleVersionBookContent,
    ResourceContentUrl,
    ResourceContentSteps,
    ResourcesByMediaType,
    ApiBibleVersion,
} from '$lib/types/file-manager';
import type { FrontendPassage } from '$lib/types/file-manager';
import { objectEntries, objectValues } from './typesafe-standard-lib';

export const convertToReadableSize = (size: number) => {
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;

    if (isNaN(size)) {
        return 'Invalid input';
    }

    if (size < kb) {
        return `${size.toFixed(2)} B`;
    } else if (size < mb) {
        return `${(size / kb).toFixed(2)} KB`;
    } else if (size < gb) {
        return `${(size / mb).toFixed(2)} MB`;
    } else {
        return `${(size / gb).toFixed(2)} GB`;
    }
};

export const addFrontEndDataToBibleData = async (inputBibleData: ApiBibleVersion[]) => {
    await asyncForEach(inputBibleData, async (bibleVersion) => {
        await asyncForEach(bibleVersion.contents, async (content) => {
            const outputContent = content as unknown as FrontendBibleVersionBookContent;
            outputContent.expanded = false;
            outputContent.textSelected = await isCachedFromCdn(content.textUrl);

            await asyncForEach(outputContent.audioUrls.chapters, async (chapter) => {
                chapter.selected = await isCachedFromCdn(chapter[audioFileTypeForBrowser()].url);
            });

            outputContent.selected =
                outputContent.textSelected && outputContent.audioUrls.chapters.every((chapter) => chapter.selected);
        });
    });
    return inputBibleData;
};

export const addFrontEndDataToPassageData = async (inputPassageData: ApiPassage[]) => {
    const outputPassageData = inputPassageData as unknown as FrontendPassage[];
    await asyncForEach(outputPassageData, async (passage) => {
        const inputPassage = passage as unknown as ApiPassage;
        passage.expanded = false;

        passage.primaryResourceName = inputPassage.resources.find(
            ({ content }) => content?.displayName
        )?.content?.displayName;
        passage.resources = [
            ...inputPassage.resources,
            ...inputPassage.resources.flatMap(({ supportingResources }) => supportingResources ?? []),
        ].reduce(
            (output, resource) => {
                if (!!resource.content && resource.type === 1) {
                    if (resource.mediaType === 1) {
                        const textContent = resource.content.content as ResourceContentUrl;
                        output.text.urlsAndSizes.push({
                            url: textContent.url,
                            size: resource.content.contentSize,
                        });
                    } else if (resource.mediaType === 2) {
                        const audioContent = resource.content.content as ResourceContentSteps;
                        output.audio.urlsAndSizes.push(
                            ...audioContent.steps.map((step) => ({
                                url: step[audioFileTypeForBrowser()].url,
                                size: step[audioFileTypeForBrowser()].size,
                            }))
                        );
                    }
                } else if (!!resource.content && resource.mediaType === 3) {
                    const imagesContent = resource.content.content as ResourceContentUrl;
                    output.images.urlsAndSizes.push({
                        url: imagesContent.url,
                        size: resource.content.contentSize,
                    });
                }
                return output;
            },
            {
                text: { urlsAndSizes: [], selected: false },
                audio: { urlsAndSizes: [], selected: false },
                images: { urlsAndSizes: [], selected: false },
            } as ResourcesByMediaType
        );

        await asyncForEach(objectEntries(passage.resources), async ([_, resourceInfo]) => {
            resourceInfo.selected = await asyncEvery(
                resourceInfo.urlsAndSizes,
                async ({ url }) => await isCachedFromCdn(url)
            );
        });

        passage.selected = objectValues(passage.resources).every(({ selected }) => selected);
    });
    return outputPassageData;
};

export const resetDownloadData = () => {
    downloadData.update((downloadData) => {
        downloadData.urlsToDelete = [];
        downloadData.urlsToDownload = [];
        downloadData.totalSizeToDelete = 0;
        downloadData.totalSizeToDownload = 0;

        return downloadData;
    });
};

export const addUrlToDownloads = (url: string, size: number) => {
    downloadData.update((downloadData) => {
        const index = downloadData.urlsToDelete.indexOf(url);
        if (index > -1) {
            downloadData.urlsToDelete.splice(index, 1);
            downloadData.totalSizeToDelete = downloadData.totalSizeToDelete - size;
        }

        const index2 = downloadData.urlsToDownload.findIndex((urlWithSize) => urlWithSize.url === url);
        if (index2 === -1) {
            downloadData.urlsToDownload.push({ url, size });
            downloadData.totalSizeToDownload = downloadData.totalSizeToDownload + size;
        }

        return downloadData;
    });
};

export const addUrlToDelete = (url: string, size: number) => {
    downloadData.update((downloadData) => {
        const index = downloadData.urlsToDownload.findIndex((urlWithSize) => urlWithSize.url === url);
        if (index > -1) {
            downloadData.urlsToDownload.splice(index, 1);
            downloadData.totalSizeToDownload = downloadData.totalSizeToDownload - size;
        }

        const index2 = downloadData.urlsToDelete.indexOf(url);
        if (index2 === -1) {
            downloadData.urlsToDelete.push(url);
            downloadData.totalSizeToDelete = downloadData.totalSizeToDelete + size;
        }

        return downloadData;
    });
};
