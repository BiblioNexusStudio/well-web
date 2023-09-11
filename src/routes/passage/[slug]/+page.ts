import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import {
    cacheManyFromCdnWithProgress,
    fetchFromCacheOrApi,
    fetchFromCacheOrCdn,
    isCachedFromCdn,
} from '$lib/data-cache';
import { currentLanguageId } from '$lib/stores/current-language.store';
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
import { reduceAsync } from '$lib/utils/async-array';
import { isOnline } from '$lib/stores/is-online.store';
import { bibleUrlsWithMetadataForBookAndChapters } from '$lib/utils/data-handlers/bible';
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

async function fetchBibleContent(passage: BasePassage) {
    let bibleData;
    try {
        bibleData = await fetchFromCacheOrApi(`bibles/language/${get(currentLanguageId)}`);
    } catch (error) {
        // this means the user hasn't cached the Bible data, so just return empty
        return {};
    }
    if (bibleData[0]) {
        await cacheBibleContentForPassageIfOnline(bibleData[0], passage);
        const book = bibleData[0].contents.find(
            (book: FrontendBibleVersionBookContent) => book.bookId === passage.bookId
        );
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
        const chapters = await reduceAsync(
            fullBookText?.chapters ?? [],
            async (output, chapter) => {
                const chapterNumber = parseInt(chapter.number);
                if (passage.startChapter <= chapterNumber && passage.endChapter >= chapterNumber) {
                    const audioUrlData = filteredAudio.find((audioChapter: FrontendAudioChapter) => {
                        const audioChapterNumber = parseInt(audioChapter.number);
                        return audioChapterNumber === chapterNumber;
                    });
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
                                      ).start
                                    : audioUrlData.audioTimestamps[0].start;

                            const endTimestamp =
                                chapterNumber === passage.endChapter
                                    ? audioUrlData.audioTimestamps.find(
                                          ({ verseNumber }: AudioTimestamp) =>
                                              passage.endVerse === parseInt(verseNumber.split('-')[0])
                                      ).end
                                    : audioUrlData.audioTimestamps[audioUrlData.audioTimestamps.length - 1].end;

                            audioData = {
                                url,
                                startTimestamp,
                                endTimestamp,
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
                                        (chapterNumber === passage.startChapter &&
                                            verseNumber >= passage.startVerse)) &&
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
    } else {
        return {};
    }
}

async function cacheCbbterContentForPassageIfOnline(passageWithResources: ApiPassage) {
    if (get(isOnline)) {
        await cacheManyFromCdnWithProgress(cbbterUrlsWithMetadataForPassage(passageWithResources));
    }
}

async function fetchResourceContent(passage: BasePassage) {
    let allPassagesWithResources;
    try {
        allPassagesWithResources = (await fetchFromCacheOrApi(
            `passages/resources/language/${get(currentLanguageId)}`
        )) as ApiPassage[];
    } catch (error) {
        return { text: [], audio: [] };
    }
    const passageWithResources = allPassagesWithResources.find((thisPassage) => passagesEqual(thisPassage, passage));
    if (passageWithResources) {
        await cacheCbbterContentForPassageIfOnline(passageWithResources);
        const audioResourceContent = (
            passageWithResources.resources
                ?.filter(({ mediaType }) => mediaType === 2)
                ?.map(({ content }) => content?.content) || []
        )?.filter(Boolean) as ResourceContentSteps[];
        const textResources = passageWithResources.resources?.filter(({ mediaType }) => mediaType === 1) || [];
        const textResourceContent = await Promise.all(
            textResources.map(async ({ content }) => {
                const textContent = content?.content as ResourceContentUrl | null;
                return textContent?.url && (await fetchFromCacheOrCdn(textContent?.url));
            })
        );
        const imageResources =
            passageWithResources.resources
                .flatMap(({ supportingResources }) => supportingResources ?? [])
                .filter(({ mediaType }) => mediaType === 4) || [];
        const imageResourceContent = imageResources
            .map(({ content }) => {
                if (content) {
                    const imageContent = content.content as ResourceContentUrl;
                    return { displayName: content.displayName, url: imageContent?.url };
                }
            })
            .filter(Boolean) as CbbtErImageContent[];
        return {
            text: textResourceContent.map((content) => ({ steps: content } as CbbtErTextContent)),
            audio: audioResourceContent,
            images: imageResourceContent,
        };
    } else {
        return { text: [], audio: [] };
    }
}

export const load = (async ({ parent, params }) => {
    await parent(); // ensure languages have loaded
    const passage = stringToPassageType(params.slug);
    return { fetched: { bibleContent: fetchBibleContent(passage), resourceContent: fetchResourceContent(passage) } };
}) satisfies PageLoad;
