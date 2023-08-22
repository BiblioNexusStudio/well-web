import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { fetchFromCacheOrApi, fetchFromCacheOrCdn } from '$lib/data-cache';
import { currentLanguageId } from '$lib/stores/current-language.store';
import { stringToPassageType } from '$lib/utils/passage-helpers';
import type { AudioChapter, AudioTimestamp, BibleVersionBookContent, Passage, Resource } from '$lib/types/fileManager';
import type { BibleBookTextContent } from '$lib/types/bible-text-content';
import { passagesEqual } from '$lib/utils/passage-helpers';
import { isIOSSafari } from '$lib/utils/browser';

async function fetchBibleContent(passage: Passage) {
    const [{ contents: books }] = await fetchFromCacheOrApi(`bibles/language/${get(currentLanguageId)}`);
    const book = books.find((book: BibleVersionBookContent) => book.bookId === passage.bookId);
    const fullBookText = (await fetchFromCacheOrCdn(book.textUrl)) as BibleBookTextContent;
    const filteredAudio = book.audioUrls.chapters.filter((chapter: AudioChapter) => {
        const chapterNumber = parseInt(chapter.number);
        return passage.startChapter <= chapterNumber && passage.endChapter >= chapterNumber;
    });
    const chapters = fullBookText.chapters.reduce((output, chapter) => {
        const chapterNumber = parseInt(chapter.number);
        if (passage.startChapter <= chapterNumber && passage.endChapter >= chapterNumber) {
            const audioUrlData = filteredAudio.find((audioChapter: AudioChapter) => {
                const chapterNumber = parseInt(audioChapter.number);
                return passage.startChapter <= chapterNumber && passage.endChapter >= chapterNumber;
            });
            const audioData = {
                url: isIOSSafari() ? audioUrlData.mp3.url : audioUrlData.webm.url,
                startTimestamp: audioUrlData.audioTimestamps.find(({ verseNumber }: AudioTimestamp) => {
                    return passage.startVerse === parseInt(verseNumber.split('-')[0]);
                }).start,
                endTimestamp: audioUrlData.audioTimestamps.find(({ verseNumber }: AudioTimestamp) => {
                    return passage.endVerse === parseInt(verseNumber.split('-')[0]);
                }).end,
            };
            return [
                ...output,
                {
                    number: chapter.number,
                    audioData,
                    versesText: chapter.verses.filter((verse) => {
                        const verseNumber = parseInt(verse.number.split('-')[0]);
                        return passage.startVerse <= verseNumber && passage.endVerse >= verseNumber;
                    }),
                },
            ];
        } else {
            return output;
        }
    }, []);
    return { bookName: book.displayName, chapters };
}

async function fetchResourceContent(passage: Passage) {
    const allResourcesWithPassages = (await fetchFromCacheOrApi(
        `resources/language/${get(currentLanguageId)}`
    )) as Resource[];
    const scopedResources = allResourcesWithPassages.filter(({ passages }) =>
        passages.some((p) => passagesEqual(p, passage))
    );
    const audioResourceContent = scopedResources
        .filter(({ mediaType }) => mediaType === 2)
        .map(({ content }) => content);
    const textResources = scopedResources.filter(({ mediaType }) => mediaType === 1);
    const textResourceContent = await Promise.all(
        textResources.map(async ({ content }) => await fetchFromCacheOrCdn(content.url))
    );
    return {
        textResourceContent: textResourceContent.map((content) => ({ steps: content })),
        audioResourceContent,
    };
}

export const load = (async ({ parent, params }) => {
    await parent(); // ensure languages have loaded
    const passage = stringToPassageType(params.slug);
    const bibleContent = await fetchBibleContent(passage);
    const resourceContent = await fetchResourceContent(passage);
    return { ...bibleContent, ...resourceContent };
}) satisfies PageLoad;
