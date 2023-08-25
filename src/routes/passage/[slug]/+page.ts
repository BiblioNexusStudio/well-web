import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { fetchFromCacheOrApi, fetchFromCacheOrCdn, isCachedFromCdn } from '$lib/data-cache';
import { currentLanguageId } from '$lib/stores/current-language.store';
import { stringToPassageType } from '$lib/utils/passage-helpers';
import type { AudioChapter, AudioTimestamp, BibleVersionBookContent, Passage, Passages } from '$lib/types/file-manager';
import type { BibleBookTextContent } from '$lib/types/bible-text-content';
import { passagesEqual } from '$lib/utils/passage-helpers';
import { audioFileTypeForBrowser } from '$lib/utils/browser';
import { reduceAsync } from '$lib/utils/async-array';

async function fetchBibleContent(passage: Passage) {
    let bibleData;
    try {
        bibleData = await fetchFromCacheOrApi(`bibles/language/${get(currentLanguageId)}`);
    } catch (error) {
        console.log(error);
        return {};
    }
    if (bibleData[0]) {
        const book = bibleData[0].contents.find((book: BibleVersionBookContent) => book.bookId === passage.bookId);
        const fullBookText = (await fetchFromCacheOrCdn(book.textUrl)) as BibleBookTextContent;
        const filteredAudio = book.audioUrls.chapters.filter((chapter: AudioChapter) => {
            const chapterNumber = parseInt(chapter.number);
            return passage.startChapter <= chapterNumber && passage.endChapter >= chapterNumber;
        });
        const chapters = await reduceAsync(
            fullBookText.chapters,
            async (output, chapter) => {
                const chapterNumber = parseInt(chapter.number);
                if (passage.startChapter <= chapterNumber && passage.endChapter >= chapterNumber) {
                    const audioUrlData = filteredAudio.find((audioChapter: AudioChapter) => {
                        const audioChapterNumber = parseInt(audioChapter.number);
                        return audioChapterNumber === chapterNumber;
                    });
                    let audioData: { url: string; startTimestamp: number; endTimestamp: number } | null = null;
                    const url = audioUrlData[audioFileTypeForBrowser()].url;
                    if (navigator.onLine || (await isCachedFromCdn(url))) {
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
            []
        );
        return { bookName: book.displayName, chapters };
    } else {
        return {};
    }
}

async function fetchResourceContent(passage: Passage) {
    let allPassagesWithResources;
    try {
        allPassagesWithResources = (await fetchFromCacheOrApi(
            `passages/resources/language/${get(currentLanguageId)}`
        )) as Passages[];
    } catch (error) {
        console.log(error);
        return {};
    }
    const passageWithResources = allPassagesWithResources.find((thisPassage) => passagesEqual(thisPassage, passage));
    if (passageWithResources) {
        const audioResourceContent = (
            passageWithResources.resources
                ?.filter(({ mediaType }) => mediaType === 2)
                ?.map(({ content }) => content?.content) || []
        )?.filter(Boolean);
        const textResources = passageWithResources.resources?.filter(({ mediaType }) => mediaType === 1) || [];
        const textResourceContent = await Promise.all(
            textResources.map(async ({ content }) => await fetchFromCacheOrCdn(content?.content.url))
        );
        return {
            text: textResourceContent.map((content) => ({ steps: content })),
            audio: audioResourceContent,
        };
    } else {
        return {};
    }
}

export const load = (async ({ parent, params }) => {
    await parent(); // ensure languages have loaded
    const passage = stringToPassageType(params.slug);
    return { fetched: { bibleContent: fetchBibleContent(passage), resourceContent: fetchResourceContent(passage) } };
}) satisfies PageLoad;
