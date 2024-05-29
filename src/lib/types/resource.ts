export enum ParentResourceId {
    FIA = 1,
    UwTranslationNotes = 11,
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

export const PredeterminedPassageGuides = [ParentResourceId.FIA];

// because guides come with their own custom UIs we need to be able to filter out guides that aren't supported by the
// client yet
export const EnabledGuides = [ParentResourceId.FIA, ParentResourceId.UwTranslationNotes];

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

export interface UrlWithInfo {
    url: string;
    mediaType: MediaType;
    size: number;
}

export interface ApiParentResource {
    enabled: boolean;
    shortName: string;
    displayName: string;
    resourceType: ParentResourceType;
    complexityLevel: ParentResourceComplexityLevel;
    licenseInfo: ApiLicenseInfo | null;
    resourceCountForLanguage: number;
    id: ParentResourceId;
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
    parentResourceId: ParentResourceId;
    displayName?: string;
}

export interface ResourceContentInfoWithMetadata extends ResourceContentInfo {
    url?: string;
    thumbnailUrl?: string;
    duration?: number;
}

export type TiptapContent = object;

export interface ResourceContentTiptap {
    tiptap: TiptapContent;
}
