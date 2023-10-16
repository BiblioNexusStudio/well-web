export const ResourceType = {
    CBBTER: 'CBBTER',
    TyndaleBibleDictionary: 'TyndaleBibleDictionary',
    UbsImages: 'UbsImages',
    VideoBibleDictionary: 'VideoBibleDictionary',
} as const;

export type ResourceTypeEnum = (typeof ResourceType)[keyof typeof ResourceType];

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
