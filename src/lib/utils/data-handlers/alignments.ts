import { englishWordsWithGreekAlignmentsForBookAndChapter } from '$lib/api-endpoints';
import { fetchFromCacheOrApi } from '$lib/data-cache';
import { asyncMap } from '$lib/utils/async-array';
import { range } from '$lib/utils/array';
import type { BibleSection } from '$lib/types/bible';
import { alignmentScriptureStringToReference } from '../bible-section-helpers';

export interface EnglishWordWithGreekAlignmentForVerse {
    verse: number;
    words: EnglishWordWithGreekAlignment[];
}

export interface EnglishWordWithGreekAlignment {
    word: string;
    nextWordIsInGroup: boolean;
    greekWords: GreekWord[];
}

export interface GreekWord {
    word: string;
    senses: GreekSense[];
}

export interface GreekSense {
    glosses: string[];
    definition: string;
}

export async function fetchEnglishWordsWithGreekAlignmentsForSection(bibleId: number, bibleSection: BibleSection) {
    const chapters = range(bibleSection.startChapter, bibleSection.endChapter);
    const chapterData = await asyncMap(chapters, async (chapter) => {
        const data = await fetchEnglishWordsWithGreekAlignmentsForBookAndChapter(
            bibleId,
            bibleSection.bookCode,
            chapter
        );
        const verseMap = new Map(data.map((verse) => [verse.verse, verse.words]));
        return [chapter, verseMap] as [number, typeof verseMap];
    });
    return new Map(chapterData);
}

export function findSelectedWordIndexesAndGreekWordsForEnglish(
    englishWordIndex: number,
    englishWord: string | undefined,
    verseData: EnglishWordWithGreekAlignment[]
) {
    let selectedWordIndexes: number[] = [];
    const range = [0, -1, 1, -2, 2];
    for (const offset of range) {
        const targetIndex = englishWordIndex + offset;
        if (targetIndex >= 0 && targetIndex < verseData.length) {
            const word = verseData[targetIndex];
            if (word && word.word.replace(/[’‘]/g, "'") === englishWord) {
                selectedWordIndexes = [targetIndex - offset];

                let nextIndex = targetIndex;
                while (verseData[nextIndex]?.nextWordIsInGroup && nextIndex < verseData.length - 1) {
                    nextIndex++;
                    selectedWordIndexes.push(nextIndex - offset);
                }

                let prevIndex = targetIndex;
                while (prevIndex > 0) {
                    prevIndex--;
                    if (verseData[prevIndex]?.nextWordIsInGroup) {
                        selectedWordIndexes.unshift(prevIndex - offset);
                    } else {
                        return { selectedWordIndexes, greekWords: verseData[prevIndex + 1]?.greekWords ?? [] };
                    }
                }
                return { selectedWordIndexes, greekWords: verseData[prevIndex]?.greekWords ?? [] };
            }
        }
    }
}

export function formatAlignmentDefinition(definition: string, bookCodesToNames: Map<string, string>) {
    return definition
        .replace(/{N:\s?[^}]+}|{A:\s?[^}]+}/g, '')
        .replace(/{S:\s?(\d{14})}/g, (_, code) => alignmentScriptureStringToReference(code, bookCodesToNames))
        .replace(/{L:\s?([^}<]+).*?}(?:\[.+?\])?\s*(?:[’‘']([^’‘']+?),?[’‘'])?\s*(?:\{D:[^}]+\})/g, '$1 ’$2’')
        .replace(/{L:\s?([^}<]+).*?}(?:\[.+?\])?\s*(.*?),?\s*(?:\{D:[^}]+?\})/g, '$1 ’$2’')
        .replace(/{L:\s?([^}<]+).*?}(?:\[.+?\])?/g, '$1')
        .replace(/,([’‘'])\s*{D:\s?[\d.]+}/g, '$1')
        .replace(/\[[a-f]\]/g, '')
        .replace(/{D:\s?([\d.]+)}/g, 'entry $1');
}

async function fetchEnglishWordsWithGreekAlignmentsForBookAndChapter(
    bibleId: number,
    bookCode: string,
    chapter: number
) {
    return (await fetchFromCacheOrApi(
        ...englishWordsWithGreekAlignmentsForBookAndChapter(bibleId, bookCode, chapter)
    )) as EnglishWordWithGreekAlignmentForVerse[];
}
