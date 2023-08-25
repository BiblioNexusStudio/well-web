import type { UrlWithSize } from '$lib/data-cache';

export interface BibleVersion {
    languageId: number | string;
    name: string;
    contents: BibleVersionBookContent[];
}

export interface BibleVersionBookContent {
    bookId: number;
    displayName: string;
    textUrl: string;
    audioUrls: {
        chapters: AudioChapter[];
    };
    textSize: number;
    audioSize: number;
    expanded?: boolean;
    selected?: boolean;
    textSelected?: boolean;
}

export interface AudioChapter {
    number: string;
    webm: AudioResource;
    mp3: AudioResource;
    audioTimestamps: AudioTimestamp[];
    selected?: boolean;
}

export interface AudioResource {
    url: string;
    size: number;
}

export interface AudioTimestamp {
    verseNumber: string;
    start: number;
    end: number;
}

export interface Language {
    id: number;
    iso6393Code: string;
    englishDisplay: string;
}

export interface DownloadData {
    totalSizeToDownload: number;
    totalSizeToDelete: number;
    urlsToDownload: UrlWithSize[];
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
    webm: AudioResource;
    mp3: AudioResource;
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
