import type { PassageResourceContent } from './passage';

export type Url = string;
export type UrlWithMetadata = { mediaType: MediaTypeEnum; url: Url; size: number };
export type TiptapContent = object;

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
    cached?: boolean;
    resourceMenuItems?: PassageResourceContent[];
    cbbterResourceUrls?: UrlWithMetadata[];
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

export interface ResourceContentUrl {
    url: string;
}

export interface ResourceContentTiptap {
    tiptap: TiptapContent;
}

export interface ResourceContentCbbtErText extends ResourceContentTiptap {
    stepNumber: number;
}

export interface CbbtErAudioSingleStepContent {
    step: number;
    webm: AudioResource;
    mp3: AudioResource;
}

export interface CbbtErTextSingleStepContent {
    stepNumber: number;
    contentHTML: string;
}

export interface CbbtErTextContent {
    displayName: string;
    steps: CbbtErTextSingleStepContent[];
}

export interface CbbtErAudioContent {
    steps: CbbtErAudioSingleStepContent[];
}

export interface ImageContent {
    displayName: string | null;
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
    content: CbbtErAudioContent | ResourceContentUrl;
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

export interface FooterInputs {
    text: boolean;
    audio: boolean;
    media: boolean;
}

export interface ResourcesMenuItem {
    name: string;
    value: string;
    selected: boolean;
    isBible: boolean;
    display: boolean;
}

export interface BiblesModule {
    id: 0;
    name: 'string';
    abbreviation: 'string';
    books: [
        {
            bookCode: 'string';
            displayName: 'string';
            textSize: 0;
            audioSize: 0;
            chapterCount: 0;
        }
    ];
}

export interface BiblesModuleBook {
    bookCode: string;
    displayName: string;
    textSize: 0;
    audioSize: 0;
    chapterCount: 0;
    textUrl: string;
    audioUrls: {
        chapters: FrontendAudioChapter[];
    };
}

export interface CbbterPassage {
    bookCode: string;
    endChapter: number;
    endVerse: number;
    id: number;
    startChapter: number;
    startVerse: number;
}
export interface CbbterResource {
    bookCode: string;
    passages: CbbterPassage[];
}

export interface CbbterTextContent {
    contentId: number;
    typeName: string;
    mediaTypeName: string;
    contentSize: number;
}

export interface CbbterResourceWithContent {
    id: number;
    bookCode: string;
    startChapter: number;
    endChapter: number;
    contents: CbbterTextContent[];
}

export interface ResourcesApiModule {
    chapters: ResourcesApiModuleChapter[];
}

export interface ResourcesApiModuleChapter {
    chapterNumber: number;
    contents: PassageResourceContent[];
}
