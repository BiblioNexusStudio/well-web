import { get } from 'svelte/store';
import { fetchFromCacheOrApi, fetchFromCacheOrCdn, isCachedFromCdn } from '$lib/data-cache';
import { currentLanguageInfo } from '$lib/stores/current-language.store';
import type {
    FrontendAudioChapter,
    AudioTimestamp,
    CbbtErTextContent,
    ResourceContentCbbtErText,
} from '$lib/types/file-manager';
import type { BibleBookTextContent, FrontendBibleBook, FrontendChapterContent } from '$lib/types/bible-text-content';
import { audioFileTypeForBrowser } from '$lib/utils/browser';
import { asyncFilter, asyncMap, asyncReduce } from '$lib/utils/async-array';
import { isOnline } from '$lib/stores/is-online.store';
import { fetchAllBibles, bookDataForBibleTab } from '$lib/utils/data-handlers/bible';
import { range } from '$lib/utils/array';
import { parseTiptapJsonToHtml } from '$lib/utils/tiptap-parsers';
import type { BasePassage, PassageResourceContent, PassageWithResourceContentIds } from '$lib/types/passage';
import { MediaType, ParentResourceName, type CbbtErAudioMetadata, type CbbtErAudioContent } from '$lib/types/resource';
import {
    fetchDisplayNameForResourceContent,
    fetchMetadataForResourceContent,
    resourceContentApiFullUrl,
    resourceContentApiPath,
} from '$lib/utils/data-handlers/resources/resource';
import { readFilesIntoObjectUrlsMapping } from '$lib/utils/unzip';
import { preferredBibleIds } from '$lib/stores/preferred-bibles.store';
import { log } from '$lib/logger';

export type PassagePageTab = 'bible' | 'guide';

export async function fetchBibleContent(passage: BasePassage, bible: FrontendBibleBook) {
    if (!bible.bookMetadata) return null;

    let fullBookText: BibleBookTextContent | null = null;
    try {
        fullBookText = await fetchFromCacheOrCdn(bible.bookMetadata.textUrl);
    } catch (error) {
        // this means the user hasn't downloaded the Bible text, which is fine, they may have audio still
        log.exception(error as Error);
    }
    const filteredAudio = bible.bookMetadata.audioUrls.chapters.filter((chapter: FrontendAudioChapter) => {
        const chapterNumber = parseInt(chapter.number);
        return passage.startChapter <= chapterNumber && passage.endChapter >= chapterNumber;
    });
    const chapters = await asyncReduce(
        range(passage.startChapter, passage.endChapter),
        async (output, chapterNumber) => {
            const audioUrlData = filteredAudio.find((audioChapter: FrontendAudioChapter) => {
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
                                          passage.startVerse === parseInt(verseNumber.split('-')[0])
                                  )?.start
                                : audioUrlData.audioTimestamps[0].start;

                        const endTimestamp =
                            chapterNumber === passage.endChapter
                                ? audioUrlData.audioTimestamps.find(
                                      ({ verseNumber }: AudioTimestamp) =>
                                          passage.endVerse === parseInt(verseNumber.split('-')[0])
                                  )?.end
                                : audioUrlData.audioTimestamps[audioUrlData.audioTimestamps.length - 1].end;

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
                                const verseNumber = parseInt(verse.number.split('-')[0]);
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

async function getCbbterAudioForPassage(passage: PassageWithResourceContentIds): Promise<CbbtErAudioContent[]> {
    const allAudioResourceContent = passage.contents.filter(
        ({ mediaTypeName, parentResourceName }) =>
            parentResourceName === ParentResourceName.CBBTER && mediaTypeName === MediaType.Audio
    );
    return (
        await asyncMap(allAudioResourceContent, async (resourceContent) => {
            try {
                const metadata = await fetchMetadataForResourceContent(resourceContent);
                const audioTypeSteps = ((metadata?.metadata || null) as CbbtErAudioMetadata | null)?.[
                    audioFileTypeForBrowser()
                ].steps;
                if (!audioTypeSteps) return null;
                const steps = (
                    await readFilesIntoObjectUrlsMapping(resourceContentApiFullUrl(resourceContent), audioTypeSteps)
                ).filter(({ url }) => !!url);
                return { steps };
            } catch (error) {
                // nothing cached
                log.exception(error as Error);
                return null;
            }
        })
    ).filter(Boolean) as CbbtErAudioContent[];
}

async function getCbbterTextForPassage(passage: PassageWithResourceContentIds): Promise<CbbtErTextContent[]> {
    const allTextResourceContent = passage.contents.filter(
        ({ mediaTypeName, parentResourceName }) =>
            parentResourceName === ParentResourceName.CBBTER && mediaTypeName === MediaType.Text
    );
    return (
        await asyncMap(allTextResourceContent, async (resourceContent) => {
            try {
                const displayName = await fetchDisplayNameForResourceContent(resourceContent);
                const content = (await fetchFromCacheOrApi(
                    resourceContentApiPath(resourceContent)
                )) as ResourceContentCbbtErText[];
                return {
                    displayName,
                    steps: content.map((step) => ({ ...step, contentHTML: parseTiptapJsonToHtml(step.tiptap) })),
                };
            } catch (error) {
                // stuff not cached
                log.exception(error as Error);
                return null;
            }
        })
    ).filter(Boolean) as CbbtErTextContent[];
}

async function getAdditionalResourcesForPassage(
    passage: PassageWithResourceContentIds
): Promise<PassageResourceContent[]> {
    const additionalResourceContent = passage.contents.filter(
        ({ parentResourceName }) => parentResourceName !== ParentResourceName.CBBTER
    );
    return await asyncFilter(
        additionalResourceContent,
        async (resourceContent) => get(isOnline) || (await isCachedFromCdn(resourceContentApiFullUrl(resourceContent)))
    );
}

export async function fetchPassage(passageId: string): Promise<BasePassage> {
    return await fetchFromCacheOrApi(`passages/${passageId}/language/${get(currentLanguageInfo)?.id}`);
}

function updateAndGetPreferredIds(bibleIdsInCurrentLanguage: number[]) {
    const defaultCurrentLanguageBibleId = bibleIdsInCurrentLanguage[0];
    let preferredIds = get(preferredBibleIds);
    if (
        defaultCurrentLanguageBibleId &&
        preferredIds.every((existingId) => !bibleIdsInCurrentLanguage.includes(existingId))
    ) {
        preferredIds = preferredIds.concat([defaultCurrentLanguageBibleId]);
        preferredBibleIds.set(preferredIds);
    }
    return preferredIds;
}

// Fetch Bible data for use in the passage page.
// Handles online and offline, pulling both the available Bibles (for use in the preferred Bibles modal) and Bibles to
// show in the tab carousel.
export async function fetchBibleData(passage: BasePassage) {
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

export async function fetchResourceData(passage: BasePassage) {
    let text: CbbtErTextContent[] = [];
    let audio: CbbtErAudioContent[] = [];
    let title: string | undefined = undefined;
    let additionalResources: PassageResourceContent[] = [];
    let passageWithResources;
    try {
        passageWithResources = (await fetchFromCacheOrApi(
            `passages/${passage.id}/language/${get(currentLanguageInfo)?.id}`
        )) as PassageWithResourceContentIds;
    } catch (error) {
        // data not cached
        log.exception(error as Error);
    }

    if (passageWithResources) {
        audio = await getCbbterAudioForPassage(passageWithResources);
        text = await getCbbterTextForPassage(passageWithResources);
        additionalResources = await getAdditionalResourcesForPassage(passageWithResources);
        title = text[0]?.displayName;
    }
    return {
        cbbterText: text[0],
        cbbterAudio: audio[0],
        title,
        additionalResources: additionalResources,
    };
}

export type ResourceData = Awaited<ReturnType<typeof fetchResourceData>>;
export type BibleData = Awaited<ReturnType<typeof fetchBibleData>>;
