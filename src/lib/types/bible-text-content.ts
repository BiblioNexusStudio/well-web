import type { FrontendAudioChapter } from './file-manager';
import type { ApiLicenseInfo } from './resource';

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

export interface BaseBible {
    abbreviation: string;
    id: number;
    name: string;
    languageId: number;
    licenseInfo: ApiLicenseInfo | null;
}

export interface ApiBible extends BaseBible {
    books: ApiBibleBookContent[];
}

export interface FrontendBibleBook extends BaseBible {
    bookMetadata: BibleBookContentDetails | null;
    defaultForCurrentLanguage: boolean;
    loadingContent: boolean;
    content: { chapters: FrontendChapterContent[] } | null;
}

export interface BaseBibleBookContent {
    audioSize: number;
    textSize: number;
    bookCode: string;
    chapterCount: number;
    displayName: string;
}

export type ApiBibleBookContent = BaseBibleBookContent;

export interface BibleBookContentDetails extends BaseBibleBookContent {
    textUrl: string;
    audioUrls: { chapters: FrontendAudioChapter[] } | null;
}

export interface FrontendChapterAudioData {
    url: string;
    startTimestamp: number | null;
    endTimestamp: number | null;
}

export interface FrontendChapterContent {
    number: string;
    audioData: FrontendChapterAudioData | null;
    versesText: { number: string; text: string }[];
}
