import { bibleData, originalBibleData, originalPassageData, passageData } from '$lib/stores/file-manager.store';
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
    FrontendBibleVersion,
} from '$lib/types/file-manager';
import { get } from 'svelte/store';
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

export const resetOriginalData = () => {
    originalPassageData.set(JSON.parse(JSON.stringify(get(passageData))));
    originalBibleData.set(JSON.parse(JSON.stringify(get(bibleData))));
};

const selectedUrlsAndSizesForPassages = (passages: FrontendPassage[]) =>
    passages.reduce(
        (output, passage) =>
            output.concat(
                objectValues(passage.resources).reduce(
                    (acc, { urlsAndSizes, selected }) => (selected ? acc.concat(urlsAndSizes) : acc),
                    [] as { url: string; size: number }[]
                )
            ),
        [] as { url: string; size: number }[]
    );

const selectedUrlsAndSizesForBibles = (bibles: FrontendBibleVersion[]) =>
    bibles.reduce(
        (output, bible) =>
            output.concat(
                bible.contents.reduce((acc, bookContent) => {
                    const urlsAndSizes = [] as { url: string; size: number }[];
                    if (bookContent.textSelected) {
                        urlsAndSizes.push({ url: bookContent.textUrl, size: bookContent.textSize });
                    }
                    bookContent.audioUrls.chapters.forEach((chapter) => {
                        if (chapter.selected) {
                            urlsAndSizes.push(chapter[audioFileTypeForBrowser()]);
                        }
                    });
                    return acc.concat(urlsAndSizes);
                }, [] as { url: string; size: number }[])
            ),
        [] as { url: string; size: number }[]
    );

export const calculateUrlsAndSizesToChange = (
    currentBibles: FrontendBibleVersion[],
    originalBibles: FrontendBibleVersion[],
    currentPassages: FrontendPassage[],
    originalPassages: FrontendPassage[]
) => {
    const originalSelectedUrlsAndSizes = selectedUrlsAndSizesForPassages(originalPassages).concat(
        selectedUrlsAndSizesForBibles(originalBibles)
    );
    const currentSelectedUrlsAndSizes = selectedUrlsAndSizesForPassages(currentPassages).concat(
        selectedUrlsAndSizesForBibles(currentBibles)
    );

    const urlsAndSizesToDelete = originalSelectedUrlsAndSizes
        .filter(({ url: originalUrl }) => !currentSelectedUrlsAndSizes.some(({ url }) => url === originalUrl))
        .filter((v, i, a) => a.findIndex((t) => t.url === v.url) === i);

    const urlsAndSizesToDownload = currentSelectedUrlsAndSizes
        .filter(({ url: currentUrl }) => !originalSelectedUrlsAndSizes.some(({ url }) => url === currentUrl))
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
                } else if (!!resource.content && resource.mediaType === 4) {
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
