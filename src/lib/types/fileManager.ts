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

export interface Resource {
    languageId: number;
    displayName: string;
    summary: string | null;
    content: ResourceContentSteps | ResourceContentUrl | null;
    contentSize: number;
    type: number;
    mediaType: number;
    englishLabel: string;
    tags: string | null;
    passages: Passage[];
    expanded?: boolean;
    selected?: boolean;
}

export interface Passage {
    bookId: number;
    startChapter: number;
    endChapter: number;
    startVerse: number;
    endVerse: number;
}

export interface ResourceContentSteps {
    steps: ResourceStep[];
}

export interface ResourceStep {
    step: number;
    webm: audioResource;
    mp3: audioResource;
}

export interface ResourceContentUrl {
    url: string;
}

export interface Passages {
    bookId: number;
    bookName: string;
    startChapter: number;
    endChapter: number;
    startVerse: number;
    endVerse: number;
    resources: PassagesResource[];
    expanded?: boolean;
    selected?: boolean;
}

export interface PassagesResource {
    content: PassagesContent | null;
    type: number;
    mediaType: number;
    englishLabel: string;
    tag: string | null;
    expanded?: boolean;
    selected?: boolean;
}

export interface PassagesContent {
    languageId: number;
    displayName: string;
    summary: string | null;
    content: ResourceContentSteps | ResourceContentUrl;
    contentSize: number;
    selected?: boolean;
}
