import { writable, derived, get } from 'svelte/store';
import type { BaseBible, ApiBibleContents, ApiChapterContents } from '$lib/types/bible-text-content';
import { browser } from '$app/environment';
import { currentLanguageInfo } from './language.store';

export const bibleWellBibleSetByUser = 'BIBLE_WELL_BIBLE_SET_BY_USER';

export const fetchedBaseBibles = writable<BaseBible[]>([]);

export const bibleStoredByUser = derived(fetchedBaseBibles, ($bibles) => {
    const localId = browser && localStorage.getItem(bibleWellBibleSetByUser);
    return $bibles.find((b: BaseBible) => b.id.toString() === localId) || null;
});

export const baseBibleSetByUser = writable<BaseBible | null>(null);

export const fetchedBaseBiblesWithLanguageDefault = derived(
    [currentLanguageInfo, fetchedBaseBibles],
    ([$language, $bibles]) => {
        const bibleIdsInCurrentLanguage = $bibles
            .filter(({ languageId }) => languageId === $language?.id)
            .map(({ id }) => id);

        return $bibles.map((b) => {
            return { ...b, defaultForCurrentLanguage: bibleIdsInCurrentLanguage.includes(b.id) };
        });
    }
);

export const bibleDataFetchedByUser = writable<ApiBibleContents[]>([]);

export const currentBibleSetByUser = writable<ApiBibleContents | null>(null);

export const loadingContent = writable<boolean>(false);

export const currentBookNumber = writable<number>(0);

export const currentStartChapter = writable<number>(0);

export const currentEndChapter = writable<number>(0);

export const currentStartVerse = writable<number>(0);

export const currentEndVerse = writable<number>(0);

currentBibleSetByUser.subscribe((value) => {
    const newBaseBible = get(fetchedBaseBibles).find((b: BaseBible) => b.id === value?.bibleId) || null;
    baseBibleSetByUser.set(newBaseBible);
});

export const filterBookByRange = function (
    chapters: ApiChapterContents[],
    startChapter: number,
    endChapter: number,
    startVerse: number,
    endVerse: number
) {
    const filteredBook = [];

    for (const chapter of chapters) {
        const chapterNumber = chapter?.number;

        if (chapterNumber < startChapter || chapterNumber > endChapter) {
            continue;
        }

        const filteredVerses = [];

        for (const verse of chapter.verses) {
            const verseNumber = verse.number;

            if (
                (chapterNumber === startChapter &&
                    verseNumber >= startVerse &&
                    chapterNumber === endChapter &&
                    verseNumber <= endVerse) ||
                (chapterNumber === startChapter && verseNumber >= startVerse && chapterNumber < endChapter) ||
                (chapterNumber > startChapter && chapterNumber < endChapter) ||
                (chapterNumber === endChapter && verseNumber <= endVerse && chapterNumber > startChapter)
            ) {
                filteredVerses.push(verse);
            }
        }

        if (filteredVerses.length > 0) {
            filteredBook.push({
                number: chapterNumber,
                verses: filteredVerses,
            });
        }
    }

    return filteredBook;
};
