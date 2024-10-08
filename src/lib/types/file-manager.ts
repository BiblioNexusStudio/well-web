import type { DirectionCode } from '$lib/utils/language-utils';
import type { ApiParentResource, MediaType, ParentResourceId } from './resource';

export type Url = string;
export interface UrlWithMetadata {
    mediaType: MediaType;
    url: Url;
    contentId?: number;
    size: number;
    metadataOnly?: boolean;
    hasInlineMedia?: boolean;
}

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
    version: number;
    mediaTypeName: MediaType;
    parentResourceId: ParentResourceId;
    isResourceUrlCached?: boolean;
    inlineMediaSize: number | null;
}

export interface FrontendAudioChapter extends ApiAudioChapter {
    selected?: boolean;
    isAudioUrlCached?: boolean;
    allUrlsCached?: boolean;
    resourceMenuItems?: FileManagerResourceContentInfo[];
    fiaResourceUrls?: UrlWithMetadata[];
    deleteMenuOpen?: boolean;
    deleteResources?: boolean;
}

interface AudioResource {
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

export interface FooterInputs {
    text: boolean;
    audio: boolean;
    media: boolean;
}

export interface ResourcesMenuItem {
    name: string;
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
    isTextUrlCached?: boolean;
    bibleId: number | null;
    audioUrls: {
        chapters: FrontendAudioChapter[];
    } | null;
}

export interface ResourcesApiModule {
    chapters: ResourcesApiModuleChapter[];
}

export interface ResourcesApiModuleChapter {
    chapterNumber: number;
    contents: FileManagerResourceContentInfo[];
}
