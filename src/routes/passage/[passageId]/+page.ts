import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { fetchFromCacheOrApi, fetchFromCacheOrCdn, isCachedFromApi, isCachedFromCdn } from '$lib/data-cache';
import { currentLanguageCode, currentLanguageInfo } from '$lib/stores/current-language.store';
import type {
    FrontendAudioChapter,
    AudioTimestamp,
    CbbtErTextContent,
    ResourceContentCbbtErText,
} from '$lib/types/file-manager';
import type { BibleBookContentDetails, BibleBookTextContent } from '$lib/types/bible-text-content';
import { audioFileTypeForBrowser } from '$lib/utils/browser';
import { asyncFilter, asyncMap, asyncReduce } from '$lib/utils/async-array';
import { isOnline } from '$lib/stores/is-online.store';
import {
    fetchBibleDataForBookCodeAndBibleId,
    fetchBibleDataForBookCodeAndLanguageCode,
} from '$lib/utils/data-handlers/bible';
import { range } from '$lib/utils/array';
import { parseTiptapJsonToHtml } from '$lib/utils/tiptap-to-html';
import type { BasePassage, PassageResourceContent, PassageWithResourceContentIds } from '$lib/types/passage';
import { MediaType, ResourceType, type CbbtErAudioMetadata, type CbbtErAudioContent } from '$lib/types/resource';
import {
    fetchDisplayNameForResourceContent,
    fetchMetadataForResourceContent,
    resourceContentApiFullUrl,
    resourceContentApiPath,
} from '$lib/utils/data-handlers/resources/resource';
import { readFilesIntoObjectUrlsMapping } from '$lib/utils/unzip';

export interface FrontendChapterAudioData {
    url: string;
    startTimestamp: number | null;
    endTimestamp: number | null;
}

export interface FrontendChapterContent {
    number: string;
    audioData: FrontendChapterAudioData | null;
    versesText: { number: string; text: string }[];
}

async function fetchBibleContent(passage: BasePassage, bibleId: number | null) {
    let bookData: BibleBookContentDetails | null = null;
    if (bibleId) {
        bookData = await fetchBibleDataForBookCodeAndBibleId(passage.bookCode, bibleId);
    } else {
        bookData = await fetchBibleDataForBookCodeAndLanguageCode(passage.bookCode, get(currentLanguageCode));
    }
    if (!bookData) return {};

    let fullBookText: BibleBookTextContent | null = null;
    try {
        fullBookText = await fetchFromCacheOrCdn(bookData.textUrl);
    } catch (_) {
        // this means the user hasn't downloaded the Bible text, which is fine, they may have audio still
    }
    const filteredAudio = bookData.audioUrls.chapters.filter((chapter: FrontendAudioChapter) => {
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
    return { bookName: bookData.displayName, chapters };
}

async function getCbbterAudioForPassage(passage: PassageWithResourceContentIds): Promise<CbbtErAudioContent[]> {
    const allAudioResourceContent = passage.contents.filter(
        ({ mediaTypeName, typeName }) => typeName === ResourceType.CBBTER && mediaTypeName === MediaType.Audio
    );
    return (
        await asyncMap(allAudioResourceContent, async (resourceContent) => {
            try {
                const metadata = await fetchMetadataForResourceContent(resourceContent);
                const audioTypeSteps = (metadata?.metadata as CbbtErAudioMetadata | null)?.[audioFileTypeForBrowser()]
                    .steps;
                if (!audioTypeSteps) return null;
                const steps = (
                    await readFilesIntoObjectUrlsMapping(resourceContentApiFullUrl(resourceContent), audioTypeSteps)
                ).filter(({ url }) => !!url);
                return { steps };
            } catch (_) {
                // nothing cached
                return null;
            }
        })
    ).filter(Boolean) as CbbtErAudioContent[];
}

async function getCbbterTextForPassage(passage: PassageWithResourceContentIds): Promise<CbbtErTextContent[]> {
    const allTextResourceContent = passage.contents.filter(
        ({ mediaTypeName, typeName }) => typeName === ResourceType.CBBTER && mediaTypeName === MediaType.Text
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
                console.error(error);
                return null;
            }
        })
    ).filter(Boolean) as CbbtErTextContent[];
}

async function getAdditionalResourcesForPassage(
    passage: PassageWithResourceContentIds
): Promise<PassageResourceContent[]> {
    const additionalResourceContent = passage.contents.filter(({ typeName }) => typeName !== ResourceType.CBBTER);
    return await asyncFilter(
        additionalResourceContent,
        async (resourceContent) => get(isOnline) || (await isCachedFromApi(resourceContentApiPath(resourceContent)))
    );
}

async function fetchResourceContent(passage: BasePassage) {
    let passageWithResources;
    try {
        passageWithResources = (await fetchFromCacheOrApi(
            `passages/${passage.id}/language/${get(currentLanguageInfo)?.id}`
        )) as PassageWithResourceContentIds;
    } catch (error) {
        return { text: [], audio: [] };
    }
    if (passageWithResources) {
        const audioResourceContent = await getCbbterAudioForPassage(passageWithResources);
        const textResourceContent = await getCbbterTextForPassage(passageWithResources);
        const additionalResources = await getAdditionalResourcesForPassage(passageWithResources);
        const title = textResourceContent[0]?.displayName;
        return {
            title,
            text: textResourceContent,
            audio: audioResourceContent,
            additionalResources,
        };
    } else {
        return { text: [], audio: [] };
    }
}

export const load = (async ({ parent, params, url }) => {
    const bibleId = url.searchParams.get('bibleId');
    await parent(); // ensure languages have loaded
    const passage = await fetchFromCacheOrApi(`passages/${params.passageId}/language/${get(currentLanguageInfo)?.id}`);
    return {
        url,
        passage,
        bibleId,
        fetched: {
            bibleContent: fetchBibleContent(passage, (bibleId && parseInt(bibleId)) || null),
            resourceContent: fetchResourceContent(passage),
        },
    };
}) satisfies PageLoad;
