import type { BibleSection, FrontendBibleBook, BaseBible } from '$lib/types/bible';
import { handleRtlVerseReferences, type DirectionCode } from './language-utils';
import { lookupLanguageInfoById } from '$lib/stores/language.store';

const newTestamentBooks = [
    'MAT',
    'MRK',
    'LUK',
    'JHN',
    'ACT',
    'ROM',
    '1CO',
    '2CO',
    'GAL',
    'EPH',
    'PHP',
    'COL',
    '1TH',
    '2TH',
    '1TI',
    '2TI',
    'TIT',
    'PHM',
    'HEB',
    'JAS',
    '1PE',
    '2PE',
    '1JN',
    '2JN',
    '3JN',
    'JUD',
    'REV',
];

const bookNumbersToCodes: Record<number, string> = {
    1: 'GEN',
    2: 'EXO',
    3: 'LEV',
    4: 'NUM',
    5: 'DEU',
    6: 'JOS',
    7: 'JDG',
    8: 'RUT',
    9: '1SA',
    10: '2SA',
    11: '1KI',
    12: '2KI',
    13: '1CH',
    14: '2CH',
    15: 'EZR',
    16: 'NEH',
    17: 'EST',
    18: 'JOB',
    19: 'PSA',
    20: 'PRO',
    21: 'ECC',
    22: 'SNG',
    23: 'ISA',
    24: 'JER',
    25: 'LAM',
    26: 'EZK',
    27: 'DAN',
    28: 'HOS',
    29: 'JOL',
    30: 'AMO',
    31: 'OBA',
    32: 'JON',
    33: 'MIC',
    34: 'NAM',
    35: 'HAB',
    36: 'ZEP',
    37: 'HAG',
    38: 'ZEC',
    39: 'MAL',
    41: 'MAT',
    42: 'MRK',
    43: 'LUK',
    44: 'JHN',
    45: 'ACT',
    46: 'ROM',
    47: '1CO',
    48: '2CO',
    49: 'GAL',
    50: 'EPH',
    51: 'PHP',
    52: 'COL',
    53: '1TH',
    54: '2TH',
    55: '1TI',
    56: '2TI',
    57: 'TIT',
    58: 'PHM',
    59: 'HEB',
    60: 'JAS',
    61: '1PE',
    62: '2PE',
    63: '1JN',
    64: '2JN',
    65: '3JN',
    66: 'JUD',
    67: 'REV',
    68: 'TOB',
    69: 'JDT',
    70: 'ESG',
    71: 'WIS',
    72: 'SIR',
    73: 'BAR',
    74: 'LJE',
    75: 'S3Y',
    76: 'SUS',
    77: 'BEL',
    78: '1MA',
    79: '2MA',
    80: '3MA',
    81: '4MA',
    82: '1ES',
    83: '2ES',
    84: 'MAN',
    85: 'PS2',
    86: 'ODA',
    87: 'PSS',
};

export function bibleSectionToString(bibleSection: BibleSection | null) {
    if (!bibleSection) {
        return null;
    }
    return `${bibleSection.bookCode}${String(bibleSection.startChapter).padStart(3, '0')}${String(
        bibleSection.startVerse
    ).padStart(3, '0')}-${String(bibleSection.endChapter).padStart(3, '0')}${String(bibleSection.endVerse).padStart(
        3,
        '0'
    )}`;
}

export function alignmentScriptureStringToReference(scriptureString: string, bookCodesToNames: Map<string, string>) {
    const bookNumber = parseInt(scriptureString.slice(0, 3)) + 1;
    const bookName = bookCodesToNames.get(bookNumbersToCodes[bookNumber] ?? '');
    const chapter = parseInt(scriptureString.slice(3, 6), 10);
    const verse = parseInt(scriptureString.slice(6, 9), 10);

    const bibleSection: BibleSection = {
        bookCode: '',
        startChapter: chapter,
        startVerse: verse,
        endChapter: chapter,
        endVerse: verse,
    };

    const reference = bibleSectionToReference(bibleSection, undefined);
    return `${bookName} ${reference}`;
}

export function stringToBibleSection(sectionString: string): BibleSection {
    const bookCode = sectionString.slice(0, 3);
    const startChapter = parseInt(sectionString.slice(3, 6), 10);
    const startVerse = parseInt(sectionString.slice(6, 9), 10);
    const endChapter = parseInt(sectionString.slice(10, 13), 10);
    const endVerse = parseInt(sectionString.slice(13, 16), 10);

    return {
        bookCode,
        startChapter,
        startVerse,
        endChapter,
        endVerse,
    };
}

export function isNewTestament(bibleSection: BibleSection | null) {
    return !!bibleSection && newTestamentBooks.includes(bibleSection.bookCode);
}

export function bibleSectionsEqual(passage1: BibleSection, passage2: BibleSection) {
    return (
        passage1.bookCode === passage2.bookCode &&
        passage1.startChapter === passage2.startChapter &&
        passage1.endChapter === passage2.endChapter &&
        passage1.startVerse === passage2.startVerse &&
        passage1.endVerse === passage2.endVerse
    );
}

export function bibleSectionToReference(bibleSection: BibleSection, scriptDirection: DirectionCode | undefined) {
    let reference: string;
    if (bibleSection.startChapter === bibleSection.endChapter) {
        if (bibleSection.startVerse === bibleSection.endVerse) {
            reference = `${bibleSection.startChapter}:${bibleSection.startVerse}`;
        } else {
            reference = `${bibleSection.startChapter}:${bibleSection.startVerse}-${bibleSection.endVerse}`;
        }
    } else {
        reference = `${bibleSection.startChapter}:${bibleSection.startVerse}-${bibleSection.endChapter}:${bibleSection.endVerse}`;
    }
    return handleRtlVerseReferences(reference, scriptDirection)!;
}

export function sortAndFilterBibles(
    bibles: FrontendBibleBook[] | BaseBible[],
    currentLanguageInfoId: number | undefined,
    searchQuery: string
) {
    return bibles
        .map((bible) => ({ ...bible, languageCode: lookupLanguageInfoById(bible.languageId)?.iso6393Code }))
        .filter(
            ({ abbreviation, name, languageCode }) =>
                languageCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((first, second) => {
            if (currentLanguageInfoId) {
                if (first.languageId === currentLanguageInfoId && second.languageId !== currentLanguageInfoId) {
                    return -1;
                }
                if (first.languageId !== currentLanguageInfoId && second.languageId === currentLanguageInfoId) {
                    return 1;
                }
            }

            const languageComparison = (first.languageCode ?? '').localeCompare(second.languageCode ?? '');
            return languageComparison !== 0 ? languageComparison : first.name.localeCompare(second.name);
        });
}
