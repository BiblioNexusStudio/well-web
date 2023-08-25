import { downloadData } from '$lib/stores/file-manager.store';
import { isCachedFromCdn } from '$lib/data-cache';
import { asyncEvery, asyncForEach, reduceAsync } from './async-array';
import { audioFileTypeForBrowser } from './browser';
import type { BibleVersion, Passages } from '$lib/types/file-manager';

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

export const addFrontEndDataToBibleData = async (inputBibleData: BibleVersion[]) => {
    await asyncForEach(inputBibleData, async (bibleVersion) => {
        await asyncForEach(bibleVersion.contents, async (content) => {
            content.expanded = false;
            content.textSelected = await isCachedFromCdn(content.textUrl);

            await asyncForEach(content.audioUrls.chapters, async (chapter) => {
                chapter.selected = await isCachedFromCdn(chapter[audioFileTypeForBrowser()].url);
            });

            content.selected = content.textSelected && content.audioUrls.chapters.every((chapter) => chapter.selected);
        });
    });
    return inputBibleData;
};

export const addFrontEndDataToPassageData = async (inputPassageData: Passages[]) => {
    await asyncForEach(inputPassageData, async (passage) => {
        passage.expanded = false;

        passage.resources = [
            ...passage.resources,
            ...passage.resources.flatMap(({ supportingResources }) => supportingResources ?? []),
        ].reduce(
            (output, resource) => {
                if (!!resource.content && resource.type === 1) {
                    if (resource.mediaType === 1) {
                        output.text.urlsAndSizes.push({
                            url: resource.content.content.url,
                            size: resource.content.contentSize,
                        });
                    } else if (resource.mediaType === 2) {
                        output.audio.urlsAndSizes.push(
                            ...resource.content.content.steps.map((step) => ({
                                url: step[audioFileTypeForBrowser()].url,
                                size: step[audioFileTypeForBrowser()].size,
                            }))
                        );
                    }
                } else if (!!resource.content && resource.mediaType === 3) {
                    output.images.urlsAndSizes.push({
                        url: resource.content.content.url,
                        size: resource.content.content.size,
                    });
                }
                return output;
            },
            {
                text: { urlsAndSizes: [], selected: false },
                audio: { urlsAndSizes: [], selected: false },
                images: { urlsAndSizes: [], selected: false },
            }
        );

        await asyncForEach(Object.entries(passage.resources), async ([_, resourceInfo]) => {
            resourceInfo.selected = await asyncEvery(
                resourceInfo.urlsAndSizes,
                async ({ url }) => await isCachedFromCdn(url)
            );
        });

        passage.selected = Object.values(passage.resources).every(({ selected }) => selected);
    });
    return inputPassageData;
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
