import type { Passage } from '$lib/types/fileManager';

export function passageTypeToString(passage: Passage) {
    return `1${String(passage.bookId).padStart(3, '0')}${String(passage.startChapter).padStart(3, '0')}${String(
        passage.startVerse
    ).padStart(3, '0')}${String(passage.endChapter).padStart(3, '0')}${String(passage.endVerse).padStart(3, '0')}`;
}

export function stringToPassageType(passageString: string): Passage {
    return {
        bookId: parseInt(passageString.substring(1, 4), 10),
        startChapter: parseInt(passageString.substring(4, 7), 10),
        startVerse: parseInt(passageString.substring(7, 10), 10),
        endChapter: parseInt(passageString.substring(10, 13), 10),
        endVerse: parseInt(passageString.substring(13, 16), 10),
    };
}

export function passagesEqual(passage1: Passage, passage2: Passage): boolean {
    return (
        passage1.bookId === passage2.bookId &&
        passage1.startChapter === passage2.startChapter &&
        passage1.endChapter === passage2.endChapter &&
        passage1.startVerse === passage2.startVerse &&
        passage1.endVerse === passage2.endVerse
    );
}

export function passageToReference(passage: Passage): string {
    if (passage.startChapter === passage.endChapter) {
        return `${passage.startChapter}:${passage.startVerse}-${passage.endVerse}`;
    }
    return `${passage.startChapter}:${passage.startVerse}-${passage.endChapter}:${passage.endVerse}`;
}
