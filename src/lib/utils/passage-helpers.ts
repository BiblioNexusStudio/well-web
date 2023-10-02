import type { BasePassage } from '$lib/types/passage';

export function passageToString(passage: BasePassage) {
    return `${passage.bookCode}${String(passage.startChapter).padStart(3, '0')}${String(passage.startVerse).padStart(
        3,
        '0'
    )}-${String(passage.endChapter).padStart(3, '0')}${String(passage.endVerse).padStart(3, '0')}`;
}

export function passagesEqual(passage1: BasePassage, passage2: BasePassage): boolean {
    return (
        passage1.bookCode === passage2.bookCode &&
        passage1.startChapter === passage2.startChapter &&
        passage1.endChapter === passage2.endChapter &&
        passage1.startVerse === passage2.startVerse &&
        passage1.endVerse === passage2.endVerse
    );
}

export function passageToReference(passage: BasePassage): string {
    if (passage.startChapter === passage.endChapter) {
        return `${passage.startChapter}:${passage.startVerse}-${passage.endVerse}`;
    }
    return `${passage.startChapter}:${passage.startVerse}-${passage.endChapter}:${passage.endVerse}`;
}
