import type { BibleSection } from '$lib/types/bible';

export function bibleSectionToString(bibleSection: BibleSection) {
    return `${bibleSection.bookCode}${String(bibleSection.startChapter).padStart(3, '0')}${String(
        bibleSection.startVerse
    ).padStart(3, '0')}-${String(bibleSection.endChapter).padStart(3, '0')}${String(bibleSection.endVerse).padStart(
        3,
        '0'
    )}`;
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

export function bibleSectionsEqual(passage1: BibleSection, passage2: BibleSection): boolean {
    return (
        passage1.bookCode === passage2.bookCode &&
        passage1.startChapter === passage2.startChapter &&
        passage1.endChapter === passage2.endChapter &&
        passage1.startVerse === passage2.startVerse &&
        passage1.endVerse === passage2.endVerse
    );
}

export function bibleSectionToReference(bibleSection: BibleSection): string {
    if (bibleSection.startChapter === bibleSection.endChapter) {
        if (bibleSection.startVerse === bibleSection.endVerse) {
            return `${bibleSection.startChapter}:${bibleSection.startVerse}`;
        }
        return `${bibleSection.startChapter}:${bibleSection.startVerse}-${bibleSection.endVerse}`;
    }
    return `${bibleSection.startChapter}:${bibleSection.startVerse}-${bibleSection.endChapter}:${bibleSection.endVerse}`;
}
