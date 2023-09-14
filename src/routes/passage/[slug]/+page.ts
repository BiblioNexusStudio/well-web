import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import {
    cacheManyFromCdnWithProgress,
    fetchFromCacheOrApi,
    fetchFromCacheOrCdn,
    isCachedFromCdn,
} from '$lib/data-cache';
import { currentLanguageCode, currentLanguageInfo } from '$lib/stores/current-language.store';
import { stringToPassageType } from '$lib/utils/passage-helpers';
import type {
    ApiPassage,
    FrontendAudioChapter,
    AudioTimestamp,
    BasePassage,
    FrontendBibleVersionBookContent,
    ResourceContentUrl,
    ResourceContentSteps,
    CbbtErTextContent,
    CbbtErImageContent,
    ApiBibleVersion,
} from '$lib/types/file-manager';
import type { BibleBookTextContent } from '$lib/types/bible-text-content';
import { passagesEqual } from '$lib/utils/passage-helpers';
import { audioFileTypeForBrowser } from '$lib/utils/browser';
import { asyncFilter, asyncMap, asyncReduce } from '$lib/utils/async-array';
import { isOnline } from '$lib/stores/is-online.store';
import { bibleUrlsWithMetadataForBookAndChapters, fetchBibleDataForLanguageCode } from '$lib/utils/data-handlers/bible';
import { cbbterUrlsWithMetadataForPassage } from '$lib/utils/data-handlers/resources/cbbt-er';

export interface FrontendChapterContent {
    number: string;
    audioData: { url: string; startTimestamp: number | null; endTimestamp: number | null } | null;
    versesText: { number: string; text: string }[];
}

async function cacheBibleContentForPassageIfOnline(bibleVersion: ApiBibleVersion, passage: BasePassage) {
    if (get(isOnline)) {
        const chapterNumbers = Array.from(
            { length: passage.endChapter - passage.startChapter },
            (_, i) => i + passage.startChapter
        );
        await cacheManyFromCdnWithProgress(
            bibleUrlsWithMetadataForBookAndChapters(bibleVersion, passage.bookId, chapterNumbers)
        );
    }
}

async function fetchBibleContent(passage: BasePassage, bibleLanguage: string | null) {
    const bibleData = await fetchBibleDataForLanguageCode(bibleLanguage);
    if (!bibleData[0]) return {};

    await cacheBibleContentForPassageIfOnline(bibleData[0], passage);
    const book = bibleData[0].contents.find((book: FrontendBibleVersionBookContent) => book.bookId === passage.bookId);
    if (!book) return {};

    let fullBookText = null;
    try {
        fullBookText = (await fetchFromCacheOrCdn(book.textUrl)) as BibleBookTextContent;
    } catch (_) {
        // this means the user hasn't downloaded the Bible text, which is fine
    }
    const filteredAudio = book.audioUrls.chapters.filter((chapter: FrontendAudioChapter) => {
        const chapterNumber = parseInt(chapter.number);
        return passage.startChapter <= chapterNumber && passage.endChapter >= chapterNumber;
    });
    const chapters = await asyncReduce(
        fullBookText?.chapters ?? [],
        async (output, chapter) => {
            const chapterNumber = parseInt(chapter.number);
            if (passage.startChapter <= chapterNumber && passage.endChapter >= chapterNumber) {
                const audioUrlData = filteredAudio.find((audioChapter: FrontendAudioChapter) => {
                    const audioChapterNumber = parseInt(audioChapter.number);
                    return audioChapterNumber === chapterNumber;
                });
                if (!audioUrlData) return output;
                let audioData: { url: string; startTimestamp: number | null; endTimestamp: number | null } | null =
                    null;
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

                return [
                    ...output,
                    {
                        number: chapter.number,
                        audioData,
                        versesText: chapter.verses.filter((verse) => {
                            const verseNumber = parseInt(verse.number.split('-')[0]);
                            return (
                                (chapterNumber > passage.startChapter ||
                                    (chapterNumber === passage.startChapter && verseNumber >= passage.startVerse)) &&
                                (chapterNumber < passage.endChapter ||
                                    (chapterNumber === passage.endChapter && verseNumber <= passage.endVerse))
                            );
                        }),
                    },
                ];
            } else {
                return output;
            }
        },
        [] as FrontendChapterContent[]
    );
    return { bookName: book.displayName, chapters };
}

async function cacheCbbterContentForPassageIfOnline(passageWithResources: ApiPassage) {
    if (get(isOnline)) {
        await cacheManyFromCdnWithProgress(cbbterUrlsWithMetadataForPassage(passageWithResources));
    }
}

async function getCachedAudioContentForPassage(passage: ApiPassage) {
    const audioResourceContent = (
        passage.resources?.filter(({ mediaType }) => mediaType === 2)?.map(({ content }) => content?.content) || []
    )?.filter(Boolean) as ResourceContentSteps[];
    const contentWithCachedSteps = await asyncMap(audioResourceContent, async (content) => ({
        ...content,
        steps: await asyncFilter(
            content.steps,
            async (step) =>
                !!step[audioFileTypeForBrowser()]?.url && (await isCachedFromCdn(step[audioFileTypeForBrowser()]?.url))
        ),
    }));
    return contentWithCachedSteps.filter((content) => content.steps.length > 0);
}

async function getCachedTextContentForPassage(passage: ApiPassage) {
    const textResources = passage.resources?.filter(({ mediaType }) => mediaType === 1) || [];
    return await Promise.all(
        textResources.map(async ({ content }) => {
            const textContent = content?.content as ResourceContentUrl | null;
            if (textContent?.url) {
                try {
                    return await fetchFromCacheOrCdn(textContent?.url);
                } catch (e) {
                    return null;
                }
            }
            return null;
        })
    );
}

async function getCachedImageContentForPassage(passage: ApiPassage) {
    const imageResources =
        passage.resources
            .flatMap(({ supportingResources }) => supportingResources ?? [])
            .filter(({ mediaType }) => mediaType === 4) || [];
    return asyncFilter(
        imageResources
            .map(({ content }) => {
                if (content) {
                    const imageContent = content.content as ResourceContentUrl;
                    return { displayName: content.displayName, url: imageContent?.url };
                }
            })
            .filter(Boolean) as CbbtErImageContent[],
        async (content) => await isCachedFromCdn(content.url)
    );
}

function getTitleForPassage(passage: ApiPassage) {
    const textResources = passage.resources?.filter(({ mediaType }) => mediaType === 1) || [];
    return textResources?.[0]?.content?.displayName;
}

async function fetchResourceContent(passage: BasePassage) {
    let allPassagesWithResources;
    try {
        allPassagesWithResources = (await fetchFromCacheOrApi(
            `passages/resources/language/${get(currentLanguageInfo)?.id}`
        )) as ApiPassage[];
    } catch (error) {
        return { text: [], audio: [] };
    }
    const passageWithResources = allPassagesWithResources.find((thisPassage) => passagesEqual(thisPassage, passage));
    if (passageWithResources) {
        await cacheCbbterContentForPassageIfOnline(passageWithResources);
        const audioResourceContent = await getCachedAudioContentForPassage(passageWithResources);
        const textResourceContent = await getCachedTextContentForPassage(passageWithResources);
        const imageResourceContent = await getCachedImageContentForPassage(passageWithResources);
        const title = getTitleForPassage(passageWithResources);
        return {
            title,
            text: textResourceContent?.map((content) => ({ steps: content } as CbbtErTextContent)),
            audio: audioResourceContent,
            images: imageResourceContent,
        };
    } else {
        return { text: [], audio: [] };
    }
}

export const load = (async ({ parent, params, url }) => {
    const bibleLanguageCode = url.searchParams.get('bibleLanguage') || get(currentLanguageCode);
    await parent(); // ensure languages have loaded
    const passage = stringToPassageType(params.slug);
    return {
        passage,
        bibleLanguageCode,
        fetched: {
            bibleContent: fetchBibleContent(passage, bibleLanguageCode),
            resourceContent: fetchResourceContent(passage),
        },
    };
}) satisfies PageLoad;
