export enum ParentResourceId {
    FIA = 1,
    FIAImages = 15,
    FIAMaps = 16,
    FIAKeyTerms = 17,
    VideoBibleDictionary = 4,
    UwTranslationNotes = 11,
    UwTranslationQuestions = 13,
    UwTranslationWords = 7,
    SilOpenTranslatorsNotes = 18,
}

export enum MediaType {
    Text = 'Text',
    Audio = 'Audio',
    Video = 'Video',
    Image = 'Image',
    Metadata = 'Metadata',
}

enum ParentResourceComplexityLevel {
    None = 'None',
    Basic = 'Basic',
    Advanced = 'Advanced',
}

export const SrvResources = [
    ParentResourceId.FIA,
    ParentResourceId.FIAImages,
    ParentResourceId.FIAMaps,
    ParentResourceId.FIAKeyTerms,
    ParentResourceId.VideoBibleDictionary,
];

export const PredeterminedPassageGuides = [ParentResourceId.FIA];

export const DraftingGuides = [ParentResourceId.FIA];
export const CheckingGuides = [
    ParentResourceId.UwTranslationNotes,
    ParentResourceId.UwTranslationQuestions,
    ParentResourceId.UwTranslationWords,
    ParentResourceId.SilOpenTranslatorsNotes,
];

export const SubgroupedTextResourceRegexes: Partial<Record<ParentResourceId, RegExp>> = {
    [ParentResourceId.UwTranslationNotes]: /(.*)\s*\(.*\)/,
};

export const GuidesAvailableOnResourcesTab = [ParentResourceId.UwTranslationNotes];

// because guides come with their own custom UIs we need to be able to filter out guides that aren't supported by the
// client yet
export const EnabledGuides = [
    ParentResourceId.FIA,
    ParentResourceId.UwTranslationNotes,
    ParentResourceId.UwTranslationQuestions,
    ParentResourceId.UwTranslationWords,
    ParentResourceId.SilOpenTranslatorsNotes,
];

export enum ParentResourceType {
    None = 'None',
    Guide = 'Guide',
    Dictionary = 'Dictionary',
    StudyNotes = 'StudyNotes',
    Images = 'Images',
    Videos = 'Videos',
}

export enum ReviewLevel {
    None = 'None',
    Community = 'Community',
    Professional = 'Professional',
    Ai = 'Ai',
}

export interface ResourceContentMetadata {
    displayName: string;
    reviewLevel?: ReviewLevel;
    associatedResources: AssociatedResource[];
    metadata: Record<string, unknown>;
}

export interface AssociatedResource {
    resourceId: number;
    contentId: number;
    externalId: string;
    mediaType?: string;
}

export interface ApiParentResource {
    enabled?: boolean;
    shortName: string;
    displayName: string;
    resourceType: ParentResourceType;
    complexityLevel: ParentResourceComplexityLevel;
    licenseInfo: ApiLicenseInfo | null;
    resourceCountForLanguage: number;
    id: ParentResourceId;
}

export interface StepBasedGuideStep {
    id: number | undefined;
    label: string;
    eventTrackerName: string;
    contentHTML?: string;
    audioUrl?: string;
    communityEdition: boolean;
}

interface ApiSingleLicense {
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

interface ResourcesForVerse {
    number: number;
    resourceContents: ResourceContentInfo[];
}

export interface ResourceContentInfo {
    id: number;
    version: number;
    mediaType: MediaType;
    resourceType: ParentResourceType;
    parentResourceId: ParentResourceId;
    dependentOnId?: number | null;
    sortOrder?: number;
    displayName?: string;
}

export interface BasicTextResourceContent {
    mediaType: MediaType.Text;
    version: number;
    audioId?: number;
    audioVersion?: number;
    id: number;

    /** In some cases, like displaying Open Translator's Notes sections/paragraphs, we will already know the html and don't need to fetch anything */
    html?: string;
}

export interface ResourceContentInfoWithMetadata extends ResourceContentInfo {
    url?: string;
    thumbnailUrl?: string;
    duration?: number;
    reviewLevel?: ReviewLevel;
}

interface TtContent {
    type: string;
    attrs: object;
    content?: object[];
    text?: string;
}

export interface DownloadTtContent {
    type: string;
    attrs: { src: string };
    content: object[];
}

export interface InnerTipTapContent {
    type: string;
    attrs: object;
    content: TtContent[];
}

export interface TiptapContent {
    type: string;
    content: InnerTipTapContent[];
}

export interface ResourceContentTiptap {
    tiptap: TiptapContent;
}
