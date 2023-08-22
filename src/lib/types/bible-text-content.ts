export interface BibleBookTextContent {
    chapters: BibleBookTextChapter[];
}

export interface BibleBookTextChapter {
    number: string;
    verses: BibleBookTextVerse[];
}

export interface BibleBookTextVerse {
    number: string;
    text: string;
}
