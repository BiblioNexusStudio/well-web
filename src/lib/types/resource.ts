import type { LanguageCodeEnum } from '$lib/utils/language-utils';

export const ParentResourceName = {
    BiblicaBibleDictionary: 'BiblicaBibleDictionary',
    BiblicaStudyNotes: 'BiblicaStudyNotes',
    CBBTER: 'CBBTER',
    TyndaleBibleDictionary: 'TyndaleBibleDictionary',
    TyndaleStudyNotes: 'TyndaleStudyNotes',
    UbsImages: 'UbsImages',
    VideoBibleDictionary: 'VideoBibleDictionary',
} as const;

export type ParentResourceNameEnum = (typeof ParentResourceName)[keyof typeof ParentResourceName];

export const MediaType = {
    Text: 'Text',
    Audio: 'Audio',
    Video: 'Video',
    Image: 'Image',
    Metadata: 'Metadata',
} as const;

export type MediaTypeEnum = (typeof MediaType)[keyof typeof MediaType];

export interface ResourceContentMetadata {
    displayName: string;
    metadata: Record<string, unknown>;
}

export interface ResourceContentTiptap {
    tiptap: object;
}

export interface UrlWithInfo {
    url: string;
    mediaType: MediaTypeEnum;
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
    licenseInfo: ApiLicenseInfo | null;
}

export interface ApiLicenseInfo {
    title: string;
    copyright: {
        dates?: string | null;
        holder: { name: string; url?: string | null };
    };
    licenses: Record<LanguageCodeEnum, { name: string; url?: string | null }>[];
}
