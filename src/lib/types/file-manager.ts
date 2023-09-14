export type Url = string;
export type UrlWithMetadata = { mediaType: MediaTypeEnum; url: Url; size: number };

export interface BaseBibleVersion {
    languageId: number;
    name: string;
}

export interface ApiBibleVersion extends BaseBibleVersion {
    contents: ApiBibleVersionBookContent[];
}

export interface FrontendBibleVersion extends BaseBibleVersion {
    contents: FrontendBibleVersionBookContent[];
}

export interface BaseBibleVersionBookContent {
    bookId: number;
    displayName: string;
    textUrl: string;
    textSize: number;
    audioSize: number;
}

export interface ApiBibleVersionBookContent extends BaseBibleVersionBookContent {
    audioUrls: {
        chapters: ApiAudioChapter[];
    };
}

export interface FrontendBibleVersionBookContent extends BaseBibleVersionBookContent {
    audioUrls: {
        chapters: FrontendAudioChapter[];
    };
    expanded?: boolean;
    selected?: boolean;
    textSelected?: boolean;
}

export interface ApiAudioChapter {
    number: string;
    webm: AudioResource;
    mp3: AudioResource;
    audioTimestamps: AudioTimestamp[] | null;
    selected?: boolean;
}

export interface FrontendAudioChapter extends ApiAudioChapter {
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
    urlsToDownload: UrlWithMetadata[];
    urlsToDelete: string[];
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

export interface CbbtErTextContent {
    steps: { stepNumber: number; contentHTML: string }[];
}

export interface CbbtErImageContent {
    displayName: string;
    url: string;
}

export interface BasePassage {
    bookId: number;
    bookName?: string;
    startChapter: number;
    endChapter: number;
    startVerse: number;
    endVerse: number;
}

export interface ApiPassage extends BasePassage {
    resources: ApiPassageResource[];
}

export interface FrontendPassage extends BasePassage {
    resources: ResourcesByMediaType;
    expanded?: boolean;
    selected?: boolean;
    primaryResourceName?: string;
}

export interface ApiPassageResource {
    content: ApiPassageContent | null;
    type: number;
    mediaType: number;
    englishLabel: string;
    tag: string | null;
    expanded?: boolean;
    selected?: boolean;
    supportingResources: ApiPassageResource[];
}

export interface ApiPassageContent {
    languageId: number;
    displayName: string;
    summary: string | null;
    content: ResourceContentSteps | ResourceContentUrl;
    contentSize: number;
    selected?: boolean;
}

export interface ResourcesByMediaType {
    [MediaType.text]: ResourcesForMediaType;
    [MediaType.audio]: ResourcesForMediaType;
    [MediaType.images]: ResourcesForMediaType;
}

export interface ResourcesForMediaType {
    urlsWithMetadata: UrlWithMetadata[];
    selected: boolean;
}

export const MediaType = {
    text: 'text',
    audio: 'audio',
    images: 'images',
} as const;

export type MediaTypeEnum = (typeof MediaType)[keyof typeof MediaType];
