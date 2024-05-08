export enum ParentResourceName {
    BiblicaBibleDictionary = 'BiblicaBibleDictionary',
    BiblicaStudyNotes = 'BiblicaStudyNotes',
    CBBTER = 'CBBTER',
    TyndaleBibleDictionary = 'TyndaleBibleDictionary',
    TyndaleStudyNotes = 'TyndaleStudyNotes',
    UWTranslationWords = 'UWTranslationWords',
    UbsImages = 'UbsImages',
    VideoBibleDictionary = 'VideoBibleDictionary',
}

export enum MediaType {
    Text = 'Text',
    Audio = 'Audio',
    Video = 'Video',
    Image = 'Image',
    Metadata = 'Metadata',
}

export enum ParentResourceComplexityLevel {
    None = 'None',
    Basic = 'Basic',
    Advanced = 'Advanced',
}

export enum ParentResourceType {
    None = 'None',
    Guide = 'Guide',
    Dictionary = 'Dictionary',
    StudyNotes = 'StudyNotes',
    Images = 'Images',
    Videos = 'Videos',
}

export interface ResourceContentMetadata {
    displayName: string;
    metadata: Record<string, unknown>;
}

export interface ResourceContentTiptap {
    tiptap: object;
}

export interface UrlWithInfo {
    url: string;
    mediaType: MediaType;
    size: number;
}

export interface CbbtErAudioContent {
    steps: {
        stepNumber: number;
        url: string;
    }[];
}

export interface CbbtErAudioMetadata {
    webm: AudioTypeMetadata;
    mp3: AudioTypeMetadata;
}

export interface AudioTypeMetadata {
    steps: {
        file: string;
        stepNumber: number;
    }[];
}

export interface ApiParentResource {
    shortName: string;
    displayName: string;
    resourceType: ParentResourceType;
    complexityLevel: ParentResourceComplexityLevel;
    licenseInfo: ApiLicenseInfo | null;
    id: number;
}

export interface ApiSingleLicense {
    name: string;
    url?: string | null;
}

export interface ApiLicenseInfo {
    title: string;
    copyright: {
        dates?: string | null;
        holder: { name: string; url?: string | null };
    };
    licenses: Record<string, ApiSingleLicense>[];
}

export interface ResourceContentGroupedByVerses {
    verses: ResourcesForVerse[];
}

export interface ResourcesForVerse {
    number: number;
    resourceContents: ResourceContentInfo[];
}

export interface ResourceContentInfo {
    id: number;
    mediaType: MediaType;
    resourceType: ParentResourceType;
    parentResource: string;
}
