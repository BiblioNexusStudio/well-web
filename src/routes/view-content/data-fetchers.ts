import { get } from 'svelte/store';
import { fetchFromCacheOrCdn, isCachedFromCdn } from '$lib/data-cache';
import { currentLanguageInfo } from '$lib/stores/language.store';
import type { FrontendAudioChapter, AudioTimestamp } from '$lib/types/file-manager';
import type { BibleBookTextContent, FrontendBibleBook, FrontendChapterContent } from '$lib/types/bible';
import { audioFileTypeForBrowser } from '$lib/utils/browser';
import { asyncFilter, asyncMap, asyncReduce } from '$lib/utils/async-array';
import { isOnline } from '$lib/stores/is-online.store';
import { fetchAllBibles, bookDataForBibleTab } from '$lib/utils/data-handlers/bible';
import { range } from '$lib/utils/array';
import { type ResourceContentInfo, ParentResourceType } from '$lib/types/resource';
import {
    resourceContentApiFullUrl,
    type ResourceContentInfoWithFrontendData,
} from '$lib/utils/data-handlers/resources/resource';
import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
import { log } from '$lib/logger';
import { resourceContentsForBibleSection } from '$lib/utils/data-handlers/resources/resource';
import type { BibleSection } from '$lib/types/bible';

export enum PassagePageTabEnum {
    Bible = 'Bible',
    Guide = 'Guide',
    MainMenu = 'MainMenu',
    LibraryMenu = 'LibraryMenu',
    Resources = 'Resources',
}

export async function fetchBibleContent(passage: BibleSection, bible: FrontendBibleBook) {
    if (!bible.bookMetadata) return null;

    let fullBookText: BibleBookTextContent | null = null;
    try {
        fullBookText = await fetchFromCacheOrCdn(bible.bookMetadata.textUrl);
    } catch (error) {
        // this means the user hasn't downloaded the Bible text, which is fine, they may have audio still
        log.exception(error as Error);
    }
    const filteredAudio = bible.bookMetadata.audioUrls?.chapters.filter((chapter: FrontendAudioChapter) => {
        const chapterNumber = parseInt(chapter.number);
        return passage.startChapter <= chapterNumber && passage.endChapter >= chapterNumber;
    });
    const chapters = await asyncReduce(
        range(passage.startChapter, passage.endChapter),
        async (output, chapterNumber) => {
            const audioUrlData = filteredAudio?.find((audioChapter: FrontendAudioChapter) => {
                const audioChapterNumber = parseInt(audioChapter.number);
                return audioChapterNumber === chapterNumber;
            });
            let audioData: { url: string; startTimestamp: number | null; endTimestamp: number | null } | null = null;
            if (audioUrlData) {
                const url = audioUrlData[audioFileTypeForBrowser()].url;
                if (get(isOnline) || (await isCachedFromCdn(url))) {
                    if (audioUrlData.audioTimestamps) {
                        const startTimestamp =
                            chapterNumber === passage.startChapter
                                ? audioUrlData.audioTimestamps.find(
                                      ({ verseNumber }: AudioTimestamp) =>
                                          passage.startVerse === parseInt(verseNumber.split('-')[0]!)
                                  )?.start
                                : audioUrlData.audioTimestamps[0]?.start;

                        const endTimestamp =
                            chapterNumber === passage.endChapter
                                ? audioUrlData.audioTimestamps.find(
                                      ({ verseNumber }: AudioTimestamp) =>
                                          passage.endVerse === parseInt(verseNumber.split('-')[0]!)
                                  )?.end
                                : audioUrlData.audioTimestamps[audioUrlData.audioTimestamps.length - 1]?.end;

                        audioData = {
                            url,
                            startTimestamp: startTimestamp || null,
                            endTimestamp: endTimestamp || null,
                        };
                    } else {
                        audioData = {
                            url,
                            startTimestamp: null,
                            endTimestamp: null,
                        };
                    }
                }
            }
            const chapterText = fullBookText?.chapters?.find((chapter) => String(chapterNumber) === chapter.number);
            if (chapterText || audioData) {
                return [
                    ...output,
                    {
                        number: String(chapterNumber),
                        audioData,
                        versesText:
                            chapterText?.verses.filter((verse) => {
                                const verseNumber = parseInt(verse.number.split('-')[0]!);
                                return (
                                    (chapterNumber > passage.startChapter ||
                                        (chapterNumber === passage.startChapter &&
                                            verseNumber >= passage.startVerse)) &&
                                    (chapterNumber < passage.endChapter ||
                                        (chapterNumber === passage.endChapter && verseNumber <= passage.endVerse))
                                );
                            }) ?? [],
                    },
                ];
            }
            return output;
        },
        [] as FrontendChapterContent[]
    );
    return { chapters };
}

async function filterToAdditionalResourceInfo(resourceContents: ResourceContentInfo[]) {
    const additionalResourceContent = resourceContents.filter(
        ({ resourceType }) => resourceType !== ParentResourceType.Guide
    );

    return await asyncFilter(
        additionalResourceContent,
        async (resourceContent) => get(isOnline) || (await isCachedFromCdn(resourceContentApiFullUrl(resourceContent)))
    );
}

async function filterToGuideResourceInfo(resourceContents: ResourceContentInfoWithFrontendData[]) {
    const onlyGuides = resourceContents.filter((content) => content.resourceType === ParentResourceType.Guide);

    return await asyncFilter(
        onlyGuides,
        async (resourceContent) => get(isOnline) || (await isCachedFromCdn(resourceContentApiFullUrl(resourceContent)))
    );
}

function updateAndGetPreferredIds(bibleIdsInCurrentLanguage: number[]) {
    const defaultCurrentLanguageBibleId = bibleIdsInCurrentLanguage[0];
    let preferredIds = get(preferredBibleIds);
    if (defaultCurrentLanguageBibleId && preferredIds.length === 0) {
        preferredIds = preferredIds.concat([defaultCurrentLanguageBibleId]);
        preferredBibleIds.set(preferredIds);
    }
    return preferredIds;
}

// Fetch Bible data for use in the passage page.
// Handles online and offline, pulling both the available Bibles (for use in the preferred Bibles modal) and Bibles to
// show in the tab carousel.
export async function fetchBibleData(passage: BibleSection) {
    const bibles = await fetchAllBibles();
    const currentLanguageId = get(currentLanguageInfo)?.id;
    const bibleIdsInCurrentLanguage = bibles
        .filter(({ languageId }) => languageId === currentLanguageId)
        .map(({ id }) => id);
    const preferredIds = updateAndGetPreferredIds(bibleIdsInCurrentLanguage);
    const biblesWithBookData: FrontendBibleBook[] = await asyncMap(bibles, async (bible) => ({
        ...bible,
        bookMetadata: await bookDataForBibleTab(passage, bible.id, preferredIds.includes(bible.id)),
        defaultForCurrentLanguage: bible.id === bibleIdsInCurrentLanguage[0],
        loadingContent: false,
        content: null,
    }));

    // Filter down to Bibles that are actually available for the passage and either the
    // user has selected the Bible as preferred OR the Bible is in the current language
    const online = get(isOnline);
    const availableBibles = biblesWithBookData
        .sort(
            (first, second) =>
                (first.languageId === currentLanguageId ? 0 : 1) -
                (second.languageId === currentLanguageId ? 0 : 1) +
                ((preferredIds.includes(first.id) ? 0 : 1) - (preferredIds.includes(second.id) ? 0 : 1))
        )
        .filter(({ bookMetadata }) => online || !!bookMetadata);
    const biblesForTabs = availableBibles.filter(({ id }) => preferredIds.includes(id));
    return { biblesForTabs, availableBibles };
}

export async function fetchResourceData(passage: BibleSection) {
    let additionalResourceInfo: ResourceContentInfo[] = [];
    let guideResourceInfo: ResourceContentInfoWithFrontendData[] = [];
    let resourceContents: ResourceContentInfoWithFrontendData[] | undefined;
    try {
        resourceContents = await resourceContentsForBibleSection(passage);
    } catch (error) {
        // data not cached
        log.exception(error as Error);
    }
    if (resourceContents) {
        additionalResourceInfo = await filterToAdditionalResourceInfo(resourceContents);
        guideResourceInfo = await filterToGuideResourceInfo(resourceContents);
    }
    return {
        additionalResourceInfo,
        guideResourceInfo,
    };
}

export type ResourceData = Awaited<ReturnType<typeof fetchResourceData>>;
export type BibleData = Awaited<ReturnType<typeof fetchBibleData>>;
