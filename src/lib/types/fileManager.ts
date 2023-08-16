export interface BibleBook {
    languageId: number | string;
    name: string;
    contents: BibleBookContent[];
}

export interface BibleBookContent {
    bookId: number;
    displayName: string;
    textUrl: string;
    audioUrls: {
        chapters: audioChapters[];
    };
    textSizeKb: number;
    audioSizeKb: number;
    expanded?: boolean;
}

export interface audioChapters {
    number: string;
    webmUrl: string;
    mp3Url: string;
    webmSizeKb: number;
    mp3SizeKb: number;
    audioTimestamps: audioTimestamps[];
}

export interface audioTimestamps {
    verseNumber: string;
    start: number;
    end: number;
}

export interface language {
    id: number;
    iso6393Code: string;
    englishDisplay: string;
}
