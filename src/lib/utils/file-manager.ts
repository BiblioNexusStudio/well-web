import { bibleData, originalBibleData, originalPassageData, passageData } from '$lib/stores/file-manager.store';
import { isCachedFromCdn } from '$lib/data-cache';
import { asyncEvery, asyncForEach } from './async-array';
import { audioFileTypeForBrowser } from './browser';
import {
    type ApiPassage,
    type FrontendBibleVersionBookContent,
    type ApiBibleVersion,
    type FrontendBibleVersion,
    type UrlWithMetadata,
    type BiblesModuleBook,
    type ApiAudioChapter,
    type ResourcesMenuItem,
    MediaType,
} from '$lib/types/file-manager';
import { get } from 'svelte/store';
import type { FrontendPassage } from '$lib/types/file-manager';
import { objectEntries, objectValues } from './typesafe-standard-lib';
import { cbbterUrlsWithMetadataForPassage } from './data-handlers/resources/cbbt-er';
import { groupBy } from './array';

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

const selectedUrlsWithMetadataForPassages = (passages: FrontendPassage[]) =>
    passages.reduce(
        (output, passage) =>
            output.concat(
                objectValues(passage.resources).reduce(
                    (acc, { urlsWithMetadata, selected }) => (selected ? acc.concat(urlsWithMetadata) : acc),
                    [] as UrlWithMetadata[]
                )
            ),
        [] as UrlWithMetadata[]
    );

const selectedUrlsWithMetadataForBibles = (bibles: FrontendBibleVersion[]) =>
    bibles.reduce(
        (output, bible) =>
            output.concat(
                bible.contents.reduce((acc, bookContent) => {
                    const urlsWithMetadata = [] as UrlWithMetadata[];
                    if (bookContent.textSelected) {
                        urlsWithMetadata.push({
                            url: bookContent.textUrl,
                            size: bookContent.textSize,
                            mediaType: MediaType.text,
                        });
                    }
                    bookContent.audioUrls.chapters.forEach((chapter) => {
                        if (chapter.selected) {
                            urlsWithMetadata.push({
                                ...chapter[audioFileTypeForBrowser()],
                                mediaType: MediaType.audio,
                            });
                        }
                    });
                    return acc.concat(urlsWithMetadata);
                }, [] as UrlWithMetadata[])
            ),
        [] as UrlWithMetadata[]
    );

export const calculateUrlsWithMetadataToChange = (
    currentBibles: FrontendBibleVersion[],
    originalBibles: FrontendBibleVersion[],
    currentPassages: FrontendPassage[],
    originalPassages: FrontendPassage[]
) => {
    const originalSelectedUrlsWithMetadata = selectedUrlsWithMetadataForPassages(originalPassages).concat(
        selectedUrlsWithMetadataForBibles(originalBibles)
    );
    const currentSelectedUrlsWithMetadata = selectedUrlsWithMetadataForPassages(currentPassages).concat(
        selectedUrlsWithMetadataForBibles(currentBibles)
    );

    const urlsAndSizesToDelete = originalSelectedUrlsWithMetadata
        .filter(({ url: originalUrl }) => !currentSelectedUrlsWithMetadata.some(({ url }) => url === originalUrl))
        .filter((v, i, a) => a.findIndex((t) => t.url === v.url) === i);

    const urlsAndSizesToDownload = currentSelectedUrlsWithMetadata
        .filter(({ url: currentUrl }) => !originalSelectedUrlsWithMetadata.some(({ url }) => url === currentUrl))
        .filter((v, i, a) => a.findIndex((t) => t.url === v.url) === i);

    return {
        urlsToDelete: urlsAndSizesToDelete.map(({ url }) => url),
        urlsToDownload: urlsAndSizesToDownload,
        totalSizeToDelete: urlsAndSizesToDelete.reduce((acc, { size }) => size + acc, 0),
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

export const addFrontEndDataToBiblesModuleBook = (inputBiblesModuleBook: BiblesModuleBook) => {
    inputBiblesModuleBook.audioUrls.chapters.forEach((chapter) => {
        chapter.selected = false;
    });

    return inputBiblesModuleBook;
};

export const buildRowData = (
    audioChapter: ApiAudioChapter,
    resourcesMenu: ResourcesMenuItem[],
    hasText: boolean,
    textSize: number
) => {
    const bibleSelected = resourcesMenu.some(({ selected, isBible }) => selected && isBible);
    const hasAudio = audioChapter[audioFileTypeForBrowser()].size > 0;
    let resources = 0;
    let size = 0;

    if (hasAudio && bibleSelected) {
        resources++;
        size = size + audioChapter[audioFileTypeForBrowser()].size;
    }

    if (hasText && bibleSelected) {
        resources++;
        size = size + textSize;
    }

    if (audioChapter.cbbtErResourceWithContents) {
        if (
            audioChapter.cbbtErResourceWithContents.contents.length > 0 &&
            resourcesMenu.some(({ selected, value }) => selected && value === 'CBBTER')
        ) {
            const cbbterText = audioChapter.cbbtErResourceWithContents.contents.find(
                ({ mediaTypeName, typeName }) => mediaTypeName === 'Text' && typeName === 'CBBTER'
            );
            const cbbterAudio = audioChapter.cbbtErResourceWithContents.contents.find(
                ({ mediaTypeName, typeName }) => mediaTypeName === 'Audio' && typeName === 'CBBTER'
            );
            if (cbbterText) {
                resources++;
                size = size + cbbterText.contentSize;
            }

            if (cbbterAudio) {
                resources++;
                size = size + cbbterAudio.contentSize;
            }
        }
    }

    return { resources, size, hasAudio, hasText };
};
