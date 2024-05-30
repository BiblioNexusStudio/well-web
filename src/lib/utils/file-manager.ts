import { METADATA_ONLY_FAKE_FILE_SIZE, isCachedFromCdn } from '$lib/data-cache';
import { asyncUnorderedForEach } from './async-array';
import { audioFileTypeForBrowser } from './browser';
import type {
    UrlWithMetadata,
    BiblesModuleBook,
    FrontendAudioChapter,
    ResourcesMenuItem,
    FooterInputs,
    ResourcesApiModule,
    ApiAudioChapter,
} from '$lib/types/file-manager';
import {
    resourceContentApiFullUrl,
    resourceContentsForBookAndChapterFullUrl,
    resourceMetadataApiFullUrl,
    resourceThumbnailApiFullUrl,
} from '$lib/utils/data-handlers/resources/resource';
import { MediaType, ParentResourceId } from '$lib/types/resource';
import { currentLanguageInfo } from '$lib/stores/language.store';
import { get } from 'svelte/store';
import { bibleBooksByBibleIdFullUrl } from './data-handlers/bible';

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
    const languageId = get(currentLanguageInfo)?.id;
    const urlsAndSizesToDownload = [] as UrlWithMetadata[];
    const urlsToDelete = [] as string[];
    const bibleSelected = resourcesMenu.some(({ selected, isBible }) => selected && isBible);
    const selectedChaptersLength = biblesModuleBook.audioUrls?.chapters.filter((chapter) => chapter.selected).length;

    if (
        biblesModuleBook.audioUrls?.chapters.some((chapter) => chapter.selected) &&
        bibleSelected &&
        footerInputs.text &&
        !biblesModuleBook.isTextUrlCached
    ) {
        urlsAndSizesToDownload.push({
            mediaType: MediaType.Text,
            url: bibleBooksByBibleIdFullUrl(biblesModuleBook.bibleId!),
            size: METADATA_ONLY_FAKE_FILE_SIZE * 10,
        });
        urlsAndSizesToDownload.push({
            mediaType: MediaType.Text,
            url: biblesModuleBook.textUrl,
            size: biblesModuleBook.textSize,
        });
    }

    if (
        (selectedChaptersLength === 1 || selectedChaptersLength == 0) &&
        biblesModuleBook.audioUrls?.chapters.some((chapter) => chapter.deleteResources)
    ) {
        urlsToDelete.push(biblesModuleBook.textUrl);
    }

    biblesModuleBook.audioUrls?.chapters.forEach((chapter) => {
        if (chapter.selected) {
            if (
                bibleSelected &&
                footerInputs.audio &&
                chapter[audioFileTypeForBrowser()].url &&
                !chapter.isAudioUrlCached
            ) {
                urlsAndSizesToDownload.push({
                    mediaType: MediaType.Audio,
                    url: chapter[audioFileTypeForBrowser()].url,
                    size: chapter[audioFileTypeForBrowser()].size,
                });
            }

            urlsAndSizesToDownload.push({
                url: resourceContentsForBookAndChapterFullUrl(languageId, biblesModuleBook.bookCode, chapter.number),
                mediaType: MediaType.Text,
                metadataOnly: true,
                size: METADATA_ONLY_FAKE_FILE_SIZE * 5,
            });

            if (chapter.deleteResources) {
                urlsToDelete.push(chapter[audioFileTypeForBrowser()].url);
            }

            chapter.resourceMenuItems?.forEach((resourceMenuItem) => {
                if (!resourceMenuItem.isResourceUrlCached) {
                    if (footerInputs.text) {
                        if (resourceMenuItem.mediaTypeName === MediaType.Text) {
                            if (
                                resourcesMenu.some(
                                    ({ selected, parentResource }) =>
                                        selected && parentResource?.id === resourceMenuItem.parentResourceId
                                )
                            ) {
                                urlsAndSizesToDownload.push({
                                    mediaType: MediaType.Text,
                                    contentId: resourceMenuItem.contentId,
                                    url: resourceContentApiFullUrl(resourceMenuItem),
                                    size: resourceMenuItem.contentSize,
                                });
                                urlsAndSizesToDownload.push({
                                    url: resourceMetadataApiFullUrl(resourceMenuItem),
                                    contentId: resourceMenuItem.contentId,
                                    mediaType: MediaType.Text,
                                    metadataOnly: true,
                                    size: METADATA_ONLY_FAKE_FILE_SIZE,
                                });
                            }
                        }
                    }

                    if (footerInputs.audio) {
                        if (resourceMenuItem.mediaTypeName === MediaType.Audio) {
                            if (
                                resourcesMenu.some(
                                    ({ selected, parentResource }) =>
                                        selected && parentResource?.id === resourceMenuItem.parentResourceId
                                )
                            ) {
                                urlsAndSizesToDownload.push({
                                    mediaType: MediaType.Audio,
                                    contentId: resourceMenuItem.contentId,
                                    url: resourceContentApiFullUrl(resourceMenuItem),
                                    size: resourceMenuItem.contentSize,
                                });
                                urlsAndSizesToDownload.push({
                                    url: resourceMetadataApiFullUrl(resourceMenuItem),
                                    mediaType: MediaType.Audio,
                                    contentId: resourceMenuItem.contentId,
                                    metadataOnly: true,
                                    size: METADATA_ONLY_FAKE_FILE_SIZE,
                                });
                            }
                        }
                    }

                    if (footerInputs.media) {
                        if (resourceMenuItem.mediaTypeName === MediaType.Image) {
                            urlsAndSizesToDownload.push({
                                mediaType: MediaType.Image,
                                contentId: resourceMenuItem.contentId,
                                url: resourceContentApiFullUrl(resourceMenuItem),
                                size: resourceMenuItem.contentSize,
                            });
                            urlsAndSizesToDownload.push({
                                url: resourceMetadataApiFullUrl(resourceMenuItem),
                                mediaType: MediaType.Image,
                                contentId: resourceMenuItem.contentId,
                                metadataOnly: true,
                                size: METADATA_ONLY_FAKE_FILE_SIZE,
                            });
                        }

                        if (resourceMenuItem.mediaTypeName === MediaType.Video) {
                            urlsAndSizesToDownload.push({
                                mediaType: MediaType.Video,
                                contentId: resourceMenuItem.contentId,
                                url: resourceContentApiFullUrl(resourceMenuItem),
                                size: resourceMenuItem.contentSize,
                            });
                            urlsAndSizesToDownload.push({
                                url: resourceThumbnailApiFullUrl(resourceMenuItem),
                                mediaType: MediaType.Video,
                                contentId: resourceMenuItem.contentId,
                                metadataOnly: true,
                                size: METADATA_ONLY_FAKE_FILE_SIZE,
                            });
                            urlsAndSizesToDownload.push({
                                url: resourceMetadataApiFullUrl(resourceMenuItem),
                                mediaType: MediaType.Video,
                                contentId: resourceMenuItem.contentId,
                                metadataOnly: true,
                                size: METADATA_ONLY_FAKE_FILE_SIZE,
                            });
                        }
                    }
                } else if (chapter.deleteResources) {
                    urlsToDelete.push(resourceContentApiFullUrl(resourceMenuItem));
                    urlsToDelete.push(resourceMetadataApiFullUrl(resourceMenuItem));
                    urlsToDelete.push(resourceThumbnailApiFullUrl(resourceMenuItem));
                }
            });
        }
    });

    if (resourcesMenu.some(({ selected, parentResource }) => selected && parentResource?.id === ParentResourceId.FIA)) {
        biblesModuleBook.audioUrls?.chapters.forEach((chapter) => {
            if (chapter.fiaResourceUrls?.length && chapter.fiaResourceUrls?.length > 0) {
                chapter.fiaResourceUrls.forEach((fiaResourceUrl) => {
                    if (chapter.deleteResources) {
                        urlsToDelete.push(fiaResourceUrl.url);
                    } else {
                        urlsAndSizesToDownload.push(fiaResourceUrl);
                    }
                });
            }
        });
    }

    const uniqueUrls = removeDuplicates(urlsAndSizesToDownload);
    return {
        urlsToDelete,
        urlsToDownload: uniqueUrls,
        totalSizeToDownload: uniqueUrls.reduce((acc, { size }) => size + acc, 0),
        nonMetadataSizeToDownload: uniqueUrls.filter((u) => !u.metadataOnly).reduce((acc, { size }) => size + acc, 0),
    };
};

export const addFrontEndDataToBiblesModuleBook = async (inputBiblesModuleBook: BiblesModuleBook) => {
    if (inputBiblesModuleBook.audioUrls === null) {
        inputBiblesModuleBook = populateNullAudioChapters(inputBiblesModuleBook);
    }

    inputBiblesModuleBook.isTextUrlCached = await isCachedFromCdn(inputBiblesModuleBook.textUrl);

    await asyncUnorderedForEach(inputBiblesModuleBook.audioUrls?.chapters ?? [], async (chapter) => {
        chapter.isAudioUrlCached = await isCachedFromCdn(chapter[audioFileTypeForBrowser()].url);
        chapter.selected = false;
        chapter.allUrlsCached = false;
        chapter.fiaResourceUrls = [];
        chapter.resourceMenuItems = [];
    });

    return inputBiblesModuleBook;
};

export const addFrontEndDataToResourcesMenuItems = async (inputResourcesApiModule: ResourcesApiModule) => {
    await asyncUnorderedForEach(inputResourcesApiModule.chapters, async (chapter) => {
        await asyncUnorderedForEach(chapter.contents, async (content) => {
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
    let hasVideos = false;

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

        if (resourceMenuItem.mediaTypeName === MediaType.Image) {
            hasImages = true;
        }

        if (resourceMenuItem.mediaTypeName === MediaType.Video) {
            hasVideos = true;
        }
    });

    return { resources, size, hasAudio, hasText, hasImages, hasVideos };
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

export function populateNullAudioChapters(data: BiblesModuleBook) {
    const emptyAudioUrlsChapters: ApiAudioChapter[] = [];

    for (let i = 0; i < data.chapterCount; i++) {
        emptyAudioUrlsChapters.push({
            number: `${i + 1}`,
            webm: {
                url: '',
                size: 0,
            },
            mp3: {
                url: '',
                size: 0,
            },
            audioTimestamps: [],
        });
    }

    data.audioUrls = {
        chapters: emptyAudioUrlsChapters,
    };

    return data;
}
