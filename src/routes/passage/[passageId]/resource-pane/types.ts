import type { ParentResourceName } from '$lib/types/resource';

export type ResourcePaneTab = 'basic' | 'advanced' | 'searching';

export type AnyResource = TextResource | ImageOrVideoResource;

export interface ImageOrVideoResource {
    type: 'image' | 'video';
    displayName: string | null;
    url: string;
    duration?: number;
    thumbnailUrl?: string;
    parentResourceName: ParentResourceName;
}

export interface TextResource {
    displayName: string | null;
    html: string;
    preview: string;
    parentResourceName: ParentResourceName;
}
