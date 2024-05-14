import type { DirectionCode } from '$lib/utils/language-utils';
import type { ApiParentResource, MediaType, ParentResourceName } from './resource';

export type Url = string;
export interface UrlWithMetadata {
    mediaType: MediaType;
    url: Url;
    contentId?: number;
    size: number;
    metadataOnly?: boolean;
}
export type TiptapContent = object;

export interface ApiAudioChapter {
    number: string;
    webm: AudioResource;
    mp3: AudioResource;
    audioTimestamps: AudioTimestamp[] | null;
    selected?: boolean;
}

export interface FileManagerResourceContentInfo {
    contentId: number;
    contentSize: number;
    mediaTypeName: MediaType;
    parentResourceName: ParentResourceName;
    isResourceUrlCached?: boolean;
}

export interface FrontendAudioChapter extends ApiAudioChapter {
    selected?: boolean;
    isAudioUrlCached?: boolean;
    allUrlsCached?: boolean;
    resourceMenuItems?: FileManagerResourceContentInfo[];
    cbbterResourceUrls?: UrlWithMetadata[];
    deleteMenuOpen?: boolean;
    deleteResources?: boolean;
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
    displayName: string;
    enabled: boolean;
    scriptDirection: DirectionCode;
}

export interface DownloadData {
    totalSizeToDownload: number;
    nonMetadataSizeToDownload: number;
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
    parentResource: ApiParentResource | null;
}

export interface BiblesModule {
    id: number;
    name: string;
    abbreviation: string;
    books: [
        {
            bookCode: string;
            displayName: string;
            textSize: number;
            audioSize: number;
            chapterCount: number;
        },
    ];
}

export interface BiblesModuleBook {
    bookCode: string;
    displayName: string;
    textSize: number;
    audioSize: number;
    chapterCount: number;
    textUrl: string;
    isTextUrlCached?: boolean;
    audioUrls: {
        chapters: FrontendAudioChapter[];
    } | null;
}

export interface CbbterTextContent {
    contentId: number;
    parentResourceName: string;
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
    contents: FileManagerResourceContentInfo[];
}
