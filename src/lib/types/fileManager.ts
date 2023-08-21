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
    textSize: number;
    audioSize: number;
    expanded?: boolean;
    selected?: boolean;
    textSelected?: boolean;
}

export interface audioChapters {
    number: string;
    webm: audioResource;
    mp3: audioResource;
    audioTimestamps: audioTimestamps[];
    selected?: boolean;
}

export interface audioResource {
    url: string;
    size: number;
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

export interface DownloadData {
    totalSizeToDownload: number;
    totalSizeToDelete: number;
    urlsToDownload: string[];
    urlsToDelete: string[];
}
