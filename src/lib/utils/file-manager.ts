import { bibleData, originalBibleData, originalPassageData, passageData } from '$lib/stores/file-manager.store';
import { isCachedFromCdn } from '$lib/data-cache';
import { asyncEvery, asyncForEach } from './async-array';
import { audioFileTypeForBrowser } from './browser';
import type {
    ApiPassage,
    FrontendBibleVersionBookContent,
    ApiBibleVersion,
    UrlWithMetadata,
    BiblesModuleBook,
    FrontendAudioChapter,
    ResourcesMenuItem,
    FooterInputs,
    ResourcesApiModule,
} from '$lib/types/file-manager';
import { get } from 'svelte/store';
import type { FrontendPassage } from '$lib/types/file-manager';
import { objectEntries, objectValues } from './typesafe-standard-lib';
import { cbbterUrlsWithMetadataForPassage } from './data-handlers/resources/cbbt-er';
import { groupBy } from './array';
import { resourceContentApiFullUrl, resourceMetadataApiFullPath } from '$lib/utils/data-handlers/resources/resource';

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

export const resetOriginalData = () => {
    originalPassageData.set(JSON.parse(JSON.stringify(get(passageData))));
    originalBibleData.set(JSON.parse(JSON.stringify(get(bibleData))));
};

export const calculateUrlsWithMetadataToChange = (
    biblesModuleBook: BiblesModuleBook,
    footerInputs: FooterInputs,
    resourcesMenu: ResourcesMenuItem[]
) => {
    const urlsAndSizesToDownload = [] as UrlWithMetadata[];
    const bibleSelected = resourcesMenu.some(({ selected, isBible }) => selected && isBible);

    if (
        biblesModuleBook.audioUrls.chapters.some((chapter) => chapter.selected) &&
        bibleSelected &&
        footerInputs.text &&
        !biblesModuleBook.isTextUrlCached
    ) {
        urlsAndSizesToDownload.push({
            mediaType: 'text',
            url: biblesModuleBook.textUrl,
            size: biblesModuleBook.textSize,
        });
    }

    biblesModuleBook.audioUrls.chapters.forEach((chapter) => {
        if (chapter.selected && !chapter.isAudioUrlCached) {
            if (bibleSelected && footerInputs.audio) {
                urlsAndSizesToDownload.push({
                    mediaType: 'audio',
                    url: chapter[audioFileTypeForBrowser()].url,
                    size: chapter[audioFileTypeForBrowser()].size,
                });
            }

            chapter.resourceMenuItems?.forEach((resourceMenuItem) => {
                if (footerInputs.text) {
                    if (resourceMenuItem.mediaTypeName.toLowerCase() === 'text') {
                        if (
                            resourcesMenu.some(({ selected, value }) => selected && value === resourceMenuItem.typeName)
                        ) {
                            urlsAndSizesToDownload.push({
                                mediaType: 'text',
                                url: resourceContentApiFullUrl(resourceMenuItem),
                                size: resourceMenuItem.contentSize,
                            });
                            urlsAndSizesToDownload.push({
                                url: resourceMetadataApiFullPath(resourceMenuItem),
                                mediaType: 'text',
                                size: 2048,
                            });
                        }
                    }
                }

                if (footerInputs.audio) {
                    if (resourceMenuItem.mediaTypeName.toLowerCase() === 'audio') {
                        if (
                            resourcesMenu.some(({ selected, value }) => selected && value === resourceMenuItem.typeName)
                        ) {
                            urlsAndSizesToDownload.push({
                                mediaType: 'audio',
                                url: resourceContentApiFullUrl(resourceMenuItem),
                                size: resourceMenuItem.contentSize,
                            });
                            urlsAndSizesToDownload.push({
                                url: resourceMetadataApiFullPath(resourceMenuItem),
                                mediaType: 'audio',
                                size: 2048,
                            });
                        }
                    }
                }

                if (footerInputs.media) {
                    if (resourceMenuItem.mediaTypeName.toLowerCase() === 'image') {
                        urlsAndSizesToDownload.push({
                            mediaType: 'images',
                            url: resourceContentApiFullUrl(resourceMenuItem),
                            size: resourceMenuItem.contentSize,
                        });
                        urlsAndSizesToDownload.push({
                            url: resourceMetadataApiFullPath(resourceMenuItem),
                            mediaType: 'images',
                            size: 2048,
                        });
                    }
                }
            });
        }
    });

    if (resourcesMenu.some(({ selected, value }) => selected && value === 'CBBTER')) {
        biblesModuleBook.audioUrls.chapters.forEach((chapter) => {
            if (chapter.cbbterResourceUrls?.length && chapter.cbbterResourceUrls?.length > 0) {
                chapter.cbbterResourceUrls.forEach((cbbterResourceUrl) => {
                    urlsAndSizesToDownload.push({
                        mediaType: 'text',
                        url: cbbterResourceUrl.url,
                        size: cbbterResourceUrl.size,
                    });
                });
            }
        });
    }

    return {
        urlsToDelete: [],
        urlsToDownload: removeDuplicates(urlsAndSizesToDownload),
        totalSizeToDelete: 0,
        totalSizeToDownload: urlsAndSizesToDownload.reduce((acc, { size }) => size + acc, 0),
    };
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

        passage.resources = groupBy(
            cbbterUrlsWithMetadataForPassage(inputPassage),
            (urlWithMediaTypeAndSize) => urlWithMediaTypeAndSize.mediaType,
            (urlsWithMetadata) => ({ urlsWithMetadata, selected: false })
        );

        await asyncForEach(objectEntries(passage.resources), async ([_, resourceInfo]) => {
            resourceInfo.selected = await asyncEvery(
                resourceInfo.urlsWithMetadata,
                async ({ url }) => await isCachedFromCdn(url)
            );
        });

        passage.selected = objectValues(passage.resources).every(({ selected }) => selected);
    });
    return outputPassageData;
};

export const addFrontEndDataToBiblesModuleBook = async (inputBiblesModuleBook: BiblesModuleBook) => {
    inputBiblesModuleBook.isTextUrlCached = await isCachedFromCdn(inputBiblesModuleBook.textUrl);

    await asyncForEach(inputBiblesModuleBook.audioUrls.chapters, async (chapter) => {
        chapter.isAudioUrlCached = await isCachedFromCdn(chapter[audioFileTypeForBrowser()].url);
        chapter.selected = false;
        chapter.cbbterResourceUrls = [];
        chapter.resourceMenuItems = [];
    });

    return inputBiblesModuleBook;
};

export const addFrontEndDataToResourcesMenuItems = async (inputResourcesApiModule: ResourcesApiModule) => {
    await asyncForEach(inputResourcesApiModule.chapters, async (chapter) => {
        await asyncForEach(chapter.contents, async (content) => {
            content.isResourceUrlCached = await isCachedFromCdn(resourceContentApiFullUrl(content));
        });
    });

    return inputResourcesApiModule;
};

export const buildRowData = (
    audioChapter: FrontendAudioChapter,
    resourcesMenu: ResourcesMenuItem[],
    hasText: boolean,
    textSize: number
) => {
    const bibleSelected = resourcesMenu.some(({ selected, isBible }) => selected && isBible);
    const hasAudio = audioChapter[audioFileTypeForBrowser()].size > 0;
    let resources = 0;
    let size = 0;
    let hasImages = false;
    const allUrlsCached =
        audioChapter.isAudioUrlCached &&
        audioChapter.resourceMenuItems?.every((resourceMenuItem) => resourceMenuItem?.isResourceUrlCached);

    if (hasAudio && bibleSelected) {
        resources++;
        size = size + audioChapter[audioFileTypeForBrowser()].size;
    }

    if (hasText && bibleSelected) {
        resources++;
        size = size + textSize;
    }

    audioChapter.resourceMenuItems?.forEach((resourceMenuItem) => {
        size = size + resourceMenuItem.contentSize;
        resources++;

        if (resourceMenuItem.mediaTypeName === 'Image') {
            hasImages = true;
        }
    });

    return { resources, size, hasAudio, hasText, hasImages, allUrlsCached };
};

export function removeDuplicates(arr: UrlWithMetadata[]): UrlWithMetadata[] {
    const uniqueUrls = new Set<string>();

    const uniqueArray = arr.filter((item) => {
        if (!uniqueUrls.has(item.url)) {
            uniqueUrls.add(item.url);
            return true;
        }
        return false;
    });

    return uniqueArray;
}
