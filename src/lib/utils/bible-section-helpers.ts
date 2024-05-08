import type { BibleSection } from '$lib/types/passage';

export function bibleSectionToString(bibleSection: BibleSection) {
    return `${bibleSection.bookCode}${String(bibleSection.startChapter).padStart(3, '0')}${String(
        bibleSection.startVerse
    ).padStart(3, '0')}-${String(bibleSection.endChapter).padStart(3, '0')}${String(bibleSection.endVerse).padStart(
        3,
        '0'
    )}`;
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
        return `${bibleSection.startChapter}:${bibleSection.startVerse}-${bibleSection.endVerse}`;
    }
    return `${bibleSection.startChapter}:${bibleSection.startVerse}-${bibleSection.endChapter}:${bibleSection.endVerse}`;
}
