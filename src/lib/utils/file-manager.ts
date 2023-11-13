import { METADATA_ONLY_FAKE_FILE_SIZE, isCachedFromCdn } from '$lib/data-cache';
import { asyncForEach } from './async-array';
import { audioFileTypeForBrowser } from './browser';
import type {
    UrlWithMetadata,
    BiblesModuleBook,
    FrontendAudioChapter,
    ResourcesMenuItem,
    FooterInputs,
    ResourcesApiModule,
} from '$lib/types/file-manager';
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

export const calculateUrlsWithMetadataToChange = (
    biblesModuleBook: BiblesModuleBook,
    footerInputs: FooterInputs,
    resourcesMenu: ResourcesMenuItem[]
) => {
    const urlsAndSizesToDownload = [] as UrlWithMetadata[];
    const urlsToDelete = [] as string[];
    const bibleSelected = resourcesMenu.some(({ selected, isBible }) => selected && isBible);
    const selectedChaptersLength = biblesModuleBook.audioUrls.chapters.filter((chapter) => chapter.selected).length;

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

    if (
        (selectedChaptersLength === 1 || selectedChaptersLength == 0) &&
        biblesModuleBook.audioUrls.chapters.some((chapter) => chapter.deleteResources)
    ) {
        urlsToDelete.push(biblesModuleBook.textUrl);
    }

    biblesModuleBook.audioUrls.chapters.forEach((chapter) => {
        if (chapter.selected) {
            if (bibleSelected && footerInputs.audio && !chapter.isAudioUrlCached) {
                urlsAndSizesToDownload.push({
                    mediaType: 'audio',
                    url: chapter[audioFileTypeForBrowser()].url,
                    size: chapter[audioFileTypeForBrowser()].size,
                });
            }

            if (chapter.deleteResources) {
                urlsToDelete.push(chapter[audioFileTypeForBrowser()].url);
            }

            chapter.resourceMenuItems?.forEach((resourceMenuItem) => {
                if (!resourceMenuItem.isResourceUrlCached) {
                    if (footerInputs.text) {
                        if (resourceMenuItem.mediaTypeName.toLowerCase() === 'text') {
                            if (
                                resourcesMenu.some(
                                    ({ selected, value }) => selected && value === resourceMenuItem.typeName
                                )
                            ) {
                                urlsAndSizesToDownload.push({
                                    mediaType: 'text',
                                    url: resourceContentApiFullUrl(resourceMenuItem),
                                    size: resourceMenuItem.contentSize,
                                });
                                urlsAndSizesToDownload.push({
                                    url: resourceMetadataApiFullPath(resourceMenuItem),
                                    mediaType: 'text',
                                    metadataOnly: true,
                                    size: METADATA_ONLY_FAKE_FILE_SIZE,
                                });
                            }
                        }
                    }

                    if (footerInputs.audio) {
                        if (resourceMenuItem.mediaTypeName.toLowerCase() === 'audio') {
                            if (
                                resourcesMenu.some(
                                    ({ selected, value }) => selected && value === resourceMenuItem.typeName
                                )
                            ) {
                                urlsAndSizesToDownload.push({
                                    mediaType: 'audio',
                                    url: resourceContentApiFullUrl(resourceMenuItem),
                                    size: resourceMenuItem.contentSize,
                                });
                                urlsAndSizesToDownload.push({
                                    url: resourceMetadataApiFullPath(resourceMenuItem),
                                    mediaType: 'audio',
                                    metadataOnly: true,
                                    size: METADATA_ONLY_FAKE_FILE_SIZE,
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
                                metadataOnly: true,
                                size: METADATA_ONLY_FAKE_FILE_SIZE,
                            });
                        }
                    }
                } else if (chapter.deleteResources) {
                    urlsToDelete.push(resourceContentApiFullUrl(resourceMenuItem));
                    urlsToDelete.push(resourceMetadataApiFullPath(resourceMenuItem));
                }
            });
        }
    });

    if (resourcesMenu.some(({ selected, value }) => selected && value === 'CBBTER')) {
        biblesModuleBook.audioUrls.chapters.forEach(async (chapter) => {
            if (chapter.cbbterResourceUrls?.length && chapter.cbbterResourceUrls?.length > 0) {
                await asyncForEach(chapter.cbbterResourceUrls, async (cbbterResourceUrl) => {
                    const isCbbterResourceUrlCached = await isCachedFromCdn(cbbterResourceUrl.url);
                    if (!isCbbterResourceUrlCached) {
                        urlsAndSizesToDownload.push(cbbterResourceUrl);
                    } else if (chapter.deleteResources) {
                        urlsToDelete.push(cbbterResourceUrl.url);
                    }
                });
            }
        });
    }

    return {
        urlsToDelete,
        urlsToDownload: removeDuplicates(urlsAndSizesToDownload),
        totalSizeToDelete: 0,
        totalSizeToDownload: removeDuplicates(urlsAndSizesToDownload).reduce((acc, { size }) => size + acc, 0),
    };
};

export const addFrontEndDataToBiblesModuleBook = async (inputBiblesModuleBook: BiblesModuleBook) => {
    inputBiblesModuleBook.isTextUrlCached = await isCachedFromCdn(inputBiblesModuleBook.textUrl);

    await asyncForEach(inputBiblesModuleBook.audioUrls.chapters, async (chapter) => {
        chapter.isAudioUrlCached = await isCachedFromCdn(chapter[audioFileTypeForBrowser()].url);
        chapter.selected = false;
        chapter.allUrlsCached = false;
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

    return { resources, size, hasAudio, hasText, hasImages };
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
