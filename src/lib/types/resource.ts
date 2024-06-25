export enum ParentResourceId {
    FIA = 1,
    VideoBibleDictionary = 4,
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

export const SrvResources = [ParentResourceId.FIA, ParentResourceId.VideoBibleDictionary];

export const PredeterminedPassageGuides = [ParentResourceId.FIA];

export const SubgroupedTextResourceRegexes: Partial<Record<ParentResourceId, RegExp>> = {
    [ParentResourceId.UwTranslationNotes]: /(.*)\s*\(.*\)/,
};

export const GuidesAvailableOnResourcesTab = [ParentResourceId.UwTranslationNotes];

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
    associatedResources: AssociatedResource[];
    metadata: Record<string, unknown>;
}

export interface AssociatedResource {
    resourceId: number;
    contentId: number;
    externalId: string;
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
    version: number;
    mediaType: MediaType;
    resourceType: ParentResourceType;
    parentResourceId: ParentResourceId;
    displayName?: string;
}

export interface TextResourceContentJustId {
    mediaType: MediaType.Text;
    version: number;
    id: number;
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
